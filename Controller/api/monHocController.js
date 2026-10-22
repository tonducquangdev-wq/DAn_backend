const mongoose = require("mongoose");
const MonHoc = require("../../Model/MonHoc");
const BaiTap = require("../../Model/BaiTap");
const LichHoc = require("../../Model/LichHoc");
const GiaSu = require("../../Model/GiaSu");
const SuKien = require("../../Model/SuKien");
const User = require("../../Model/User");

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
            chi_tiet_lich_hoc,
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

        // Chuẩn hóa chi tiết lịch học theo từng buổi nếu có
        let parsedChiTiet = [];
        if (Array.isArray(chi_tiet_lich_hoc) && chi_tiet_lich_hoc.length > 0) {
            parsedChiTiet = chi_tiet_lich_hoc
                .filter(item => item && Number(item.thu_trong_tuan) >= 2 && Number(item.thu_trong_tuan) <= 8)
                .map(item => ({
                    thu_trong_tuan: Number(item.thu_trong_tuan),
                    gio_bat_dau: item.gio_bat_dau && item.gio_bat_dau.includes(":") ? item.gio_bat_dau : validStartHour,
                    gio_ket_thuc: item.gio_ket_thuc && item.gio_ket_thuc.includes(":") ? item.gio_ket_thuc : validEndHour,
                    phong_hoc: item.phong_hoc ? item.phong_hoc.trim() : (phong_hoc ? phong_hoc.trim() : null)
                }));
            if (parsedChiTiet.length > 0) {
                parsedNgayHoc = parsedChiTiet.map(item => item.thu_trong_tuan);
            }
        }

        if (parsedNgayHoc.length === 0) {
            const dayOfStart = startDate.getDay() === 0 ? 8 : startDate.getDay() + 1;
            parsedNgayHoc = [dayOfStart];
        }

        if (parsedChiTiet.length === 0) {
            parsedChiTiet = parsedNgayHoc.map(thu => ({
                thu_trong_tuan: thu,
                gio_bat_dau: validStartHour,
                gio_ket_thuc: validEndHour,
                phong_hoc: phong_hoc ? phong_hoc.trim() : null
            }));
        }

        // Map theo thứ để tra cứu giờ chính xác từng buổi
        const scheduleMap = {};
        parsedChiTiet.forEach(item => {
            scheduleMap[item.thu_trong_tuan] = item;
        });

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
            gio_bat_dau: parsedChiTiet[0]?.gio_bat_dau || validStartHour,
            gio_ket_thuc: parsedChiTiet[0]?.gio_ket_thuc || validEndHour,
            ngay_hoc: parsedNgayHoc,
            chi_tiet_lich_hoc: parsedChiTiet,
            trang_thai: trang_thai || "dang_hoc",
            mau_sac: mau_sac || "#3B82F6"
        });

        // 2. Tạo bản ghi LichHoc cho từng buổi với giờ học tương ứng
        for (const item of parsedChiTiet) {
            await LichHoc.create({
                user_id: req.user._id,
                mon_hoc_id: monHoc._id,
                thu_trong_tuan: item.thu_trong_tuan,
                gio_bat_dau: item.gio_bat_dau,
                gio_ket_thuc: item.gio_ket_thuc,
                phong_hoc: item.phong_hoc || phong_hoc || null
            });
        }

        // 3. Tự động đồng bộ các buổi học vào trang Lịch (SuKien)
        const eventsToInsert = [];
        let current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endLimit = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const maxSessions = 100; // Giới hạn an toàn

        const eventTitle = ma_mon ? `${ten_mon.trim()} (${ma_mon.trim()})` : ten_mon.trim();

        while (current <= endLimit && eventsToInsert.length < maxSessions) {
            const vnDay = current.getDay() === 0 ? 8 : current.getDay() + 1;
            if (scheduleMap[vnDay]) {
                const session = scheduleMap[vnDay];
                const [sH, sM] = session.gio_bat_dau.split(":").map(Number);
                const [eH, eM] = session.gio_ket_thuc.split(":").map(Number);
                const sessionRoom = session.phong_hoc || phong_hoc || "Chưa cập nhật";
                const eventDesc = `Lớp học phần: ${ten_mon.trim()}\nGiảng viên: ${giang_vien || "Chưa cập nhật"}\nPhòng học: ${sessionRoom}${so_tin_chi ? `\nSố tín chỉ: ${so_tin_chi}` : ""}`;

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
                    dia_diem: session.phong_hoc || phong_hoc || null,
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

        // Nếu người xem không phải là Admin, ẩn toàn bộ gia sư thuộc các tài khoản bị khóa (banned)
        if (req.user?.role !== "admin") {
            const bannedUserIds = await User.find({ status: "banned" }).distinct("_id");
            if (bannedUserIds.length > 0) {
                filter.user_id = { $nin: bannedUserIds };
            }
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
