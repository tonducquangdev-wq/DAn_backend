const User = require("../Model/User");
const SuKien = require("../Model/SuKien");
const { sendPushToUser } = require("./pushService");

/**
 * Lấy khoảng thời gian của ngày hôm nay theo múi giờ Việt Nam (UTC+7)
 */
function getTodayVietnamRange() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
    const dateStr = formatter.format(now); // Ví dụ "2026-10-17"

    const startOfDay = new Date(`${dateStr}T00:00:00.000+07:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999+07:00`);

    return { dateStr, startOfDay, endOfDay };
}

/**
 * Lấy giờ:phút hiện tại (HH:mm) theo múi giờ Việt Nam (UTC+7)
 */
function getCurrentVietnamTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-GB", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
    });
    return timeStr;
}

/**
 * Soạn nội dung thông báo đẩy tóm tắt lịch trình trong ngày
 */
function buildDailyBriefingMessage(user, events) {
    if (!events || events.length === 0) {
        return {
            title: `🌅 Chào ngày mới, ${user.name}!`,
            body: "Hôm nay bạn không có lịch trình nào trên hệ thống. Chúc bạn một ngày thật thư thái và nhiều năng lượng! ✨",
            url: "/",
            icon: "/pwa-192x192.png",
            tag: "daily-briefing-" + Date.now(),
            data: { type: "daily_briefing", eventCount: 0 }
        };
    }

    const count = events.length;
    const title = `🌅 Lịch trình hôm nay (${count} sự kiện) - ${user.name}`;

    const lines = events.slice(0, 4).map((ev) => {
        const time = new Date(ev.thoi_gian_bat_dau).toLocaleTimeString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit"
        });
        const icon =
            ev.loai_su_kien === "hoc-tap"
                ? "📚"
                : ev.loai_su_kien === "tap-luyen"
                ? "🏋️"
                : ev.loai_su_kien === "deadline"
                ? "⏰"
                : ev.loai_su_kien === "cong-viec"
                ? "💼"
                : "☕";
        return `${icon} ${time}: ${ev.tieu_de}`;
    });

    if (count > 4) {
        lines.push(`... và ${count - 4} sự kiện khác.`);
    }

    return {
        title,
        body: lines.join("\n"),
        url: "/",
        icon: "/pwa-192x192.png",
        tag: "daily-briefing-" + Date.now(),
        data: { type: "daily_briefing", eventCount: count }
    };
}

/**
 * Gửi thông báo tổng hợp lịch trình hôm nay đến 1 người dùng cụ thể
 */
async function sendDailyBriefingToUser(user) {
    const { startOfDay, endOfDay } = getTodayVietnamRange();
    const events = await SuKien.find({
        user_id: user._id,
        is_deleted: false,
        thoi_gian_bat_dau: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ thoi_gian_bat_dau: 1 });

    const payload = buildDailyBriefingMessage(user, events);
    await sendPushToUser(user._id, payload);

    return { success: true, eventCount: events.length, payload, events };
}

let schedulerInterval = null;

/**
 * Khởi động scheduler quét mỗi phút và tự động bắn thông báo khi đến giờ hẹn
 */
function startDailyBriefingScheduler() {
    if (schedulerInterval) return;

    console.log("⏰ Daily Briefing Scheduler đã được kích hoạt (kiểm tra mỗi 60 giây)...");

    schedulerInterval = setInterval(async () => {
        try {
            const currentTime = getCurrentVietnamTime();
            const { dateStr } = getTodayVietnamRange();

            // Tìm các user có bật thông báo hàng ngày, đúng giờ hẹn và hôm nay chưa gửi
            const users = await User.find({
                daily_briefing_enabled: true,
                daily_briefing_time: currentTime,
                daily_briefing_last_sent: { $ne: dateStr }
            });

            if (users.length > 0) {
                console.log(
                    `[Scheduler] 🔔 Phát hiện ${users.length} người dùng cần nhận thông báo lịch trình lúc ${currentTime}...`
                );

                for (const user of users) {
                    try {
                        // Đánh dấu đã gửi ngay để tránh duplicate
                        user.daily_briefing_last_sent = dateStr;
                        await user.save();

                        await sendDailyBriefingToUser(user);
                        console.log(`[Scheduler] ✅ Đã gửi thông báo lịch trình cho: ${user.name} (${user.email})`);
                    } catch (userErr) {
                        console.error(`[Scheduler] ❌ Lỗi gửi cho user ${user.email}:`, userErr.message);
                    }
                }
            }
        } catch (err) {
            console.error("[Scheduler] ❌ Lỗi vòng lặp Daily Briefing Scheduler:", err.message);
        }
    }, 60 * 1000);
}

module.exports = {
    getTodayVietnamRange,
    getCurrentVietnamTime,
    buildDailyBriefingMessage,
    sendDailyBriefingToUser,
    startDailyBriefingScheduler
};
