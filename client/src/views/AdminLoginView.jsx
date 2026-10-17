import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const DEFAULT_ADMIN = {
  email: "admin@lifeplanner.com",
  password: "admin123456"
};

const STORAGE_KEY = "life_planner_admin_saved_creds";

export const AdminLoginView = ({ onBackToUserAuth, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [quickFillFeedback, setQuickFillFeedback] = useState("");
  const [hasCustomSaved, setHasCustomSaved] = useState(false);

  const { adminLogin, theme, toggleTheme } = useAuth();

  // Kiểm tra xem đã có tài khoản lưu trước đó chưa
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email && parsed.password) {
          setHasCustomSaved(true);
        }
      }
    } catch (e) {}
  }, []);

  // Lấy tài khoản cần nạp (ưu tiên tài khoản do admin tự lưu, nếu chưa có thì dùng mặc định)
  const getSavedCredentials = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email && parsed.password) {
          return { ...parsed, isCustom: true };
        }
      }
    } catch (e) {}
    return { ...DEFAULT_ADMIN, isCustom: false };
  };

  // Nạp dữ liệu tự động vào ô email và password
  const handleQuickFill = () => {
    const creds = getSavedCredentials();
    setEmail(creds.email);
    setPassword(creds.password);
    setError("");
    setQuickFillFeedback(
      `✨ Đã nạp tài khoản [${creds.email}]! Chỉ cần ấn "Đăng Nhập Quản Trị" nữa là xong.`
    );
    setTimeout(() => {
      setQuickFillFeedback("");
    }, 5000);
  };

  // Lưu tài khoản & mật khẩu đang nhập
  const handleSaveCredentials = () => {
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập Email và Mật khẩu vào ô bên dưới trước khi bấm Lưu!");
      return;
    }
    try {
      const credsToSave = {
        email: email.trim(),
        password: password.trim(),
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credsToSave));
      setHasCustomSaved(true);
      setError("");
      setQuickFillFeedback(`💾 Đã lưu TK/MK của "${email}"! Lần sau chỉ cần bấm "Nạp Dữ Liệu" là tự điền ngay.`);
      setTimeout(() => {
        setQuickFillFeedback("");
      }, 5000);
    } catch (e) {
      setError("Không thể lưu vào bộ nhớ trình duyệt: " + e.message);
    }
  };

  // Khôi phục tài khoản Admin mặc định
  const handleResetToDefault = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasCustomSaved(false);
      setEmail(DEFAULT_ADMIN.email);
      setPassword(DEFAULT_ADMIN.password);
      setError("");
      setQuickFillFeedback("🔄 Đã khôi phục tài khoản Admin mặc định (admin@lifeplanner.com).");
      setTimeout(() => {
        setQuickFillFeedback("");
      }, 4000);
    } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setQuickFillFeedback("");
    setLoading(true);

    try {
      const res = await adminLogin(email, password);
      if (res.success) {
        setSuccessMsg("Xác thực Quản Trị Viên thành công! Đang chuyển hướng vào Trung tâm điều hành...");
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 600);
      } else {
        setError(res.message || "Đăng nhập cổng Quản trị thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối hệ thống Quản trị: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      {/* Background Decorator Lights */}
      <div className="admin-glow-orb orb-1"></div>
      <div className="admin-glow-orb orb-2"></div>

      {/* Top Bar with Back Link & Theme Toggle */}
      <div className="admin-top-nav">
        <button
          type="button"
          onClick={onBackToUserAuth}
          className="admin-back-btn"
          title="Quay lại Cổng Đăng Nhập Học Viên / Người Dùng"
        >
          <span>←</span>
          <span>Cổng Người Dùng</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="admin-theme-btn"
          title="Đổi giao diện Sáng / Tối"
        >
          {theme === "dark" ? "☀️ Sáng" : "🌙 Tối"}
        </button>
      </div>

      {/* Central Card */}
      <div className="admin-card-container">
        <div className="admin-card">
          {/* Header */}
          <div className="admin-card-header">
            <div className="admin-shield-icon">
              <span className="crown-badge">👑</span>
              <svg viewBox="0 0 24 24" className="shield-svg">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.54-3.08 8.79-7 9.92-3.92-1.13-7-5.38-7-9.92V6.3l7-3.12z"/>
                <path d="M12 6.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z" opacity="0.6"/>
              </svg>
            </div>

            <div className="admin-badge-pill">
              <span className="pulsing-dot"></span>
              <span>ADMIN SECURITY VAULT</span>
            </div>

            <h1 className="admin-title">CỔNG QUẢN TRỊ VIÊN</h1>
            <p className="admin-subtitle">Trung tâm kiểm soát & phân quyền hệ thống Life Planner</p>
          </div>

          {/* Quick Credential Actions Bar (Nạp dữ liệu & Lưu TK/MK) */}
          <div className="admin-quick-fill-box">
            <div className="quick-fill-header">
              <div className="quick-fill-title">
                <span className="icon">⚡</span>
                <span>Nạp & Lưu Tài Khoản Admin</span>
              </div>
              <span className="quick-fill-badge">Tiện ích</span>
            </div>

            <div className="quick-fill-actions">
              <button
                type="button"
                className="btn-quick-fill-main"
                onClick={handleQuickFill}
                title="Bấm để tự động điền Email và Mật khẩu của Admin vào form"
              >
                <span>🔑</span>
                <span>Nạp Dữ Liệu Admin</span>
              </button>

              <button
                type="button"
                className="btn-quick-fill-secondary"
                onClick={handleSaveCredentials}
                title="Lưu Email & Mật khẩu bạn đang nhập để nạp cho các lần đăng nhập sau"
              >
                <span>💾</span>
                <span>Lưu TK/MK</span>
              </button>

              {hasCustomSaved && (
                <button
                  type="button"
                  className="btn-quick-fill-icon"
                  onClick={handleResetToDefault}
                  title="Khôi phục tài khoản Admin mặc định hệ thống"
                >
                  <span>🔄</span>
                </button>
              )}
            </div>

            {quickFillFeedback && (
              <div className="quick-fill-feedback-msg">
                {quickFillFeedback}
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="admin-alert admin-alert-danger">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <strong>Truy cập bị từ chối</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="admin-alert admin-alert-success">
              <div className="alert-icon">✅</div>
              <div className="alert-content">
                <strong>Chào mừng Quản trị viên</strong>
                <p>{successMsg}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-field-group">
              <label className="admin-label">Email Quản Trị Hệ Thống</label>
              <div className="admin-input-box">
                <span className="input-prefix-icon">📧</span>
                <input
                  type="email"
                  className="admin-input"
                  placeholder="admin@lifeplanner.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="admin-field-group">
              <label className="admin-label">Mật Khẩu Cấp Cao</label>
              <div className="admin-input-box">
                <span className="input-prefix-icon">🔑</span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="admin-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="admin-eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            <div className="admin-form-meta">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Duy trì phiên bảo mật</span>
              </label>

              <span className="security-tag" title="Phiên làm việc được mã hóa JWT 256-bit">
                🔒 256-bit SSL
              </span>
            </div>

            <button
              type="submit"
              className="admin-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border-sm"></span>
                  <span>Đang xác thực bảo mật...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Đăng Nhập Quản Trị</span>
                  <span>➔</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice Footer */}
          <div className="admin-card-footer">
            <div className="security-notice">
              <span className="notice-icon">🛡️</span>
              <p>
                Khu vực giới hạn đặc quyền. Chỉ tài khoản Quản Trị Viên (Role: Admin) mới được phép đăng nhập. Mọi nỗ lực truy cập bất hợp pháp đều được lưu lại.
              </p>
            </div>

            <div className="admin-alt-action">
              <span>Bạn là học viên hoặc chuyên gia?</span>
              <button
                type="button"
                onClick={onBackToUserAuth}
                className="admin-switch-link"
              >
                Vào Cổng Học Viên ➔
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
