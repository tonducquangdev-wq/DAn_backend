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
        loai_du_an: {
            type: String,
            enum: ["cong_viec_chinh", "part_time", "du_an_tu_do"],
            default: "part_time"
        },
        luong_theo_gio: { type: Number, default: 0 },
        luong_co_ban: { type: Number, default: 0 },
        dia_chi: { type: String, default: null },
        ngay_bat_dau: { type: Date, default: null },
        ngay_ket_thuc: { type: Date, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("DuAn", duAnSchema);
