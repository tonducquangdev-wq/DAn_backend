import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthModal } from "./components/AuthModal";
import { Sidebar } from "./components/Sidebar";

import { DashboardView } from "./views/DashboardView";
import { CalendarView } from "./views/CalendarView";
import { StudyGpaView } from "./views/StudyGpaView";
import { WorkoutView } from "./views/WorkoutView";
import { ProjectsView } from "./views/ProjectsView";
import { ProfileView } from "./views/ProfileView";

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", fontBreak: "bold" }}>
        🚀 Đang nạp hệ thống Life Planner...
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "calendar":
        return <CalendarView />;
      case "study":
        return <StudyGpaView />;
      case "workout":
        return <WorkoutView />;
      case "projects":
        return <ProjectsView />;
      case "profile":
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-wrapper">
        {renderContent()}
      </main>
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
