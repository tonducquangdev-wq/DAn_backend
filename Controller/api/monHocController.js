const MonHoc = require("../../Model/MonHoc");
const BaiTap = require("../../Model/BaiTap");
const LichHoc = require("../../Model/LichHoc");
const GiaSu = require("../../Model/GiaSu");

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
        const { ma_mon, ten_mon, giang_vien, phong_hoc, so_tin_chi, diem_so, tien_do, ngay_bat_dau, ngay_ket_thuc, trang_thai, mau_sac } = req.body;

        if (!ma_mon || !ten_mon || !so_tin_chi) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập Mã môn, Tên môn và Số tín chỉ" });
        }

        const monHoc = await MonHoc.create({
            user_id: req.user._id,
            ma_mon,
            ten_mon,
            giang_vien: giang_vien || null,
            phong_hoc: phong_hoc || null,
            so_tin_chi: Number(so_tin_chi),
            diem_so: diem_so !== undefined && diem_so !== null ? Number(diem_so) : null,
            tien_do: tien_do ? Number(tien_do) : 0,
            ngay_bat_dau: ngay_bat_dau || null,
            ngay_ket_thuc: ngay_ket_thuc || null,
            trang_thai: trang_thai || "dang_hoc",
            mau_sac: mau_sac || "#3B82F6"
        });

        res.status(201).json({ success: true, message: "Tạo môn học thành công", data: monHoc });
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

        res.status(200).json({ success: true, message: "Xóa môn học thành công" });
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

// 4. Danh sách Gia sư
const getGiaSu = async (req, res) => {
    try {
        let giaSus = await GiaSu.find();
        if (giaSus.length === 0) {
            // Seed dữ liệu mẫu nếu chưa có
            giaSus = await GiaSu.insertMany([
                { ho_ten: "Nguyễn Văn Anh", mon_hoc_chuyen_mon: "Toán Cao Cấp & Đại Số", gia_theo_gio: 200000, rating: 4.9, mo_ta: "Thạc sĩ Toán học - 5 năm kinh nghiệm luyện thi" },
                { ho_ten: "Trần Thị Bích", mon_hoc_chuyen_mon: "Lập trình Web & Node.js", gia_theo_gio: 250000, rating: 5.0, mo_ta: "Senior Fullstack Engineer tại Tech Corp" },
                { ho_ten: "Lê Hoàng Nam", mon_hoc_chuyen_mon: "Tiếng Anh IELTS & Giao Tiếp", gia_theo_gio: 180000, rating: 4.8, mo_ta: "IELTS 8.5 - Giảng dạy nhiệt tình" }
            ]);
        }
        res.status(200).json({ success: true, data: giaSus });
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
