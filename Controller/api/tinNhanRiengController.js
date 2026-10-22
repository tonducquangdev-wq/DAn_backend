const TinNhanRieng = require("../../Model/TinNhanRieng");
const User = require("../../Model/User");
const GiaSu = require("../../Model/GiaSu");
const HuanLuyenVien = require("../../Model/HuanLuyenVien");
const { sendPushToUser } = require("../../Utils/pushService");
const mongoose = require("mongoose");

/**
 * 1. Lấy danh sách hội thoại gần đây (Recent Conversations)
 */
const getHoiThoai = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        // Tìm tất cả các tin nhắn liên quan đến người dùng hiện tại
        const messages = await TinNhanRieng.find({
            $or: [{ nguoi_gui: currentUserId }, { nguoi_nhan: currentUserId }]
        })
            .sort({ createdAt: -1 })
            .populate("nguoi_gui", "name email role avatar is_expert_verified status")
            .populate("nguoi_nhan", "name email role avatar is_expert_verified status")
            .lean();

        // Gom nhóm theo đối tác chat
        const conversationMap = new Map();

        for (const msg of messages) {
            const isMe = msg.nguoi_gui._id.toString() === currentUserId.toString();
            const partner = isMe ? msg.nguoi_nhan : msg.nguoi_gui;
            if (!partner) continue;

            const partnerId = partner._id.toString();

            if (!conversationMap.has(partnerId)) {
                conversationMap.set(partnerId, {
                    partner: partner,
                    last_message: {
                        _id: msg._id,
                        noi_dung: msg.noi_dung,
                        nguoi_gui: msg.nguoi_gui._id,
                        da_doc: msg.da_doc,
                        createdAt: msg.createdAt
                    },
                    unread_count: 0
                });
            }

            // Đếm tin chưa đọc từ đối tác gửi cho mình
            if (!isMe && !msg.da_doc) {
                const convo = conversationMap.get(partnerId);
                convo.unread_count += 1;
            }
        }

        let conversations = Array.from(conversationMap.values());

        // Nếu người xem không phải Admin, ẩn toàn bộ hội thoại với tài khoản đã bị khóa (banned)
        if (req.user?.role !== "admin") {
            conversations = conversations.filter((c) => c.partner && c.partner.status !== "banned");
        }

        // Bổ sung thông tin môn dạy của gia sư hoặc PT nếu có
        const partnerUserIds = conversations.map((c) => c.partner._id);
        const [giaSus, pts] = await Promise.all([
            GiaSu.find({ user_id: { $in: partnerUserIds } }).select("user_id mon_hoc_chuyen_mon").lean(),
            HuanLuyenVien.find({ user_id: { $in: partnerUserIds } }).select("user_id chuyen_mon").lean()
        ]);

        const giaSuMap = {};
        giaSus.forEach((gs) => {
            if (gs.user_id) giaSuMap[gs.user_id.toString()] = gs.mon_hoc_chuyen_mon;
        });

        const ptMap = {};
        pts.forEach((pt) => {
            if (pt.user_id) ptMap[pt.user_id.toString()] = pt.chuyen_mon;
        });

        const enrichedConversations = conversations.map((c) => {
            const pid = c.partner._id.toString();
            return {
                ...c,
                partner_extra: {
                    mon_hoc: giaSuMap[pid] || null,
                    pt_chuyen_mon: ptMap[pid] || null
                }
            };
        });

        res.status(200).json({
            success: true,
            data: enrichedConversations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi tải danh sách hội thoại: " + error.message
        });
    }
};

/**
 * 2. Lấy toàn bộ tin nhắn với 1 người dùng cụ thể và đánh dấu đã đọc
 */
