import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthModal } from "./components/AuthModal";
import { FloatingMenu } from "./components/FloatingMenu";

import { CalendarView } from "./views/CalendarView";
import { StudyGpaView } from "./views/StudyGpaView";
import { TutorView } from "./views/TutorView";
import { WorkoutView } from "./views/WorkoutView";
import { ProjectsView } from "./views/ProjectsView";
import { ProfileView } from "./views/ProfileView";

function MainApp() {
  const { user, loading, theme, toggleTheme } = useAuth();
  const [activeTab, setActiveTab] = useState("workout"); // Default to workout for focus or user choice

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
      case "profile":
        return <ProfileView />;
      default:
        return <WorkoutView />;
    }
  };

  return (
    <div className="app-container no-sidebar">
      {/* Top Header Bar */}
      <header className="neu-top-header">
        <div className="brand-logo-inline" onClick={() => setActiveTab("calendar")}>
          <div className="logo-icon-circle">LP</div>
          <span className="logo-title">LIFE PLANNER</span>
        </div>

        {/* Header Nav Pills */}
        <nav className="header-nav-pills" aria-label="Main Navigation">
          <button
            className={`header-nav-btn ${activeTab === "calendar" ? "active" : ""}`}
            onClick={() => setActiveTab("calendar")}
          >
            <span>📅</span> Lịch & Sự Kiện
          </button>
          <button
            className={`header-nav-btn ${activeTab === "study" ? "active" : ""}`}
            onClick={() => setActiveTab("study")}
          >
            <span>🎓</span> Học Tập & GPA
          </button>
          <button
            className={`header-nav-btn ${activeTab === "workout" ? "active" : ""}`}
            onClick={() => setActiveTab("workout")}
          >
            <span>🏋️</span> Thể Chất & Gym
          </button>
          <button
            className={`header-nav-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span>👤</span> Hồ Sơ
          </button>
        </nav>

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
            style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}
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
      <main className="main-wrapper full-width">
        {renderContent()}
      </main>

      {/* Bottom Right Floating Bubble Menu */}
      <FloatingMenu activeTab={activeTab} setActiveTab={setActiveTab} />
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
