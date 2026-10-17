const mongoose = require("mongoose");

const giaSuSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        ho_ten: { type: String, required: true, trim: true },
        mon_hoc_chuyen_mon: { type: String, required: true, trim: true },
        so_dien_thoai: { type: String, default: null },
        email: { type: String, default: null },
        gia_theo_gio: { type: Number, default: 0 },
        mo_ta: { type: String, default: null },
        rating: { type: Number, default: 5.0 },
        avatar: { type: String, default: null },
        khung_gio_day: { type: String, default: "Buổi tối & Cuối tuần" },
        ca_day: { type: [String], default: ["toi"] },
        kinh_nghiem: { type: String, default: "3+ năm kinh nghiệm" },
        khu_vuc: { type: String, default: "Online toàn quốc" },
        hoc_vi: { type: String, default: "Cử nhân Đại học" },
        truong_tot_nghiep: { type: String, default: "Đại học Quốc gia" },
        phuong_phap_day: { type: String, default: null },
        thanh_tich: { type: [String], default: [] },
        bang_cap: [
            {
                ten_bang: { type: String, required: true },
                to_chuc: { type: String },
                nam: { type: String },
                xep_loai: { type: String, default: "Xuất sắc" },
                hinh_anh: { type: String, default: "/images/degree_certificate.jpg" },
                da_xac_thuc: { type: Boolean, default: true },
                mo_ta: { type: String }
            }
        ],
        bang_diem: {
            gpa_he_4: { type: Number, default: 3.8 },
            gpa_he_10: { type: Number, default: 9.0 },
            xep_loai: { type: String, default: "Xuất sắc" },
            truong_dai_hoc: { type: String },
            chuyen_nganh: { type: String },
            hinh_anh: { type: String, default: "/images/academic_transcript.jpg" },
            da_xac_thuc: { type: Boolean, default: true },
            mon_tieu_bieu: [
                {
                    ten_mon: { type: String },
                    diem_so: { type: String },
                    diem_he_4: { type: Number },
                    tin_chi: { type: Number }
                }
            ]
        },
        danh_gia_hoc_vien: [
            {
                ten_hoc_vien: { type: String },
                ngay: { type: String },
                rating: { type: Number, default: 5.0 },
                binh_luan: { type: String },
                khoa_hoc: { type: String }
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model("GiaSu", giaSuSchema);
