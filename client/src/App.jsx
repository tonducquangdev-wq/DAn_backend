import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthModal } from "./components/AuthModal";
import { FloatingMenu } from "./components/FloatingMenu";
import { ProfileModal } from "./components/ProfileModal";
import { NotificationWatcher } from "./components/NotificationWatcher";

import { CalendarView } from "./views/CalendarView";
import { StudyGpaView } from "./views/StudyGpaView";
import { TutorView } from "./views/TutorView";
import { WorkoutView } from "./views/WorkoutView";
import { ProjectsView } from "./views/ProjectsView";

function MainApp() {
  const { user, loading, theme, toggleTheme } = useAuth();
  const [activeTab, setActiveTab] = useState("calendar"); // Trang đầu tiên sau khi đăng nhập là trang lịch
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (user) {
      setActiveTab("calendar");
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
    return <AuthModal />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "calendar":
        return <CalendarView />;
      case "study":
        return <StudyGpaView onNavigateToTutor={() => setActiveTab("tutors")} />;
      case "tutors":
        return <TutorView onBack={() => setActiveTab("study")} />;
      case "workout":
        return <WorkoutView onNavigateToCalendar={() => setActiveTab("calendar")} />;
      case "projects":
        return <ProjectsView />;
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
