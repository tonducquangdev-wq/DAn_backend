const mongoose = require("mongoose");

const lichHocSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        mon_hoc_id: { type: mongoose.Schema.Types.ObjectId, ref: "MonHoc", required: true },
        thu_trong_tuan: { type: Number, required: true, min: 2, max: 8 }, // 2: Thứ 2, ..., 8: CN
        gio_bat_dau: { type: String, required: true }, // Format HH:mm
        gio_ket_thuc: { type: String, required: true }, // Format HH:mm
        phong_hoc: { type: String, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("LichHoc", lichHocSchema);
