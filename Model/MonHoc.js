const mongoose = require("mongoose");

const monHocSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        ma_mon: { type: String, default: null, trim: true },
        ten_mon: { type: String, required: true, trim: true },
        giang_vien: { type: String, default: null, trim: true },
        phong_hoc: { type: String, default: null, trim: true },
        so_tin_chi: { type: Number, default: 3, min: 1, max: 20 },
        diem_so: { type: Number, min: 0, max: 10, default: null },
        tien_do: { type: Number, min: 0, max: 100, default: 0 },
        ngay_bat_dau: { type: Date, default: null },
        ngay_ket_thuc: { type: Date, default: null },
        gio_bat_dau: { type: String, default: "07:30" },
        gio_ket_thuc: { type: String, default: "09:30" },
        ngay_hoc: { type: [Number], default: [2] }, // 2: Thứ 2, ..., 8: CN
        chi_tiet_lich_hoc: [
            {
                thu_trong_tuan: { type: Number, min: 2, max: 8 },
                gio_bat_dau: { type: String, default: "07:30" },
                gio_ket_thuc: { type: String, default: "09:30" },
                phong_hoc: { type: String, default: null }
            }
        ],
        trang_thai: {
            type: String,
            enum: ["dang_hoc", "da_hoan_thanh", "tam_dung"],
            default: "dang_hoc"
        },
        mau_sac: { type: String, default: "#3B82F6" },
        is_deleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model("MonHoc", monHocSchema);
