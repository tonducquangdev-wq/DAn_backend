import React, { useState } from "react";

export const FloatingMenu = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (tab) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  return (
    <div className={`floating-menu-container d-none d-lg-block ${isOpen ? "active" : ""}`} id="floatingMenuContainer">
      {/* POPUP MENU */}
      <div className="floating-menu-popup" id="floatingMenuPopup" role="menu">
        <div className="px-2 py-1 mb-1 d-flex align-items-center justify-content-between">
          <span className="fs-8 fw-bold text-uppercase text-muted letter-spacing-1">Điều hướng</span>
          <span className="badge bg-primary-subtle text-primary rounded-pill fs-8">Life Planner</span>
        </div>

        <ul className="floating-menu-list p-0 m-0 style-none">
          <li>
            <button
              className={`floating-menu-item w-100 text-start border-0 bg-transparent cursor-pointer ${activeTab === "calendar" ? "active" : ""}`}
              onClick={() => handleSelect("calendar")}
            >
              <span className="menu-item-icon bg-primary-subtle text-primary">
                <i className="bi bi-calendar3"></i>
              </span>
              <span>📅 Lịch cá nhân</span>
            </button>
          </li>

          <li>
            <button
              className={`floating-menu-item w-100 text-start border-0 bg-transparent cursor-pointer ${activeTab === "study" ? "active" : ""}`}
              onClick={() => handleSelect("study")}
            >
              <span className="menu-item-icon bg-info-subtle text-info">
                <i className="bi bi-mortarboard-fill"></i>
              </span>
              <span>📚 Báo cáo học tập</span>
            </button>
          </li>

          <li>
            <button
              className={`floating-menu-item w-100 text-start border-0 bg-transparent cursor-pointer ${activeTab === "workout" ? "active" : ""}`}
              onClick={() => handleSelect("workout")}
            >
              <span className="menu-item-icon bg-success-subtle text-success">
                <i className="bi bi-heart-pulse-fill"></i>
              </span>
              <span>🏋️ Báo cáo tập luyện</span>
            </button>
          </li>

          <li className="floating-menu-divider"></li>

          <li>
            <button
              className={`floating-menu-item w-100 text-start border-0 bg-transparent cursor-pointer ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => handleSelect("profile")}
            >
              <span className="menu-item-icon bg-secondary-subtle text-secondary">
                <i className="bi bi-person-fill-gear"></i>
              </span>
              <span>👤 Hồ sơ & Cài đặt</span>
            </button>
          </li>
        </ul>
      </div>

      {/* TOGGLE BUTTON */}
      <button
        type="button"
        className="floating-menu-btn border-0 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        title="Menu điều hướng nhanh"
      >
        <i className={`bi ${isOpen ? "bi-x-lg" : "bi-list"} icon-open`}></i>
      </button>
    </div>
  );
};
