import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  LEAD_TIME_OPTIONS,
  formatLeadTime,
  playNotificationSound,
  requestBrowserNotificationPermission
} from "../services/notificationService";

const EVENT_CATEGORIES = {
  "hoc-tap": { label: "Học tập", icon: "📚", color: "#3b82f6" },
  "tap-luyen": { label: "Tập luyện", icon: "🏋️", color: "#10b981" },
  "deadline": { label: "Deadline", icon: "⏰", color: "#f59e0b" },
  "ca-nhan": { label: "Cá nhân", icon: "☕", color: "#8b5cf6" },
  "cong-viec": { label: "Công việc", icon: "💼", color: "#6366f1" }
};

export const ProfileModal = ({ show, onClose }) => {
  const { user, setUser, theme, toggleTheme } = useAuth();

  // Tab State: "info" | "notifications" | "security"
  const [activeTab, setActiveTab] = useState("info");

  // Form Thông Tin Cá Nhân
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [updatingInfo, setUpdatingInfo] = useState(false);

  // Form Cài Đặt Thông Báo Chung
  const [notifyEvents, setNotifyEvents] = useState(true);
  const [notifySound, setNotifySound] = useState(true);
  const [notifyLeadTime, setNotifyLeadTime] = useState(15);
  const [updatingNotify, setUpdatingNotify] = useState(false);

  // Danh Sách Sự Kiện & Quản Lý Từng Sự Kiện
  const [userEvents, setUserEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [searchEventQuery, setSearchEventQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [actionEventId, setActionEventId] = useState(null);

  // Form Đổi Mật Khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Thông báo phản hồi
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // Nạp danh sách sự kiện từ backend
  const loadUserEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await api.getSuKien();
      if (res.success && Array.isArray(res.data)) {
        setUserEvents(res.data);
      }
    } catch (err) {
      console.warn("Lỗi nạp sự kiện:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Đồng bộ thông tin khi mở modal hoặc user thay đổi
  useEffect(() => {
    if (show && user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setNotifyEvents(user.notify_events !== false);
      setNotifySound(user.notify_sound !== false);
      setNotifyLeadTime(user.notify_lead_time !== undefined ? user.notify_lead_time : 15);
      setStatusMsg({ type: "", text: "" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [show, user]);

  // Nạp sự kiện khi chuyển sang tab notifications
  useEffect(() => {
    if (show && activeTab === "notifications") {
      loadUserEvents();
    }
  }, [show, activeTab]);

  // Đóng bằng phím ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && show) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  // Xử lý Cập nhật Thông tin cá nhân
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: "", text: "" });
    setUpdatingInfo(true);

    try {
      const res = await api.updateProfile({ name, email });
      if (res.success) {
        if (setUser) setUser(res.data);
        setStatusMsg({ type: "success", text: "✅ Đã lưu cập nhật thông tin cá nhân!" });
      } else {
        setStatusMsg({ type: "error", text: "⚠️ " + (res.message || "Cập nhật không thành công") });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: "⚠️ Lỗi kết nối: " + err.message });
    } finally {
      setUpdatingInfo(false);
    }
  };

  // Xử lý Lưu cài đặt thông báo chung
  const handleSaveNotifySettings = async (e) => {
    e?.preventDefault();
    setStatusMsg({ type: "", text: "" });
    setUpdatingNotify(true);

    try {
      const res = await api.updateProfile({
        notify_events: notifyEvents,
        notify_sound: notifySound,
        notify_lead_time: Number(notifyLeadTime)
      });
      if (res.success) {
        if (setUser) setUser(res.data);
        setStatusMsg({ type: "success", text: "✅ Đã lưu cài đặt thông báo hệ thống!" });
      } else {
        setStatusMsg({ type: "error", text: "⚠️ " + (res.message || "Lỗi lưu cài đặt thông báo") });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: "⚠️ Lỗi kết nối: " + err.message });
    } finally {
      setUpdatingNotify(false);
    }
  };

  // Bật/tắt thông báo cho từng sự kiện
  const handleToggleEventNotification = async (event) => {
    const nextStatus = !(event.bat_thong_bao !== false);
    setActionEventId(event._id);

    // Cập nhật lạc quan (Optimistic update)
    setUserEvents((prev) =>
      prev.map((ev) => (ev._id === event._id ? { ...ev, bat_thong_bao: nextStatus } : ev))
    );

    try {
      const res = await api.updateSuKien(event._id, {
        bat_thong_bao: nextStatus,
        thoi_gian_nhac_truoc: event.thoi_gian_nhac_truoc !== undefined ? Number(event.thoi_gian_nhac_truoc) : 15
      });
      if (!res.success) {
        // Rollback nếu lỗi
        setUserEvents((prev) =>
          prev.map((ev) => (ev._id === event._id ? { ...ev, bat_thong_bao: !nextStatus } : ev))
        );
        setStatusMsg({ type: "error", text: "⚠️ " + (res.message || "Không thể cập nhật sự kiện") });
      } else {
        setStatusMsg({
          type: "success",
          text: nextStatus
            ? `🔔 Đã bật thông báo cho: "${event.tieu_de}"`
            : `🔕 Đã tắt thông báo cho: "${event.tieu_de}"`
        });
      }
    } catch (err) {
      setUserEvents((prev) =>
        prev.map((ev) => (ev._id === event._id ? { ...ev, bat_thong_bao: !nextStatus } : ev))
      );
      setStatusMsg({ type: "error", text: "⚠️ Lỗi kết nối: " + err.message });
    } finally {
      setActionEventId(null);
    }
  };

  // Đổi số phút nhắc trước cho từng sự kiện
  const handleChangeEventLeadTime = async (event, newMinutes) => {
    const minutes = Number(newMinutes);
    setActionEventId(event._id);

    // Cập nhật lạc quan
    setUserEvents((prev) =>
      prev.map((ev) =>
        ev._id === event._id ? { ...ev, thoi_gian_nhac_truoc: minutes, bat_thong_bao: true } : ev
      )
    );

    try {
      const res = await api.updateSuKien(event._id, {
        thoi_gian_nhac_truoc: minutes,
        bat_thong_bao: true
      });
      if (res.success) {
        setStatusMsg({
          type: "success",
          text: `⏰ Đã đặt nhắc trước ${formatLeadTime(minutes)} cho "${event.tieu_de}"!`
        });
      } else {
        setStatusMsg({ type: "error", text: "⚠️ " + (res.message || "Lỗi cập nhật thời gian") });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: "⚠️ Lỗi kết nối: " + err.message });
    } finally {
      setActionEventId(null);
    }
  };

  // Bật tất cả hoặc Tắt tất cả thông báo
  const handleBatchToggleAll = async (targetStatus) => {
    if (userEvents.length === 0) return;
    setStatusMsg({ type: "", text: "" });
    setLoadingEvents(true);

    try {
      await Promise.all(
        userEvents.map((ev) =>
          api.updateSuKien(ev._id, {
            bat_thong_bao: targetStatus,
            thoi_gian_nhac_truoc: ev.thoi_gian_nhac_truoc !== undefined ? ev.thoi_gian_nhac_truoc : 15
          })
        )
      );

      setUserEvents((prev) => prev.map((ev) => ({ ...ev, bat_thong_bao: targetStatus })));
      setStatusMsg({
        type: "success",
        text: targetStatus ? "🔔 Đã bật thông báo cho tất cả sự kiện!" : "🔕 Đã tắt thông báo cho tất cả sự kiện!"
      });
    } catch (err) {
      setStatusMsg({ type: "error", text: "⚠️ Lỗi thực thi hàng loạt: " + err.message });
    } finally {
      setLoadingEvents(false);
    }
  };

  // Xử lý Đổi Mật Khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: "", text: "" });

    if (newPassword.length < 6) {
      setStatusMsg({ type: "error", text: "⚠️ Mật khẩu mới phải có ít nhất 6 ký tự!" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: "error", text: "⚠️ Mật khẩu xác nhận không trùng khớp!" });
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      if (res.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setStatusMsg({ type: "success", text: "✅ Đổi mật khẩu tài khoản thành công!" });
      } else {
        setStatusMsg({ type: "error", text: "⚠️ " + (res.message || "Đổi mật khẩu thất bại") });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: "⚠️ Lỗi kết nối: " + err.message });
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Lọc danh sách sự kiện
  const filteredEvents = userEvents.filter((ev) => {
    const matchesSearch =
      !searchEventQuery.trim() ||
      (ev.tieu_de && ev.tieu_de.toLowerCase().includes(searchEventQuery.toLowerCase())) ||
      (ev.dia_diem && ev.dia_diem.toLowerCase().includes(searchEventQuery.toLowerCase()));
    const matchesCategory = filterCategory === "all" || ev.loai_su_kien === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const activeNotifCount = userEvents.filter((ev) => ev.bat_thong_bao !== false).length;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10050 }}>
      <div
        className="modal-content profile-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: activeTab === "notifications" ? "680px" : "520px",
          width: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "26px",
          transition: "max-width 0.25s ease"
        }}
      >
        {/* Header Modal */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-main)", margin: "0 0 4px 0" }}>
              ⚙️ Cài Đặt Cá Nhân & Tài Khoản
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
              Quản lý hồ sơ cá nhân, cài đặt thông báo sự kiện và bảo mật tài khoản
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Đóng hộp thoại"
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px 8px",
              borderRadius: "8px",
              lineHeight: 1
            }}
          >
            ✖
          </button>
        </div>

        {/* Tab Buttons Switcher */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            background: "rgba(0, 0, 0, 0.04)",
            padding: "4px",
            borderRadius: "9999px",
            marginBottom: "18px",
            border: "1px solid var(--border-color)"
          }}
        >
          <button
            type="button"
            className="profile-modal-tab-btn"
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "9999px",
              border: "none",
              background: activeTab === "info" ? "var(--primary)" : "transparent",
              color: activeTab === "info" ? "#ffffff" : "var(--text-muted)",
              fontWeight: activeTab === "info" ? 700 : 600,
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
            onClick={() => {
              setActiveTab("info");
              setStatusMsg({ type: "", text: "" });
            }}
          >
            <span>👤</span> Thông Tin
          </button>

          <button
            type="button"
            className="profile-modal-tab-btn"
            style={{
              flex: 1.2,
              padding: "8px 12px",
              borderRadius: "9999px",
              border: "none",
              background: activeTab === "notifications" ? "var(--primary)" : "transparent",
              color: activeTab === "notifications" ? "#ffffff" : "var(--text-muted)",
              fontWeight: activeTab === "notifications" ? 700 : 600,
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
            onClick={() => {
              setActiveTab("notifications");
              setStatusMsg({ type: "", text: "" });
            }}
          >
            <span>🔔</span> Thông Báo Sự Kiện
          </button>

          <button
            type="button"
            className="profile-modal-tab-btn"
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "9999px",
              border: "none",
              background: activeTab === "security" ? "var(--primary)" : "transparent",
              color: activeTab === "security" ? "#ffffff" : "var(--text-muted)",
              fontWeight: activeTab === "security" ? 700 : 600,
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
            onClick={() => {
              setActiveTab("security");
              setStatusMsg({ type: "", text: "" });
            }}
          >
            <span>🔒</span> Bảo Mật
          </button>
        </div>

        {/* Thông Báo Trạng Thái */}
        {statusMsg.text && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              marginBottom: "16px",
              fontSize: "0.82rem",
              fontWeight: "600",
              background: statusMsg.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
              color: statusMsg.type === "success" ? "#10b981" : "#ef4444",
              border: `1px solid ${statusMsg.type === "success" ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <span>{statusMsg.text}</span>
            <button
              type="button"
              onClick={() => setStatusMsg({ type: "", text: "" })}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
            >
              ✖
            </button>
          </div>
        )}

        {/* ============================================================
            TAB 1: THÔNG TIN CÁ NHÂN
            ============================================================ */}
        {activeTab === "info" && (
          <form onSubmit={handleUpdateProfile}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "20px",
                padding: "16px",
                background: "rgba(59, 130, 246, 0.06)",
                borderRadius: "16px",
                border: "1px solid rgba(59, 130, 246, 0.15)"
              }}
            >
              <div
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: "0 0 2px 0", fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)" }}>
                  {user?.name || "Người dùng"}
                </h4>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {user?.email || ""}
                </p>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", display: "block" }}>
                Họ và Tên *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ và tên..."
                style={{ width: "100%" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", display: "block" }}>
                Địa Chỉ Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                style={{ width: "100%" }}
              />
            </div>

            {/* Chuyển đổi giao diện sáng/tối */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "var(--neu-bg)",
                borderRadius: "14px",
                border: "1px solid var(--border-color)",
                marginBottom: "22px"
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)" }}>
                  Giao Diện Hệ Thống
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {theme === "dark" ? "Chế độ ban đêm 🌙" : "Chế độ ban ngày ☀️"}
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={toggleTheme}
                style={{ padding: "6px 14px", fontSize: "0.82rem" }}
              >
                {theme === "dark" ? "☀️ Sang Sáng" : "🌙 Sang Tối"}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={updatingInfo}>
                Đóng
              </button>
              <button type="submit" className="btn-primary" disabled={updatingInfo}>
                {updatingInfo ? "⏳ Đang lưu..." : "💾 Lưu Thay Đổi"}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================
            TAB 2: THÔNG BÁO SỰ KIỆN (YÊU CẦU CỦA NGƯỜI DÙNG)
            ============================================================ */}
        {activeTab === "notifications" && (
          <div>
            {/* Phân vùng 1: Cài đặt thông báo chung */}
            <div
              style={{
                background: "rgba(59, 130, 246, 0.05)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "20px"
              }}
            >
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚙️ Cài Đặt Thông Báo Chung Toàn Hệ Thống</span>
              </div>

              {/* Bật/tắt thông báo sự kiện */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-main)" }}>
                    🔔 Bật thông báo sự kiện
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Nhận cảnh báo trên trình duyệt khi sự kiện chuẩn bị bắt đầu
                  </div>
                </div>
                <label style={{ cursor: "pointer", position: "relative", display: "inline-block", width: "44px", height: "24px", margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={notifyEvents}
                    onChange={(e) => setNotifyEvents(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: notifyEvents ? "var(--primary)" : "#cbd5e1",
                      transition: "0.3s",
                      borderRadius: "24px"
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        content: '""',
                        height: "18px",
                        width: "18px",
                        left: notifyEvents ? "22px" : "3px",
                        bottom: "3px",
                        backgroundColor: "white",
                        transition: "0.3s",
                        borderRadius: "50%",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                      }}
                    />
                  </span>
                </label>
              </div>

              {/* Âm thanh chuông báo */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🔊 Phát âm thanh chuông nhắc</span>
                    <button
                      type="button"
                      onClick={() => playNotificationSound()}
                      title="Bấm để nghe thử chuông nhắc nhở"
                      style={{
                        padding: "2px 8px",
                        fontSize: "0.72rem",
                        background: "rgba(59, 130, 246, 0.15)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        borderRadius: "6px",
                        color: "var(--primary)",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      ▶ Thử chuông
                    </button>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Phát chuông nhẹ nhàng khi thông báo sự kiện xuất hiện
                  </div>
                </div>
                <label style={{ cursor: "pointer", position: "relative", display: "inline-block", width: "44px", height: "24px", margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={notifySound}
                    onChange={(e) => setNotifySound(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: notifySound ? "var(--primary)" : "#cbd5e1",
                      transition: "0.3s",
                      borderRadius: "24px"
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        content: '""',
                        height: "18px",
                        width: "18px",
                        left: notifySound ? "22px" : "3px",
                        bottom: "3px",
                        backgroundColor: "white",
                        transition: "0.3s",
                        borderRadius: "50%",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                      }}
                    />
                  </span>
                </label>
              </div>

              {/* Thời gian nhắc trước mặc định */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-main)" }}>
                    ⏰ Thời gian nhắc trước mặc định
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Áp dụng khi tạo mới sự kiện trên trang lịch
                  </div>
                </div>
                <select
                  value={notifyLeadTime}
                  onChange={(e) => setNotifyLeadTime(Number(e.target.value))}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    border: "1px solid var(--border-color)",
                    background: "var(--card-bg)",
                    color: "var(--text-main)",
                    cursor: "pointer"
                  }}
                >
                  {LEAD_TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveNotifySettings}
                  disabled={updatingNotify}
                  style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                >
                  {updatingNotify ? "⏳ Đang lưu..." : "💾 Lưu Cài Đặt Chung"}
                </button>
              </div>
            </div>

            {/* Phân vùng 2: Danh sách sự kiện & Bật/Tắt từng sự kiện */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)" }}>
                    📅 Danh Sách Sự Kiện & Tùy Chọn Nhắc Nhở ({filteredEvents.length})
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Đang bật thông báo cho <strong>{activeNotifCount}</strong> / {userEvents.length} sự kiện
                  </div>
                </div>

                {/* Nút bật/tắt tất cả */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => handleBatchToggleAll(true)}
                    disabled={loadingEvents || userEvents.length === 0}
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      borderRadius: "6px",
                      border: "1px solid #10b981",
                      background: "rgba(16, 185, 129, 0.1)",
                      color: "#10b981",
                      cursor: "pointer"
                    }}
                    title="Bật thông báo cho toàn bộ sự kiện"
                  >
                    🔔 Bật tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchToggleAll(false)}
                    disabled={loadingEvents || userEvents.length === 0}
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--neu-bg)",
                      color: "var(--text-muted)",
                      cursor: "pointer"
                    }}
                    title="Tắt thông báo cho toàn bộ sự kiện"
                  >
                    🔕 Tắt tất cả
                  </button>
                </div>
              </div>

              {/* Tìm kiếm & Lọc theo loại */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={searchEventQuery}
                  onChange={(e) => setSearchEventQuery(e.target.value)}
                  placeholder="🔍 Tìm kiếm sự kiện..."
                  style={{
                    flex: "1 1 200px",
                    padding: "6px 12px",
                    fontSize: "0.82rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)"
                  }}
                />

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    fontSize: "0.82rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--card-bg)",
                    color: "var(--text-main)"
                  }}
                >
                  <option value="all">Tất cả danh mục</option>
                  <option value="hoc-tap">📚 Học tập</option>
                  <option value="tap-luyen">🏋️ Tập luyện</option>
                  <option value="deadline">⏰ Deadline</option>
                  <option value="ca-nhan">☕ Cá nhân</option>
                  <option value="cong-viec">💼 Công việc</option>
                </select>
              </div>

              {/* Danh sách thẻ sự kiện */}
              <div
                style={{
                  maxHeight: "360px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  paddingRight: "4px"
                }}
              >
                {loadingEvents ? (
                  <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    ⏳ Đang nạp danh sách sự kiện...
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "26px",
                      background: "var(--neu-bg)",
                      borderRadius: "14px",
                      color: "var(--text-muted)",
                      fontSize: "0.85rem"
                    }}
                  >
                    {userEvents.length === 0
                      ? "Bạn chưa có sự kiện nào trong hệ thống. Hãy tạo sự kiện mới ở trang Lịch!"
                      : "Không tìm thấy sự kiện phù hợp với bộ lọc."}
                  </div>
                ) : (
                  filteredEvents.map((ev) => {
                    const cat = EVENT_CATEGORIES[ev.loai_su_kien] || { label: "Khác", icon: "📌", color: "#3b82f6" };
                    const isEnabled = ev.bat_thong_bao !== false;
                    const leadMin = ev.thoi_gian_nhac_truoc !== undefined ? ev.thoi_gian_nhac_truoc : 15;
                    const isActing = actionEventId === ev._id;

                    return (
                      <div
                        key={ev._id}
                        style={{
                          background: "var(--card-bg)",
                          border: `1px solid ${isEnabled ? "rgba(16, 185, 129, 0.3)" : "var(--border-color)"}`,
                          borderLeft: `4px solid ${ev.mau_sac || cat.color}`,
                          borderRadius: "12px",
                          padding: "12px 14px",
                          transition: "all 0.2s ease",
                          boxShadow: isEnabled ? "0 2px 8px rgba(16, 185, 129, 0.08)" : "none"
                        }}
                      >
                        {/* Hàng trên: Badge, Tiêu đề, Trạng thái */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(0,0,0,0.06)",
                                  color: "var(--text-muted)",
                                  fontWeight: 600
                                }}
                              >
                                {cat.icon} {cat.label}
                              </span>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                🕒 {new Date(ev.thoi_gian_bat_dau).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                              </span>
                            </div>

                            <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text-main)", lineHeight: 1.3 }}>
                              {ev.tieu_de}
                            </div>
                            {ev.dia_diem && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                📍 {ev.dia_diem}
                              </div>
                            )}
                          </div>

                          {/* Toggle switch bật/tắt riêng sự kiện này */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                            <label style={{ cursor: "pointer", position: "relative", display: "inline-block", width: "42px", height: "22px", margin: 0 }}>
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                disabled={isActing}
                                onChange={() => handleToggleEventNotification(ev)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                              />
                              <span
                                style={{
                                  position: "absolute",
                                  cursor: "pointer",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: isEnabled ? "#10b981" : "#cbd5e1",
                                  transition: "0.3s",
                                  borderRadius: "22px"
                                }}
                              >
                                <span
                                  style={{
                                    position: "absolute",
                                    content: '""',
                                    height: "16px",
                                    width: "16px",
                                    left: isEnabled ? "22px" : "3px",
                                    bottom: "3px",
                                    backgroundColor: "white",
                                    transition: "0.3s",
                                    borderRadius: "50%",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                  }}
                                />
                              </span>
                            </label>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                color: isEnabled ? "#10b981" : "var(--text-muted)"
                              }}
                            >
                              {isEnabled ? "🔔 Bật" : "🔕 Tắt"}
                            </span>
                          </div>
                        </div>

                        {/* Hàng dưới: Lựa chọn thời gian nhắc trước */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                            marginTop: "8px",
                            paddingTop: "8px",
                            borderTop: "1px dashed var(--border-color)",
                            fontSize: "0.78rem"
                          }}
                        >
                          <span style={{ color: isEnabled ? "var(--text-main)" : "var(--text-muted)", fontWeight: 600 }}>
                            {isEnabled ? "⏰ Nhắc trước:" : "💤 Nhắc nhở đang tắt:"}
                          </span>

                          <select
                            value={leadMin}
                            disabled={!isEnabled || isActing}
                            onChange={(e) => handleChangeEventLeadTime(ev, e.target.value)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.75rem",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              background: isEnabled ? "var(--card-bg)" : "rgba(0,0,0,0.04)",
                              color: isEnabled ? "var(--text-main)" : "var(--text-muted)",
                              cursor: isEnabled ? "pointer" : "not-allowed"
                            }}
                          >
                            {LEAD_TIME_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 3: ĐỔI MẬT KHẨU
            ============================================================ */}
        {activeTab === "security" && (
          <form onSubmit={handleChangePassword}>
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", display: "block" }}>
                Mật Khẩu Hiện Tại *
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrentPass ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  style={{ width: "100%", paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    color: "var(--text-muted)"
                  }}
                >
                  {showCurrentPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", display: "block" }}>
                Mật Khẩu Mới * (Tối thiểu 6 ký tự)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPass ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  style={{ width: "100%", paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    color: "var(--text-muted)"
                  }}
                >
                  {showNewPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "22px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", display: "block" }}>
                Xác Nhận Mật Khẩu Mới *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={updatingPassword}
              >
                Đóng
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={updatingPassword}
              >
                {updatingPassword ? "⏳ Đang đổi..." : "🔑 Cập Nhật Mật Khẩu"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
