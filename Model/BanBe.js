const mongoose = require("mongoose");

const banBeSchema = new mongoose.Schema(
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
        trang_thai: {
            type: String,
            enum: ["pending", "accepted", "rejected", "blocked"],
            default: "pending"
        }
    },
    { timestamps: true }
);

// Ngăn tạo 2 lời mời trùng lặp giữa 2 người cùng chiều
banBeSchema.index({ nguoi_gui: 1, nguoi_nhan: 1 }, { unique: true });

module.exports = mongoose.model("BanBe", banBeSchema);
