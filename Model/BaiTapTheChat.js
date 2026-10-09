const mongoose = require("mongoose");

const baiTapTheChatSchema = new mongoose.Schema(
    {
        ten_bai_tap: { type: String, required: true, trim: true },
        nhom_co: { type: String, required: true, trim: true },
        loai_bai_tap: {
            type: String,
            enum: ["strength", "cardio", "core"],
            default: "strength"
        },
        meo_tap: { type: String, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("BaiTapTheChat", baiTapTheChatSchema);
