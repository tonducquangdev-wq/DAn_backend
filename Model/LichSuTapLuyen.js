const mongoose = require("mongoose");

const lichSuTapLuyenSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        buoi_tap_id: { type: mongoose.Schema.Types.ObjectId, ref: "BuoiTap", default: null },
        ten_buoi_tap: { type: String, default: null },
        ngay_tap: { type: Date, required: true },
        thoi_gian_tap_phut: { type: Number, default: 0 },
        ghi_chu: { type: String, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("LichSuTapLuyen", lichSuTapLuyenSchema);
