const mongoose = require("mongoose");

const congViecSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        du_an_id: { type: mongoose.Schema.Types.ObjectId, ref: "DuAn", default: null },
        tieu_de: { type: String, required: true, trim: true },
        mo_ta: { type: String, default: null },
        do_uu_tien: {
            type: String,
            enum: ["cao", "trung_binh", "thap"],
            default: "trung_binh"
        },
        trang_thai: {
            type: String,
            enum: ["chua_lam", "dang_lam", "hoan_thanh"],
            default: "chua_lam"
        },
        tien_do: { type: Number, min: 0, max: 100, default: 0 },
        han_chot: { type: Date, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("CongViec", congViecSchema);
