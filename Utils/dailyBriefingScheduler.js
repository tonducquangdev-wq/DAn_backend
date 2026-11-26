const User = require("../Model/User");
const SuKien = require("../Model/SuKien");
const PushSubscription = require("../Model/PushSubscription");
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
 * Soạn nội dung Web Push nhắc trước 1 sự kiện (deadline / học tập / tập luyện / công việc)
 */
function buildEventReminderMessage(user, event) {
    const startTime = new Date(event.thoi_gian_bat_dau).toLocaleTimeString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: "2-digit",
        minute: "2-digit"
    });

    const icon =
        event.loai_su_kien === "hoc-tap"
            ? "📚"
            : event.loai_su_kien === "tap-luyen"
            ? "🏋️"
            : event.loai_su_kien === "deadline"
            ? "⏰"
            : event.loai_su_kien === "cong-viec"
            ? "💼"
            : "☕";

    const leadMinutes = Number(event.thoi_gian_nhac_truoc ?? user.notify_lead_time ?? 15);
    const now = new Date();
    const startMs = new Date(event.thoi_gian_bat_dau).getTime();
    const diffMinutes = Math.max(0, Math.round((startMs - now.getTime()) / 60000));

    const timeText = diffMinutes === 0 ? "Đang diễn ra ngay bây giờ!" : `Sẽ diễn ra sau ${diffMinutes} phút (${startTime})`;

    return {
        title: `${icon} Nhắc nhở: ${event.tieu_de}`,
        body: `${timeText}${event.dia_diem ? ` tại ${event.dia_diem}` : ""}`,
        url: "/#calendar",
        icon: "/pwa-192x192.png",
        badge: "/pwa-64x64.png",
        tag: `event-remind-${event._id}`,
        renotify: true,
        vibrate: [200, 100, 200],
        data: {
            type: "event_reminder",
            eventId: event._id,
            loai_su_kien: event.loai_su_kien,
            thoi_gian_bat_dau: event.thoi_gian_bat_dau,
            dia_diem: event.dia_diem
        }
    };
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
 * Kiểm tra và gửi Web Push nhắc trước cho các sự kiện sắp diễn ra
 * (quét mỗi phút; mỗi sự kiện chỉ gửi 1 lần nhờ cờ push_reminded)
 */
