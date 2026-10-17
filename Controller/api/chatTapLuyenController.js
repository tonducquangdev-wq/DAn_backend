const TinNhanTapLuyen = require("../../Model/TinNhanTapLuyen");
const User = require("../../Model/User");

/**
 * 1. Lấy danh sách tin nhắn kênh chat tổng tập luyện
 */
const getTinNhan = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 60;
        
        // Lấy các tin nhắn mới nhất rồi đảo ngược lại để hiển thị từ trên xuống dưới
        const tinNhans = await TinNhanTapLuyen.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("user_id", "name email role is_expert_verified avatar")
            .populate("reactions.user_id", "name");

        res.status(200).json({
            success: true,
            data: tinNhans.reverse()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi tải tin nhắn tập luyện: " + error.message
        });
    }
};

/**
 * 2. Gửi tin nhắn mới vào kênh chat tổng
 */
const guiTinNhan = async (req, res) => {
    try {
        const { noi_dung, loai } = req.body;
        const userId = req.user._id;

        if (!noi_dung || !noi_dung.trim()) {
            return res.status(400).json({
                success: false,
                message: "Nội dung tin nhắn không được để trống."
            });
        }

        const tinNhan = await TinNhanTapLuyen.create({
            user_id: userId,
            noi_dung: noi_dung.trim(),
            loai: loai || "text"
        });

        const populated = await TinNhanTapLuyen.findById(tinNhan._id)
            .populate("user_id", "name email role is_expert_verified avatar");

        res.status(201).json({
            success: true,
            message: "Đã gửi tin nhắn thành công",
            data: populated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi gửi tin nhắn: " + error.message
        });
    }
};

/**
 * 3. Thả cảm xúc / reaction cho tin nhắn
 */
const reactTinNhan = async (req, res) => {
    try {
        const { id } = req.params;
        const { icon } = req.body;
        const userId = req.user._id;

        const tinNhan = await TinNhanTapLuyen.findById(id);
        if (!tinNhan) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tin nhắn."
            });
        }

        const existingReactionIndex = tinNhan.reactions.findIndex(
            (r) => r.user_id.toString() === userId.toString()
        );

        if (existingReactionIndex > -1) {
            // Nếu đã bấm cùng icon -> gỡ reaction
            if (tinNhan.reactions[existingReactionIndex].icon === (icon || "💪")) {
                tinNhan.reactions.splice(existingReactionIndex, 1);
            } else {
                // Nếu khác icon -> đổi icon
                tinNhan.reactions[existingReactionIndex].icon = icon || "💪";
            }
        } else {
            tinNhan.reactions.push({
                user_id: userId,
                icon: icon || "💪"
            });
        }

        await tinNhan.save();

        const updated = await TinNhanTapLuyen.findById(id)
            .populate("user_id", "name email role is_expert_verified avatar")
            .populate("reactions.user_id", "name");

        res.status(200).json({
            success: true,
            data: updated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi tương tác tin nhắn: " + error.message
        });
    }
};

/**
 * 4. Xóa tin nhắn (chính chủ hoặc Quản trị viên)
 */
const xoaTinNhan = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.role === "admin";

        const tinNhan = await TinNhanTapLuyen.findById(id);
        if (!tinNhan) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tin nhắn."
            });
        }

        if (tinNhan.user_id.toString() !== userId.toString() && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền xóa tin nhắn này."
            });
        }

        await TinNhanTapLuyen.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: "Đã xóa tin nhắn."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi xóa tin nhắn: " + error.message
        });
    }
};

module.exports = {
    getTinNhan,
    guiTinNhan,
    reactTinNhan,
    xoaTinNhan
};
