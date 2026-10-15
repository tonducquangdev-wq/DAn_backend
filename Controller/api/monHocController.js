const mongoose = require("mongoose");
const MonHoc = require("../../Model/MonHoc");
const BaiTap = require("../../Model/BaiTap");
const LichHoc = require("../../Model/LichHoc");
const GiaSu = require("../../Model/GiaSu");
const SuKien = require("../../Model/SuKien");

// 1. Quản lý Môn học
const getMonHoc = async (req, res) => {
    try {
        const monHocs = await MonHoc.find({ user_id: req.user._id, is_deleted: false }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: monHocs });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách môn học: " + error.message });
    }
};

const createMonHoc = async (req, res) => {
    try {
        const {
            ma_mon,
            ten_mon,
            giang_vien,
            phong_hoc,
            so_tin_chi,
            diem_so,
            tien_do,
            ngay_bat_dau,
            ngay_ket_thuc,
            gio_bat_dau,
            gio_ket_thuc,
            ngay_hoc,
            trang_thai,
            mau_sac
        } = req.body;

        if (!ten_mon || !ten_mon.trim()) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập Tên môn học" });
        }

        // Chuẩn hóa ngày & giờ học
        const startDate = ngay_bat_dau ? new Date(ngay_bat_dau) : new Date();
        const endDate = ngay_ket_thuc ? new Date(ngay_ket_thuc) : new Date(startDate.getTime() + 60 * 24 * 60 * 60 * 1000);
        const validStartHour = gio_bat_dau && typeof gio_bat_dau === "string" && gio_bat_dau.includes(":") ? gio_bat_dau : "07:30";
        const validEndHour = gio_ket_thuc && typeof gio_ket_thuc === "string" && gio_ket_thuc.includes(":") ? gio_ket_thuc : "09:30";

        // Chuẩn hóa danh sách thứ trong tuần (2: Thứ 2, ..., 8: CN)
        let parsedNgayHoc = [];
        if (Array.isArray(ngay_hoc) && ngay_hoc.length > 0) {
            parsedNgayHoc = ngay_hoc.map(Number).filter(n => n >= 2 && n <= 8);
        } else if (ngay_hoc !== undefined && ngay_hoc !== null) {
            const n = Number(ngay_hoc);
            if (n >= 2 && n <= 8) parsedNgayHoc = [n];
        }
        if (parsedNgayHoc.length === 0) {
            const dayOfStart = startDate.getDay() === 0 ? 8 : startDate.getDay() + 1;
            parsedNgayHoc = [dayOfStart];
        }

        // 1. Tạo môn học trong DB
        const monHoc = await MonHoc.create({
            user_id: req.user._id,
            ma_mon: ma_mon ? ma_mon.trim() : null,
            ten_mon: ten_mon.trim(),
            giang_vien: giang_vien ? giang_vien.trim() : null,
            phong_hoc: phong_hoc ? phong_hoc.trim() : null,
            so_tin_chi: so_tin_chi ? Number(so_tin_chi) : 3,
            diem_so: diem_so !== undefined && diem_so !== null ? Number(diem_so) : null,
            tien_do: tien_do ? Number(tien_do) : 0,
            ngay_bat_dau: startDate,
            ngay_ket_thuc: endDate,
            gio_bat_dau: validStartHour,
            gio_ket_thuc: validEndHour,
            ngay_hoc: parsedNgayHoc,
            trang_thai: trang_thai || "dang_hoc",
            mau_sac: mau_sac || "#3B82F6"
        });

        // 2. Tạo bản ghi LichHoc
        for (const thu of parsedNgayHoc) {
            await LichHoc.create({
                user_id: req.user._id,
                mon_hoc_id: monHoc._id,
                thu_trong_tuan: thu,
                gio_bat_dau: validStartHour,
                gio_ket_thuc: validEndHour,
                phong_hoc: phong_hoc || null
            });
        }

        // 3. Tự động đồng bộ các buổi học vào trang Lịch (SuKien)
        const eventsToInsert = [];
        const [sH, sM] = validStartHour.split(":").map(Number);
        const [eH, eM] = validEndHour.split(":").map(Number);

        let current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endLimit = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const maxSessions = 100; // Giới hạn an toàn

        const eventTitle = ma_mon ? `${ten_mon.trim()} (${ma_mon.trim()})` : ten_mon.trim();
        const eventDesc = `Lớp học phần: ${ten_mon.trim()}\nGiảng viên: ${giang_vien || "Chưa cập nhật"}\nPhòng học: ${phong_hoc || "Chưa cập nhật"}${so_tin_chi ? `\nSố tín chỉ: ${so_tin_chi}` : ""}`;

        while (current <= endLimit && eventsToInsert.length < maxSessions) {
            const vnDay = current.getDay() === 0 ? 8 : current.getDay() + 1;
            if (parsedNgayHoc.includes(vnDay)) {
                const evStart = new Date(current.getFullYear(), current.getMonth(), current.getDate(), sH, sM, 0);
                const evEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate(), eH, eM, 0);

                eventsToInsert.push({
                    user_id: req.user._id,
                    mon_hoc_id: monHoc._id,
                    loai_su_kien: "hoc-tap",
                    tieu_de: eventTitle,
                    mo_ta: eventDesc,
                    thoi_gian_bat_dau: evStart,
                    thoi_gian_ket_thuc: evEnd,
                    dia_diem: phong_hoc || null,
                    mau_sac: mau_sac || "#3B82F6",
                    quy_tac_lap: "weekly",
                    nhom_lap_id: `monhoc_${monHoc._id}`,
                    bat_thong_bao: true,
                    so_ngay_nhac: 0
                });
            }
            current.setDate(current.getDate() + 1);
        }

        if (eventsToInsert.length === 0) {
            // Đảm bảo tối thiểu 1 buổi nếu không trùng thứ
            const evStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), sH, sM, 0);
            const evEnd = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), eH, eM, 0);
            eventsToInsert.push({
                user_id: req.user._id,
                mon_hoc_id: monHoc._id,
                loai_su_kien: "hoc-tap",
                tieu_de: eventTitle,
                mo_ta: eventDesc,
                thoi_gian_bat_dau: evStart,
                thoi_gian_ket_thuc: evEnd,
                dia_diem: phong_hoc || null,
                mau_sac: mau_sac || "#3B82F6",
                quy_tac_lap: "once",
                nhom_lap_id: `monhoc_${monHoc._id}`,
                bat_thong_bao: true,
                so_ngay_nhac: 0
            });
        }

        await SuKien.insertMany(eventsToInsert);

        res.status(201).json({
            success: true,
            message: `Tạo môn học thành công và đã tự động lên lịch ${eventsToInsert.length} buổi học trên trang Lịch!`,
            data: monHoc,
            total_events_created: eventsToInsert.length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tạo môn học: " + error.message });
    }
};

