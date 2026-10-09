import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export const AuthModal = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await login(email, password);
      } else {
        res = await register(name, email, password);
      }

      if (!res.success) {
        setError(res.message);
      }
    } catch (err) {
      setError("Có lỗi xảy ra: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div className="logo-icon" style={{ width: "48px", height: "48px", margin: "0 auto 12px", background: "linear-gradient(135deg, #6366f1, #a855f7)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.5rem", fontWeight: "800" }}>
            LP
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800" }}>
            {isLogin ? "Đăng Nhập Life Planner" : "Tạo Tài Khoản Mới"}
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {isLogin ? "Quản lý cuộc sống, học tập & gym tiện lợi" : "Bắt đầu hành trình lập kế hoạch cá nhân của bạn"}
          </p>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "10px 14px", borderRadius: "10px", fontSize: "0.85rem", marginBottom: "16px" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Họ và Tên</label>
              <input type="text" placeholder="Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}

          <div className="form-group">
            <label>Địa chỉ Email</label>
            <input type="email" placeholder="example@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Mật Khẩu</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "12px", padding: "12px" }} disabled={loading}>
            {loading ? "Đang xử lý..." : isLogin ? "Đăng Nhập ngay" : "Tạo Tài Khoản"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: "700", cursor: "pointer" }}
          >
            {isLogin ? "Đăng ký ngay" : "Đăng nhập tại đây"}
          </button>
        </div>
      </div>
    </div>
  );
};
