const mongoose = require("mongoose");

const tinNhanRiengSchema = new mongoose.Schema(
    {
        nguoi_gui: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        nguoi_nhan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        noi_dung: {
            type: String,
            required: true,
            trim: true
        },
        loai: {
            type: String,
            enum: ["text", "image", "file"],
            default: "text"
        },
        da_doc: {
            type: Boolean,
            default: false
        },
        thoi_gian_doc: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Tối ưu hóa truy vấn hội thoại 2 chiều và đếm tin chưa đọc
tinNhanRiengSchema.index({ nguoi_gui: 1, nguoi_nhan: 1, createdAt: -1 });
tinNhanRiengSchema.index({ nguoi_nhan: 1, da_doc: 1 });

module.exports = mongoose.model("TinNhanRieng", tinNhanRiengSchema);
