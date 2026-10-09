const mongoose = require("mongoose");

const monHocSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        ma_mon: { type: String, required: true, trim: true },
        ten_mon: { type: String, required: true, trim: true },
        giang_vien: { type: String, default: null, trim: true },
        phong_hoc: { type: String, default: null, trim: true },
        so_tin_chi: { type: Number, required: true, min: 1, max: 20 },
        diem_so: { type: Number, min: 0, max: 10, default: null },
        tien_do: { type: Number, min: 0, max: 100, default: 0 },
        ngay_bat_dau: { type: Date, default: null },
        ngay_ket_thuc: { type: Date, default: null },
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
