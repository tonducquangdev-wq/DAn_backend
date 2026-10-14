const mongoose = require("mongoose");

const suKienSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        cong_viec_id: { type: mongoose.Schema.Types.ObjectId, ref: "CongViec", default: null },
        mon_hoc_id: { type: mongoose.Schema.Types.ObjectId, ref: "MonHoc", default: null },
        loai_su_kien: {
            type: String,
            enum: ["hoc-tap", "tap-luyen", "deadline", "ca-nhan"],
            required: true
        },
        tieu_de: { type: String, required: true, trim: true },
        mo_ta: { type: String, default: null },
        thoi_gian_bat_dau: { type: Date, required: true },
        thoi_gian_ket_thuc: { type: Date, required: true },
        dia_diem: { type: String, default: null },
        mau_sac: { type: String, default: "#10B981" },
        quy_tac_lap: {
            type: String,
            enum: ["once", "daily", "weekly", "monthly"],
            default: "once"
        },
        nhom_lap_id: { type: String, default: null },
        bat_thong_bao: { type: Boolean, default: true },
        so_ngay_nhac: { type: Number, default: 0 },
        is_deleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model("SuKien", suKienSchema);
