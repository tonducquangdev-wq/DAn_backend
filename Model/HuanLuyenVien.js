const mongoose = require("mongoose");

const huanLuyenVienSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        ho_ten: { type: String, required: true, trim: true },
        chuyen_mon: { type: String, required: true, trim: true }, // Tăng cơ, Giảm mỡ, Calisthenics, Powerlifting, Phục hồi chức năng
        so_dien_thoai: { type: String, default: null },
        email: { type: String, default: null },
        gia_theo_gio: { type: Number, default: 250000 },
        mo_ta: { type: String, default: null },
        rating: { type: Number, default: 5.0 },
        avatar: { type: String, default: null },
        khung_gio_tap: { type: String, default: "Linh hoạt / Sáng & Tối" },
        ca_tap: { type: [String], default: ["sang", "toi"] },
        kinh_nghiem: { type: String, default: "2+ năm huấn luyện cá nhân" },
        khu_vuc: { type: String, default: "Phòng Gym đối tác & Hướng dẫn Online" },
        chung_chi_the_hinh: { type: String, default: "Chứng chỉ HLV Thể Hình Quốc Gia" },
        phong_tap: { type: String, default: "Life Fitness Club" },
        phuong_phap_huan_luyen: { type: String, default: "Khoa học vận động, dinh dưỡng cá nhân hóa và theo dõi chỉ số InBody hàng tuần" },
        thanh_tich: { type: [String], default: [] },
        chung_chi: [
            {
                ten_bang: { type: String, required: true },
                to_chuc: { type: String },
                nam: { type: String },
                xep_loai: { type: String, default: "Xuất sắc" },
                hinh_anh: { type: String, default: "/images/pt_certificate.jpg" },
                da_xac_thuc: { type: Boolean, default: true },
                mo_ta: { type: String }
            }
        ],
        danh_gia_hoc_vien: [
            {
                ten_hoc_vien: { type: String },
                ngay: { type: String },
                rating: { type: Number, default: 5.0 },
                binh_luan: { type: String },
                muc_tieu: { type: String }
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model("HuanLuyenVien", huanLuyenVienSchema);
