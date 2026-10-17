import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { WorkoutCommunityChat } from "./WorkoutCommunityChat";

export const FloatingMenu = ({ activeTab, setActiveTab, onOpenProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, logout, theme, toggleTheme } = useAuth();

  const menuItems = [
    { id: "calendar", label: "Lịch & Sự Kiện", icon: "📅", color: "#3b82f6" },
    { id: "study", label: "Học Tập", icon: "🎓", color: "#8b5cf6" },
    { id: "workout", label: "Tập Luyện Gym", icon: "🏋️", color: "#10b981" },
    { id: "messages", label: "Tin Nhắn & Bạn Bè", icon: "💬", color: "#3b82f6" },
    { id: "projects", label: "Dự Án & Tasks", icon: "📋", color: "#06b6d4" },
    ...(user?.role === "admin" ? [{ id: "admin", label: "Quản Trị Admin", icon: "👑", color: "#f59e0b" }] : []),
    { id: "profile", label: "Cài Đặt Cá Nhân", icon: "⚙️", color: "#f59e0b" }
  ];

  const handleSelect = (id) => {
    if (id === "profile") {
      setIsOpen(false);
      if (onOpenProfile) {
        onOpenProfile();
      }
      return;
    }
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* CỬA SỔ CHAT TỔNG CỘNG ĐỒNG TẬP LUYỆN */}
      <WorkoutCommunityChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* CỤM BONG BÓNG ĐIỀU HƯỚNG FLOATING */}
      <div className={`neu-floating-container ${isOpen ? "is-open" : ""}`}>
        {/* POPUP MENU ĐIỀU HƯỚNG */}
        <div className="neu-floating-popup">
          <div className="neu-popup-header">
            <div 
              className="user-mini-badge"
              onClick={() => {
                setIsOpen(false);
                if (onOpenProfile) onOpenProfile();
              }}
              title="Xem và chỉnh sửa cài đặt cá nhân"
              style={{ cursor: "pointer" }}
            >
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

        {/* BONG BÓNG CHAT TỔNG TẬP LUYỆN (NẰM PHÍA TRÊN NÚT ĐIỀU HƯỚNG 🚀) */}
        {activeTab === "workout" && (
          <button
            type="button"
            className={`neu-workout-chat-bubble-btn ${isChatOpen ? "active" : ""}`}
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              if (isOpen) setIsOpen(false);
            }}
            title="Kênh Chat Tổng Tập Luyện (Cộng đồng Gym & PT)"
          >
            <span className="chat-bubble-main-icon">{isChatOpen ? "✖" : "💬"}</span>
            {!isChatOpen && <span className="chat-bubble-sub-icon">🏋️</span>}
            <span className="chat-online-pulse-dot" />
          </button>
        )}

        {/* FLOATING BUBBLE BUTTON (NÚT TÊN LỬA ĐIỀU HƯỚNG 🚀) */}
        <button
          type="button"
          className="neu-floating-bubble-btn"
          onClick={() => {
            setIsOpen(!isOpen);
            if (isChatOpen) setIsChatOpen(false);
          }}
          title="Menu điều hướng"
        >
          <span className="bubble-icon">{isOpen ? "✖" : "🚀"}</span>
        </button>
      </div>
    </>
  );
};
