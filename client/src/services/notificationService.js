// Quản lý âm thanh thông báo và kiểm tra sự kiện sắp diễn ra
export const LEAD_TIME_OPTIONS = [
  { value: 0, label: "Đúng giờ bắt đầu (0 phút)" },
  { value: 5, label: "5 phút trước" },
  { value: 10, label: "10 phút trước" },
  { value: 15, label: "15 phút trước (Mặc định)" },
  { value: 30, label: "30 phút trước" },
  { value: 60, label: "1 tiếng trước (60 phút)" },
  { value: 120, label: "2 tiếng trước" },
  { value: 1440, label: "1 ngày trước (24 tiếng)" }
];

export const formatLeadTime = (minutes) => {
  const m = Number(minutes);
  const opt = LEAD_TIME_OPTIONS.find((o) => o.value === m);
  if (opt) return opt.label;
  if (m === 0) return "Đúng giờ";
  if (m < 60) return `${m} phút trước`;
  if (m < 1440) return `${Math.floor(m / 60)} tiếng trước`;
  return `${Math.floor(m / 1440)} ngày trước`;
};

// Phát âm thanh chuông nhắc nhở bằng Web Audio API
export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    // Âm đôi vui tươi: D5 -> A5
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.warn("Không thể phát chuông thông báo:", e);
  }
};

// Yêu cầu quyền thông báo của trình duyệt
export const requestBrowserNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const perm = await Notification.requestPermission();
    return perm === "granted";
  }
  return false;
};

// Gửi thông báo hệ điều hành / trình duyệt
export const sendBrowserNotification = (title, body, tag = "event-reminder") => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag
    });
  } catch (e) {
    console.warn("Không thể gửi notification:", e);
  }
};
