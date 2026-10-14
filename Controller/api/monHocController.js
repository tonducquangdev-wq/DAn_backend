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

        if (!ma_mon || !ten_mon || !so_tin_chi) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập Mã môn, Tên môn và Số tín chỉ" });
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
            ma_mon,
            ten_mon,
            giang_vien: giang_vien || null,
            phong_hoc: phong_hoc || null,
            so_tin_chi: Number(so_tin_chi),
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

        while (current <= endLimit && eventsToInsert.length < maxSessions) {
            const vnDay = current.getDay() === 0 ? 8 : current.getDay() + 1;
            if (parsedNgayHoc.includes(vnDay)) {
                const evStart = new Date(current.getFullYear(), current.getMonth(), current.getDate(), sH, sM, 0);
                const evEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate(), eH, eM, 0);

                eventsToInsert.push({
                    user_id: req.user._id,
                    mon_hoc_id: monHoc._id,
                    loai_su_kien: "hoc-tap",
                    tieu_de: `${ten_mon} (${ma_mon})`,
                    mo_ta: `Lớp học phần: ${ten_mon}\nGiảng viên: ${giang_vien || "Chưa cập nhật"}\nPhòng học: ${phong_hoc || "Chưa cập nhật"}\nSố tín chỉ: ${so_tin_chi}`,
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
                tieu_de: `${ten_mon} (${ma_mon})`,
                mo_ta: `Lớp học phần: ${ten_mon}\nGiảng viên: ${giang_vien || "Chưa cập nhật"}\nPhòng học: ${phong_hoc || "Chưa cập nhật"}\nSố tín chỉ: ${so_tin_chi}`,
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

const createBaiTap = async (req, res) => {
    try {
        const { ten_bai_tap, mon_hoc_id, meo_ghi_nho, han_nop, do_uu_tien, trang_thai } = req.body;
        if (!ten_bai_tap || !han_nop) {
            return res.status(400).json({ success: false, message: "Vui lòng điền Tên bài tập và Hạn nộp" });
        }

        const baiTap = await BaiTap.create({
            user_id: req.user._id,
            mon_hoc_id: mon_hoc_id || null,
            ten_bai_tap,
            meo_ghi_nho: meo_ghi_nho || null,
            han_nop,
            do_uu_tien: do_uu_tien || "trung_binh",
            trang_thai: trang_thai || "chua_hoan_thanh"
        });

        res.status(201).json({ success: true, message: "Tạo bài tập thành công", data: baiTap });
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
        await baiTap.save();

        res.status(200).json({ success: true, message: "Cập nhật bài tập thành công", data: baiTap });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật bài tập: " + error.message });
    }
};

const deleteBaiTap = async (req, res) => {
    try {
        const { id } = req.params;
        await BaiTap.deleteOne({ _id: id, user_id: req.user._id });
        res.status(200).json({ success: true, message: "Xóa bài tập thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa bài tập: " + error.message });
    }
};

// 4. Danh sách Gia sư & Bộ lọc tìm kiếm
const getGiaSu = async (req, res) => {
    try {
        const { mon_hoc, min_gia, max_gia, ca_day, search, min_rating } = req.query;

        // Tự động khởi tạo dữ liệu mẫu phong phú nếu chưa có hoặc ít hơn 6 gia sư
        const count = await GiaSu.countDocuments();
        if (count < 6) {
            await GiaSu.deleteMany({});
            await GiaSu.insertMany([
                {
                    ho_ten: "Nguyễn Văn Anh",
                    mon_hoc_chuyen_mon: "Toán Cao Cấp & Đại Số",
                    so_dien_thoai: "0912 345 678",
                    email: "vananh.math@gmail.com",
                    gia_theo_gio: 200000,
                    rating: 4.9,
                    mo_ta: "Thạc sĩ Toán học - 5 năm kinh nghiệm luyện thi đại học và hỗ trợ sinh viên các học phần Toán đại cương.",
                    khung_gio_day: "Tối Thứ 2, 4, 6 (19:30 - 21:30)",
                    ca_day: ["toi"],
                    kinh_nghiem: "5 năm kinh nghiệm",
                    khu_vuc: "Online qua Google Meet"
                },
                {
                    ho_ten: "Trần Thị Bích",
                    mon_hoc_chuyen_mon: "Lập trình Web & Node.js",
                    so_dien_thoai: "0987 654 321",
                    email: "bich.tran.dev@gmail.com",
                    gia_theo_gio: 250000,
                    rating: 5.0,
                    mo_ta: "Senior Fullstack Engineer tại Tech Corp - Hướng dẫn đồ án môn học, React, Express, MongoDB thực chiến.",
                    khung_gio_day: "Tối Thứ 3, 5 & Cả ngày Thứ 7",
                    ca_day: ["toi", "cuoi_tuan"],
                    kinh_nghiem: "4 năm làm việc thực tế",
                    khu_vuc: "Online toàn quốc"
                },
                {
                    ho_ten: "Lê Hoàng Nam",
                    mon_hoc_chuyen_mon: "Tiếng Anh IELTS & Giao Tiếp",
                    so_dien_thoai: "0903 112 233",
                    email: "nam.ielts@gmail.com",
                    gia_theo_gio: 180000,
                    rating: 4.8,
                    mo_ta: "IELTS 8.5 - Phương pháp dạy thực tế, chỉnh phát âm chuẩn, sửa bài tập writing và thuyết trình chuyên nghiệp.",
                    khung_gio_day: "Chiều Thứ 2, 4 & Sáng Thứ 7 (14:00 - 16:00)",
                    ca_day: ["chieu", "sang", "cuoi_tuan"],
                    kinh_nghiem: "3 năm giảng dạy",
                    khu_vuc: "Hà Nội & Online"
                },
                {
                    ho_ten: "Phạm Minh Đức",
                    mon_hoc_chuyen_mon: "Cấu trúc dữ liệu & Giải thuật",
                    so_dien_thoai: "0934 889 900",
                    email: "duc.algorithms@gmail.com",
                    gia_theo_gio: 300000,
                    rating: 4.9,
                    mo_ta: "Giải Ba Quốc gia Tin học - Chuyên thuật toán LeetCode, Codeforces và cấu trúc dữ liệu cho sinh viên CNTT.",
                    khung_gio_day: "Sáng Thứ 7 & Sáng Chủ Nhật (08:30 - 11:30)",
                    ca_day: ["sang", "cuoi_tuan"],
                    kinh_nghiem: "3 năm gia sư chuyên sâu",
                    khu_vuc: "Online qua Discord / Meet"
                },
                {
                    ho_ten: "Đỗ Mai Hương",
                    mon_hoc_chuyen_mon: "Vật Lý Đại Cương",
                    so_dien_thoai: "0966 778 899",
                    email: "maihuong.physics@gmail.com",
                    gia_theo_gio: 150000,
                    rating: 4.7,
                    mo_ta: "Cựu sinh viên Bách Khoa loại Giỏi - Chuyên giải bài tập cơ - nhiệt - điện quang dễ hiểu, cam kết qua môn điểm cao.",
                    khung_gio_day: "Tối Thứ 3, 5, 7 (18:30 - 20:30)",
                    ca_day: ["toi", "cuoi_tuan"],
                    kinh_nghiem: "2 năm gia sư",
                    khu_vuc: "Online & Trực tiếp"
                },
                {
                    ho_ten: "Vũ Hải Đăng",
                    mon_hoc_chuyen_mon: "Trí Tuệ Nhân Tạo & Python",
                    so_dien_thoai: "0971 223 344",
                    email: "dang.ai.dev@gmail.com",
                    gia_theo_gio: 350000,
                    rating: 5.0,
                    mo_ta: "AI Research Engineer - Chuyên hướng dẫn Machine Learning, Deep Learning, PyTorch và xử lý dữ liệu lớn.",
                    khung_gio_day: "Chiều Thứ 7 & Tối Chủ Nhật",
                    ca_day: ["chieu", "toi", "cuoi_tuan"],
                    kinh_nghiem: "5 năm kinh nghiệm AI",
                    khu_vuc: "Online toàn quốc"
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
