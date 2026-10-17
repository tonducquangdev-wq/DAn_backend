import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthModal } from "./components/AuthModal";
import { AdminLoginView } from "./views/AdminLoginView";
import { FloatingMenu } from "./components/FloatingMenu";
import { ProfileModal } from "./components/ProfileModal";
import { NotificationWatcher } from "./components/NotificationWatcher";
import { NotificationCenterDropdown } from "./components/NotificationCenterDropdown";

import { CalendarView } from "./views/CalendarView";
import { StudyGpaView } from "./views/StudyGpaView";
import { TutorView } from "./views/TutorView";
import { WorkoutView } from "./views/WorkoutView";
import { ProjectsView } from "./views/ProjectsView";
import { AdminDashboardView } from "./views/AdminDashboardView";
import { MessagesView } from "./views/MessagesView";
import { DangKyChuyenGiaModal } from "./components/DangKyChuyenGiaModal";

function MainApp() {
  const { user, loading, theme, toggleTheme, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("calendar"); // Trang đầu tiên sau khi đăng nhập là trang lịch
  const [chatPartnerId, setChatPartnerId] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDangKyModal, setShowDangKyModal] = useState(false);

  const navigateToChat = (partnerId, partnerName) => {
    setChatPartnerId(partnerId);
    setActiveTab("messages");
  };

  // Nhận diện đường dẫn vào cổng Admin Login
  const checkIsAdminPortalFromUrl = () => {
    if (typeof window === "undefined") return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path === "/admin/login" ||
      path === "/admin" ||
      hash === "#admin" ||
      hash === "#admin-login" ||
      search.includes("admin")
    );
  };

  const [isAdminPortal, setIsAdminPortal] = useState(checkIsAdminPortalFromUrl);

  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminPortal(checkIsAdminPortalFromUrl());
    };
    window.addEventListener("hashchange", handleUrlChange);
    window.addEventListener("popstate", handleUrlChange);
    return () => {
      window.removeEventListener("hashchange", handleUrlChange);
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, []);

  const navigateToAdminPortal = () => {
    setIsAdminPortal(true);
    window.location.hash = "admin-login";
  };

  const navigateToUserPortal = () => {
    setIsAdminPortal(false);
    if (window.location.hash === "#admin-login" || window.location.hash === "#admin") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === "admin" && (isAdminPortal || window.location.hash.includes("admin"))) {
        setActiveTab("admin");
      } else {
        setActiveTab("calendar");
      }
    }
  }, [user?._id]);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "var(--text-main)", background: "var(--neu-bg)" }}>
        🚀 Đang nạp hệ thống Life Planner...
      </div>
    );
  }

  if (!user) {
    if (isAdminPortal) {
      return (
        <AdminLoginView
          onBackToUserAuth={navigateToUserPortal}
          onSuccess={() => {
            setIsAdminPortal(false);
            setActiveTab("admin");
          }}
        />
      );
    }
    return <AuthModal onGoToAdminLogin={navigateToAdminPortal} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "calendar":
        return <CalendarView />;
      case "study":
        return (
          <StudyGpaView
            onNavigateToTutor={() => setActiveTab("tutors")}
            onOpenDangKyGiaSu={() => setShowDangKyModal(true)}
          />
        );
      case "tutors":
        return (
          <TutorView
            onBack={() => setActiveTab("study")}
            onOpenDangKyGiaSu={() => setShowDangKyModal(true)}
            onNavigateToChat={navigateToChat}
          />
        );
      case "workout":
        return <WorkoutView onNavigateToCalendar={() => setActiveTab("calendar")} />;
      case "messages":
        return <MessagesView initialPartnerId={chatPartnerId} />;
      case "projects":
        return <ProjectsView />;
      case "admin":
        return <AdminDashboardView onBackToApp={() => setActiveTab("calendar")} />;
      default:
        return <CalendarView />;
    }
  };

  return (
    <div className={`app-container no-sidebar ${activeTab === "calendar" ? "calendar-view-active" : ""}`}>
      {/* Top Header Bar */}
      <header className="neu-top-header">
        <div className="brand-logo-inline" onClick={() => setActiveTab("calendar")}>
          <div className="logo-icon-circle">LP</div>
          <span className="logo-title">LIFE PLANNER</span>
        </div>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* Nút truy cập Admin Portal cho Quản trị viên */}
          {user?.role === "admin" && (
            <button
              onClick={() => setActiveTab(activeTab === "admin" ? "calendar" : "admin")}
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                border: "1px solid rgba(245, 158, 11, 0.5)",
                background: activeTab === "admin" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(245, 158, 11, 0.15)",
                color: activeTab === "admin" ? "#fff" : "#f59e0b",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                transition: "all 0.2s"
              }}
              title="Mở Bảng điều khiển Quản trị viên Admin"
            >
              <span>👑</span>
              <span>{activeTab === "admin" ? "Về Ứng Dụng" : "Admin Portal"}</span>
            </button>
          )}

          {/* Huy hiệu Gia sư hoặc PT đã được xác thực */}
          {user?.role === "tutor" && (
            <span
              style={{
                padding: "0.3rem 0.7rem",
                borderRadius: "20px",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                fontSize: "0.75rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                border: "1px solid rgba(16, 185, 129, 0.3)"
              }}
              title="Tài khoản Gia sư đã được kiểm duyệt"
            >
              🎓 Gia Sư Verified
            </span>
          )}

          {user?.role === "pt" && (
            <span
              style={{
                padding: "0.3rem 0.7rem",
                borderRadius: "20px",
                background: "rgba(139, 92, 246, 0.15)",
                color: "#a78bfa",
                fontSize: "0.75rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                border: "1px solid rgba(139, 92, 246, 0.3)"
              }}
              title="Tài khoản Huấn Luyện Viên PT đã được kiểm duyệt"
            >
              🏋️ PT Verified
            </span>
          )}

          {/* Nút Đăng ký làm Gia Sư cho Sinh viên / User theo style Neumorphism */}
          {(!user?.role || user?.role === "user") && (
            <button
              onClick={() => setShowDangKyModal(true)}
              style={{
                padding: "0.42rem 0.95rem",
                borderRadius: "20px",
                border: "1px solid var(--border-color)",
                background: "var(--neu-bg)",
                color: "var(--primary)",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)",
                transition: "all 0.25s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "5px 5px 12px var(--neu-shadow-dark), -5px -5px 12px var(--neu-shadow-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)";
              }}
              title="Đăng ký trở thành Gia Sư hoặc Huấn Luyện Viên PT"
            >
              <span style={{ fontSize: "0.95rem" }}>🎓</span>
              <span className="d-none d-sm-inline">Đăng Ký Gia Sư</span>
            </button>
          )}

          {/* Nút Điều Hướng Nhanh Sang Kênh Tin Nhắn & Bạn Bè */}
          <button
            onClick={() => setActiveTab(activeTab === "messages" ? "calendar" : "messages")}
            style={{
              padding: "0.42rem 0.95rem",
              borderRadius: "20px",
              border: activeTab === "messages" ? "1px solid rgba(59, 130, 246, 0.6)" : "1px solid var(--border-color)",
              background: activeTab === "messages" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "var(--neu-bg)",
              color: activeTab === "messages" ? "#ffffff" : "var(--text-main)",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: activeTab === "messages"
                ? "0 4px 12px rgba(37, 99, 235, 0.4)"
                : "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)",
              transition: "all 0.25s ease"
            }}
            title="Mở Kênh Tin Nhắn & Bạn Bè"
          >
            <span style={{ fontSize: "0.95rem" }}>💬</span>
            <span className="d-none d-sm-inline">Tin Nhắn</span>
          </button>

          {/* Chuông Trung Tâm Thông Báo (Tất cả người dùng & Quản trị viên) */}
          <NotificationCenterDropdown />

          <button
            id="header-theme-toggle"
            className="header-theme-toggle"
            onClick={toggleTheme}
            title={theme === "dark" ? "Chuyển sang Giao diện Sáng (Light)" : "Chuyển sang Giao diện Tối (Dark)"}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <div
            className="d-none d-md-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", cursor: "pointer" }}
            onClick={() => setShowProfileModal(true)}
            title="Xem và chỉnh sửa cài đặt cá nhân & tài khoản"
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.8rem"
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "Tài khoản"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`main-wrapper full-width ${activeTab === "calendar" ? "calendar-main-wrapper" : ""}`}>
        {renderContent()}
      </main>

      {/* Bottom Right Floating Bubble Menu */}
      <FloatingMenu
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Giám sát thông báo sự kiện thời gian thực (Âm thanh & Popup) */}
      <NotificationWatcher />

      {/* Modal Cài Đặt Cá Nhân & Tài Khoản (Không chuyển trang) */}
      <ProfileModal
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenDangKyExpert={() => setShowDangKyModal(true)}
      />

      {/* Modal Nộp Hồ Sơ Đăng Ký Chuyên Gia (Gia Sư & PT) */}
      <DangKyChuyenGiaModal
        show={showDangKyModal}
        onClose={() => setShowDangKyModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
