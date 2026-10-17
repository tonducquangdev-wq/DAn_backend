const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        avatar: { type: String, default: null },
        theme_mode: { 
            type: String, 
            enum: ["light", "dark", "system"], 
            default: "system" 
        },
        language: { type: String, default: "vi" },
        notify_events: { type: Boolean, default: true },
        notify_deadlines: { type: Boolean, default: true },
        notify_workouts: { type: Boolean, default: true },
        notify_sound: { type: Boolean, default: true },
        notify_lead_time: { type: Number, default: 15 },
        workout_default_initialized: { type: Boolean, default: false },
        role: {
            type: String,
            enum: ["user", "tutor", "gia_su", "pt", "admin"],
            default: "user"
        },
        status: {
            type: String,
            enum: ["active", "banned"],
            default: "active"
        },
        phone: { type: String, default: null },
        bio: { type: String, default: null },
        is_expert_verified: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);