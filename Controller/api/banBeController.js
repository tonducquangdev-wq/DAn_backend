const BanBe = require("../../Model/BanBe");
const User = require("../../Model/User");
const ThongBao = require("../../Model/ThongBao");

/**
 * 1. Lấy danh sách bạn bè đã kết nối (accepted)
 */
const getDanhSachBanBe = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const friendships = await BanBe.find({
            $or: [
                { nguoi_gui: currentUserId, trang_thai: "accepted" },
                { nguoi_nhan: currentUserId, trang_thai: "accepted" }
            ]
        })
            .populate("nguoi_gui", "name email role avatar bio is_expert_verified status")
            .populate("nguoi_nhan", "name email role avatar bio is_expert_verified status")
            .sort({ updatedAt: -1 });

        const friends = friendships.map((f) => {
            const isSender = f.nguoi_gui._id.toString() === currentUserId.toString();
            const friendUser = isSender ? f.nguoi_nhan : f.nguoi_gui;
            return {
                friendship_id: f._id,
                user: friendUser,
                since: f.updatedAt
            };
        }).filter((item) => item.user && item.user.status !== "banned");

        res.status(200).json({
            success: true,
            data: friends
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy danh sách bạn bè: " + error.message
        });
    }
};

/**
 * 2. Lấy danh sách lời mời kết bạn (đã nhận & đã gửi đang chờ duyệt)
 */
const getLoiMoiKetBan = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        // Lời mời người khác gửi tới mình
        let nhan = await BanBe.find({
            nguoi_nhan: currentUserId,
            trang_thai: "pending"
        })
            .populate("nguoi_gui", "name email role avatar bio is_expert_verified status")
            .sort({ createdAt: -1 });

        // Lời mời mình gửi đi đang chờ đối phương chấp nhận
        let da_gui = await BanBe.find({
            nguoi_gui: currentUserId,
            trang_thai: "pending"
        })
            .populate("nguoi_nhan", "name email role avatar bio is_expert_verified status")
            .sort({ createdAt: -1 });

        // Nếu người xem không phải Admin, ẩn các lời mời liên quan đến tài khoản bị khóa
        if (req.user?.role !== "admin") {
            nhan = nhan.filter((r) => r.nguoi_gui && r.nguoi_gui.status !== "banned");
            da_gui = da_gui.filter((r) => r.nguoi_nhan && r.nguoi_nhan.status !== "banned");
        }

        res.status(200).json({
            success: true,
            data: {
                nhan,
                da_gui
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy danh sách lời mời: " + error.message
        });
    }
};

/**
 * 3. Gửi lời mời kết bạn
 */
const guiLoiMoiKetBan = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { nguoi_nhan_id } = req.body;

        if (!nguoi_nhan_id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu mã ID người nhận lời mời kết bạn."
            });
        }

        if (nguoi_nhan_id.toString() === currentUserId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Không thể tự gửi lời mời kết bạn cho chính mình."
            });
        }

        const targetUser = await User.findById(nguoi_nhan_id);
        if (!targetUser || (targetUser.status === "banned" && req.user?.role !== "admin")) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng này hoặc tài khoản đã bị khóa."
            });
        }

        // Kiểm tra xem đã có quan hệ nào giữa 2 người chưa
        const existing = await BanBe.findOne({
            $or: [
                { nguoi_gui: currentUserId, nguoi_nhan: nguoi_nhan_id },
                { nguoi_gui: nguoi_nhan_id, nguoi_nhan: currentUserId }
            ]
        });

        if (existing) {
            if (existing.trang_thai === "accepted") {
                return res.status(400).json({
                    success: false,
                    message: "Hai bạn đã là bạn bè của nhau rồi."
                });
            }

            if (existing.trang_thai === "pending") {
                // Nếu người nhận đang chủ động gửi lại cho người gửi trước đó -> tự động chấp nhận luôn
                if (existing.nguoi_nhan.toString() === currentUserId.toString()) {
                    existing.trang_thai = "accepted";
                    await existing.save();

                    return res.status(200).json({
                        success: true,
                        message: `Hai bạn đã trở thành bạn bè với ${targetUser.name}!`,
                        data: existing
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: "Bạn đã gửi lời mời kết bạn trước đó, vui lòng chờ đối phương phản hồi."
                });
            }

            // Nếu từng bị rejected -> cập nhật lại thành pending
            existing.nguoi_gui = currentUserId;
            existing.nguoi_nhan = nguoi_nhan_id;
            existing.trang_thai = "pending";
            await existing.save();

            return res.status(200).json({
                success: true,
                message: `Đã gửi lại lời mời kết bạn đến ${targetUser.name}!`,
                data: existing
            });
        }

        const newFriendship = await BanBe.create({
            nguoi_gui: currentUserId,
            nguoi_nhan: nguoi_nhan_id,
            trang_thai: "pending"
        });

        // Tạo thông báo cho người nhận
        try {
            await ThongBao.create({
                user_id: nguoi_nhan_id,
                tieu_de: "📬 Lời mời kết bạn mới",
                noi_dung: `${req.user.name} đã gửi lời mời kết bạn đến bạn. Hãy vào mục Bạn Bè để chấp nhận nhé!`,
                loai: "info"
            });
        } catch (errNoti) {
            console.error("Lỗi tạo thông báo kết bạn:", errNoti);
        }

        res.status(201).json({
            success: true,
            message: `Đã gửi lời mời kết bạn đến ${targetUser.name}!`,
            data: newFriendship
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi gửi lời mời kết bạn: " + error.message
        });
    }
};

