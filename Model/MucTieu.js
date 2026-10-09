const mongoose = require("mongoose");

const mucTieuSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        tieu_de: { type: String, required: true, trim: true },
        loai_muc_tieu: { type: String, default: "hoc_tap" },
        gia_tri_muc_tieu: { type: Number, required: true },
        gia_tri_hien_tai: { type: Number, default: 0 },
        han_chot: { type: Date, default: null },
        trang_thai: {
            type: String,
            enum: ["dang_thuc_hien", "hoan_thanh", "tam_dung"],
            default: "dang_thuc_hien"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("MucTieu", mucTieuSchema);
