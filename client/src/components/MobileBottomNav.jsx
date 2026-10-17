import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const MobileBottomNav = ({ activeTab, setActiveTab, onOpenProfile, onOpenCreateEvent }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Lấy tổng số tin nhắn chưa đọc định kỳ để hiện badge
  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await api.getTongTinNhanChuaDoc();
        if (isMounted && res.success && res.data) {
          setUnreadCount(res.data.unread_count || 0);
        }
      } catch (err) {
        // im lặng
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleTabClick = (tabId) => {
    if (tabId === "profile") {
      if (onOpenProfile) onOpenProfile();
      return;
    }
    setActiveTab(tabId);
  };

  // Nút [+] ở giữa footer: Kích hoạt trực tiếp chức năng Thêm Sự Kiện Lịch
  const handleCreateEvent = () => {
    if (activeTab !== "calendar") {
      sessionStorage.setItem("autoOpenCreateEvent", "true");
      setActiveTab("calendar");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("open-create-event-modal"));
      }, 120);
    } else {
      window.dispatchEvent(new CustomEvent("open-create-event-modal"));
    }
    if (onOpenCreateEvent) {
      onOpenCreateEvent();
    }
  };

  return (
    <nav className="mobile-bottom-nav-bar">
      {/* 1. LỊCH */}
      <button
        type="button"
        className={`mobile-bar-item ${activeTab === "calendar" ? "active" : ""}`}
        onClick={() => handleTabClick("calendar")}
        aria-label="Lịch"
      >
        <div className="mobile-bar-icon-box">
          <i className="bi bi-calendar3"></i>
        </div>
        <span className="mobile-bar-label">Lịch</span>
      </button>

      {/* 2. HỌC TẬP */}
      <button
        type="button"
        className={`mobile-bar-item ${activeTab === "study" ? "active" : ""}`}
        onClick={() => handleTabClick("study")}
        aria-label="Học tập"
      >
        <div className="mobile-bar-icon-box">
          <i className="bi bi-mortarboard-fill"></i>
        </div>
        <span className="mobile-bar-label">Học tập</span>
      </button>

      {/* 3. NÚT TRÒN GIỮA (FAB) NỔI BẬT - TRỰC TIẾP THÊM SỰ KIỆN */}
      <div className="mobile-bar-fab-container">
        <button
          type="button"
          className="mobile-bar-fab-btn"
          onClick={handleCreateEvent}
          aria-label="Thêm Sự Kiện Lịch Mới"
          title="Thêm Sự Kiện Lịch Mới"
        >
          <i className="bi bi-plus-lg"></i>
        </button>
      </div>

      {/* 4. TẬP LUYỆN */}
      <button
        type="button"
        className={`mobile-bar-item ${activeTab === "workout" ? "active" : ""}`}
        onClick={() => handleTabClick("workout")}
        aria-label="Tập luyện"
      >
        <div className="mobile-bar-icon-box">
          <i className="bi bi-heart-pulse-fill"></i>
        </div>
        <span className="mobile-bar-label">Tập luyện</span>
      </button>

      {/* 5. HỒ SƠ */}
      <button
        type="button"
        className={`mobile-bar-item ${activeTab === "profile" ? "active" : ""}`}
        onClick={() => handleTabClick("profile")}
        aria-label="Hồ sơ"
      >
        <div className="mobile-bar-icon-box">
          <i className="bi bi-person-fill"></i>
          {unreadCount > 0 && <span className="mobile-bar-dot"></span>}
        </div>
        <span className="mobile-bar-label">Hồ sơ</span>
      </button>
    </nav>
  );
};
