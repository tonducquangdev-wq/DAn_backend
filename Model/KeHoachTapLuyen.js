const mongoose = require("mongoose");

const keHoachTapLuyenSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        ten_ke_hoach: { type: String, required: true, trim: true },
        mo_ta: { type: String, default: null },
        is_active: { type: Boolean, default: false },
        share_code: { type: String, default: null, sparse: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("KeHoachTapLuyen", keHoachTapLuyenSchema);
