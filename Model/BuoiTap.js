const mongoose = require("mongoose");

const buoiTapSchema = new mongoose.Schema(
    {
        ke_hoach_tap_luyen_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "KeHoachTapLuyen", 
            required: true 
        },
        ten_buoi_tap: { type: String, required: true, trim: true },
        ngay_trong_tuan: { type: Number, required: true, min: 2, max: 8 },
        thu_tu: { type: Number, default: 1 }
    },
    { timestamps: true }
);

module.exports = mongoose.model("BuoiTap", buoiTapSchema);
