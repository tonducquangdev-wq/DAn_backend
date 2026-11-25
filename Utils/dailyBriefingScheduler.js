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
 * Trả về giờ hiện tại theo định dạng HH:mm ở múi giờ Việt Nam
 * Với catch-up window logic để cải thiện độ chính xác
 */
function getCurrentVietnamTimeForCheck() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-GB", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    });
    return timeStr;
}

/**
 * Chuyển đổi HH:mm thành số phút từ đầu ngày để dễ so sánh
 */
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
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
    const result = await sendPushToUser(user._id, payload);

    return { success: true, eventCount: events.length, payload, events, sent: result.sent };
}

let schedulerInterval = null;
let lastSchedulerCheck = null;

/**
 * Kiểm tra xem có người dùng nào nên nhận thông báo không
 * Chỉ xét những người dùng đã bật và chưa gửi hôm nay
 */
async function checkAndSendBriefings() {
    try {
        const nowLocal = new Date();
        const nowVN = getCurrentVietnamTimeForCheck();
        const { dateStr } = getTodayVietnamRange();

        // Tìm các user có bật thông báo hàng ngày, hôm nay chưa gửi
        const users = await User.find({
            daily_briefing_enabled: true,
            daily_briefing_last_sent: { $ne: dateStr }
        });

        // Lọc theo giờ: chỉ gửi khi giờ hiện tại >= giờ cấu hình (với độ trễ 1 phút để đảm bảo check chính xác)
        const eligibleUsers = users.filter(user => {
            const scheduledTime = user.daily_briefing_time;
            const nowMinutes = timeToMinutes(nowVN);
            const scheduledMinutes = timeToMinutes(scheduledTime);
            
            // Gửi nếu thời gian hiện tại >= thời gian cấu hình
            return nowMinutes >= scheduledMinutes;
        });

        if (eligibleUsers.length > 0) {
            console.log(
                `[Scheduler] 🔔 Phát hiện ${eligibleUsers.length} người dùng cần nhận thông báo lịch trình lúc ${nowVN}...`
            );

            let sentCount = 0;
            for (const user of eligibleUsers) {
                try {
                    // Gửi thông báo
                    const result = await sendDailyBriefingToUser(user);
                    if (result.sent > 0) {
                        // Chỉ đánh dấu đã gửi nếu có ít nhất 1 thông báo được gửi
                        user.daily_briefing_last_sent = dateStr;
                        await user.save();
                        sentCount++;
                        console.log(`[Scheduler] ✅ Đã gửi thông báo lịch trình cho: ${user.name} (${user.email}), gửi được ${result.sent} thông báo`);
                    } else {
                        console.warn(`[Scheduler] ⚠️ Không gửi được thông báo cho người dùng: ${user.name} (${user.email}), không có thiết bị nhận`);
                    }
                } catch (userErr) {
                    console.error(`[Scheduler] ❌ Lỗi gửi cho user ${user.email}:`, userErr.message);
                }
            }
            
            console.log(`[Scheduler] ✅ Tổng cộng đã gửi ${sentCount} thông báo thành công`);
        }
        
        lastSchedulerCheck = nowLocal;
    } catch (err) {
        console.error("[Scheduler] ❌ Lỗi vòng lặp Daily Briefing Scheduler:", err.message);
    }
}

/**
 * Lấy trạng thái của scheduler để debug
 */
function getSchedulerStatus() {
    return {
        lastCheck: lastSchedulerCheck,
        interval: schedulerInterval ? "running" : "stopped"
    };
}

/**
 * Khởi động scheduler quét mỗi phút và tự động bắn thông báo khi đến giờ hẹn
 */
function startDailyBriefingScheduler() {
    if (schedulerInterval) return;

    console.log("⏰ Daily Briefing Scheduler đã được kích hoạt (kiểm tra mỗi 60 giây)...");

    // Thực hiện kiểm tra ngay lập tức khi bắt đầu
    checkAndSendBriefings();
    
    schedulerInterval = setInterval(checkAndSendBriefings, 60 * 1000);
}

module.exports = {
    getTodayVietnamRange,
    getCurrentVietnamTimeForCheck,
    timeToMinutes,
    buildDailyBriefingMessage,
    sendDailyBriefingToUser,
    startDailyBriefingScheduler,
    getSchedulerStatus
};
