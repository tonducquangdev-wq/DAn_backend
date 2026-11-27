import React from "react";
import { useAuth } from "../context/AuthContext";

export const Topbar = ({ activeTab, setActiveTab, setMobileOpen }) => {
  const { user, logout, theme, toggleTheme } = useAuth();

  const titleMap = {
    calendar: "Lịch Cá Nhân & Sự Kiện",
    projects: "Công Việc & Dự Án",
    study: "Quản Lý Học Tập",
    tutors: "Tìm Kiếm Gia Sư Hỗ Trợ",
    workout: "Rèn Luyện Thể Chất & Gym",
    profile: "Cài Đặt Cá Nhân & Tài Khoản"
  };

  const title = titleMap[activeTab] || "Life Planner";

  return (
    <header className="top-header">
      {/* LEFT: Toggle, Back button & Page Title */}
      <div className="topbar-left d-flex align-items-center gap-2 gap-sm-3">
        <button
          className="btn btn-light rounded-3 p-1.5 px-2.5 border-0 shadow-2xs topbar-sidebar-toggle d-lg-none"
          onClick={() => setMobileOpen && setMobileOpen(true)}
          type="button"
          title="Mở Menu danh mục"
        >
          <i className="bi bi-list fs-5 text-dark"></i>
        </button>

        {activeTab !== "calendar" && (
          <button
            className="btn-back-to-calendar border-0 bg-transparent cursor-pointer"
            onClick={() => setActiveTab("calendar")}
            title="Quay lại giao diện Lịch chính"
          >
            <i className="bi bi-arrow-left"></i>
            <span className="d-none d-sm-inline">Quay lại Lịch</span>
          </button>
        )}

        <div className="page-title-box d-flex align-items-center gap-2">
          <h5 className="fw-bold topbar-title mb-0">{title}</h5>
        </div>
      </div>

      {/* CENTER: SEARCH BOX */}
      <div className="topbar-center d-none d-md-block">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input type="text" className="form-control" placeholder="Tìm kiếm công việc, môn học, bài tập..." />
        </div>
      </div>

      {/* RIGHT: THEME TOGGLE & USER PROFILE */}
      <div className="topbar-right header-actions d-flex align-items-center gap-2 gap-sm-3">
        {/* Theme toggle button */}
        <button
          className="d-flex align-items-center p-0"
          onClick={toggleTheme}
          title={`Chuyển sang ${theme === "dark" ? "Light Mode ☀️" : "Dark Mode 🌙"}`}
          style={{ background: "transparent", border: "none" }}
        >
          <div
            style={{
              width: "56px",
              height: "28px",
              borderRadius: "9999px",
              position: "relative",
              background: "var(--neu-bg)",
              border: "1px solid var(--border-color)",
              boxShadow:
                "inset 2px 2px 4px var(--neu-inset-dark), inset -2px -2px 4px var(--neu-inset-light)",
              transition: "background 0.3s ease"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "3px",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: theme === "dark" ? "#fbbf24" : "#6366f1",
                boxShadow:
                  "2px 2px 6px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)",
                transform: `translate(${theme === "dark" ? "28px" : "0px"}, -50%)`,
                transition: "transform 300ms ease-out, background 300ms ease"
              }}
            >
              <i
                className={theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill"}
                style={{ fontSize: "12px", color: "#ffffff", lineHeight: 1 }}
              />
            </div>
          </div>
        </button>

        {/* User Profile */}
        <div className="user-profile dropdown">
          <button
            className="d-flex align-items-center gap-2 text-decoration-none bg-transparent border-0 cursor-pointer topbar-user-link dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <div className="user-avatar rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="d-none d-lg-block text-start user-meta">
              <div className="fw-bold fs-7 leading-tight user-display-name text-truncate">
                {user?.name || "Người dùng"}
              </div>
              <small className="text-muted fs-8 user-email text-truncate">
                {user?.email || "user@lifeplanner.local"}
              </small>
            </div>
          </button>

          <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 py-2 mt-2">
            <li className="px-3 py-2 border-bottom d-lg-none">
              <div className="fw-bold fs-7 text-truncate">{user?.name}</div>
              <small className="text-muted fs-8 text-truncate d-block">{user?.email}</small>
            </li>
            <li>
              <button
                className="dropdown-item py-2 d-flex align-items-center gap-2 rounded-2 mx-1 border-0 bg-transparent cursor-pointer"
                onClick={() => setActiveTab("profile")}
              >
                <i className="bi bi-person text-primary"></i>
                <span>Hồ sơ cá nhân</span>
              </button>
            </li>
            <li>
              <button
                className="dropdown-item py-2 d-flex align-items-center gap-2 rounded-2 mx-1 border-0 bg-transparent cursor-pointer"
                onClick={toggleTheme}
              >
                <i className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon"} text-warning`}></i>
                <span>{theme === "dark" ? "Giao diện Sáng" : "Giao diện Tối"}</span>
              </button>
            </li>
            <li><hr className="dropdown-divider my-1" /></li>
            <li>
              <button
                className="d-flex align-items-center gap-2 border-0 cursor-pointer"
                onClick={logout}
                title="Đăng xuất"
                style={{
                  borderRadius: "12px",
                  padding: "6px 14px",
                  background: "var(--neu-bg)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-main)",
                  boxShadow:
                    "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
                  e.currentTarget.style.color = "#ef4444";
                  e.currentTarget.style.boxShadow = "inset 2px 2px 5px rgba(239,68,68,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--neu-bg)";
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.color = "var(--text-main)";
                  e.currentTarget.style.boxShadow =
                    "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)";
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.boxShadow =
                    "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.boxShadow =
                    "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)";
                }}
              >
                <i className="bi bi-box-arrow-right" style={{ fontSize: "16px" }}></i>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap" }}>Thoát</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};
