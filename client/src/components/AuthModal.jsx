import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/login.css";

export const AuthModal = ({ onGoToAdminLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Có lỗi xảy ra: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await register(name, email, password);
      if (!res.success) {
        setError(res.message || "Đăng ký thất bại");
      }
    } catch (err) {
      setError("Có lỗi xảy ra: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlip = (targetLoginState) => {
    setError("");
    setIsLogin(targetLoginState);
  };

  return (
    <div className="neu-auth-wrapper">
      <div className={`flip-card-container ${!isLogin ? "is-flipped" : ""}`}>
        <div className="flip-card-inner">

          {/* FRONT PANEL: LOGIN */}
          <div className="form-panel login-panel">
            <div className="panel-header">
              <div className="neu-icon-circle">
                {/* Lock Icon */}
                <svg viewBox="0 0 24 24">
                  <path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-9h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-6-5a3 3 0 0 1 3 3v2H9V6a3 3 0 0 1 3-3z"/>
                </svg>
              </div>
              <h2 className="panel-title">Welcome</h2>
              <p className="panel-subtitle">Login to continue your journey</p>
            </div>

            {isLogin && error && (
              <div className="neu-alert-error">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="neu-form">
              <div className="neu-input-field">
                <input
                  type="email"
                  className="neu-input"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="neu-input-field">
                <input
                  type={showPassword ? "text" : "password"}
                  className="neu-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="neu-input-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  👁️
                </button>
              </div>

              <div className="neu-form-options">
                <label className="neu-checkbox-label">
                  <input
                    type="checkbox"
                    className="neu-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Chức năng quên mật khẩu đang phát triển"); }} className="neu-forgot-link">
                  Forgot Password?
                </a>
              </div>

              <button type="submit" className="neu-submit-btn" disabled={loading}>
                {loading ? "Đang xử lý..." : "Login"}
              </button>
            </form>

            <div className="panel-footer">
              <span>Don't have an account?</span>
              <button
                type="button"
                className="neu-flip-toggle-btn"
                onClick={() => toggleFlip(false)}
                title="Chuyển sang Đăng ký"
              >
                +
              </button>
            </div>

            {onGoToAdminLogin && (
              <div className="neu-admin-switch-container">
                <button
                  type="button"
                  className="neu-admin-portal-link"
                  onClick={onGoToAdminLogin}
                  title="Chuyển sang Cổng Đăng Nhập dành riêng cho Quản Trị Viên"
                >
                  <span>👑 Cổng Quản Trị Viên (Admin)</span>
                  <span>➔</span>
                </button>
              </div>
            )}
          </div>


          {/* BACK PANEL: SIGN UP */}
          <div className="form-panel signup-panel">
            <div className="panel-header">
              <div className="neu-icon-circle">
                {/* User Lock Icon */}
                <svg viewBox="0 0 24 24">
                  <path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-14 0v1h2v-1a5 5 0 0 1 10 0v1z"/>
                </svg>
              </div>
              <h2 className="panel-title">Create Account</h2>
              <p className="panel-subtitle">Sign up to manage your planner</p>
            </div>

            {!isLogin && error && (
              <div className="neu-alert-error">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="neu-form">
              <div className="neu-input-field">
                <input
                  type="text"
                  className="neu-input"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="neu-input-field">
                <input
                  type="email"
                  className="neu-input"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="neu-input-field">
                <input
                  type={showPassword ? "text" : "password"}
                  className="neu-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="neu-input-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  👁️
                </button>
              </div>

              <button type="submit" className="neu-submit-btn" disabled={loading}>
                {loading ? "Đang xử lý..." : "Sign Up"}
              </button>
            </form>

            <div className="panel-footer">
              <span>Already have an account?</span>
              <button
                type="button"
                className="neu-link-btn"
                onClick={() => toggleFlip(true)}
              >
                Login
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