/**
 * 4. Chấp nhận lời mời kết bạn
 */
const chapNhanLoiMoi = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { id } = req.params; // friendship _id

        const friendship = await BanBe.findOne({
            _id: id,
            nguoi_nhan: currentUserId,
            trang_thai: "pending"
        }).populate("nguoi_gui", "name email");

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lời mời kết bạn này hoặc đã được xử lý."
            });
        }

        friendship.trang_thai = "accepted";
        await friendship.save();

        // Tạo thông báo cho người gửi lời mời
        try {
            await ThongBao.create({
                user_id: friendship.nguoi_gui._id,
                tieu_de: "🎉 Lời mời kết bạn được đồng ý",
                noi_dung: `${req.user.name} đã chấp nhận lời mời kết bạn của bạn. Giờ đây hai bạn có thể nhắn tin cho nhau!`,
                loai: "success"
            });
        } catch (errNoti) {
            console.error("Lỗi tạo thông báo chấp nhận kết bạn:", errNoti);
        }

        res.status(200).json({
            success: true,
            message: `Đã chấp nhận kết bạn với ${friendship.nguoi_gui.name}!`,
            data: friendship
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi chấp nhận kết bạn: " + error.message
        });
    }
};

/**
 * 5. Từ chối hoặc hủy lời mời kết bạn
 */
const tuChoiLoiMoi = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { id } = req.params;

        const friendship = await BanBe.findOne({
            _id: id,
            $or: [{ nguoi_nhan: currentUserId }, { nguoi_gui: currentUserId }]
        });

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lời mời kết bạn này."
            });
        }

        await BanBe.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: "Đã hủy bỏ lời mời kết bạn."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi từ chối lời mời: " + error.message
        });
    }
};

/**
 * 6. Hủy kết bạn (Unfriend)
 */
const huyKetBan = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { friendUserId } = req.params;

        const result = await BanBe.deleteOne({
            $or: [
                { nguoi_gui: currentUserId, nguoi_nhan: friendUserId, trang_thai: "accepted" },
                { nguoi_gui: friendUserId, nguoi_nhan: currentUserId, trang_thai: "accepted" }
            ]
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy mối quan hệ bạn bè này."
            });
        }

        res.status(200).json({
            success: true,
            message: "Đã hủy kết bạn thành công."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi hủy kết bạn: " + error.message
        });
    }
};

/**
 * 7. Tìm kiếm người dùng trong hệ thống để kết bạn hoặc nhắn tin
 */
const timKiemNguoiDung = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { q, role } = req.query;

        const queryFilter = {
            _id: { $ne: currentUserId }
        };

        if (req.user?.role !== "admin") {
            queryFilter.status = { $ne: "banned" };
        }

        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), "i");
            queryFilter.$or = [{ name: regex }, { email: regex }];
        }

        if (role && role !== "all") {
            queryFilter.role = role;
        }

        const users = await User.find(queryFilter)
            .select("name email role avatar bio is_expert_verified")
            .limit(25)
            .lean();

        // Lấy danh sách quan hệ bạn bè giữa currentUserId và các users tìm được
        const userIds = users.map((u) => u._id);
        const friendships = await BanBe.find({
            $or: [
                { nguoi_gui: currentUserId, nguoi_nhan: { $in: userIds } },
                { nguoi_gui: { $in: userIds }, nguoi_nhan: currentUserId }
            ]
        }).lean();

        const relationMap = {};
        friendships.forEach((f) => {
            const otherId = f.nguoi_gui.toString() === currentUserId.toString()
                ? f.nguoi_nhan.toString()
                : f.nguoi_gui.toString();

            if (f.trang_thai === "accepted") {
                relationMap[otherId] = { status: "friend", friendshipId: f._id };
            } else if (f.trang_thai === "pending") {
                if (f.nguoi_gui.toString() === currentUserId.toString()) {
                    relationMap[otherId] = { status: "pending_sent", friendshipId: f._id };
                } else {
                    relationMap[otherId] = { status: "pending_received", friendshipId: f._id };
                }
            }
        });

        const results = users.map((u) => {
            const relation = relationMap[u._id.toString()] || { status: "none", friendshipId: null };
            return {
                ...u,
                relation_status: relation.status,
                friendship_id: relation.friendshipId
            };
        });

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi tìm kiếm người dùng: " + error.message
        });
    }
};

module.exports = {
    getDanhSachBanBe,
    getLoiMoiKetBan,
    guiLoiMoiKetBan,
    chapNhanLoiMoi,
    tuChoiLoiMoi,
    huyKetBan,
    timKiemNguoiDung
};
