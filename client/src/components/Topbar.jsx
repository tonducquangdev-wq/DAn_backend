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
          className="btn btn-sm btn-outline-secondary rounded-circle p-2 border-0 d-flex align-items-center justify-content-center"
          style={{ width: "36px", height: "36px" }}
          onClick={toggleTheme}
          title={`Chuyển sang ${theme === "dark" ? "Light Mode ☀️" : "Dark Mode 🌙"}`}
        >
          <i className={`bi ${theme === "dark" ? "bi-sun-fill text-warning" : "bi-moon-stars-fill text-primary"} fs-6`}></i>
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
                className="dropdown-item py-2 d-flex align-items-center gap-2 text-danger rounded-2 mx-1 border-0 bg-transparent cursor-pointer"
                onClick={logout}
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>Đăng xuất</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};
