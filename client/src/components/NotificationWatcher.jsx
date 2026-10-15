import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  playNotificationSound,
  sendBrowserNotification,
  requestBrowserNotificationPermission,
  formatLeadTime
} from "../services/notificationService";

export const NotificationWatcher = () => {
  const { user } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState([]);
  const notifiedIdsRef = useRef(new Set());

  // Khởi tạo và xin quyền thông báo trình duyệt nếu người dùng bật thông báo
  useEffect(() => {
    if (user && user.notify_events !== false) {
      requestBrowserNotificationPermission();
    }
  }, [user]);

  // Vòng lặp kiểm tra sự kiện cần nhắc nhở
  useEffect(() => {
    if (!user || user.notify_events === false) return;

    const checkUpcomingReminders = async () => {
      try {
        const now = new Date();
        // Lấy sự kiện của hôm nay và ngày mai
        const res = await api.getSuKien();
        if (!res.success || !Array.isArray(res.data)) return;

        const events = res.data;
        const nowMs = now.getTime();

        events.forEach((ev) => {
          // Chỉ kiểm tra các sự kiện đang bật thông báo
          if (ev.bat_thong_bao === false) return;

          const startMs = new Date(ev.thoi_gian_bat_dau).getTime();
          const leadMinutes = ev.thoi_gian_nhac_truoc !== undefined ? Number(ev.thoi_gian_nhac_truoc) : 15;
          const reminderMs = startMs - leadMinutes * 60 * 1000;

          // Điều kiện kích hoạt:
          // 1. Thời gian hiện tại đã vượt qua hoặc chạm mốc nhắc nhở (nowMs >= reminderMs)
          // 2. Sự kiện chưa kết thúc quá lâu (trong vòng 15 phút sau giờ bắt đầu)
          // 3. Chưa từng được thông báo trong phiên làm việc này
          const reminderKey = `${ev._id}_${startMs}`;

          if (nowMs >= reminderMs && nowMs <= startMs + 15 * 60 * 1000) {
            if (!notifiedIdsRef.current.has(reminderKey)) {
              notifiedIdsRef.current.add(reminderKey);

              // Tính thời gian còn lại
              const diffMinutes = Math.max(0, Math.round((startMs - nowMs) / 60000));
              let timeMessage = "";
              if (diffMinutes === 0) {
                timeMessage = "Đang diễn ra ngay bây giờ!";
              } else if (diffMinutes < 60) {
                timeMessage = `Sẽ diễn ra sau ${diffMinutes} phút nữa`;
              } else {
                timeMessage = `Sẽ diễn ra lúc ${new Date(startMs).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
              }

              // 1. Phát âm thanh nếu người dùng bật âm thanh
              if (user.notify_sound !== false) {
                playNotificationSound();
              }

              // 2. Gửi thông báo native qua trình duyệt
              sendBrowserNotification(
                `🔔 Nhắc nhở: ${ev.tieu_de}`,
                `${timeMessage}${ev.dia_diem ? ` tại ${ev.dia_diem}` : ""}`
              );

              // 3. Hiển thị popup banner trên giao diện web
              const newAlert = {
                id: reminderKey,
                tieu_de: ev.tieu_de,
                loai_su_kien: ev.loai_su_kien,
                thoi_gian_bat_dau: ev.thoi_gian_bat_dau,
                dia_diem: ev.dia_diem,
                timeMessage,
                mau_sac: ev.mau_sac || "#3b82f6"
              };

              setActiveAlerts((prev) => [newAlert, ...prev]);

              // Tự động ẩn sau 15 giây nếu không bấm tắt
              setTimeout(() => {
                setActiveAlerts((prev) => prev.filter((a) => a.id !== reminderKey));
              }, 15000);
            }
          }
        });
      } catch (err) {
        console.warn("Lỗi kiểm tra nhắc nhở sự kiện:", err);
      }
    };

    // Kiểm tra ngay khi mount và lặp lại mỗi 25 giây
    checkUpcomingReminders();
    const interval = setInterval(checkUpcomingReminders, 25000);

    return () => clearInterval(interval);
  }, [user]);

  const dismissAlert = (id) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (activeAlerts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 10090,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxWidth: "380px",
        width: "90%"
      }}
    >
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            background: "var(--card-bg, #ffffff)",
            borderRadius: "16px",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)",
            border: `2px solid ${alert.mau_sac}`,
            borderLeft: `6px solid ${alert.mau_sac}`,
            padding: "16px 18px",
            animation: "slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            color: "var(--text-main, #1e293b)",
            backdropFilter: "blur(12px)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.4rem", animation: "ring 1.5s infinite" }}>🔔</span>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: alert.mau_sac }}>
                  Nhắc Nhở Sự Kiện
                </span>
                <h4 style={{ margin: "2px 0 0 0", fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)" }}>
                  {alert.tieu_de}
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dismissAlert(alert.id)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.1rem",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "2px 4px",
                lineHeight: 1
              }}
              title="Đóng thông báo"
            >
              ✖
            </button>
          </div>

          <div style={{ marginTop: "10px", fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div>
              ⏰ <strong>{alert.timeMessage}</strong> (bắt đầu lúc {new Date(alert.thoi_gian_bat_dau).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })})
            </div>
            {alert.dia_diem && (
              <div>
                📍 Địa điểm: <strong>{alert.dia_diem}</strong>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => dismissAlert(alert.id)}
              style={{
                padding: "5px 14px",
                fontSize: "0.78rem",
                fontWeight: 700,
                borderRadius: "9999px"
              }}
            >
              ✓ Đã xem
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
