const mongoose = require("mongoose");

const thongBaoSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        tieu_de: { type: String, required: true, trim: true },
        noi_dung: { type: String, required: true },
        loai: { type: String, default: "info" },
        da_doc: { type: Boolean, default: false },
        data: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    { timestamps: true }
);

module.exports = mongoose.model("ThongBao", thongBaoSchema);
