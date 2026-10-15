const mongoose = require("mongoose");

const keHoachTapLuyenSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        ten_ke_hoach: { type: String, required: true, trim: true },
        mo_ta: { type: String, default: null },
        so_buoi_tuan: { type: Number, default: 4 },
        cuong_do: { 
            type: String, 
            enum: ["beginner", "intermediate", "advanced"], 
            default: "intermediate" 
        },
        dong_bo_lich: { type: Boolean, default: true },
        is_active: { type: Boolean, default: false },
        is_default: { type: Boolean, default: false },
        share_code: { type: String, default: null, sparse: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("KeHoachTapLuyen", keHoachTapLuyenSchema);
