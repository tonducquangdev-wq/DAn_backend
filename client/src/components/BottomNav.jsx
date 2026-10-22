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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <span>Lịch</span>
      </button>

      {/* 2. MÔN HỌC */}
      <button
        className={`nav-item border-0 bg-transparent cursor-pointer ${activeTab === "study" ? "active" : ""}`}
        onClick={() => setActiveTab("study")}
      >
        <div className="nav-icon-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* 4. TẬP LUYỆN */}
      <button
        className={`nav-item border-0 bg-transparent cursor-pointer ${activeTab === "workout" ? "active" : ""}`}
        onClick={() => setActiveTab("workout")}
      >
        <div className="nav-icon-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <span>Tập luyện</span>
      </button>

      {/* 5. HỒ SƠ */}
      <button
        className={`nav-item border-0 bg-transparent cursor-pointer ${activeTab === "profile" ? "active" : ""}`}
        onClick={() => setActiveTab("profile")}
      >
        <div className="nav-icon-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <span>Hồ sơ</span>
      </button>
    </nav>
  );
};
