const PushSubscription = require("../../Model/PushSubscription");
const { vapidPublicKey, sendPushToUser } = require("../../Utils/pushService");

/**
 * 1. Lấy VAPID Public Key để frontend client đăng ký với PushManager
 */
const getPublicKey = (req, res) => {
    res.status(200).json({
        success: true,
        data: { publicKey: vapidPublicKey }
    });
};

/**
 * 2. Lưu thông tin Push Subscription từ thiết bị của người dùng
 */
const subscribe = async (req, res) => {
    try {
        const userId = req.user._id;
        const { subscription, device_info } = req.body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu Push Subscription không hợp lệ."
            });
        }

        // Cập nhật nếu endpoint đã tồn tại, hoặc tạo mới nếu chưa có
        const updatedSub = await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            {
                user_id: userId,
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth
                },
                device_info: device_info || "Mobile PWA"
            },
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true,
            message: "Đã đăng ký nhận thông báo đẩy trên thiết bị này thành công!",
            data: updatedSub
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi đăng ký thông báo: " + error.message
        });
    }
};

/**
 * 3. Hủy đăng ký Push Subscription
 */
const unsubscribe = async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (endpoint) {
            await PushSubscription.deleteOne({ endpoint });
        }
        res.status(200).json({
            success: true,
            message: "Đã hủy đăng ký nhận thông báo trên thiết bị."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi hủy đăng ký: " + error.message
        });
    }
};

/**
 * 4. Bắn thử 1 thông báo đẩy (Test Push) trực tiếp về điện thoại người dùng
 */
const testPush = async (req, res) => {
    try {
        const user = req.user;

        await sendPushToUser(user._id, {
            title: "🔔 Life Planner Thông Báo",
            body: `Xin chào ${user.name}! Thông báo đẩy trên điện thoại của bạn đang hoạt động cực kỳ mượt mà. 🎉`,
            icon: "/pwa-192x192.png",
            url: "/#messages",
            data: { test: true }
        });

        res.status(200).json({
            success: true,
            message: "Đã gửi thông báo đẩy thử nghiệm đến điện thoại của bạn!"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi gửi thông báo thử nghiệm: " + error.message
        });
    }
};

/**
 * 5. Lấy cấu hình thông báo lịch trình sự kiện hàng ngày của user
 */
const getDailyBriefingSettings = async (req, res) => {
    try {
        const userId = req.user._id;
        const User = require("../../Model/User");
        const SuKien = require("../../Model/SuKien");
        const { getTodayVietnamRange } = require("../../Utils/dailyBriefingScheduler");

        const user = await User.findById(userId).select("daily_briefing_enabled daily_briefing_time daily_briefing_last_sent");
        const { startOfDay, endOfDay } = getTodayVietnamRange();

        // Lấy danh sách sự kiện trong ngày hôm nay để preview
        const todayEvents = await SuKien.find({
            user_id: userId,
            is_deleted: false,
            thoi_gian_bat_dau: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ thoi_gian_bat_dau: 1 });

        res.status(200).json({
            success: true,
            data: {
                enabled: user?.daily_briefing_enabled || false,
                time: user?.daily_briefing_time || "07:00",
                last_sent: user?.daily_briefing_last_sent || null,
                today_events: todayEvents
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy cấu hình thông báo hàng ngày: " + error.message
        });
    }
};

/**
 * 6. Cập nhật cấu hình thông báo lịch trình sự kiện hàng ngày
 */
const updateDailyBriefingSettings = async (req, res) => {
    try {
        const userId = req.user._id;
        const { enabled, time } = req.body;
        const User = require("../../Model/User");

        // Validate time format (HH:mm)
        if (time && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
            return res.status(400).json({
                success: false,
                message: "Định dạng thời gian không hợp lệ. Vui lòng sử dụng định dạng HH:mm (ví dụ 07:00, 08:30)."
            });
        }

        const updateData = {};
        if (typeof enabled === "boolean") {
            updateData.daily_briefing_enabled = enabled;
        }
        if (time) {
            updateData.daily_briefing_time = time;
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select(
            "daily_briefing_enabled daily_briefing_time daily_briefing_last_sent"
        );

        res.status(200).json({
            success: true,
            message: "Đã lưu cài đặt thông báo sự kiện trong ngày thành công!",
            data: {
                enabled: updatedUser.daily_briefing_enabled,
                time: updatedUser.daily_briefing_time,
                last_sent: updatedUser.daily_briefing_last_sent
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lưu cài đặt thông báo hàng ngày: " + error.message
        });
    }
};

/**
 * 7. Bắn thử ngay thông báo tổng hợp sự kiện hôm nay ra điện thoại người dùng
 */
const testDailyBriefing = async (req, res) => {
    try {
        const user = req.user;
        const { sendDailyBriefingToUser } = require("../../Utils/dailyBriefingScheduler");

        const result = await sendDailyBriefingToUser(user);

        res.status(200).json({
            success: true,
            message: `Đã gửi thử thông báo tổng hợp hôm nay (${result.eventCount} sự kiện) ra điện thoại của bạn!`,
            data: {
                eventCount: result.eventCount,
                payload: result.payload
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi gửi thử thông báo lịch trình: " + error.message
        });
    }
};

module.exports = {
    getPublicKey,
    subscribe,
    unsubscribe,
    testPush,
    getDailyBriefingSettings,
    updateDailyBriefingSettings,
    testDailyBriefing
};