const updateMonHoc = async (req, res) => {
    try {
        const { id } = req.params;
        const monHoc = await MonHoc.findOne({ _id: id, user_id: req.user._id, is_deleted: false });
        if (!monHoc) return res.status(404).json({ success: false, message: "Không tìm thấy môn học" });

        Object.assign(monHoc, req.body);
        await monHoc.save();

        res.status(200).json({ success: true, message: "Cập nhật môn học thành công", data: monHoc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật môn học: " + error.message });
    }
};

const deleteMonHoc = async (req, res) => {
    try {
        const { id } = req.params;
        const monHoc = await MonHoc.findOne({ _id: id, user_id: req.user._id });
        if (!monHoc) return res.status(404).json({ success: false, message: "Không tìm thấy môn học" });

        monHoc.is_deleted = true;
        await monHoc.save();

        // Đồng bộ xóa các buổi học môn này khỏi trang Lịch
        await SuKien.updateMany(
            { user_id: req.user._id, $or: [{ mon_hoc_id: id }, { nhom_lap_id: `monhoc_${id}` }] },
            { $set: { is_deleted: true } }
        );

        // Xóa các bản ghi LichHoc
        await LichHoc.deleteMany({ user_id: req.user._id, mon_hoc_id: id });

        res.status(200).json({ success: true, message: "Xóa môn học và đồng bộ dọn dẹp lịch thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa môn học: " + error.message });
    }
};

// 2. Tính toán GPA & Báo cáo Học tập
const getBaoCaoHocTap = async (req, res) => {
    try {
        const monHocs = await MonHoc.find({ user_id: req.user._id, is_deleted: false });

        let tongTinChi = 0;
        let tongTinChiCoDiem = 0;
        let tongDiemHe10 = 0;
        let tongDiemHe4 = 0;

        monHocs.forEach(m => {
            tongTinChi += m.so_tin_chi;
            if (m.diem_so !== null && m.diem_so !== undefined) {
                const tinChi = m.so_tin_chi;
                const diem10 = m.diem_so;

                tongTinChiCoDiem += tinChi;
                tongDiemHe10 += diem10 * tinChi;

                let diem4 = 0;
                if (diem10 >= 8.5) diem4 = 4.0;
                else if (diem10 >= 7.0) diem4 = 3.0;
                else if (diem10 >= 5.5) diem4 = 2.0;
                else if (diem10 >= 4.0) diem4 = 1.0;

                tongDiemHe4 += diem4 * tinChi;
            }
        });

        const gpa10 = tongTinChiCoDiem > 0 ? (tongDiemHe10 / tongTinChiCoDiem).toFixed(2) : 0;
        const gpa4 = tongTinChiCoDiem > 0 ? (tongDiemHe4 / tongTinChiCoDiem).toFixed(2) : 0;

        let xepLoai = "Chưa xếp loại";
        if (gpa4 >= 3.6) xepLoai = "Xuất sắc";
        else if (gpa4 >= 3.2) xepLoai = "Giỏi";
        else if (gpa4 >= 2.5) xepLoai = "Khá";
        else if (gpa4 >= 2.0) xepLoai = "Trung bình";
        else if (gpa4 > 0) xepLoai = "Yếu";

        res.status(200).json({
            success: true,
            data: {
                tong_mon_hoc: monHocs.length,
                tong_tin_chi: tongTinChi,
                tong_tin_chi_co_diem: tongTinChiCoDiem,
                gpa_he_10: Number(gpa10),
                gpa_he_4: Number(gpa4),
                xep_loai: xepLoai,
                danh_sach_mon: monHocs
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tính toán GPA: " + error.message });
    }
};

// 3. Quản lý Bài tập (BaiTap)
const getBaiTap = async (req, res) => {
    try {
        const baiTaps = await BaiTap.find({ user_id: req.user._id })
            .populate("mon_hoc_id", "ten_mon ma_mon mau_sac")
            .sort({ han_nop: 1 });
        res.status(200).json({ success: true, data: baiTaps });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy bài tập: " + error.message });
    }
};

// Helper tính toán mốc thời gian bắt đầu & kết thúc của deadline
const parseDueDates = (han_nop, gio_nop) => {
    let dueDateTime;
    if (typeof han_nop === "string" && !han_nop.includes("T")) {
        const timeStr = (gio_nop && gio_nop.trim()) ? gio_nop.trim() : "23:59";
        dueDateTime = new Date(`${han_nop}T${timeStr}:00`);
    } else {
        dueDateTime = new Date(han_nop);
    }

    if (isNaN(dueDateTime.getTime())) {
        dueDateTime = new Date();
        dueDateTime.setHours(23, 59, 0, 0);
    }

    const endDue = new Date(dueDateTime);
    const startDue = new Date(dueDateTime);
    // Giữ startDue trong cùng ngày với endDue để ô lịch tháng & tuần hiển thị chính xác ngày nộp
    if (startDue.getHours() >= 1) {
        startDue.setHours(startDue.getHours() - 1);
    } else {
        startDue.setMinutes(0);
    }

    return { dueDateTime, startDue, endDue };
};

const createBaiTap = async (req, res) => {
    try {
        const { ten_bai_tap, mon_hoc_id, meo_ghi_nho, han_nop, gio_nop, do_uu_tien, trang_thai } = req.body;
        if (!ten_bai_tap || !han_nop) {
            return res.status(400).json({ success: false, message: "Vui lòng điền Tên bài tập và Hạn nộp" });
        }

        const { dueDateTime, startDue, endDue } = parseDueDates(han_nop, gio_nop);

        // Tạo bản ghi BaiTap
        const baiTap = await BaiTap.create({
            user_id: req.user._id,
            mon_hoc_id: (mon_hoc_id && mongoose.Types.ObjectId.isValid(mon_hoc_id)) ? mon_hoc_id : null,
            ten_bai_tap,
            meo_ghi_nho: meo_ghi_nho || null,
            han_nop: dueDateTime,
            do_uu_tien: do_uu_tien || "trung_binh",
            trang_thai: trang_thai || "chua_hoan_thanh"
        });

        // Xác định tên môn học để gán nhãn địa điểm/môn học trên lịch
        let tenMonHoc = "Bài tập";
        if (mon_hoc_id && mongoose.Types.ObjectId.isValid(mon_hoc_id)) {
            const mh = await MonHoc.findOne({ _id: mon_hoc_id, user_id: req.user._id, is_deleted: false });
            if (mh) {
                tenMonHoc = mh.ten_mon;
            }
        }

        // Tự động thêm sự kiện vào Trang Lịch dưới dạng DEADLINE
        const suKienDeadline = await SuKien.create({
            user_id: req.user._id,
            mon_hoc_id: (mon_hoc_id && mongoose.Types.ObjectId.isValid(mon_hoc_id)) ? mon_hoc_id : null,
            bai_tap_id: baiTap._id,
            loai_su_kien: "deadline",
            tieu_de: ten_bai_tap,
            mo_ta: meo_ghi_nho
                ? `${meo_ghi_nho}\n(Môn: ${tenMonHoc} | Hạn nộp: ${dueDateTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${dueDateTime.toLocaleDateString("vi-VN")})`
                : `Hạn chót nộp bài tập môn: ${tenMonHoc} (Mức độ ưu tiên: ${do_uu_tien || "trung bình"})`,
            thoi_gian_bat_dau: startDue,
            thoi_gian_ket_thuc: endDue,
            dia_diem: tenMonHoc,
            mau_sac: "#f59e0b",
            quy_tac_lap: "once",
            nhom_lap_id: `baitap_${baiTap._id}`,
            bat_thong_bao: true,
            so_ngay_nhac: 1
        });

        baiTap.su_kien_id = suKienDeadline._id;
        await baiTap.save();

        res.status(201).json({
            success: true,
            message: "Tạo bài tập thành công và đã tự động lưu deadline vào trang Lịch!",
            data: baiTap,
            calendar_event_id: suKienDeadline._id
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tạo bài tập: " + error.message });
    }
};

const updateBaiTap = async (req, res) => {
    try {
        const { id } = req.params;
        const baiTap = await BaiTap.findOne({ _id: id, user_id: req.user._id });
        if (!baiTap) return res.status(404).json({ success: false, message: "Không tìm thấy bài tập" });

        Object.assign(baiTap, req.body);
        if (req.body.han_nop || req.body.gio_nop) {
            const { dueDateTime } = parseDueDates(req.body.han_nop || baiTap.han_nop, req.body.gio_nop);
            baiTap.han_nop = dueDateTime;
        }
        await baiTap.save();

        // Đồng bộ dữ liệu sang sự kiện Deadline trên trang Lịch
        let tenMonHoc = "Bài tập";
        if (baiTap.mon_hoc_id && mongoose.Types.ObjectId.isValid(baiTap.mon_hoc_id)) {
            const mh = await MonHoc.findOne({ _id: baiTap.mon_hoc_id, user_id: req.user._id });
            if (mh) tenMonHoc = mh.ten_mon;
        }

        const { startDue, endDue } = parseDueDates(baiTap.han_nop, req.body.gio_nop);

        await SuKien.updateMany(
            { user_id: req.user._id, $or: [{ bai_tap_id: id }, { nhom_lap_id: `baitap_${id}` }] },
            {
                $set: {
                    tieu_de: baiTap.ten_bai_tap,
                    thoi_gian_bat_dau: startDue,
                    thoi_gian_ket_thuc: endDue,
                    dia_diem: tenMonHoc,
                    mon_hoc_id: baiTap.mon_hoc_id || null,
                    mo_ta: baiTap.meo_ghi_nho
                        ? `${baiTap.meo_ghi_nho}\n(Môn: ${tenMonHoc} | Hạn: ${endDue.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${endDue.toLocaleDateString("vi-VN")})`
                        : `Hạn chót nộp bài tập môn: ${tenMonHoc} (Mức ưu tiên: ${baiTap.do_uu_tien || "trung bình"})`
                }
            }
        );

        res.status(200).json({ success: true, message: "Cập nhật bài tập và đồng bộ lịch thành công", data: baiTap });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật bài tập: " + error.message });
    }
};

const deleteBaiTap = async (req, res) => {
    try {
        const { id } = req.params;
        const baiTap = await BaiTap.findOne({ _id: id, user_id: req.user._id });
        if (!baiTap) return res.status(404).json({ success: false, message: "Không tìm thấy bài tập" });

        await BaiTap.deleteOne({ _id: id, user_id: req.user._id });

        // Đồng bộ dọn dẹp sự kiện deadline tương ứng trên trang Lịch
        await SuKien.updateMany(
            { user_id: req.user._id, $or: [{ bai_tap_id: id }, { nhom_lap_id: `baitap_${id}` }] },
            { $set: { is_deleted: true } }
        );

        res.status(200).json({ success: true, message: "Xóa bài tập và đồng bộ gỡ deadline trên lịch thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa bài tập: " + error.message });
    }
};

// 4. Danh sách Gia sư & Bộ lọc tìm kiếm
const getGiaSu = async (req, res) => {
    try {
        const { mon_hoc, min_gia, max_gia, ca_day, search, min_rating } = req.query;

        // Tự động khởi tạo dữ liệu mẫu phong phú kèm bằng cấp & bảng điểm nếu chưa có
        const existingWithDegree = await GiaSu.findOne({ "bang_cap.0": { $exists: true } });
        const count = await GiaSu.countDocuments();
        if (count < 6 || !existingWithDegree) {
            await GiaSu.deleteMany({});
            await GiaSu.insertMany([
                {
                    ho_ten: "Nguyễn Văn Anh",
                    mon_hoc_chuyen_mon: "Toán Cao Cấp & Đại Số",
                    so_dien_thoai: "0912 345 678",
                    email: "vananh.math@gmail.com",
                    gia_theo_gio: 200000,
                    rating: 4.9,
                    mo_ta: "Thạc sĩ Toán học - 5 năm kinh nghiệm luyện thi đại học và hỗ trợ sinh viên các học phần Giải tích, Đại số tuyến tính, Xác suất thống kê.",
                    khung_gio_day: "Tối Thứ 2, 4, 6 (19:30 - 21:30)",
                    ca_day: ["toi"],
                    kinh_nghiem: "5 năm giảng dạy chuyên sâu",
                    khu_vuc: "Online qua Google Meet / Zoom",
                    hoc_vi: "Thạc sĩ Toán học",
                    truong_tot_nghiep: "Đại học Sư Phạm Hà Nội",
                    phuong_phap_day: "Giảng dạy theo sơ đồ tư duy bản chất, phân tích trực quan ý nghĩa hình học của công thức, luyện đề thi giữa kỳ & cuối kỳ theo chuẩn ngân hàng đề các trường Đại học.",
                    thanh_tich: [
                        "Giải Nhì Olympic Toán học Sinh viên Toàn quốc môn Đại số",
                        "Học bổng Vallet danh giá 2 năm liên tiếp dành cho tài năng toán học",
                        "Đã kèm hơn 120 sinh viên Bách Khoa, NEU, Ngoại Thương qua môn đạt điểm A/B+"
                    ],
                    bang_cap: [
                        {
                            ten_bang: "Bằng Thạc sĩ Khoa học Toán học (Loại Xuất Sắc)",
                            to_chuc: "Trường Đại học Sư Phạm Hà Nội",
                            nam: "2021",
                            xep_loai: "Xuất sắc",
                            hinh_anh: "/images/degree_certificate.jpg",
                            da_xac_thuc: true,
                            mo_ta: "Chuyên ngành Toán Giải tích & Phương trình vi phân. Tốt nghiệp thủ khoa đầu ra."
                        },
                        {
                            ten_bang: "Chứng chỉ Bồi dưỡng Nghiệp vụ Sư phạm Đại học",
                            to_chuc: "Viện Nghiên cứu Sư phạm",
                            nam: "2020",
                            xep_loai: "Giỏi",
                            hinh_anh: "/images/degree_certificate.jpg",
                            da_xac_thuc: true,
                            mo_ta: "Phương pháp giảng dạy hiện đại, ứng dụng công nghệ trực quan và tương tác trực tuyến."
                        }
                    ],
                    bang_diem: {
                        gpa_he_4: 3.92,
                        gpa_he_10: 9.35,
                        xep_loai: "Thủ khoa Xuất sắc",
                        truong_dai_hoc: "Đại học Sư Phạm Hà Nội",
                        chuyen_nganh: "Toán học & Ứng dụng",
                        hinh_anh: "/images/academic_transcript.jpg",
                        da_xac_thuc: true,
                        mon_tieu_bieu: [
                            { ten_mon: "Giải tích hàm & Giải tích nhiều biến", diem_so: "10.0", diem_he_4: 4.0, tin_chi: 4 },
                            { ten_mon: "Đại số tuyến tính & Cấu trúc đại số", diem_so: "9.8", diem_he_4: 4.0, tin_chi: 4 },
                            { ten_mon: "Xác suất thống kê ứng dụng", diem_so: "9.6", diem_he_4: 4.0, tin_chi: 3 },
                            { ten_mon: "Phương trình vi phân & Đạo hàm riêng", diem_so: "9.7", diem_he_4: 4.0, tin_chi: 3 }
                        ]
                    },
                    danh_gia_hoc_vien: [
                        {
                            ten_hoc_vien: "Hoàng Minh Tuấn (SV ĐH Bách Khoa)",
                            ngay: "12/03/2026",
                            rating: 5.0,
                            khoa_hoc: "Kèm Giải tích 2 & Đại số",
                            binh_luan: "Thầy dạy cực kỳ có tâm, từ một người mất gốc Toán suýt rớt môn giữa kỳ, sau 1 tháng học kèm em đã thi cuối kỳ được 8.5 điểm A!"
                        },
                        {
                            ten_hoc_vien: "Nguyễn Thu Uyên (SV Kinh Tế Quốc Dân)",
                            ngay: "28/02/2026",
                            rating: 5.0,
                            khoa_hoc: "Toán Cao Cấp C1",
                            binh_luan: "Thầy chữa bài tập rất kỹ, giải thích bản chất công thức dễ hiểu vô cùng, tài liệu luyện đề bám sát đề thi thật."
                        }
                    ]
                },
                {
                    ho_ten: "Trần Thị Bích",
                    mon_hoc_chuyen_mon: "Lập trình Web & Node.js",
                    so_dien_thoai: "0987 654 321",
                    email: "bich.tran.dev@gmail.com",
                    gia_theo_gio: 250000,
                    rating: 5.0,
                    mo_ta: "Senior Fullstack Engineer tại Tech Corp - Hướng dẫn đồ án môn học, React, Express, MongoDB thực chiến từ số 0 đến deploy production.",
                    khung_gio_day: "Tối Thứ 3, 5 & Cả ngày Thứ 7",
                    ca_day: ["toi", "cuoi_tuan"],
                    kinh_nghiem: "4 năm làm việc thực tế",
                    khu_vuc: "Online toàn quốc qua Live-share & Discord",
                    hoc_vi: "Kỹ sư Công nghệ Thông tin",
                    truong_tot_nghiep: "Đại học Bách Khoa Hà Nội",
                    phuong_phap_day: "Pair programming thực chiến 1-1, code review chi tiết từng dòng, hướng dẫn giải quyết bug thực tế, tư vấn kiến trúc chuẩn Clean Architecture và chuẩn bị CV phỏng vấn Fresher/Intern.",
                    thanh_tich: [
                        "Top 3 Hackathon Sinh viên Công nghệ BK Maker Challenge",
                        "Tech Lead dự án Web EdTech đạt 50,000+ sinh viên hoạt động hàng tháng",
                        "Đã đồng hành hỗ trợ bảo vệ thành công hơn 65 đồ án tốt nghiệp và bài tập lớn"
                    ],
                    bang_cap: [
                        {
                            ten_bang: "Bằng Kỹ sư Công nghệ Thông tin (Chương trình Tiên tiến)",
                            to_chuc: "Trường Đại học Bách Khoa Hà Nội",
                            nam: "2022",
                            xep_loai: "Giỏi",
                            hinh_anh: "/images/degree_certificate.jpg",
                            da_xac_thuc: true,
                            mo_ta: "Chuyên ngành Kỹ thuật Phần mềm. Đồ án tốt nghiệp đạt 9.8/10."
                        },
                        {
                            ten_bang: "AWS Certified Developer – Associate",
                            to_chuc: "Amazon Web Services (AWS)",
                            nam: "2023",
                            xep_loai: "Chuyên gia",
                            hinh_anh: "/images/degree_certificate.jpg",
                            da_xac_thuc: true,
                            mo_ta: "Chứng chỉ quốc tế phát triển và triển khai ứng dụng Cloud Native trên hạ tầng AWS."
                        }
                    ],
                    bang_diem: {
                        gpa_he_4: 3.86,
                        gpa_he_10: 9.15,
                        xep_loai: "Tốt nghiệp Giỏi / Top 5%",
                        truong_dai_hoc: "Đại học Bách Khoa Hà Nội",
                        chuyen_nganh: "Kỹ thuật Phần mềm",
                        hinh_anh: "/images/academic_transcript.jpg",
                        da_xac_thuc: true,
                        mon_tieu_bieu: [
                            { ten_mon: "Lập trình Web Nâng cao (Node.js/React)", diem_so: "10.0", diem_he_4: 4.0, tin_chi: 3 },
                            { ten_mon: "Hệ quản trị Cơ sở dữ liệu & NoSQL", diem_so: "9.8", diem_he_4: 4.0, tin_chi: 3 },
                            { ten_mon: "Kiến trúc & Thiết kế Phần mềm", diem_so: "9.5", diem_he_4: 4.0, tin_chi: 4 },
                            { ten_mon: "Phát triển Ứng dụng Di động & REST API", diem_so: "9.4", diem_he_4: 4.0, tin_chi: 3 }
                        ]
                    },
                    danh_gia_hoc_vien: [
                        {
                            ten_hoc_vien: "Đặng Vũ Hải (SV Học viện Bưu chính)",
                            ngay: "05/03/2026",
                            rating: 5.0,
                            khoa_hoc: "Đồ án Web Fullstack Node/React",
                            binh_luan: "Chị Bích siêu nhiệt tình! Đồ án em bị lỗi CORS và JWT mãi không xong, chị chỉ 1 buổi tối là thông suốt toàn bộ luồng Auth và Deploy thành công lên Render."
                        },
                        {
                            ten_hoc_vien: "Lê Nhật Nam (SV FPT University)",
                            ngay: "20/02/2026",
                            rating: 5.0,
                            khoa_hoc: "Thực hành Backend Express",
                            binh_luan: "Học được cách tổ chức code theo MVC chuẩn, kiến thức thực tế hơn trường dạy rất nhiều!"
                        }
                    ]
                },
                {
                    ho_ten: "Lê Hoàng Nam",
                    mon_hoc_chuyen_mon: "Tiếng Anh IELTS & Giao Tiếp",
                    so_dien_thoai: "0903 112 233",
                    email: "nam.ielts@gmail.com",
                    gia_theo_gio: 180000,
                    rating: 4.8,
                    mo_ta: "IELTS 8.5 Overall - Phương pháp Shadowing & Mindmap Writing, chỉnh phát âm IPA chuẩn bản xứ, hỗ trợ viết luận đồ án tiếng Anh và thuyết trình chuyên nghiệp.",
                    khung_gio_day: "Chiều Thứ 2, 4 & Sáng Thứ 7 (14:00 - 16:00)",
                    ca_day: ["chieu", "sang", "cuoi_tuan"],
                    kinh_nghiem: "3 năm giảng dạy học thuật",
                    khu_vuc: "Hà Nội & Online toàn quốc",
                    hoc_vi: "Cử nhân Ngôn ngữ Anh",
                    truong_tot_nghiep: "Trường Đại học Ngoại Ngữ - ĐHQGHN",
                    phuong_phap_day: "Chữa bài Speaking và Writing 1-1 không giới hạn, áp dụng phương pháp PEEL trong viết Task 2 và tư duy phản biện Logic Flow.",
                    thanh_tich: [
                        "IELTS Academic 8.5 Overall (Listening 9.0, Reading 9.0, Speaking 8.0, Writing 8.0)",
                        "Chứng chỉ Quốc tế Giảng dạy Tiếng Anh TESOL Certificate",
                        "Đã giúp hơn 80 sinh viên đạt chứng chỉ chuẩn đầu ra B2 / IELTS 6.5+"
                    ],
                    bang_cap: [
                        {
                            ten_bang: "Bằng Cử nhân Ngôn ngữ Anh (Chất lượng cao)",
                            to_chuc: "Trường Đại học Ngoại Ngữ - ĐHQGHN",
                            nam: "2021",
                            xep_loai: "Xuất sắc",
                            hinh_anh: "/images/degree_certificate.jpg",
                            da_xac_thuc: true,
                            mo_ta: "Chuyên ngành Sư phạm & Ngôn ngữ ứng dụng. Tốt nghiệp loại Xuất sắc."
                        },
                        {
                            ten_bang: "Chứng chỉ IELTS Academic 8.5 (IDP Education)",
                            to_chuc: "IDP & British Council",
                            nam: "2023",
                            xep_loai: "Expert User (C2 Level)",
                            hinh_anh: "/images/ielts_certificate.jpg",
                            da_xac_thuc: true,
                            mo_ta: "Điểm tuyệt đối 9.0 Listening, 9.0 Reading. Điểm Speaking và Writing 8.0."
                        }
                    ],
                    bang_diem: {
                        gpa_he_4: 3.90,
                        gpa_he_10: 9.25,
                        xep_loai: "Xuất sắc",
                        truong_dai_hoc: "Đại học Ngoại Ngữ - ĐHQGHN",
                        chuyen_nganh: "Ngôn ngữ Anh & Giảng dạy tiếng Anh",
                        hinh_anh: "/images/academic_transcript.jpg",
                        da_xac_thuc: true,
                        mon_tieu_bieu: [
                            { ten_mon: "Academic Essay Writing & Research", diem_so: "9.8", diem_he_4: 4.0, tin_chi: 4 },
                            { ten_mon: "Phonetics & English Pronunciation Mastery", diem_so: "10.0", diem_he_4: 4.0, tin_chi: 3 },
                            { ten_mon: "Advanced English Grammar & Syntax", diem_so: "9.5", diem_he_4: 4.0, tin_chi: 3 },
                            { ten_mon: "Public Speaking & Debate in English", diem_so: "9.6", diem_he_4: 4.0, tin_chi: 3 }
                        ]
                    },
                    danh_gia_hoc_vien: [
                        {
                            ten_hoc_vien: "Phạm Thảo My (SV ĐH Ngoại Thương)",
                            ngay: "08/03/2026",
                            rating: 5.0,
                            khoa_hoc: "Luyện thi IELTS Cấp tốc",
                            binh_luan: "Thầy Nam sửa bài viết chi tiết từng dấu phẩy và từ vựng collocations. Em thi đạt 7.0 Writing sau 2 tháng học kèm!"
                        }
                    ]
                },
                {
                    ho_ten: "Phạm Minh Đức",
                    mon_hoc_chuyen_mon: "Cấu trúc dữ liệu & Giải thuật",
                    so_dien_thoai: "0934 889 900",
                    email: "duc.algorithms@gmail.com",
                    gia_theo_gio: 300000,
                    rating: 4.9,
                    mo_ta: "Giải Ba Quốc gia Tin học - Chuyên thuật toán LeetCode, Codeforces và cấu trúc dữ liệu cho sinh viên CNTT các trường đại học.",
                    khung_gio_day: "Sáng Thứ 7 & Sáng Chủ Nhật (08:30 - 11:30)",
                    ca_day: ["sang", "cuoi_tuan"],
                    kinh_nghiem: "3 năm gia sư chuyên sâu",
                    khu_vuc: "Online qua Discord / Google Meet",
                    hoc_vi: "Cử nhân Khoa học Máy tính",
                    truong_tot_nghiep: "Trường ĐH Khoa học Tự nhiên - ĐHQG",
                    phuong_phap_day: "Trực quan hóa thuật toán bằng animation cây, đồ thị, mảng động. Rèn tư duy phân tích thời gian chạy Big-O, kỹ năng quy hoạch động và chia để trị.",
                    thanh_tich: [
                        "Giải Ba Học sinh giỏi Quốc gia môn Tin học (VNOI)",
                        "Huy chương Bạc kỳ thi lập trình sinh viên quốc tế ICPC Asia Regional",
                        "Rank Master trên Codeforces & hoàn thành 900+ bài LeetCode Medium/Hard"
                    ],
                    bang_cap: [
                        {
                            ten_bang: "Bằng Cử nhân Khoa học Máy tính (Chương trình Tài năng)",
                            to_chuc: "Trường Đại học Khoa học Tự nhiên",
                            nam: "2023",
                            xep_loai: "Xuất sắc",
                            hinh_anh: "/images/degree_certificate.jpg",
                            da_xac_thuc: true,
                            mo_ta: "Chuyên ngành Thuật toán & Trí tuệ tính toán. Tốt nghiệp thủ khoa khoa CNTT."
                        }
                    ],
                    bang_diem: {
                        gpa_he_4: 3.95,
                        gpa_he_10: 9.42,
                        xep_loai: "Thủ khoa Xuất sắc",
                        truong_dai_hoc: "ĐH Khoa học Tự nhiên",
                        chuyen_nganh: "Khoa học Máy tính",
                        hinh_anh: "/images/academic_transcript.jpg",
                        da_xac_thuc: true,
                        mon_tieu_bieu: [
                            { ten_mon: "Cấu trúc dữ liệu & Giải thuật nâng cao", diem_so: "10.0", diem_he_4: 4.0, tin_chi: 4 },
                            { ten_mon: "Thiết kế & Phân tích Thuật toán", diem_so: "9.9", diem_he_4: 4.0, tin_chi: 4 },
                            { ten_mon: "Lý thuyết Đồ thị & Toán rời rạc", diem_so: "10.0", diem_he_4: 4.0, tin_chi: 3 },
                            { ten_mon: "Lập trình thi đấu & Tối ưu hóa", diem_so: "9.8", diem_he_4: 4.0, tin_chi: 3 }
                        ]
                    },
                    danh_gia_hoc_vien: [
                        {
                            ten_hoc_vien: "Vũ Tuấn Kiệt (SV ĐH Công Nghệ - ĐHQG)",
                            ngay: "14/02/2026",
                            rating: 5.0,
                            khoa_hoc: "Cấu trúc dữ liệu & Thuật toán C++",
                            binh_luan: "Anh Đức giảng bài quy hoạch động cực kỳ sáng sủa. Từ chỗ không hiểu gì về đệ quy có nhớ, giờ em tự tin giải các bài đồ án điểm 10."
                        }
                    ]
                },
                {
                    ho_ten: "Đỗ Mai Hương",
                    mon_hoc_chuyen_mon: "Vật Lý Đại Cương",
                    so_dien_thoai: "0966 778 899",
                    email: "maihuong.physics@gmail.com",
                    gia_theo_gio: 150000,
                    rating: 4.7,
                    mo_ta: "Cựu sinh viên Bách Khoa loại Giỏi - Chuyên giải bài tập Cơ - Nhiệt - Điện quang dễ hiểu, phương pháp giải nhanh trắc nghiệm cam kết qua môn điểm cao.",
                    khung_gio_day: "Tối Thứ 3, 5, 7 (18:30 - 20:30)",
                    ca_day: ["toi", "cuoi_tuan"],
                    kinh_nghiem: "2 năm gia sư đại cương",
                    khu_vuc: "Online & Trực tiếp tại Hà Nội",
                    hoc_vi: "Kỹ sư Vật lý Kỹ thuật",
                    truong_tot_nghiep: "Đại học Bách Khoa Hà Nội",
                    phuong_phap_day: "Hệ thống hóa toàn bộ công thức theo từng chương vào 1 tờ cheat-sheet, phân dạng bài tập từ cơ bản đến nâng cao có giải chi tiết.",
                    thanh_tich: [
                        "Học bổng Khuyến khích Tài năng Khoa Vật lý Kỹ thuật",
                        "Đã kèm hơn 90 sinh viên khối kỹ thuật đạt điểm thi Vật lý đại cương từ 8.0 trở lên"
                    ],
                    bang_cap: [
                        {
                            ten_bang: "Bằng Kỹ sư Vật lý Kỹ thuật (Loại Giỏi)",
                            to_chuc: "Trường Đại học Bách Khoa Hà Nội",
                            nam: "2022",
                            xep_loai: "Giỏi",
                            hinh_anh: "/images/degree_certificate.jpg",
                            da_xac_thuc: true,
                            mo_ta: "Chuyên ngành Vật lý Bán dẫn & Thiết bị Quang học."
                        }
                    ],
                    bang_diem: {
                        gpa_he_4: 3.75,
                        gpa_he_10: 8.85,
                        xep_loai: "Giỏi",
                        truong_dai_hoc: "Đại học Bách Khoa Hà Nội",
                        chuyen_nganh: "Vật lý Kỹ thuật",
                        hinh_anh: "/images/academic_transcript.jpg",
                        da_xac_thuc: true,
                        mon_tieu_bieu: [
                            { ten_mon: "Vật lý đại cương 1 (Cơ học & Nhiệt học)", diem_so: "9.5", diem_he_4: 4.0, tin_chi: 3 },
                            { ten_mon: "Vật lý đại cương 2 (Điện từ trường)", diem_so: "9.5", diem_he_4: 4.0, tin_chi: 3 },
                            { ten_mon: "Vật lý đại cương 3 (Quang học & Lượng tử)", diem_so: "9.0", diem_he_4: 3.5, tin_chi: 3 }
                        ]
                    },
                    danh_gia_hoc_vien: [
                        {
                            ten_hoc_vien: "Bùi Quang Huy (SV ĐH Xây Dựng)",
                            ngay: "25/01/2026",
                            rating: 5.0,
                            khoa_hoc: "Vật lý Đại cương 1 & 2",
                            binh_luan: "Chị Hương giảng dễ hiểu, đặc biệt phần Điện từ trường chị vẽ hình minh họa rõ ràng, thi cuối kỳ em được 9.0 mừng rơi nước mắt!"
                        }
                    ]
                },
                {
                    ho_ten: "Vũ Hải Đăng",
                    mon_hoc_chuyen_mon: "Trí Tuệ Nhân Tạo & Python",
                    so_dien_thoai: "0971 223 344",
                    email: "dang.ai.dev@gmail.com",
                    gia_theo_gio: 350000,
                    rating: 5.0,
                    mo_ta: "AI Research Engineer - Chuyên hướng dẫn Machine Learning, Deep Learning, PyTorch, LangChain và xử lý dữ liệu lớn cho sinh viên làm đồ án tốt nghiệp.",
                    khung_gio_day: "Chiều Thứ 7 & Tối Chủ Nhật",
                    ca_day: ["chieu", "toi", "cuoi_tuan"],
                    kinh_nghiem: "5 năm kinh nghiệm AI",
                    khu_vuc: "Online toàn quốc qua Google Meet / Discord",
                    hoc_vi: "Thạc sĩ Khoa học Dữ liệu & AI",
                    truong_tot_nghiep: "Viện Công nghệ Quốc tế",
                    phuong_phap_day: "Học qua đồ án thực tế (End-to-End Project), hướng dẫn xây dựng model state-of-the-art, fine-tuning mô hình ngôn ngữ lớn LLM và viết báo cáo khoa học chuẩn IEEE.",
                    thanh_tich: [
                        "Đồng tác giả 2 bài báo quốc tế công bố tại Hội nghị IEEE/CVPR Workshop",
                        "AI Tech Lead tại công ty công nghệ đa quốc gia",
                        "Hướng dẫn hơn 40 sinh viên bảo vệ đồ án tốt nghiệp AI đạt điểm tối đa 10/10"
                    ],
                    bang_cap: [
                        {
                            ten_bang: "Bằng Thạc sĩ Trí Tuệ Nhân Tạo & Khoa học Dữ liệu",
                            to_chuc: "Viện Công nghệ Quốc tế",
                            nam: "2023",
                            xep_loai: "Xuất sắc",
                            hinh_anh: "/images/degree_certificate.jpg",
                            da_xac_thuc: true,
                            mo_ta: "Chuyên ngành Deep Learning & Computer Vision. Luận văn Thạc sĩ xuất sắc."
                        },
                        {
                            ten_bang: "Google Professional Machine Learning Engineer",
                            to_chuc: "Google Cloud Certification",
                            nam: "2024",
                            xep_loai: "Chuyên gia Quốc tế",
                            hinh_anh: "/images/degree_certificate.jpg",
                            da_xac_thuc: true,
                            mo_ta: "Chứng chỉ quốc tế của Google về thiết kế, triển khai mô hình học máy trên hạ tầng đám mây."
                        }
                    ],
                    bang_diem: {
                        gpa_he_4: 3.98,
                        gpa_he_10: 9.65,
                        xep_loai: "Thủ khoa Toàn khóa Xuất sắc",
                        truong_dai_hoc: "Viện Công nghệ Quốc tế",
                        chuyen_nganh: "Trí Tuệ Nhân Tạo & Khoa học Dữ liệu",
                        hinh_anh: "/images/academic_transcript.jpg",
                        da_xac_thuc: true,
                        mon_tieu_bieu: [
                            { ten_mon: "Machine Learning & Deep Neural Networks", diem_so: "10.0", diem_he_4: 4.0, tin_chi: 4 },
                            { ten_mon: "Natural Language Processing (NLP) & LLMs", diem_so: "9.9", diem_he_4: 4.0, tin_chi: 4 },
                            { ten_mon: "Computer Vision & Image Processing", diem_so: "9.8", diem_he_4: 4.0, tin_chi: 3 },
                            { ten_mon: "Big Data Processing & Distributed Systems", diem_so: "10.0", diem_he_4: 4.0, tin_chi: 3 }
                        ]
                    },
                    danh_gia_hoc_vien: [
                        {
                            ten_hoc_vien: "Trần Bảo Long (SV ĐH FPT)",
                            ngay: "10/03/2026",
                            rating: 5.0,
                            khoa_hoc: "Đồ án Tốt nghiệp Thị giác Máy tính",
                            binh_luan: "Nhờ anh Đăng mà em hoàn thiện mô hình phát hiện lỗi sản phẩm với độ chính xác 98% và được hội đồng đánh giá xuất sắc nhất khóa!"
                        }
                    ]
                }
            ]);
        }

        // Xây dựng điều kiện lọc
        const filter = {};

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [
                { ho_ten: regex },
                { mon_hoc_chuyen_mon: regex },
                { mo_ta: regex }
            ];
        }

        if (mon_hoc && mon_hoc !== "all") {
            filter.mon_hoc_chuyen_mon = new RegExp(mon_hoc, "i");
        }

        if (min_gia || max_gia) {
            filter.gia_theo_gio = {};
            if (min_gia && !isNaN(min_gia)) filter.gia_theo_gio.$gte = Number(min_gia);
            if (max_gia && !isNaN(max_gia)) filter.gia_theo_gio.$lte = Number(max_gia);
        }

        if (ca_day && ca_day !== "all") {
            filter.ca_day = ca_day;
        }

        if (min_rating && !isNaN(min_rating)) {
            filter.rating = { $gte: Number(min_rating) };
        }

        const giaSus = await GiaSu.find(filter).sort({ rating: -1, gia_theo_gio: 1 });
        res.status(200).json({ success: true, count: giaSus.length, data: giaSus });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách gia sư: " + error.message });
    }
};

module.exports = {
    getMonHoc,
    createMonHoc,
    updateMonHoc,
    deleteMonHoc,
    getBaoCaoHocTap,
    getBaiTap,
    createBaiTap,
    updateBaiTap,
    deleteBaiTap,
    getGiaSu
};
