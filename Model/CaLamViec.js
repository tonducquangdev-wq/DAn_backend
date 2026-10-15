const mongoose = require("mongoose");

const caLamViecSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        du_an_id: { type: mongoose.Schema.Types.ObjectId, ref: "DuAn", required: true },
        su_kien_id: { type: mongoose.Schema.Types.ObjectId, ref: "SuKien", default: null },
        tieu_de: { type: String, required: true, trim: true },
        ngay_lam: { type: Date, required: true },
        gio_bat_dau: { type: String, required: true }, // "08:00"
        gio_ket_thuc: { type: String, required: true }, // "12:30"
        thoi_gian_bat_dau: { type: Date, required: true },
        thoi_gian_ket_thuc: { type: Date, required: true },
        so_gio_lam: { type: Number, required: true, default: 0 },
        luong_theo_gio: { type: Number, default: 0 },
        tien_luong_ca: { type: Number, default: 0 },
        dia_diem: { type: String, default: null },
        ghi_chu: { type: String, default: null },
        trang_thai: {
            type: String,
            enum: ["chua_den", "da_hoan_thanh", "nghi_phep"],
            default: "chua_den"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("CaLamViec", caLamViecSchema);
