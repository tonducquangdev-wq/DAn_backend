const DuAn = require("../../Model/DuAn");
const CongViec = require("../../Model/CongViec");
const CaLamViec = require("../../Model/CaLamViec");
const SuKien = require("../../Model/SuKien");

// ==========================================
// 1. QUẢN LÝ DỰ ÁN & NƠI LÀM VIỆC
// ==========================================
const getDuAn = async (req, res) => {
    try {
        const duAns = await DuAn.find({ user_id: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: duAns });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy dự án: " + error.message });
    }
};

const createDuAn = async (req, res) => {
    try {
        const {
            ten_du_an,
            mo_ta,
            mau_sac,
            trang_thai,
            loai_du_an,
            luong_theo_gio,
            luong_co_ban,
            dia_chi,
            ngay_bat_dau,
            ngay_ket_thuc
        } = req.body;

        if (!ten_du_an || !ten_du_an.trim()) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập Tên dự án / Nơi làm việc" });
        }

        const duAn = await DuAn.create({
            user_id: req.user._id,
            ten_du_an: ten_du_an.trim(),
            mo_ta: mo_ta ? mo_ta.trim() : null,
            mau_sac: mau_sac || "#6366F1",
            trang_thai: trang_thai || "dang_thuc_hien",
            loai_du_an: loai_du_an || "part_time",
            luong_theo_gio: luong_theo_gio ? Number(luong_theo_gio) : 0,
            luong_co_ban: luong_co_ban ? Number(luong_co_ban) : 0,
            dia_chi: dia_chi ? dia_chi.trim() : null,
            ngay_bat_dau: ngay_bat_dau ? new Date(ngay_bat_dau) : null,
            ngay_ket_thuc: ngay_ket_thuc ? new Date(ngay_ket_thuc) : null
        });

        // Tự động tạo sự kiện lịch ban đầu cho Dự Án
        try {
            const startDate = duAn.ngay_bat_dau ? new Date(duAn.ngay_bat_dau) : new Date();
            let endDate = duAn.ngay_ket_thuc ? new Date(duAn.ngay_ket_thuc) : null;
            if (!endDate || endDate <= startDate) {
                endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
            }

            const prefix = duAn.loai_du_an === "part_time" ? "[Part-time]" : duAn.loai_du_an === "cong_viec_chinh" ? "[Full-time]" : "[Dự án]";

            await SuKien.create({
                user_id: req.user._id,
                du_an_id: duAn._id,
                loai_su_kien: "cong-viec",
                tieu_de: `${prefix} ${duAn.ten_du_an}`,
                mo_ta: duAn.mo_ta ? duAn.mo_ta : `${prefix} ${duAn.ten_du_an}${duAn.dia_chi ? ` • ${duAn.dia_chi}` : ""}`,
                thoi_gian_bat_dau: startDate,
                thoi_gian_ket_thuc: endDate,
                dia_diem: duAn.dia_chi || null,
                mau_sac: duAn.mau_sac || "#6366F1",
                quy_tac_lap: "once",
                bat_thong_bao: true,
                is_deleted: false
            });
        } catch (eventErr) {
            console.error("Lỗi tự động thêm dự án vào lịch:", eventErr);
        }

        res.status(201).json({ success: true, message: "Tạo dự án thành công và đã tự động thêm vào lịch", data: duAn });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tạo dự án: " + error.message });
    }
};

