const bcrypt = require("bcryptjs");
const User = require("../Model/User");
const GiaSu = require("../Model/GiaSu");
const HuanLuyenVien = require("../Model/HuanLuyenVien");

/**
 * Đồng bộ hoặc tự động tạo tài khoản User cho các Gia Sư và PT chưa có user_id
 * Giúp học viên có thể nhắn tin trực tiếp và gia sư có thể đăng nhập trả lời.
 */
const syncExpertUsers = async () => {
    try {
        const defaultPasswordHash = await bcrypt.hash("expert123456", 10);

        // 1. Đồng bộ Gia Sư
        const giaSus = await GiaSu.find();
        for (const gs of giaSus) {
            let user = null;
            if (gs.user_id) {
                user = await User.findById(gs.user_id);
            }
            if (!user && gs.email) {
                user = await User.findOne({ email: gs.email.toLowerCase() });
            }

            if (!user) {
                const email = (gs.email || `tutor_${gs._id}@lifeplanner.com`).toLowerCase();
                user = await User.create({
                    name: gs.ho_ten,
                    email: email,
                    password: defaultPasswordHash,
                    role: "tutor",
                    avatar: gs.avatar || null,
                    phone: gs.so_dien_thoai || null,
                    is_expert_verified: true,
                    bio: `Gia sư chuyên môn: ${gs.mon_hoc_chuyen_mon || "Học tập"}`
                });
            } else {
                // Đảm bảo role là tutor và đã verify
                if (user.role !== "admin" && user.role !== "tutor") {
                    user.role = "tutor";
                }
                user.is_expert_verified = true;
                await user.save();
            }

            if (!gs.user_id || gs.user_id.toString() !== user._id.toString()) {
                gs.user_id = user._id;
                await gs.save();
            }
        }

        // 2. Đồng bộ Huấn Luyện Viên PT
        const pts = await HuanLuyenVien.find();
        for (const pt of pts) {
            let user = null;
            if (pt.user_id) {
                user = await User.findById(pt.user_id);
            }
            if (!user && pt.email) {
                user = await User.findOne({ email: pt.email.toLowerCase() });
            }

            if (!user) {
                const email = (pt.email || `pt_${pt._id}@lifeplanner.com`).toLowerCase();
                user = await User.create({
                    name: pt.ho_ten,
                    email: email,
                    password: defaultPasswordHash,
                    role: "pt",
                    avatar: pt.avatar || null,
                    phone: pt.so_dien_thoai || null,
                    is_expert_verified: true,
                    bio: `Huấn luyện viên chuyên môn: ${pt.chuyen_mon || "Thể hình"}`
                });
            } else {
                if (user.role !== "admin" && user.role !== "pt") {
                    user.role = "pt";
                }
                user.is_expert_verified = true;
                await user.save();
            }

            if (!pt.user_id || pt.user_id.toString() !== user._id.toString()) {
                pt.user_id = user._id;
                await pt.save();
            }
        }
    } catch (error) {
        console.error("Lỗi đồng bộ tài khoản Chuyên gia (Gia sư/PT):", error);
    }
};

module.exports = syncExpertUsers;
