import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const MobileBottomNav = ({ activeTab, setActiveTab, onOpenProfile }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQuickSheet, setShowQuickSheet] = useState(false);

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
    setShowQuickSheet(false);
    if (tabId === "profile") {
      if (onOpenProfile) onOpenProfile();
      return;
    }
    setActiveTab(tabId);
  };

  const handleQuickAction = (tabId) => {
    setShowQuickSheet(false);
    setActiveTab(tabId);
  };

  return (
    <>
      {/* Quick Action Sheet khi bấm nút + ở giữa */}
      {showQuickSheet && (
        <div
          className="mobile-quick-sheet-overlay"
          onClick={() => setShowQuickSheet(false)}
        >
          <div
            className="mobile-quick-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-quick-sheet-header">
              <span className="mobile-quick-sheet-title">✨ Tạo Mới Nhanh</span>
              <button
                type="button"
                className="mobile-quick-sheet-close"
                onClick={() => setShowQuickSheet(false)}
              >
                ✕
              </button>
            </div>

            <div className="mobile-quick-sheet-grid">
              <button
                type="button"
                className="mobile-quick-sheet-btn"
                onClick={() => handleQuickAction("calendar")}
              >
                <div className="quick-btn-icon" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                  <i className="bi bi-calendar-plus"></i>
                </div>
                <span>Thêm Sự Kiện Lịch</span>
              </button>

              <button
                type="button"
                className="mobile-quick-sheet-btn"
                onClick={() => handleQuickAction("study")}
              >
                <div className="quick-btn-icon" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>
                  <i className="bi bi-mortarboard-fill"></i>
                </div>
                <span>Học Tập & Bài Tập</span>
              </button>

              <button
                type="button"
                className="mobile-quick-sheet-btn"
                onClick={() => handleQuickAction("workout")}
              >
                <div className="quick-btn-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                  <i className="bi bi-heart-pulse-fill"></i>
                </div>
                <span>Kế Hoạch Tập Luyện</span>
              </button>

              <button
                type="button"
                className="mobile-quick-sheet-btn"
                onClick={() => handleQuickAction("messages")}
              >
                <div className="quick-btn-icon" style={{ background: "rgba(37, 99, 235, 0.15)", color: "#2563eb" }}>
                  <i className="bi bi-chat-dots-fill"></i>
                </div>
                <span>Tin Nhắn Bạn Bè</span>
                {unreadCount > 0 && <span className="quick-badge">{unreadCount}</span>}
              </button>

              <button
                type="button"
                className="mobile-quick-sheet-btn"
                onClick={() => handleQuickAction("projects")}
              >
                <div className="quick-btn-icon" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" }}>
                  <i className="bi bi-briefcase-fill"></i>
                </div>
                <span>Ca Làm & Dự Án</span>
              </button>

              {user?.role === "admin" && (
                <button
                  type="button"
                  className="mobile-quick-sheet-btn"
                  onClick={() => handleQuickAction("admin")}
                >
                  <div className="quick-btn-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                    <i className="bi bi-shield-lock-fill"></i>
                  </div>
                  <span>Admin Portal</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar chuẩn theo hình ảnh mẫu */}
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

        {/* 3. NÚT TRÒN GIỮA (FAB) NỔI BẬT */}
        <div className="mobile-bar-fab-container">
          <button
            type="button"
            className={`mobile-bar-fab-btn ${showQuickSheet ? "fab-open" : ""}`}
            onClick={() => setShowQuickSheet((prev) => !prev)}
            aria-label="Tạo mới nhanh"
            title="Tạo mới nhanh"
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
    </>
  );
};