const updateDuAn = async (req, res) => {
    try {
        const { id } = req.params;
        const duAn = await DuAn.findOne({ _id: id, user_id: req.user._id });
        if (!duAn) return res.status(404).json({ success: false, message: "Không tìm thấy dự án" });

        Object.assign(duAn, req.body);
        if (req.body.ngay_bat_dau) duAn.ngay_bat_dau = new Date(req.body.ngay_bat_dau);
        if (req.body.ngay_ket_thuc) duAn.ngay_ket_thuc = new Date(req.body.ngay_ket_thuc);
        await duAn.save();

        // Đồng bộ cập nhật sự kiện lịch của Dự án
        try {
            const suKien = await SuKien.findOne({ du_an_id: duAn._id, cong_viec_id: null, ca_lam_viec_id: null, is_deleted: false });
            if (suKien) {
                const prefix = duAn.loai_du_an === "part_time" ? "[Part-time]" : duAn.loai_du_an === "cong_viec_chinh" ? "[Full-time]" : "[Dự án]";
                if (duAn.ten_du_an) suKien.tieu_de = `${prefix} ${duAn.ten_du_an.trim()}`;
                if (duAn.mo_ta !== undefined) suKien.mo_ta = duAn.mo_ta;
                if (duAn.mau_sac) suKien.mau_sac = duAn.mau_sac;
                if (duAn.dia_chi !== undefined) suKien.dia_diem = duAn.dia_chi;
                if (duAn.ngay_bat_dau) suKien.thoi_gian_bat_dau = new Date(duAn.ngay_bat_dau);
                if (duAn.ngay_ket_thuc) {
                    const eDate = new Date(duAn.ngay_ket_thuc);
                    if (eDate > suKien.thoi_gian_bat_dau) {
                        suKien.thoi_gian_ket_thuc = eDate;
                    }
                }
                await suKien.save();
            }
        } catch (eventErr) {
            console.error("Lỗi đồng bộ sửa dự án sang lịch:", eventErr);
        }

        res.status(200).json({ success: true, message: "Cập nhật dự án thành công", data: duAn });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật dự án: " + error.message });
    }
};

const deleteDuAn = async (req, res) => {
    try {
        const { id } = req.params;
        await DuAn.deleteOne({ _id: id, user_id: req.user._id });
        await CongViec.deleteMany({ du_an_id: id, user_id: req.user._id });
        await CaLamViec.deleteMany({ du_an_id: id, user_id: req.user._id });

        // Đồng bộ xóa các sự kiện liên quan trên lịch
        await SuKien.updateMany(
            { du_an_id: id, user_id: req.user._id },
            { $set: { is_deleted: true } }
        );

        res.status(200).json({ success: true, message: "Xóa dự án và các ca làm việc liên quan thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa dự án: " + error.message });
    }
};

// ==========================================
// 2. QUẢN LÝ CÔNG VIỆC / TASK TODO
// ==========================================
const getCongViec = async (req, res) => {
    try {
        const { du_an_id, trang_thai } = req.query;
        const query = { user_id: req.user._id };

        if (du_an_id) query.du_an_id = du_an_id;
        if (trang_thai) query.trang_thai = trang_thai;

        const congViecs = await CongViec.find(query)
            .populate("du_an_id", "ten_du_an mau_sac loai_du_an")
            .sort({ han_chot: 1, createdAt: -1 });

        res.status(200).json({ success: true, data: congViecs });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy công việc: " + error.message });
    }
};

