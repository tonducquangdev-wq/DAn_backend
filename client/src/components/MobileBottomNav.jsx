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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {unreadCount > 0 && <span className="mobile-bar-dot"></span>}
        </div>
        <span className="mobile-bar-label">Hồ sơ</span>
      </button>
    </nav>
  );
};
