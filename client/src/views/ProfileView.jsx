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
        <div style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", fontWeight: "700" }}>
          {msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Thông tin cá nhân & Giao diện */}
        <div className="glass-card">
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>👤 Thông Tin Cá Nhân & Theme</h3>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Địa chỉ Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div style={{ margin: "20px 0", padding: "14px", borderRadius: "12px", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>Chế độ Giao diện</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Hiện tại: {theme === 'dark' ? 'Dark Mode 🌙' : 'Light Mode ☀️'}</div>
              </div>
              <button type="button" className="btn-secondary" onClick={toggleTheme}>Chuyển Theme</button>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>Lưu Thay Đổi</button>
          </form>
        </div>

        {/* Đổi mật khẩu */}
        <div className="glass-card">
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>🔒 Đổi Mật Khẩu Bảo Mật</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "24px" }}>Cập Nhật Mật Khẩu</button>
          </form>
        </div>
      </div>
    </div>
  );
};
