const mongoose = require("mongoose");

const chiTietBuoiTapSchema = new mongoose.Schema(
    {
        buoi_tap_id: { type: mongoose.Schema.Types.ObjectId, ref: "BuoiTap", required: true },
        bai_tap_the_chat_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "BaiTapTheChat", 
            required: true 
        },
        so_sets: { type: Number, default: 3 },
        so_reps: { type: Number, default: 10 },
        thoi_luong_phut: { type: Number, default: null },
        thu_tu: { type: Number, default: 1 }
    },
    { timestamps: true }
);

module.exports = mongoose.model("ChiTietBuoiTap", chiTietBuoiTapSchema);
