import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const ProfileView = () => {
  const { user, setUser, theme, toggleTheme } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

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

  return (
    <div>
      <div className="header-top">
        <div>
          <h1 className="page-title">⚙️ Cài Đặt Cá Nhân & Tài Khoản</h1>
          <p className="page-subtitle">Cập nhật thông tin, giao diện Dark/Light mode và bảo mật tài khoản</p>
        </div>
      </div>

      {msg && (
        <div className="glass-card" style={{ padding: "16px 20px", marginBottom: "24px", color: msg.includes("✅") ? "var(--accent-success)" : "var(--accent-danger)", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>{msg}</span>
        </div>
      )}

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