const createCongViec = async (req, res) => {
    try {
        const { tieu_de, du_an_id, mo_ta, do_uu_tien, trang_thai, tien_do, han_chot } = req.body;
        if (!tieu_de || !tieu_de.trim()) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập Tiêu đề công việc" });
        }

        const congViec = await CongViec.create({
            user_id: req.user._id,
            du_an_id: du_an_id || null,
            tieu_de: tieu_de.trim(),
            mo_ta: mo_ta ? mo_ta.trim() : null,
            do_uu_tien: do_uu_tien || "trung_binh",
            trang_thai: trang_thai || "chua_lam",
            tien_do: tien_do ? Number(tien_do) : 0,
            han_chot: han_chot ? new Date(han_chot) : null
        });

        // Tự động tạo sự kiện lịch cho Task
        try {
            let duAnInfo = null;
            if (du_an_id) {
                duAnInfo = await DuAn.findById(du_an_id);
            }

            let startDate, endDate;
            if (congViec.han_chot) {
                endDate = new Date(congViec.han_chot);
                startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
            } else {
                startDate = new Date();
                endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
            }

            let mauSac = "#6366F1";
            if (do_uu_tien === "cao") {
                mauSac = "#ef4444";
            } else if (do_uu_tien === "trung_binh") {
                mauSac = "#f59e0b";
            } else if (do_uu_tien === "thap") {
                mauSac = "#10b981";
            } else if (duAnInfo?.mau_sac) {
                mauSac = duAnInfo.mau_sac;
            }

            const eventTitle = duAnInfo
                ? `[Task - ${duAnInfo.ten_du_an}] ${congViec.tieu_de}`
                : `[Task] ${congViec.tieu_de}`;

            await SuKien.create({
                user_id: req.user._id,
                cong_viec_id: congViec._id,
                du_an_id: du_an_id || null,
                loai_su_kien: congViec.han_chot ? "deadline" : "cong-viec",
                tieu_de: eventTitle,
                mo_ta: congViec.mo_ta || (duAnInfo ? `Thuộc: ${duAnInfo.ten_du_an}` : "Công việc cần xử lý"),
                thoi_gian_bat_dau: startDate,
                thoi_gian_ket_thuc: endDate,
                mau_sac: mauSac,
                quy_tac_lap: "once",
                bat_thong_bao: true,
                is_deleted: false
            });
        } catch (eventErr) {
            console.error("Lỗi tự động thêm task vào lịch:", eventErr);
        }

        const populatedCongViec = await CongViec.findById(congViec._id).populate("du_an_id", "ten_du_an mau_sac loai_du_an");

        res.status(201).json({ success: true, message: "Tạo công việc thành công và đã tự động thêm vào lịch", data: populatedCongViec });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tạo công việc: " + error.message });
    }
};

const updateCongViec = async (req, res) => {
    try {
        const { id } = req.params;
        const congViec = await CongViec.findOne({ _id: id, user_id: req.user._id });
        if (!congViec) return res.status(404).json({ success: false, message: "Không tìm thấy công việc" });

        Object.assign(congViec, req.body);
        if (req.body.han_chot !== undefined) {
            congViec.han_chot = req.body.han_chot ? new Date(req.body.han_chot) : null;
        }
        await congViec.save();

        // Đồng bộ cập nhật sự kiện lịch
        try {
            const suKien = await SuKien.findOne({ cong_viec_id: congViec._id, is_deleted: false });
            if (suKien) {
                let duAnInfo = null;
                if (congViec.du_an_id) {
                    duAnInfo = await DuAn.findById(congViec.du_an_id);
                }

                const prefix = duAnInfo ? `[Task - ${duAnInfo.ten_du_an}] ` : `[Task] `;
                const isCompleted = congViec.trang_thai === "hoan_thanh";
                suKien.tieu_de = `${prefix}${congViec.tieu_de}${isCompleted ? " (Đã xong)" : ""}`;

                if (congViec.mo_ta !== undefined) suKien.mo_ta = congViec.mo_ta;
                if (congViec.du_an_id !== undefined) suKien.du_an_id = congViec.du_an_id;

                if (congViec.han_chot) {
                    const endDate = new Date(congViec.han_chot);
                    suKien.thoi_gian_ket_thuc = endDate;
                    suKien.thoi_gian_bat_dau = new Date(endDate.getTime() - 60 * 60 * 1000);
                    suKien.loai_su_kien = "deadline";
                }

                if (isCompleted) {
                    suKien.mau_sac = "#94a3b8";
                } else if (congViec.do_uu_tien === "cao") {
                    suKien.mau_sac = "#ef4444";
                } else if (congViec.do_uu_tien === "trung_binh") {
                    suKien.mau_sac = "#f59e0b";
                } else if (congViec.do_uu_tien === "thap") {
                    suKien.mau_sac = "#10b981";
                } else if (duAnInfo?.mau_sac) {
                    suKien.mau_sac = duAnInfo.mau_sac;
                }

                await suKien.save();
            }
        } catch (eventErr) {
            console.error("Lỗi đồng bộ sửa task sang lịch:", eventErr);
        }

        const populatedCongViec = await CongViec.findById(congViec._id).populate("du_an_id", "ten_du_an mau_sac loai_du_an");

        res.status(200).json({ success: true, message: "Cập nhật công việc thành công", data: populatedCongViec });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật công việc: " + error.message });
    }
};