async function checkAndSendEventReminders() {
    try {
        const now = new Date();
        const nowVN = getCurrentVietnamTimeForCheck();
        const { dateStr } = getTodayVietnamRange();

        // Grace period 5 phút để bắt sự kiện vừa qua nếu scheduler chạy trễ
        const graceMs = 5 * 60 * 1000;
        const graceStart = new Date(now.getTime() - graceMs);

        // Lấy tất cả sự kiện chưa nhắc, chưa xóa, và bắt đầu trong khoảng grace period tới
        const upcomingEvents = await SuKien.find({
            is_deleted: false,
            push_reminded: false,
            thoi_gian_bat_dau: { $gt: graceStart, $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) }
        }).sort({ thoi_gian_bat_dau: 1 });

        console.log(`[Reminder Scan] 🕛 giờ VN: ${nowVN} | Tìm thấy ${upcomingEvents.length} sự kiện chưa nhắc (grace period 5 phút)`);

        if (!upcomingEvents || upcomingEvents.length === 0) return;

        // Gom nhóm theo user để chỉ quét PushSubscription 1 lần / user
        // Ép userId về string để tránh ObjectId vs String mismatch khi tra userMap
        const eventsByUser = new Map();
        for (const ev of upcomingEvents) {
            const userIdStr = ev.user_id.toString();
            if (!eventsByUser.has(userIdStr)) {
                eventsByUser.set(userIdStr, []);
            }
            eventsByUser.get(userIdStr).push(ev);
        }

        // Lấy toàn bộ user liên quan 1 truy vấn duy nhất
        const userIds = Array.from(eventsByUser.keys());
        const users = await User.find({ _id: { $in: userIds } });
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        let totalSent = 0;

        for (const [userIdStr, events] of eventsByUser) {
            const user = userMap.get(userIdStr);
            if (!user) {
                console.warn(`[Scheduler] ⚠️ Không tìm thấy user trong DB cho userId=${userIdStr}, bỏ qua ${events.length} sự kiện`);
                continue;
            }

            const pushSubsCount = (await PushSubscription.find({ user_id: userIdStr })).length;
            console.log(
                `[Scheduler] 👤 ${user.name} (${user.email}): notify_events=${user.notify_events}, notify_deadlines=${user.notify_deadlines}, notify_workouts=${user.notify_workouts}, notify_lead_time=${user.notify_lead_time}, push_subs=${pushSubsCount}`
            );

            // Lọc theo cờ thông báo tương ứng loại sự kiện
            const filteredEvents = events.filter((ev) => {
                if (ev.bat_thong_bao === false) {
                    console.log(`[Reminder Scan] ⏭️ SKIP "${ev.tieu_de}" (${ev.loai_su_kien}) của ${user.email} | lý do: bat_thong_bao=false`);
                    return false;
                }
                if (ev.loai_su_kien === "deadline" && user.notify_deadlines === false) {
                    console.log(`[Reminder Scan] ⏭️ SKIP "${ev.tieu_de}" (${ev.loai_su_kien}) của ${user.email} | lý do: notify_deadlines=false`);
                    return false;
                }
                if (ev.loai_su_kien === "tap-luyen" && user.notify_workouts === false) {
                    console.log(`[Reminder Scan] ⏭️ SKIP "${ev.tieu_de}" (${ev.loai_su_kien}) của ${user.email} | lý do: notify_workouts=false`);
                    return false;
                }
                if (ev.loai_su_kien === "hoc-tap" && user.notify_events === false) {
                    console.log(`[Reminder Scan] ⏭️ SKIP "${ev.tieu_de}" (${ev.loai_su_kien}) của ${user.email} | lý do: notify_events=false`);
                    return false;
                }
                return true;
            });

            if (filteredEvents.length === 0) {
                console.log(`[Reminder Scan] ⏭️ ${user.email}: 0 sự kiện đủ điều kiện nhắc sau khi filter cờ thông báo`);
                continue;
            }

            // Tính khoảng thời gian cho mỗi sự kiện (lead_time)
            const nowMs = now.getTime();
            const remindable = [];
            for (const ev of filteredEvents) {
                const startMs = new Date(ev.thoi_gian_bat_dau).getTime();
                const leadMinutes = Number(ev.thoi_gian_nhac_truoc ?? user.notify_lead_time ?? 15);
                const diffMinutes = (startMs - nowMs) / 60000; // phút tới giờ bắt đầu

                // Chỉ gửi nếu trong khoảng grace period (-5 phút) đến leadMinutes
                // diffMinutes <= leadMinutes: chưa quá hạn nhắc
                // diffMinutes > -5: chưa quá 5 phút kể từ giờ bắt đầu (catch-up)
                if (diffMinutes <= leadMinutes && diffMinutes > -5) {
                    remindable.push(ev);
                } else {
                    const reason = diffMinutes <= -5 ? "Qua quá 5 phút kể từ giờ bắt đầu (bỏ qua)" : "Chưa tới lead_time";
                    console.log(
                        `[Reminder Scan] ⏭️ SKIP "${ev.tieu_de}" (${ev.loai_su_kien}) của ${user.email} | diffMinutes=${diffMinutes.toFixed(1)} | leadMinutes=${leadMinutes} | lý do: ${reason}`
                    );
                }
            }

            if (remindable.length === 0) {
                console.log(`[Reminder Scan] ⏭️ ${user.email}: 0 sự kiện đủ điều kiện nhắc sau khi tính lead_time`);
                continue;
            }

            // Gửi push cho mỗi sự kiện trong khoảng
            for (const ev of remindable) {
                try {
                    // Atomic claim: đánh dấu push_reminded=true TRƯỚC khi gửi để tránh
                    // double send khi có nhiều instance Render chạy scheduler cùng lúc.
                    const claimed = await SuKien.findOneAndUpdate(
                        { _id: ev._id, push_reminded: false },
                        { $set: { push_reminded: true } },
                        { new: true }
                    );
                    if (!claimed) {
                        console.log(`[Scheduler] ⏭️ SKIP "${ev.tieu_de}" - đã được gửi bởi instance khác`);
                        continue;
                    }

                    const payload = buildEventReminderMessage(user, ev);
                    const result = await sendPushToUser(user._id, payload);

                    if (result.sent > 0) {
                        totalSent += result.sent;
                        console.log(
                            `[Scheduler] ✅ Đã gửi nhắc "${ev.tieu_de}" (${ev.loai_su_kien}) cho ${user.email} (${result.sent} thiết bị)`
                        );
                    } else {
                        // Hoàn tác push_reminded=false để thử lại lần sau
                        claimed.push_reminded = false;
                        await claimed.save();
                        if (pushSubsCount > 0) {
                            console.warn(
                                `[Scheduler] ⚠️ Có ${pushSubsCount} thiết bị đăng ký nhưng gửi nhắc "${ev.tieu_de}" cho ${user.email} thất bại (web-push trả về sent=0)`
                            );
                        } else {
                            console.warn(`[Scheduler] ⚠️ Không gửi được nhắc "${ev.tieu_de}" cho ${user.email} (không có thiết bị đăng ký push)`);
                        }
                    }
                } catch (evErr) {
                    console.error(`[Scheduler] ❌ Lỗi gửi nhắc sự kiện ${ev._id}:`, evErr.message);
                }
            }
        }

        if (totalSent === 0) {
            console.log("[Reminder Scan] ℹ️ Không có thông báo nhắc nào được gửi trong chu kỳ này");
        }
    } catch (err) {
        console.error("[Scheduler] ❌ Lỗi vòng lặp kiểm tra nhắc sự kiện:", err.message);
    }
}

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
    checkAndSendEventReminders();

    schedulerInterval = setInterval(async () => {
        checkAndSendBriefings();
        checkAndSendEventReminders();
    }, 60 * 1000);
}

module.exports = {
    getTodayVietnamRange,
    getCurrentVietnamTimeForCheck,
    timeToMinutes,
    buildDailyBriefingMessage,
    buildEventReminderMessage,
    sendDailyBriefingToUser,
    checkAndSendEventReminders,
    startDailyBriefingScheduler,
    getSchedulerStatus
};
