import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export const FloatingMenu = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, theme, toggleTheme } = useAuth();

  const menuItems = [
    { id: "calendar", label: "Lịch & Sự Kiện", icon: "📅", color: "#3b82f6" },
    { id: "study", label: "Học Tập", icon: "🎓", color: "#8b5cf6" },
    { id: "workout", label: "Tập Luyện Gym", icon: "🏋️", color: "#10b981" },
    { id: "projects", label: "Dự Án & Tasks", icon: "📋", color: "#06b6d4" },
    { id: "profile", label: "Cài Đặt Cá Nhân", icon: "⚙️", color: "#f59e0b" }
  ];

  const handleSelect = (id) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <div className={`neu-floating-container ${isOpen ? "is-open" : ""}`}>
      {/* POPUP MENU */}
      <div className="neu-floating-popup">
        <div className="neu-popup-header">
          <div className="user-mini-badge">
            <div className="user-avatar-small">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="user-info-small">
              <div className="user-name-text">{user?.name || "Người dùng"}</div>
              <div className="user-email-text">{user?.email || "Life Planner"}</div>
            </div>
          </div>
          <button 
            className="neu-theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? "Chuyển sang Light Mode ☀️" : "Chuyển sang Dark Mode 🌙"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="neu-menu-divider"></div>

        <nav className="neu-floating-nav">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`neu-floating-nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleSelect(item.id)}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-label">{item.label}</span>
                {isActive && <span className="nav-active-dot">●</span>}
              </button>
            );
          })}
        </nav>

        <div className="neu-menu-divider"></div>

        <button className="neu-logout-btn" onClick={logout}>
          <span>🚪 Đăng xuất</span>
        </button>
      </div>

      {/* FLOATING BUBBLE BUTTON */}
      <button
        type="button"
        className="neu-floating-bubble-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Menu điều hướng"
      >
        <span className="bubble-icon">{isOpen ? "✖" : "🚀"}</span>
      </button>
    </div>
  );
};
