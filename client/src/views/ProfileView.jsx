import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  LEAD_TIME_OPTIONS,
  formatLeadTime,
  playNotificationSound
} from "../services/notificationService";

const EVENT_CATEGORIES = {
  "hoc-tap": { label: "Học tập", icon: "📚", color: "#3b82f6" },
  "tap-luyen": { label: "Tập luyện", icon: "🏋️", color: "#10b981" },
  "deadline": { label: "Deadline", icon: "⏰", color: "#f59e0b" },
  "ca-nhan": { label: "Cá nhân", icon: "☕", color: "#8b5cf6" },
  "cong-viec": { label: "Công việc", icon: "💼", color: "#6366f1" }
};

export const ProfileView = () => {
  const { user, setUser, theme, toggleTheme } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  // Notification States
  const [notifyEvents, setNotifyEvents] = useState(user?.notify_events !== false);
  const [notifySound, setNotifySound] = useState(user?.notify_sound !== false);
  const [notifyLeadTime, setNotifyLeadTime] = useState(user?.notify_lead_time !== undefined ? user.notify_lead_time : 15);
  const [updatingNotify, setUpdatingNotify] = useState(false);

  // Events list
  const [userEvents, setUserEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await api.getSuKien();
      if (res.success && Array.isArray(res.data)) {
        setUserEvents(res.data);
      }
    } catch (e) {
      console.warn("Lỗi nạp sự kiện:", e);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setNotifyEvents(user.notify_events !== false);
      setNotifySound(user.notify_sound !== false);
      setNotifyLeadTime(user.notify_lead_time !== undefined ? user.notify_lead_time : 15);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMsg("");
    const res = await api.updateProfile({ name, email });
    if (res.success) {
      setUser(res.data);
      setMsg("✅ Cập nhật thông tin cá nhân thành công!");
    } else {
      setMsg("⚠️ " + res.message);
    }
  };

  const handleSaveNotifySettings = async (e) => {
    e?.preventDefault();
    setUpdatingNotify(true);
    setMsg("");
    try {
      const res = await api.updateProfile({
        notify_events: notifyEvents,
        notify_sound: notifySound,
        notify_lead_time: Number(notifyLeadTime)
      });
      if (res.success) {
        setUser(res.data);
        setMsg("✅ Lưu cài đặt thông báo chung thành công!");
      } else {
        setMsg("⚠️ " + res.message);
      }
    } catch (err) {
      setMsg("⚠️ Lỗi kết nối: " + err.message);
    } finally {
      setUpdatingNotify(false);
    }
  };

  const handleToggleEventNotification = async (event) => {
    const nextStatus = !(event.bat_thong_bao !== false);
    setUserEvents((prev) =>
      prev.map((ev) => (ev._id === event._id ? { ...ev, bat_thong_bao: nextStatus } : ev))
    );

    try {
      const res = await api.updateSuKien(event._id, {
        bat_thong_bao: nextStatus,
        thoi_gian_nhac_truoc: event.thoi_gian_nhac_truoc !== undefined ? event.thoi_gian_nhac_truoc : 15
      });
      if (!res.success) {
        setUserEvents((prev) =>
          prev.map((ev) => (ev._id === event._id ? { ...ev, bat_thong_bao: !nextStatus } : ev))
        );
        setMsg("⚠️ " + (res.message || "Không thể cập nhật sự kiện"));
      } else {
        setMsg(nextStatus ? `🔔 Đã bật thông báo cho "${event.tieu_de}"!` : `🔕 Đã tắt thông báo cho "${event.tieu_de}"!`);
      }
    } catch (err) {
      setUserEvents((prev) =>
        prev.map((ev) => (ev._id === event._id ? { ...ev, bat_thong_bao: !nextStatus } : ev))
      );
      setMsg("⚠️ Lỗi: " + err.message);
    }
  };

  const handleChangeLeadTime = async (event, newMin) => {
    const min = Number(newMin);
    setUserEvents((prev) =>
      prev.map((ev) => (ev._id === event._id ? { ...ev, thoi_gian_nhac_truoc: min, bat_thong_bao: true } : ev))
    );
    try {
      const res = await api.updateSuKien(event._id, {
        thoi_gian_nhac_truoc: min,
        bat_thong_bao: true
      });
      if (res.success) {
        setMsg(`⏰ Đã đổi thời gian nhắc trước thành ${formatLeadTime(min)} cho "${event.tieu_de}"!`);
      }
    } catch (e) {
      setMsg("⚠️ Lỗi: " + e.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg("");
    const res = await api.changePassword({ current_password: currentPassword, new_password: newPassword });
    if (res.success) {
      setCurrentPassword("");
      setNewPassword("");
      setMsg("✅ Đổi mật khẩu thành công!");
    } else {
      setMsg("⚠️ " + res.message);
    }
  };

  const filteredEvents = userEvents.filter((ev) => {
    const matchSearch =
      !searchQuery.trim() ||
      (ev.tieu_de && ev.tieu_de.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.dia_diem && ev.dia_diem.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = filterCat === "all" || ev.loai_su_kien === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ paddingBottom: "60px" }}>
      <div className="header-top">
        <div>
          <h1 className="page-title">⚙️ Cài Đặt Cá Nhân & Tài Khoản</h1>
          <p className="page-subtitle">Cập nhật hồ sơ, tùy chọn thông báo sự kiện và bảo mật tài khoản</p>
        </div>
      </div>

      {msg && (
        <div className="glass-card" style={{ padding: "14px 20px", marginBottom: "24px", color: msg.includes("✅") || msg.includes("🔔") || msg.includes("⏰") ? "var(--accent-success)" : "var(--accent-danger)", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{msg}</span>
          <button type="button" onClick={() => setMsg("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}>✖</button>
        </div>
      )}

      {/* CỤM 1: CÀI ĐẶT THÔNG BÁO SỰ KIỆN (YÊU CẦU CHÍNH CỦA NGƯỜI DÙNG) */}
      <div className="glass-card" style={{ marginBottom: "26px", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px dashed var(--border-color)" }}>
          <div className="kpi-icon" style={{ width: "56px", height: "56px", fontSize: "1.6rem" }}>
            🔔
          </div>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "4px" }}>
              Cài Đặt Thông Báo & Nhắc Nhở Sự Kiện
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
              Bật/tắt thông báo và chọn số phút nhắc nhở trước cho từng sự kiện hoặc toàn hệ thống
            </p>
          </div>
        </div>

        {/* Cài đặt chung */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", background: "rgba(59, 130, 246, 0.05)", padding: "18px", borderRadius: "16px", border: "1px solid rgba(59, 130, 246, 0.15)", marginBottom: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>🔔 Thông báo hệ thống</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Nhận popup cảnh báo sự kiện</div>
            </div>
            <input
              type="checkbox"
              checked={notifyEvents}
              onChange={(e) => setNotifyEvents(e.target.checked)}
              style={{ width: "20px", height: "20px", cursor: "pointer" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🔊 Âm thanh chuông</span>
                <button type="button" onClick={() => playNotificationSound()} style={{ padding: "1px 6px", fontSize: "0.72rem", background: "rgba(59, 130, 246, 0.15)", border: "none", borderRadius: "4px", color: "var(--primary)", cursor: "pointer" }}>Thử</button>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Phát âm chuông khi có nhắc nhở</div>
            </div>
            <input
              type="checkbox"
              checked={notifySound}
              onChange={(e) => setNotifySound(e.target.checked)}
              style={{ width: "20px", height: "20px", cursor: "pointer" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>⏰ Nhắc trước mặc định</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Khi tạo mới sự kiện</div>
            </div>
            <select
              value={notifyLeadTime}
              onChange={(e) => setNotifyLeadTime(Number(e.target.value))}
              style={{ padding: "6px 10px", fontSize: "0.82rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}
            >
              {LEAD_TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <button type="button" className="btn-primary" onClick={handleSaveNotifySettings} disabled={updatingNotify}>
              {updatingNotify ? "⏳ Đang lưu..." : "💾 Lưu Cài Đặt Chung"}
            </button>
          </div>
        </div>

        {/* Danh sách từng sự kiện */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <h4 style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-main)", margin: 0 }}>
              📅 Bật/Tắt & Chọn Số Phút Nhắc Cho Từng Sự Kiện ({filteredEvents.length})
            </h4>

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="🔍 Tìm kiếm sự kiện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: "6px 12px", fontSize: "0.82rem", borderRadius: "8px", border: "1px solid var(--border-color)", width: "180px" }}
              />
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                style={{ padding: "6px 10px", fontSize: "0.82rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}
              >
                <option value="all">Tất cả</option>
                <option value="hoc-tap">📚 Học tập</option>
                <option value="tap-luyen">🏋️ Tập luyện</option>
                <option value="deadline">⏰ Deadline</option>
                <option value="ca-nhan">☕ Cá nhân</option>
                <option value="cong-viec">💼 Công việc</option>
              </select>
            </div>
          </div>

          {loadingEvents ? (
            <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>⏳ Đang tải danh sách sự kiện...</div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>Không có sự kiện nào. Hãy thêm sự kiện trên trang Lịch!</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
              {filteredEvents.map((ev) => {
                const isEnabled = ev.bat_thong_bao !== false;
                const cat = EVENT_CATEGORIES[ev.loai_su_kien] || { label: "Khác", icon: "📌", color: "#3b82f6" };
                const leadMin = ev.thoi_gian_nhac_truoc !== undefined ? ev.thoi_gian_nhac_truoc : 15;

                return (
                  <div
                    key={ev._id}
                    style={{
                      background: "var(--neu-bg)",
                      border: `1px solid ${isEnabled ? "rgba(16, 185, 129, 0.3)" : "var(--border-color)"}`,
                      borderLeft: `4px solid ${ev.mau_sac || cat.color}`,
                      borderRadius: "12px",
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "8px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <div>
                        <span style={{ fontSize: "0.72rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(0,0,0,0.06)", color: "var(--text-muted)", fontWeight: 600 }}>
                          {cat.icon} {cat.label}
                        </span>
                        <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text-main)", marginTop: "4px" }}>
                          {ev.tieu_de}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          🕒 {new Date(ev.thoi_gian_bat_dau).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                      </div>

                      {/* Toggle button */}
                      <button
                        type="button"
                        onClick={() => handleToggleEventNotification(ev)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          border: `1px solid ${isEnabled ? "#10b981" : "var(--border-color)"}`,
                          background: isEnabled ? "rgba(16, 185, 129, 0.12)" : "rgba(0,0,0,0.04)",
                          color: isEnabled ? "#10b981" : "var(--text-muted)",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {isEnabled ? "🔔 Đang Bật" : "🔕 Đang Tắt"}
                      </button>
                    </div>

                    {/* Chọn số phút */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px dashed var(--border-color)", paddingTop: "8px" }}>
                      <span style={{ fontSize: "0.78rem", color: isEnabled ? "var(--text-main)" : "var(--text-muted)", fontWeight: 600 }}>
                        {isEnabled ? "⏰ Nhắc trước:" : "💤 Nhắc nhở đang tắt"}
                      </span>
                      <select
                        value={leadMin}
                        disabled={!isEnabled}
                        onChange={(e) => handleChangeLeadTime(ev, e.target.value)}
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
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "26px" }}>
        {/* Thông tin cá nhân & Giao diện */}
        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", paddingBottom: "18px", borderBottom: "1px dashed var(--border-color)" }}>
            <div className="kpi-icon" style={{ width: "64px", height: "64px", fontSize: "1.8rem" }}>
              👤
            </div>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "4px" }}>
                {user?.name || "Người Dùng"}
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                {user?.email || "Cài đặt tài khoản & tùy chọn giao diện"}
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Nguyễn Văn A" />
            </div>

            <div className="form-group">
              <label>Địa chỉ Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="example@email.com" />
            </div>

            <div className="today-event-item" style={{ margin: "24px 0", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: "800", fontSize: "0.95rem", color: "var(--text-main)" }}>Chế độ Giao diện</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Hiện tại: <span style={{ fontWeight: "700", color: "var(--primary)" }}>{theme === 'dark' ? 'Dark Mode 🌙' : 'Light Mode ☀️'}</span>
                </div>
              </div>
              <button type="button" className="btn-secondary" onClick={toggleTheme}>
                {theme === 'dark' ? '☀️ Sang Sáng' : '🌙 Sang Tối'}
              </button>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              💾 Lưu Thay Đổi
            </button>
          </form>
        </div>

        {/* Đổi mật khẩu */}
        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", paddingBottom: "18px", borderBottom: "1px dashed var(--border-color)" }}>
            <div className="kpi-icon" style={{ width: "64px", height: "64px", fontSize: "1.8rem" }}>
              🔒
            </div>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "4px" }}>
                Bảo Mật Tài Khoản
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Đổi mật khẩu định kỳ để bảo vệ tài khoản
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <div style={{ marginTop: "32px" }}>
              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                🔑 Cập Nhật Mật Khẩu
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
