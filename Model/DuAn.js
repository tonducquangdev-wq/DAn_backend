const mongoose = require("mongoose");

const duAnSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        ten_du_an: { type: String, required: true, trim: true },
        mo_ta: { type: String, default: null },
        mau_sac: { type: String, default: "#6366F1" },
        trang_thai: {
            type: String,
            enum: ["dang_thuc_hien", "hoan_thanh", "tam_dung"],
            default: "dang_thuc_hien"
        },
        ngay_bat_dau: { type: Date, default: null },
        ngay_ket_thuc: { type: Date, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("DuAn", duAnSchema);
