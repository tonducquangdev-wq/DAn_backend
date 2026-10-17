const mongoose = require("mongoose");

const tinNhanTapLuyenSchema = new mongoose.Schema(
    {
        user_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        },
        noi_dung: { 
            type: String, 
            required: true, 
            trim: true, 
            maxlength: 1000 
        },
        loai: { 
            type: String, 
            default: "text" 
        }, // "text" | "motivation" | "tip"
        reactions: [
            {
                user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                icon: { type: String, default: "💪" }
            }
        ]
    },
    { 
        timestamps: true 
    }
);

// Tối ưu hóa index truy vấn theo thời gian gửi
tinNhanTapLuyenSchema.index({ createdAt: -1 });

module.exports = mongoose.model("TinNhanTapLuyen", tinNhanTapLuyenSchema);
