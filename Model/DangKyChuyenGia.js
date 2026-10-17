const mongoose = require("mongoose");

const dangKyChuyenGiaSchema = new mongoose.Schema(
    {
        user_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        },
        loai: { 
            type: String, 
            enum: ["gia_su", "pt"], 
            required: true 
        },
        ho_ten: { type: String, required: true, trim: true },
        so_dien_thoai: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        chuyen_mon: { type: String, required: true, trim: true }, // Môn học (Gia sư) hoặc Chuyên môn Gym (PT)
        kinh_nghiem: { type: String, default: "1-2 năm kinh nghiệm" },
        khu_vuc: { type: String, default: "Toàn quốc / Online" },
        gia_theo_gio: { type: Number, default: 200000 },
        mo_ta: { type: String, default: "" },
        hoc_vi_hoac_the_hinh: { type: String, default: "" }, // Bằng cử nhân / HLV chứng chỉ
        truong_tot_nghiep: { type: String, default: "" },
        khung_gio_day: { type: String, default: "Linh hoạt / Thỏa thuận" },
        chung_chi: [
            {
                ten_chung_chi: { type: String, required: true },
                noi_cap: { type: String, default: "" },
                nam_cap: { type: String, default: "" },
                hinh_anh: { type: String, default: "" }
            }
        ],
        bang_diem: {
            gpa_he_4: { type: Number, default: 0 },
            gpa_he_10: { type: Number, default: 0 },
            truong_dai_hoc: { type: String, default: "" },
            hinh_anh: { type: String, default: "" }
        },
        trang_thai: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },
        ly_do_tu_choi: { type: String, default: null },
        ngay_duyet: { type: Date, default: null },
        nguoi_duyet_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("DangKyChuyenGia", dangKyChuyenGiaSchema);