const getTinNhanVoiNguoiDung = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { partnerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(partnerId)) {
            return res.status(400).json({
                success: false,
                message: "Mã định danh người dùng không hợp lệ."
            });
        }

        const partner = await User.findById(partnerId).select("name email role avatar bio is_expert_verified status").lean();
        if (!partner || (partner.status === "banned" && req.user?.role !== "admin")) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng này hoặc tài khoản đã bị khóa."
            });
        }

        // Đánh dấu đã đọc các tin đối phương gửi cho mình
        await TinNhanRieng.updateMany(
            {
                nguoi_gui: partnerId,
                nguoi_nhan: currentUserId,
                da_doc: false
            },
            {
                da_doc: true,
                thoi_gian_doc: new Date()
            }
        );

        // Lấy lịch sử 100 tin nhắn gần nhất
        const messages = await TinNhanRieng.find({
            $or: [
                { nguoi_gui: currentUserId, nguoi_nhan: partnerId },
                { nguoi_gui: partnerId, nguoi_nhan: currentUserId }
            ]
        })
            .sort({ createdAt: 1 })
            .limit(100)
            .lean();

        // Kiểm tra xem đối phương có phải là gia sư hay PT không
        const [gs, pt] = await Promise.all([
            GiaSu.findOne({ user_id: partnerId }).select("mon_hoc_chuyen_mon gia_theo_gio").lean(),
            HuanLuyenVien.findOne({ user_id: partnerId }).select("chuyen_mon gia_theo_gio").lean()
        ]);

        res.status(200).json({
            success: true,
            data: {
                partner: {
                    ...partner,
                    mon_hoc: gs?.mon_hoc_chuyen_mon || null,
                    gia_theo_gio: gs?.gia_theo_gio || pt?.gia_theo_gio || null,
                    pt_chuyen_mon: pt?.chuyen_mon || null
                },
                messages
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi tải lịch sử tin nhắn: " + error.message
        });
    }
};

/**
 * 3. Gửi tin nhắn riêng (1-on-1)
 */
const guiTinNhan = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { recipient_id, noi_dung, loai } = req.body;

        if (!recipient_id) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn người nhận tin nhắn."
            });
        }

        if (recipient_id.toString() === currentUserId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Không thể tự gửi tin nhắn cho chính mình."
            });
        }

        if (!noi_dung || !noi_dung.trim()) {
            return res.status(400).json({
                success: false,
                message: "Nội dung tin nhắn không được để trống."
            });
        }

        const recipient = await User.findById(recipient_id);
        if (!recipient || (recipient.status === "banned" && req.user?.role !== "admin")) {
            return res.status(404).json({
                success: false,
                message: "Người nhận không tồn tại hoặc tài khoản đã bị khóa."
            });
        }

        const message = await TinNhanRieng.create({
            nguoi_gui: currentUserId,
            nguoi_nhan: recipient_id,
            noi_dung: noi_dung.trim(),
            loai: loai || "text"
        });

        const populated = await TinNhanRieng.findById(message._id)
            .populate("nguoi_gui", "name email role avatar")
            .populate("nguoi_nhan", "name email role avatar");

        // Gửi push notification ra màn hình khóa điện thoại của người nhận
        sendPushToUser(recipient_id, {
            title: `💬 Tin nhắn từ ${req.user.name}`,
            body: noi_dung.trim(),
            url: "/#messages",
            data: { partnerId: currentUserId }
        }).catch(err => console.error("Lỗi gửi push tin nhắn:", err));

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
 * 4. Lấy tổng số tin nhắn chưa đọc của người dùng
 */
const getTongTinChuaDoc = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const count = await TinNhanRieng.countDocuments({
            nguoi_nhan: currentUserId,
            da_doc: false
        });

        res.status(200).json({
            success: true,
            data: { unread_count: count }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi đếm tin chưa đọc: " + error.message
        });
    }
};

/**
 * 5. Xóa tin nhắn (chỉ người gửi hoặc admin)
 */
const xoaTinNhan = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { id } = req.params;

        const message = await TinNhanRieng.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tin nhắn."
            });
        }

        if (message.nguoi_gui.toString() !== currentUserId.toString() && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền xóa tin nhắn này."
            });
        }

        await TinNhanRieng.deleteOne({ _id: id });

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
    getHoiThoai,
    getTinNhanVoiNguoiDung,
    guiTinNhan,
    getTongTinChuaDoc,
    xoaTinNhan
};
