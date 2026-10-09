import React from "react";
import { useAuth } from "../context/AuthContext";

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout, theme, toggleTheme } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "Dashboard KPI", icon: "📊" },
    { id: "calendar", label: "Lịch & Sự Kiện", icon: "📅" },
    { id: "study", label: "Học Tập & GPA", icon: "🎓" },
    { id: "workout", label: "Tập Luyện Gym", icon: "🏋️" },
    { id: "projects", label: "Dự Án & Task", icon: "📋" },
    { id: "profile", label: "Cài Đặt Cá Nhân", icon: "⚙️" }
  ];

  return (
    <aside className="sidebar">
      <div className="brand-logo">
        <div className="logo-icon">LP</div>
        <span className="logo-text">LIFE PLANNER</span>
      </div>

      <nav className="nav-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", marginBottom: "16px" }}>
        <button
          onClick={toggleTheme}
          style={{ width: "100%", background: "transparent", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem" }}
        >
          <span>{theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
          <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>Đổi theme</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="user-mini-profile">
          <div className="avatar">{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</div>
          <div className="user-info">
            <div className="name">{user?.name}</div>
            <div className="email">{user?.email}</div>
          </div>
        </div>
        <button className="btn-logout" title="Đăng xuất" onClick={logout}>
          🚪
        </button>
      </div>
    </aside>
  );
};
