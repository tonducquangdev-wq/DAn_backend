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
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("calendar");

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
        return <CalendarView />;
    }
  };

  return (
    <div className="app-container no-sidebar">
      {/* Top Header Bar */}
      <header className="neu-top-header">
        <div className="brand-logo-inline">
          <div className="logo-icon-circle">LP</div>
          <span className="logo-title">LIFE PLANNER</span>
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