const deleteCongViec = async (req, res) => {
    try {
        const { id } = req.params;
        await CongViec.deleteOne({ _id: id, user_id: req.user._id });
        await SuKien.updateMany(
            { cong_viec_id: id, user_id: req.user._id },
            { $set: { is_deleted: true } }
        );
        res.status(200).json({ success: true, message: "Xóa công việc thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa công việc: " + error.message });
    }
};

// ==========================================
// 3. QUẢN LÝ CA LÀM VIỆC PART-TIME & LƯƠNG
// ==========================================
const getCaLamViec = async (req, res) => {
    try {
        const { du_an_id } = req.query;
        const query = { user_id: req.user._id };
        if (du_an_id) query.du_an_id = du_an_id;

        const now = new Date();

        // Tự động chuyển các ca đã qua thời gian kết thúc sang trạng thái 'da_hoan_thanh' (nếu đang 'chua_den')
        await CaLamViec.updateMany(
            {
                user_id: req.user._id,
                thoi_gian_ket_thuc: { $lte: now },
                trang_thai: "chua_den"
            },
            { $set: { trang_thai: "da_hoan_thanh" } }
        );

        const caLamViecs = await CaLamViec.find(query)
            .populate("du_an_id", "ten_du_an mau_sac luong_theo_gio dia_chi loai_du_an")
            .sort({ thoi_gian_bat_dau: 1 });

        // Thống kê giờ làm và tiền lương tích lũy
        let tong_gio_da_lam = 0;
        let luong_tich_luy = 0;
        let tong_gio_toan_bo = 0;
        let luong_du_kien_toan_bo = 0;
        let so_ca_da_lam = 0;
        let so_ca_sap_toi = 0;
        let ca_tiep_theo = null;

        caLamViecs.forEach((ca) => {
            const gio = Number(ca.so_gio_lam) || 0;
            const tien = Number(ca.tien_luong_ca) || 0;

            tong_gio_toan_bo += gio;
            luong_du_kien_toan_bo += tien;

            if (ca.trang_thai === "da_hoan_thanh") {
                tong_gio_da_lam += gio;
                luong_tich_luy += tien;
                so_ca_da_lam += 1;
            } else if (ca.trang_thai === "chua_den") {
                so_ca_sap_toi += 1;
                if (!ca_tiep_theo && new Date(ca.thoi_gian_bat_dau) > now) {
                    ca_tiep_theo = ca;
                }
            }
        });

        res.status(200).json({
            success: true,
            data: caLamViecs,
            stats: {
                tong_gio_da_lam: Math.round(tong_gio_da_lam * 10) / 10,
                luong_tich_luy,
                tong_gio_toan_bo: Math.round(tong_gio_toan_bo * 10) / 10,
                luong_du_kien_toan_bo,
                so_ca_da_lam,
                so_ca_sap_toi,
                ca_tiep_theo
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách ca làm việc: " + error.message });
    }
};

const createCaLamViec = async (req, res) => {
    try {
        const { du_an_id, tieu_de, ngay_lam, gio_bat_dau, gio_ket_thuc, dia_diem, ghi_chu } = req.body;
        if (!du_an_id) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn Nơi làm việc / Dự án" });
        }
        if (!ngay_lam || !gio_bat_dau || !gio_ket_thuc) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập Ngày làm, Giờ bắt đầu và Giờ kết thúc" });
        }

        const duAn = await DuAn.findOne({ _id: du_an_id, user_id: req.user._id });
        if (!duAn) {
            return res.status(404).json({ success: false, message: "Không tìm thấy nơi làm việc" });
        }

        const dateStr = String(ngay_lam).split("T")[0];
        const startISO = new Date(`${dateStr}T${gio_bat_dau}:00`);
        let endISO = new Date(`${dateStr}T${gio_ket_thuc}:00`);
        if (endISO <= startISO) {
            endISO = new Date(endISO.getTime() + 24 * 60 * 60 * 1000);
        }

        const diffHours = (endISO.getTime() - startISO.getTime()) / (1000 * 60 * 60);
        const so_gio_lam = Math.round(diffHours * 10) / 10;
        const luong_theo_gio = Number(duAn.luong_theo_gio) || 0;
        const tien_luong_ca = Math.round(so_gio_lam * luong_theo_gio);

        const now = new Date();
        const trang_thai = endISO <= now ? "da_hoan_thanh" : "chua_den";

        const caLamViec = await CaLamViec.create({
            user_id: req.user._id,
            du_an_id: duAn._id,
            tieu_de: tieu_de && tieu_de.trim() ? tieu_de.trim() : `Ca làm (${gio_bat_dau} - ${gio_ket_thuc})`,
            ngay_lam: new Date(dateStr),
            gio_bat_dau,
            gio_ket_thuc,
            thoi_gian_bat_dau: startISO,
            thoi_gian_ket_thuc: endISO,
            so_gio_lam,
            luong_theo_gio,
            tien_luong_ca,
            dia_diem: dia_diem ? dia_diem.trim() : duAn.dia_chi || null,
            ghi_chu: ghi_chu ? ghi_chu.trim() : null,
            trang_thai
        });

        // Tự động tạo sự kiện lịch
        try {
            const desc = `🏪 Nơi làm: ${duAn.ten_du_an}\n⏱️ Thời gian: ${gio_bat_dau} - ${gio_ket_thuc} (${so_gio_lam} giờ)\n💰 Lương ca: ${tien_luong_ca.toLocaleString("vi-VN")}đ${dia_diem || duAn.dia_chi ? `\n📍 Địa chỉ: ${dia_diem || duAn.dia_chi}` : ""}`;

            const suKien = await SuKien.create({
                user_id: req.user._id,
                du_an_id: duAn._id,
                ca_lam_viec_id: caLamViec._id,
                loai_su_kien: "cong-viec",
                tieu_de: `[Ca làm - ${duAn.ten_du_an}] ${caLamViec.tieu_de}`,
                mo_ta: desc,
                thoi_gian_bat_dau: startISO,
                thoi_gian_ket_thuc: endISO,
                dia_diem: dia_diem || duAn.dia_chi || null,
                mau_sac: duAn.mau_sac || "#6366F1",
                quy_tac_lap: "once",
                bat_thong_bao: true,
                is_deleted: false
            });

            caLamViec.su_kien_id = suKien._id;
            await caLamViec.save();
        } catch (evErr) {
            console.error("Lỗi tạo sự kiện lịch:", evErr);
        }

        const populated = await CaLamViec.findById(caLamViec._id).populate("du_an_id", "ten_du_an mau_sac luong_theo_gio dia_chi loai_du_an");

        res.status(201).json({ success: true, message: "Tạo ca làm việc thành công và đã tự động thêm vào lịch", data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tạo ca làm việc: " + error.message });
    }
};

const bulkCreateCaLamViec = async (req, res) => {
    try {
        const { du_an_id, tieu_de, days_of_week, gio_bat_dau, gio_ket_thuc, tu_ngay, den_ngay, dia_diem, ghi_chu } = req.body;

        if (!du_an_id) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn Nơi làm việc / Dự án" });
        }
        if (!days_of_week || !Array.isArray(days_of_week) || days_of_week.length === 0) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn ít nhất 1 thứ trong tuần để lặp" });
        }
        if (!gio_bat_dau || !gio_ket_thuc || !tu_ngay || !den_ngay) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ ngày bắt đầu, ngày kết thúc và khung giờ" });
        }

        const duAn = await DuAn.findOne({ _id: du_an_id, user_id: req.user._id });
        if (!duAn) {
            return res.status(404).json({ success: false, message: "Không tìm thấy nơi làm việc" });
        }

        const startRange = new Date(tu_ngay);
        const endRange = new Date(den_ngay);
        if (endRange < startRange) {
            return res.status(400).json({ success: false, message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu" });
        }

        const luong_theo_gio = Number(duAn.luong_theo_gio) || 0;
        const now = new Date();

        const createdShifts = [];

        // Duyệt từng ngày
        const cur = new Date(startRange);
        while (cur <= endRange) {
            const dayOfWeek = cur.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
            if (days_of_week.includes(dayOfWeek)) {
                const dateStr = cur.toISOString().split("T")[0];
                const startISO = new Date(`${dateStr}T${gio_bat_dau}:00`);
                let endISO = new Date(`${dateStr}T${gio_ket_thuc}:00`);
                if (endISO <= startISO) {
                    endISO = new Date(endISO.getTime() + 24 * 60 * 60 * 1000);
                }

                const diffHours = (endISO.getTime() - startISO.getTime()) / (1000 * 60 * 60);
                const so_gio_lam = Math.round(diffHours * 10) / 10;
                const tien_luong_ca = Math.round(so_gio_lam * luong_theo_gio);
                const trang_thai = endISO <= now ? "da_hoan_thanh" : "chua_den";

                createdShifts.push({
                    user_id: req.user._id,
                    du_an_id: duAn._id,
                    tieu_de: tieu_de && tieu_de.trim() ? tieu_de.trim() : `Ca làm (${gio_bat_dau} - ${gio_ket_thuc})`,
                    ngay_lam: new Date(dateStr),
                    gio_bat_dau,
                    gio_ket_thuc,
                    thoi_gian_bat_dau: startISO,
                    thoi_gian_ket_thuc: endISO,
                    so_gio_lam,
                    luong_theo_gio,
                    tien_luong_ca,
                    dia_diem: dia_diem ? dia_diem.trim() : duAn.dia_chi || null,
                    ghi_chu: ghi_chu ? ghi_chu.trim() : null,
                    trang_thai
                });
            }
            cur.setDate(cur.getDate() + 1);
        }

        if (createdShifts.length === 0) {
            return res.status(400).json({ success: false, message: "Không có ngày nào khớp với các thứ đã chọn trong khoảng thời gian này" });
        }

        const insertedShifts = await CaLamViec.insertMany(createdShifts);

        // Tạo sự kiện Lịch tương ứng
        const eventsToInsert = insertedShifts.map((sh) => ({
            user_id: req.user._id,
            du_an_id: duAn._id,
            ca_lam_viec_id: sh._id,
            loai_su_kien: "cong-viec",
            tieu_de: `[Ca làm - ${duAn.ten_du_an}] ${sh.tieu_de}`,
            mo_ta: `🏪 Nơi làm: ${duAn.ten_du_an}\n⏱️ Thời gian: ${sh.gio_bat_dau} - ${sh.gio_ket_thuc} (${sh.so_gio_lam} giờ)\n💰 Lương ca: ${sh.tien_luong_ca.toLocaleString("vi-VN")}đ${sh.dia_diem ? `\n📍 Địa chỉ: ${sh.dia_diem}` : ""}`,
            thoi_gian_bat_dau: sh.thoi_gian_bat_dau,
            thoi_gian_ket_thuc: sh.thoi_gian_ket_thuc,
            dia_diem: sh.dia_diem || null,
            mau_sac: duAn.mau_sac || "#6366F1",
            quy_tac_lap: "once",
            bat_thong_bao: true,
            is_deleted: false
        }));

        await SuKien.insertMany(eventsToInsert);

        res.status(201).json({
            success: true,
            message: `Thiết lập thành công ${insertedShifts.length} ca làm việc và tự động đồng bộ vào Lịch!`,
            count: insertedShifts.length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi thiết lập lịch hàng loạt: " + error.message });
    }
};

const updateCaLamViec = async (req, res) => {
    try {
        const { id } = req.params;
        const caLamViec = await CaLamViec.findOne({ _id: id, user_id: req.user._id });
        if (!caLamViec) return res.status(404).json({ success: false, message: "Không tìm thấy ca làm việc" });

        Object.assign(caLamViec, req.body);

        if (req.body.ngay_lam || req.body.gio_bat_dau || req.body.gio_ket_thuc) {
            const dateStr = (req.body.ngay_lam ? new Date(req.body.ngay_lam) : caLamViec.ngay_lam).toISOString().split("T")[0];
            const gStart = req.body.gio_bat_dau || caLamViec.gio_bat_dau;
            const gEnd = req.body.gio_ket_thuc || caLamViec.gio_ket_thuc;

            const startISO = new Date(`${dateStr}T${gStart}:00`);
            let endISO = new Date(`${dateStr}T${gEnd}:00`);
            if (endISO <= startISO) {
                endISO = new Date(endISO.getTime() + 24 * 60 * 60 * 1000);
            }

            const diffHours = (endISO.getTime() - startISO.getTime()) / (1000 * 60 * 60);
            caLamViec.thoi_gian_bat_dau = startISO;
            caLamViec.thoi_gian_ket_thuc = endISO;
            caLamViec.so_gio_lam = Math.round(diffHours * 10) / 10;
            caLamViec.tien_luong_ca = Math.round(caLamViec.so_gio_lam * (caLamViec.luong_theo_gio || 0));
        }

        await caLamViec.save();

        // Cập nhật sự kiện lịch
        try {
            const suKien = await SuKien.findOne({ ca_lam_viec_id: caLamViec._id, is_deleted: false });
            if (suKien) {
                suKien.thoi_gian_bat_dau = caLamViec.thoi_gian_bat_dau;
                suKien.thoi_gian_ket_thuc = caLamViec.thoi_gian_ket_thuc;
                if (caLamViec.trang_thai === "nghi_phep") {
                    suKien.tieu_de = `[Nghỉ phép] ${caLamViec.tieu_de}`;
                    suKien.mau_sac = "#94a3b8";
                }
                await suKien.save();
            }
        } catch (evErr) {
            console.error("Lỗi đồng bộ sửa ca làm sang lịch:", evErr);
        }

        const populated = await CaLamViec.findById(caLamViec._id).populate("du_an_id", "ten_du_an mau_sac luong_theo_gio dia_chi loai_du_an");
        res.status(200).json({ success: true, message: "Cập nhật ca làm việc thành công", data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật ca làm việc: " + error.message });
    }
};

const deleteCaLamViec = async (req, res) => {
    try {
        const { id } = req.params;
        await CaLamViec.deleteOne({ _id: id, user_id: req.user._id });
        await SuKien.updateMany(
            { ca_lam_viec_id: id, user_id: req.user._id },
            { $set: { is_deleted: true } }
        );
        res.status(200).json({ success: true, message: "Xóa ca làm việc thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa ca làm việc: " + error.message });
    }
};

module.exports = {
    getDuAn,
    createDuAn,
    updateDuAn,
    deleteDuAn,
    getCongViec,
    createCongViec,
    updateCongViec,
    deleteCongViec,
    getCaLamViec,
    createCaLamViec,
    bulkCreateCaLamViec,
    updateCaLamViec,
    deleteCaLamViec
};
