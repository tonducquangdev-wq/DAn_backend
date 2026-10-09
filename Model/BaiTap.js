const mongoose = require("mongoose");

const baiTapSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        mon_hoc_id: { type: mongoose.Schema.Types.ObjectId, ref: "MonHoc", default: null },
        ten_bai_tap: { type: String, required: true, trim: true },
        meo_ghi_nho: { type: String, default: null },
        han_nop: { type: Date, required: true },
        do_uu_tien: {
            type: String,
            enum: ["cao", "trung_binh", "thap"],
            default: "trung_binh"
        },
        trang_thai: {
            type: String,
            enum: ["chua_hoan_thanh", "dang_thuc_hien", "da_hoan_thanh"],
            default: "chua_hoan_thanh"
        },
        file_dinh_kem: { type: String, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("BaiTap", baiTapSchema);
