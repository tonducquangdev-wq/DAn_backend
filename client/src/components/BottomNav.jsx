import React from "react";

export const BottomNav = ({ activeTab, setActiveTab, onQuickAdd }) => {
  return (
    <nav className="mobile-bottom-nav d-flex d-lg-none" id="mobileBottomNav">
      {/* 1. LỊCH */}
      <button
        className={`nav-item border-0 bg-transparent cursor-pointer ${activeTab === "calendar" ? "active" : ""}`}
        onClick={() => setActiveTab("calendar")}
      >
        <div className="nav-icon-wrapper">
          <i className="bi bi-calendar3"></i>
        </div>
        <span>Lịch</span>
      </button>

      {/* 2. MÔN HỌC */}
      <button
        className={`nav-item border-0 bg-transparent cursor-pointer ${activeTab === "study" ? "active" : ""}`}
        onClick={() => setActiveTab("study")}
      >
        <div className="nav-icon-wrapper">
          <i className="bi bi-mortarboard-fill"></i>
        </div>
        <span>Học tập</span>
      </button>

      {/* 3. CENTER FAB BUTTON */}
      <div className="nav-fab-wrapper">
        <button
          type="button"
          className="nav-fab-btn"
          title="Thêm sự kiện mới"
          onClick={() => onQuickAdd ? onQuickAdd() : setActiveTab("calendar")}
        >
          <i className="bi bi-plus-lg"></i>
        </button>
      </div>

      {/* 4. TẬP LUYỆN */}
      <button
        className={`nav-item border-0 bg-transparent cursor-pointer ${activeTab === "workout" ? "active" : ""}`}
        onClick={() => setActiveTab("workout")}
      >
        <div className="nav-icon-wrapper">
          <i className="bi bi-heart-pulse-fill"></i>
        </div>
        <span>Tập luyện</span>
      </button>

      {/* 5. HỒ SƠ */}
      <button
        className={`nav-item border-0 bg-transparent cursor-pointer ${activeTab === "profile" ? "active" : ""}`}
        onClick={() => setActiveTab("profile")}
      >
        <div className="nav-icon-wrapper">
          <i className="bi bi-person-fill"></i>
        </div>
        <span>Hồ sơ</span>
      </button>
    </nav>
  );
};
