const mongoose = require("mongoose");

const giaSuSchema = new mongoose.Schema(
    {
        ho_ten: { type: String, required: true, trim: true },
        mon_hoc_chuyen_mon: { type: String, required: true, trim: true },
        so_dien_thoai: { type: String, default: null },
        email: { type: String, default: null },
        gia_theo_gio: { type: Number, default: 0 },
        mo_ta: { type: String, default: null },
        rating: { type: Number, default: 5.0 },
        avatar: { type: String, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("GiaSu", giaSuSchema);
