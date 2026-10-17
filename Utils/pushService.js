const webpush = require("web-push");
const PushSubscription = require("../Model/PushSubscription");
const User = require("../Model/User");

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "BPzDQMMjP6YHh_C1jnypACZdF3PqWVb5qlwobOK0dnY-aFieR-g5bfeZpZvHXY6iu7tfV1Xy3znfo7tEsz2Gzwg";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "sjRrETYsNAw928TrHvCsIYAvCxZokevwxojeMu2DPOE";
const vapidEmail = process.env.VAPID_EMAIL || "mailto:support@lifeplanner.com";

webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

/**
 * Gửi thông báo đẩy đến 1 người dùng cụ thể (tất cả các thiết bị đã đăng ký của họ)
 * @param {string|ObjectId} userId - ID người dùng
 * @param {object} payload - Dữ liệu thông báo { title, body, icon, url, data }
 */
const sendPushToUser = async (userId, payload) => {
    try {
        const subscriptions = await PushSubscription.find({ user_id: userId });
        if (!subscriptions || subscriptions.length === 0) return;

        const stringifiedPayload = JSON.stringify({
            title: payload.title || "Life Planner",
            body: payload.body || "Bạn có thông báo mới",
            icon: payload.icon || "/pwa-192x192.png",
            badge: payload.badge || "/pwa-64x64.png",
            url: payload.url || "/",
            tag: payload.tag || "life-planner-notification",
            data: payload.data || {}
        });

        const sendPromises = subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.keys.p256dh,
                            auth: sub.keys.auth
                        }
                    },
                    stringifiedPayload
                );
            } catch (err) {
                // Nếu subscription hết hạn (410 Gone hoặc 404 Not Found), tự động dọn dẹp
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                } else {
                    console.error("Lỗi gửi push đến subscription:", err.message);
                }
            }
        });

        await Promise.all(sendPromises);
    } catch (error) {
        console.error("Lỗi gửi Push Notification đến user:", error);
    }
};

/**
 * Gửi thông báo đẩy cho nhiều người dùng hoặc cả server
 * @param {object} payload - { title, body, icon, url }
 * @param {string} [targetRole="all"] - "all", "user", "tutor", "pt"
 */
const sendPushBroadcast = async (payload, targetRole = "all") => {
    try {
        let userFilter = {};
        if (targetRole && targetRole !== "all") {
            userFilter.role = targetRole;
        }

        const targetUsers = await User.find(userFilter).select("_id");
        const userIds = targetUsers.map((u) => u._id);

        const subscriptions = await PushSubscription.find({ user_id: { $in: userIds } });
        if (!subscriptions || subscriptions.length === 0) return;

        const stringifiedPayload = JSON.stringify({
            title: payload.title || "Life Planner Thông Báo",
            body: payload.body || "Hệ thống vừa phát thông báo mới",
            icon: payload.icon || "/pwa-192x192.png",
            badge: payload.badge || "/pwa-64x64.png",
            url: payload.url || "/",
            tag: "broadcast-" + Date.now()
        });

        const promises = subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.keys.p256dh,
                            auth: sub.keys.auth
                        }
                    },
                    stringifiedPayload
                );
            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                }
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error("Lỗi broadcast push notification:", error);
    }
};

module.exports = {
    vapidPublicKey,
    sendPushToUser,
    sendPushBroadcast
};
