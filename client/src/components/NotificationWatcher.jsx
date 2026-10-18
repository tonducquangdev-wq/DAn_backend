import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  playNotificationSound,
  sendBrowserNotification,
  requestBrowserNotificationPermission
} from "../services/notificationService";

export const NotificationWatcher = () => {
  const { user } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState([]);
  const notifiedIdsRef = useRef(new Set());
  const notifiedSysIdsRef = useRef(new Set());

  // Khởi tạo và xin quyền thông báo trình duyệt nếu người dùng bật thông báo
  useEffect(() => {
    if (user && user.notify_events !== false) {
      requestBrowserNotificationPermission();
    }
  }, [user]);

  // Vòng lặp kiểm tra sự kiện cần nhắc nhở & thông báo từ Quản trị viên
  useEffect(() => {
    if (!user) return;

    const checkAllNotifications = async () => {
      // 1. KIỂM TRA THÔNG BÁO HỆ THỐNG / ADMIN PHÁT
      try {
        const tbRes = await api.getThongBao();
        if (tbRes.success && Array.isArray(tbRes.data)) {
          const unreadSystemNotifs = tbRes.data.filter((item) => !item.da_doc);

          unreadSystemNotifs.forEach((notif) => {
            const notifKey = `sys_${notif._id}`;
            if (!notifiedSysIdsRef.current.has(notifKey)) {
              notifiedSysIdsRef.current.add(notifKey);

              // Chọn màu theo loại thông báo
              let mau_sac = "#3b82f6";
              let icon = "📢";
              let badgeLabel = "Thông Báo Hệ Thống";

              if (notif.loai === "success") {
                mau_sac = "#10b981";
                icon = "🎉";
                badgeLabel = "Tin Vui / Chúc Mừng";
              } else if (notif.loai === "warning") {
                mau_sac = "#f59e0b";
                icon = "⚠️";
                badgeLabel = "Nhắc Nhở / Lưu Ý";
              } else if (notif.loai === "danger") {
                mau_sac = "#ef4444";
                icon = "🚨";
                badgeLabel = "Khẩn Cấp / Bảo Trì";
              }

              // Phát âm thanh
              if (user.notify_sound !== false) {
                playNotificationSound();
              }

              // Gửi native browser notification
              sendBrowserNotification(`📢 ${notif.tieu_de}`, notif.noi_dung);

              const newAlert = {
                id: notifKey,
                dbId: notif._id,
                isSystem: true,
                tieu_de: notif.tieu_de,
                noi_dung: notif.noi_dung,
                mau_sac,
                icon,
                badgeLabel,
                createdAt: notif.createdAt
              };

              setActiveAlerts((prev) => [newAlert, ...prev]);

              // Tự động ẩn banner sau 20 giây nếu không bấm tắt
              setTimeout(() => {
                setActiveAlerts((prev) => prev.filter((a) => a.id !== notifKey));
              }, 20000);
            }
          });
        }
      } catch (err) {
        console.warn("Lỗi kiểm tra thông báo hệ thống:", err);
      }

      // 2. KIỂM TRA NHẮC NHỞ LỊCH BIỂU (NẾU BẬT NOTIFY_EVENTS)
      if (user.notify_events !== false) {
        try {
          const now = new Date();
          const res = await api.getSuKien();
          if (res.success && Array.isArray(res.data)) {
            const events = res.data;
            const nowMs = now.getTime();

            events.forEach((ev) => {
              if (ev.bat_thong_bao === false) return;

              const startMs = new Date(ev.thoi_gian_bat_dau).getTime();
              const leadMinutes = ev.thoi_gian_nhac_truoc !== undefined ? Number(ev.thoi_gian_nhac_truoc) : 15;
              const reminderMs = startMs - leadMinutes * 60 * 1000;

              const reminderKey = `event_${ev._id}_${startMs}`;

              if (nowMs >= reminderMs && nowMs <= startMs + 15 * 60 * 1000) {
                if (!notifiedIdsRef.current.has(reminderKey)) {
                  notifiedIdsRef.current.add(reminderKey);

                  const diffMinutes = Math.max(0, Math.round((startMs - nowMs) / 60000));
                  let timeMessage = "";
                  if (diffMinutes === 0) {
                    timeMessage = "Đang diễn ra ngay bây giờ!";
                  } else if (diffMinutes < 60) {
                    timeMessage = `Sẽ diễn ra sau ${diffMinutes} phút nữa`;
                  } else {
                    timeMessage = `Sẽ diễn ra lúc ${new Date(startMs).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
                  }

                  if (user.notify_sound !== false) {
                    playNotificationSound();
                  }

                  sendBrowserNotification(
                    `🔔 Nhắc nhở: ${ev.tieu_de}`,
                    `${timeMessage}${ev.dia_diem ? ` tại ${ev.dia_diem}` : ""}`
                  );

                  const newAlert = {
                    id: reminderKey,
                    isSystem: false,
                    tieu_de: ev.tieu_de,
                    loai_su_kien: ev.loai_su_kien,
                    thoi_gian_bat_dau: ev.thoi_gian_bat_dau,
                    dia_diem: ev.dia_diem,
                    timeMessage,
                    mau_sac: ev.mau_sac || "#3b82f6",
                    icon: "🔔",
                    badgeLabel: "Nhắc Nhở Sự Kiện"
                  };

                  setActiveAlerts((prev) => [newAlert, ...prev]);

                  setTimeout(() => {
                    setActiveAlerts((prev) => prev.filter((a) => a.id !== reminderKey));
                  }, 15000);
                }
              }
            });
          }
        } catch (err) {
          console.warn("Lỗi kiểm tra nhắc nhở sự kiện:", err);
        }
      }
    };

    checkAllNotifications();
    const interval = setInterval(checkAllNotifications, 20000);

    return () => clearInterval(interval);
  }, [user]);

  const dismissAlert = (id) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const markAsReadAndDismiss = async (alert) => {
    if (alert.isSystem && alert.dbId) {
      try {
        await api.markThongBaoRead(alert.dbId);
      } catch (e) {}
    }
    dismissAlert(alert.id);
  };

  if (activeAlerts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "calc(16px + env(safe-area-inset-top, 0px))",
        right: "calc(16px + env(safe-area-inset-right, 0px))",
        zIndex: 10090,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxWidth: "400px",
        width: "90%"
      }}
    >
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            background: "var(--card-bg, #ffffff)",
            borderRadius: "18px",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.22), 0 2px 8px rgba(0, 0, 0, 0.1)",
            border: `2px solid ${alert.mau_sac}`,
            borderLeft: `7px solid ${alert.mau_sac}`,
            padding: "16px 18px",
            animation: "slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            color: "var(--text-main, #1e293b)",
            backdropFilter: "blur(12px)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{alert.icon}</span>
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: alert.mau_sac,
                    display: "inline-block",
                    marginBottom: "2px"
                  }}
                >
                  {alert.badgeLabel}
                </span>
                <h4 style={{ margin: "0", fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.3 }}>
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

          {/* Nội dung thông báo hệ thống hoặc sự kiện */}
          {alert.isSystem ? (
            <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
              {alert.noi_dung}
            </div>
          ) : (
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
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => markAsReadAndDismiss(alert)}
              style={{
                padding: "5px 14px",
                fontSize: "0.78rem",
                fontWeight: 700,
                borderRadius: "9999px",
                background: alert.mau_sac,
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: `0 3px 8px ${alert.mau_sac}55`
              }}
            >
              {alert.isSystem ? "✓ Đã hiểu & Đóng" : "✓ Đã xem"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
