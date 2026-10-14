import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const WEEKDAYS = [
  { id: 2, label: "T2", defaultTitle: "Push (Ngực, Vai, Tay sau)", isRest: false },
  { id: 3, label: "T3", defaultTitle: "Nghỉ", isRest: true, hasDot: true },
  { id: 4, label: "T4", defaultTitle: "Pull (Lưng, Xô, Tay trước)", isRest: false },
  { id: 5, label: "T5", defaultTitle: "Nghỉ", isRest: true },
  { id: 6, label: "T6", defaultTitle: "Legs & Core (Đùi, Mông, Bụng)", isRest: false },
  { id: 7, label: "T7", defaultTitle: "Nghỉ", isRest: true },
  { id: 8, label: "CN", defaultTitle: "Nghỉ", isRest: true }
];

const DEFAULT_EXERCISES_BY_DAY = {
  2: [
    { id: "p1", name: "Barbell Bench Press", setsReps: "4 sets × 8–10 reps", muscle: "Ngực" },
    { id: "p2", name: "Incline Dumbbell Press", setsReps: "3 sets × 10–12 reps", muscle: "Ngực" },
    { id: "p3", name: "Dumbbell Lateral Raise", setsReps: "4 sets × 12–15 reps", muscle: "Vai" },
    { id: "p4", name: "Triceps Rope Pushdown", setsReps: "3 sets × 12–15 reps", muscle: "Tay sau" }
  ],
  4: [
    { id: "l1", name: "Barbell Deadlift", setsReps: "4 sets × 6–8 reps", muscle: "Lưng" },
    { id: "l2", name: "Lat Pulldown", setsReps: "3 sets × 10–12 reps", muscle: "Xô" },
    { id: "l3", name: "Seated Cable Row", setsReps: "3 sets × 10–12 reps", muscle: "Lưng giữa" },
    { id: "l4", name: "Barbell Bicep Curl", setsReps: "3 sets × 10–12 reps", muscle: "Tay trước" }
  ],
  6: [
    { id: "c1", name: "Barbell Back Squat", setsReps: "4 sets × 8–10 reps", muscle: "Đùi trước" },
    { id: "c2", name: "Romanian Deadlift", setsReps: "3 sets × 10–12 reps", muscle: "Đùi sau / Mông" },
    { id: "c3", name: "Leg Press", setsReps: "3 sets × 12–15 reps", muscle: "Đùi" },
    { id: "c4", name: "Hanging Leg Raise", setsReps: "3 sets × 15–20 reps", muscle: "Bụng" }
  ]
};

export const WorkoutView = ({ onNavigateToCalendar }) => {
  const { user } = useAuth();

  // Dữ liệu API
  const [scheduleData, setScheduleData] = useState(null);
  const [reportData, setReportData] = useState(null);

  // Điều hướng & Chọn ngày trong tuần (T2..CN)
  const [selectedDay, setSelectedDay] = useState(2);
  const [activeSubTab, setActiveSubTab] = useState("today"); // 'today' | 'plans' | 'history'
  const [searchKeyword, setSearchKeyword] = useState("");

  // Checklist bài tập
  const [checkedItems, setCheckedItems] = useState({});
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);

  // Đồng hồ bấm giờ (Stopwatch)
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Modals & Thông báo
  const [toastMsg, setToastMsg] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Nạp dữ liệu từ backend
  const loadWorkout = () => {
    api.getWorkoutSchedule().then((res) => {
      if (res.success && res.data) {
        setScheduleData(res.data);
      }
    });
    api.getWorkoutReport().then((res) => {
      if (res.success && res.data) {
        setReportData(res.data);
      }
    });
  };

  useEffect(() => {
    loadWorkout();
  }, []);

  // Xử lý đếm giờ tập
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const formatStopwatch = (totalSec) => {
    const pad = (n) => String(n).padStart(2, "0");
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Lấy danh sách bài tập cho ngày đang chọn
  const currentExercises = DEFAULT_EXERCISES_BY_DAY[selectedDay] || [];
  const currentDayInfo = WEEKDAYS.find((w) => w.id === selectedDay) || WEEKDAYS[0];

  // Tính số lượng và phần trăm hoàn thành checklist
  const totalCount = currentExercises.length;
  const completedCount = currentExercises.filter((ex) => checkedItems[ex.id]).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Toggle checklist
  const handleToggleCheck = (id) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      return next;
    });
  };

  // Làm mới checklist
  const handleResetChecklist = () => {
    setCheckedItems({});
    setActiveExerciseIndex(0);
    showToast("Đã làm mới checklist bài tập cho buổi này.");
  };

  // Bài tiếp theo
  const handleNextExercise = () => {
    if (currentExercises.length === 0) return;
    if (activeExerciseIndex < currentExercises.length - 1) {
      setActiveExerciseIndex((prev) => prev + 1);
      // Đánh dấu bài trước đó hoàn thành
      const curEx = currentExercises[activeExerciseIndex];
      if (curEx) {
        setCheckedItems((prev) => ({ ...prev, [curEx.id]: true }));
      }
    } else {
      showToast("Bạn đã đến bài tập cuối cùng trong buổi!");
    }
  };

  // Hoàn thành buổi tập
  const handleFinishWorkout = async () => {
    const minutes = Math.max(1, Math.round(timerSeconds / 60) || 45);
    const res = await api.completeWorkout({
      buoi_tap_id: null,
      thoi_gian_tap_phut: minutes,
      ghi_chu: `Hoàn thành buổi tập ${currentDayInfo.defaultTitle}`
    });

    setIsTimerRunning(false);
    showToast(res.message || "🎉 Chúc mừng! Bạn đã hoàn thành xuất sắc buổi tập hôm nay!");
    loadWorkout();
  };

  // Bắt đầu / Tạm dừng đồng hồ
  const handleToggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  // Chia sẻ
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast("🔗 Đã sao chép liên kết chia sẻ tiến độ tập luyện!");
  };

  const activeExerciseObj = currentExercises[activeExerciseIndex];

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#ffffff",
            padding: "14px 22px",
            borderRadius: "14px",
            boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
            fontWeight: "600",
            fontSize: "0.92rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "fadeIn 0.3s ease"
          }}
        >
          <span>✨</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER: Breadcrumb + Search + User Profile */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "20px"
        }}
      >
        {/* Left: Breadcrumb Back */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onNavigateToCalendar && onNavigateToCalendar()}
            style={{
              padding: "7px 16px",
              borderRadius: "12px",
              fontSize: "0.85rem",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            ← Quay lại Lịch
          </button>
          <span style={{ fontWeight: "800", fontSize: "0.98rem", color: "var(--text-main)" }}>
            Theo dõi Thể chất
          </span>
        </div>

        {/* Center: Search input */}
        <div style={{ flex: "1", maxWidth: "380px", minWidth: "240px" }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm bài tập, lịch trình..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 18px",
              borderRadius: "20px",
              border: "1px solid rgba(0,0,0,0.06)",
              background: "var(--neu-bg)",
              boxShadow: "var(--neu-shadow-inset)",
              fontSize: "0.86rem",
              color: "var(--text-main)",
              outline: "none"
            }}
          />
        </div>

        {/* Right: User Profile Widget */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "0.88rem",
              boxShadow: "0 4px 10px rgba(59, 130, 246, 0.35)"
            }}
          >
            {user?.ho_ten ? user.ho_ten.slice(0, 2).toUpperCase() : "TQ"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.2" }}>
            <span style={{ fontWeight: "800", fontSize: "0.88rem", color: "var(--text-main)" }}>
              {user?.ho_ten || "Tôn Đức Quang"}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {user?.email || "quang@gmail.com"}
            </span>
          </div>
        </div>
      </div>

      {/* PAGE TITLE BAR & ACTION BUTTONS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "22px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              boxShadow: "var(--neu-shadow-sm)"
            }}
          >
            ❤️
          </div>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "900", margin: 0, color: "var(--text-main)" }}>
              Tập luyện
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "0.86rem", color: "var(--text-muted)" }}>
              Quản lý lịch tập, kế hoạch và theo dõi tiến độ tập luyện
            </p>
          </div>
        </div>

        {/* Buttons right */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowPlanModal(true)}
            style={{
              padding: "9px 16px",
              fontSize: "0.85rem",
              fontWeight: "700",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4f46e5, #6366f1)"
            }}
          >
            + Tạo kế hoạch
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowCustomizeModal(true)}
            style={{ padding: "9px 14px", fontSize: "0.85rem", fontWeight: "700", borderRadius: "12px" }}
          >
            ✏️ Tùy chỉnh buổi tập
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowReportModal(true)}
            style={{ padding: "9px 14px", fontSize: "0.85rem", fontWeight: "700", borderRadius: "12px" }}
          >
            📊 Báo cáo
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowCommunityModal(true)}
            style={{ padding: "9px 14px", fontSize: "0.85rem", fontWeight: "700", borderRadius: "12px" }}
          >
            👥 Cộng đồng Gymer
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleShare}
            style={{ padding: "9px 14px", fontSize: "0.85rem", fontWeight: "700", borderRadius: "12px" }}
          >
            🔗 Chia sẻ
          </button>
        </div>
      </div>

      {/* SUB-TABS & ACTIVE PLAN PILL */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "18px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setActiveSubTab("today")}
            style={{
              padding: "7px 18px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "800",
              border: "none",
              cursor: "pointer",
              background: activeSubTab === "today" ? "var(--neu-bg)" : "transparent",
              color: activeSubTab === "today" ? "var(--primary)" : "var(--text-muted)",
              boxShadow: activeSubTab === "today" ? "var(--neu-shadow-sm)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            ⚡ Buổi tập hôm nay
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("plans")}
            style={{
              padding: "7px 18px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "700",
              border: "none",
              cursor: "pointer",
              background: activeSubTab === "plans" ? "var(--neu-bg)" : "transparent",
              color: activeSubTab === "plans" ? "var(--primary)" : "var(--text-muted)",
              boxShadow: activeSubTab === "plans" ? "var(--neu-shadow-sm)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            📋 Kế hoạch rèn luyện (1)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("history")}
            style={{
              padding: "7px 18px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "700",
              border: "none",
              cursor: "pointer",
              background: activeSubTab === "history" ? "var(--neu-bg)" : "transparent",
              color: activeSubTab === "history" ? "var(--primary)" : "var(--text-muted)",
              boxShadow: activeSubTab === "history" ? "var(--neu-shadow-sm)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            🕒 Lịch sử hoạt động
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
          <span style={{ color: "var(--text-muted)", fontWeight: "600" }}>Kế hoạch áp dụng:</span>
          <span
            style={{
              background: "#3b82f6",
              color: "#ffffff",
              padding: "4px 14px",
              borderRadius: "14px",
              fontWeight: "800",
              fontSize: "0.82rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 3px 10px rgba(59, 130, 246, 0.35)"
            }}
          >
            🏷️ Push – Pull – Legs (PPL Cơ bản)
          </span>
        </div>
      </div>

      {/* LỊCH TUẦN (WEEKLY SCHEDULE RIBBON) */}
      <div
        className="glass-card"
        style={{
          padding: "16px 20px",
          marginBottom: "24px",
          borderRadius: "18px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <span
            style={{
              background: "rgba(59, 130, 246, 0.12)",
              color: "var(--primary)",
              padding: "4px 12px",
              borderRadius: "10px",
              fontWeight: "800",
              fontSize: "0.82rem"
            }}
          >
            📅 Lịch tuần
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600" }}>
            Phân bổ rèn luyện:
          </span>
        </div>

        {/* 7 Cột Ngày Trong Tuần */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: "10px"
          }}
        >
          {WEEKDAYS.map((w) => {
            const isSelected = selectedDay === w.id;
            return (
              <div
                key={w.id}
                onClick={() => setSelectedDay(w.id)}
                style={{
                  background: isSelected
                    ? "rgba(99, 102, 241, 0.08)"
                    : "var(--neu-bg)",
                  border: isSelected
                    ? "2px solid #6366f1"
                    : "1px solid rgba(0,0,0,0.06)",
                  borderRadius: "14px",
                  padding: "12px 10px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected
                    ? "0 4px 14px rgba(99, 102, 241, 0.2)"
                    : "var(--neu-shadow-sm)",
                  position: "relative",
                  minHeight: "76px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      fontWeight: "800",
                      fontSize: "0.9rem",
                      color: isSelected ? "#4f46e5" : "var(--text-main)"
                    }}
                  >
                    {w.label}
                  </span>
                  {w.hasDot && (
                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "#10b981",
                        display: "inline-block"
                      }}
                    />
                  )}
                </div>

                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: isSelected ? "700" : "600",
                    color: w.isRest ? "var(--text-muted)" : (isSelected ? "#4f46e5" : "var(--text-main)"),
                    marginTop: "6px",
                    lineHeight: "1.3"
                  }}
                >
                  {w.isRest ? "☕ Nghỉ" : w.defaultTitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NỘI DUNG CHÍNH (2 CỘT: TIẾN ĐỘ & CHECKLIST / ĐỒNG HỒ TẬP) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 0.95fr",
          gap: "24px",
          alignItems: "start",
          marginBottom: "26px"
        }}
      >
        {/* CỘT TRÁI */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card: Tiến độ buổi tập */}
          <div className="glass-card" style={{ padding: "18px 22px", borderRadius: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.3rem" }}>🏆</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: "800", fontSize: "0.88rem", letterSpacing: "0.5px" }}>
                      TIẾN ĐỘ BUỔI TẬP:
                    </span>
                    <span
                      style={{
                        background: "#3b82f6",
                        color: "#ffffff",
                        padding: "2px 10px",
                        borderRadius: "8px",
                        fontWeight: "800",
                        fontSize: "0.78rem"
                      }}
                    >
                      {currentDayInfo.isRest ? "Nghỉ" : currentDayInfo.defaultTitle.split(" ")[0]}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Đánh dấu bài tập trong checklist để cập nhật tiến độ thực tế
                  </p>
                </div>
              </div>

              <span style={{ fontWeight: "800", fontSize: "0.85rem", color: "var(--primary)" }}>
                {completedCount} / {totalCount} bài tập hoàn thành ({progressPercent}%)
              </span>
            </div>

            {/* Thanh tiến độ */}
            <div
              style={{
                width: "100%",
                height: "6px",
                background: "rgba(0,0,0,0.06)",
                borderRadius: "4px",
                overflow: "hidden",
                marginTop: "12px"
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #3b82f6, #10b981)",
                  borderRadius: "4px",
                  transition: "width 0.3s ease"
                }}
              />
            </div>
          </div>

          {/* Card: Checklist bài tập */}
          <div className="glass-card" style={{ padding: "22px", borderRadius: "18px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "rgba(59, 130, 246, 0.12)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800"
                  }}
                >
                  ☑️
                </span>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0 }}>
                    Checklist bài tập
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {completedCount} / {totalCount} bài đã hoàn thành
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    color: "var(--primary)",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "0.8rem",
                    fontWeight: "700"
                  }}
                >
                  {totalCount} bài
                </span>
                <button
                  type="button"
                  onClick={handleResetChecklist}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  🔄 Làm mới
                </button>
              </div>
            </div>

            {/* Thanh tiến độ con */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: "14px" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--primary)" }}>
                {progressPercent}%
              </span>
            </div>

            {/* Danh sách bài tập hoặc thông báo Ngày nghỉ */}
            {currentDayInfo.isRest ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  background: "var(--neu-bg)",
                  borderRadius: "14px",
                  boxShadow: "var(--neu-shadow-inset)"
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>☕</div>
                <h4 style={{ fontWeight: "800", marginBottom: "6px" }}>Hôm nay là ngày nghỉ ngơi phục hồi</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "420px", margin: "0 auto" }}>
                  Cơ bắp phát triển trong khi nghỉ ngơi. Hãy ngủ đủ giấc, bổ sung protein và uống đủ nước để nạp lại năng lượng!
                </p>
              </div>
            ) : currentExercises.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-muted)", fontStyle: "italic", padding: "20px" }}>
                Chưa có bài tập cho buổi này.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {currentExercises.map((ex, index) => {
                  const isChecked = !!checkedItems[ex.id];
                  const isActive = activeExerciseIndex === index;
                  return (
                    <div
                      key={ex.id}
                      onClick={() => setActiveExerciseIndex(index)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: "14px",
                        background: isActive ? "rgba(99, 102, 241, 0.05)" : "var(--neu-bg)",
                        border: isActive ? "1.5px solid #6366f1" : "1px solid rgba(0,0,0,0.06)",
                        boxShadow: isChecked ? "none" : "var(--neu-shadow-sm)",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleCheck(ex.id);
                          }}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                            accentColor: "#3b82f6"
                          }}
                        />
                        <span
                          style={{
                            fontWeight: "700",
                            fontSize: "0.9rem",
                            color: isChecked ? "var(--text-muted)" : "var(--text-main)",
                            textDecoration: isChecked ? "line-through" : "none"
                          }}
                        >
                          {ex.name}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            background: "rgba(59, 130, 246, 0.08)",
                            color: "#3b82f6",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontWeight: "700",
                            fontSize: "0.78rem"
                          }}
                        >
                          {ex.setsReps}
                        </span>
                        <span
                          style={{
                            background: "rgba(0,0,0,0.05)",
                            color: "var(--text-muted)",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "0.78rem"
                          }}
                        >
                          {ex.muscle}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: ĐỒNG HỒ TẬP */}
        <div className="glass-card" style={{ padding: "24px", borderRadius: "18px" }}>
          {/* Header Đồng hồ */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "800", fontSize: "1.05rem" }}>
              <span>⏱️</span>
              <span>Đồng hồ tập</span>
            </div>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: "700",
                padding: "4px 12px",
                borderRadius: "12px",
                background: isTimerRunning
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(0,0,0,0.06)",
                color: isTimerRunning ? "#059669" : "var(--text-muted)"
              }}
            >
              {isTimerRunning ? "🟢 Đang tập" : "⚫ Chưa bắt đầu"}
            </span>
          </div>

          {/* Vùng bấm giờ */}
          <div
            style={{
              textAlign: "center",
              padding: "24px 16px",
              background: "var(--neu-bg)",
              borderRadius: "16px",
              boxShadow: "var(--neu-shadow-inset)",
              marginBottom: "18px"
            }}
          >
            <div
              style={{
                fontSize: "2.8rem",
                fontWeight: "900",
                letterSpacing: "2px",
                color: "var(--text-main)",
                fontFamily: "monospace"
              }}
            >
              {formatStopwatch(timerSeconds)}
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {isTimerRunning
                ? "Thời gian rèn luyện đang được ghi nhận..."
                : 'Bấm "Bắt đầu tập" để tính thời gian rèn luyện'}
            </p>
          </div>

          {/* Hộp hiển thị bài tập hiện tại */}
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              borderRadius: "14px",
              background: "rgba(59, 130, 246, 0.04)",
              border: "1px dashed rgba(59, 130, 246, 0.2)",
              marginBottom: "18px"
            }}
          >
            {activeExerciseObj ? (
              <>
                <div style={{ fontWeight: "800", fontSize: "0.95rem", color: "var(--text-main)" }}>
                  {activeExerciseObj.name}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--primary)", fontWeight: "700", marginTop: "4px" }}>
                  {activeExerciseObj.setsReps} ({activeExerciseObj.muscle})
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: "600", fontSize: "0.88rem", color: "var(--text-muted)" }}>
                  Chưa có bài tập trong buổi này
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  -- × --
                </div>
              </>
            )}
          </div>

          {/* Nút to: Bắt đầu tập */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleToggleTimer}
            style={{
              width: "100%",
              padding: "13px",
              fontSize: "1rem",
              fontWeight: "800",
              borderRadius: "14px",
              background: isTimerRunning
                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                : "linear-gradient(135deg, #4f46e5, #3b82f6)",
              marginBottom: "10px",
              boxShadow: isTimerRunning
                ? "0 8px 20px rgba(245, 158, 11, 0.35)"
                : "0 8px 20px rgba(79, 70, 229, 0.35)"
            }}
          >
            {isTimerRunning ? "⏸ Tạm dừng tập" : "▶ Bắt đầu tập"}
          </button>

          {/* 2 nút hàng dưới: Bài tiếp theo & Hoàn thành */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "22px" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleNextExercise}
              style={{
                padding: "10px",
                fontSize: "0.84rem",
                fontWeight: "700",
                borderRadius: "12px",
                textAlign: "center"
              }}
            >
              ⏭ Bài tiếp theo
            </button>
            <button
              type="button"
              onClick={handleFinishWorkout}
              style={{
                padding: "10px",
                fontSize: "0.84rem",
                fontWeight: "800",
                borderRadius: "12px",
                background: "#10b981",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)"
              }}
            >
              ✅ Hoàn thành
            </button>
          </div>

          {/* Các buổi tập trong kế hoạch */}
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "var(--text-muted)", marginBottom: "10px", letterSpacing: "0.5px" }}>
              CÁC BUỔI TẬP TRONG KẾ HOẠCH:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setSelectedDay(2)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "10px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                  background: selectedDay === 2 ? "#3b82f6" : "var(--neu-bg)",
                  color: selectedDay === 2 ? "#ffffff" : "var(--text-main)",
                  boxShadow: selectedDay === 2 ? "0 4px 10px rgba(59, 130, 246, 0.35)" : "var(--neu-shadow-sm)"
                }}
              >
                Push (Ngực, Vai, Tay sau)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDay(4)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "10px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                  background: selectedDay === 4 ? "#3b82f6" : "var(--neu-bg)",
                  color: selectedDay === 4 ? "#ffffff" : "var(--text-main)",
                  boxShadow: selectedDay === 4 ? "0 4px 10px rgba(59, 130, 246, 0.35)" : "var(--neu-shadow-sm)"
                }}
              >
                Pull (Lưng, Xô, Tay trước)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDay(6)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "10px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                  background: selectedDay === 6 ? "#3b82f6" : "var(--neu-bg)",
                  color: selectedDay === 6 ? "#ffffff" : "var(--text-main)",
                  boxShadow: selectedDay === 6 ? "0 4px 10px rgba(59, 130, 246, 0.35)" : "var(--neu-shadow-sm)"
                }}
              >
                Legs & Core (Đùi, Mông, Bụng)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DƯỚI CÙNG: 4 THẺ THỐNG KÊ (BOTTOM KPI CARDS) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "18px"
        }}
      >
        {/* Card 1: Chuỗi rèn luyện */}
        <div className="glass-card" style={{ padding: "18px 20px", borderRadius: "18px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem"
            }}
          >
            🔥
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              CHUỖI RÈN LUYỆN
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "900", color: "var(--text-main)", marginTop: "2px" }}>
              {reportData?.chuoi_ren_luyen || 2} ngày 🔥
            </div>
          </div>
        </div>

        {/* Card 2: Buổi tập tuần này */}
        <div className="glass-card" style={{ padding: "18px 20px", borderRadius: "18px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "rgba(59, 130, 246, 0.1)",
              color: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem"
            }}
          >
            📅
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              BUỔI TẬP TUẦN NÀY
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "900", color: "var(--text-main)", marginTop: "2px" }}>
              {reportData?.buoi_tap_tuan_nay || 2} buổi
            </div>
          </div>
        </div>

        {/* Card 3: Thời gian hôm nay */}
        <div className="glass-card" style={{ padding: "18px 20px", borderRadius: "18px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "rgba(16, 185, 129, 0.1)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem"
            }}
          >
            ⏱️
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              THỜI GIAN HÔM NAY
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "900", color: "var(--text-main)", marginTop: "2px" }}>
              {reportData?.thoi_gian_hom_nay || 60} phút
            </div>
          </div>
        </div>

        {/* Card 4: Tổng tích lũy */}
        <div className="glass-card" style={{ padding: "18px 20px", borderRadius: "18px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "rgba(139, 92, 246, 0.1)",
              color: "#8b5cf6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem"
            }}
          >
            🏆
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              TỔNG TÍCH LŨY
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "900", color: "var(--text-main)", marginTop: "2px" }}>
              {reportData?.tong_tich_luy || 8} buổi
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: TẠO KẾ HOẠCH */}
      {showPlanModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "8px" }}>➕ Tạo Kế Hoạch Tập Luyện Mới</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              Chọn hoặc thiết lập giáo án thể chất cá nhân hóa phù hợp mục tiêu của bạn
            </p>
            <form onSubmit={(e) => { e.preventDefault(); setShowPlanModal(false); showToast("Đã lưu kế hoạch mới thành công!"); }}>
              <div className="form-group">
                <label>Tên kế hoạch</label>
                <input type="text" required defaultValue="Upper - Lower Split (4 Buổi)" />
              </div>
              <div className="form-group">
                <label>Mục tiêu</label>
                <select defaultValue="hypertrophy">
                  <option value="hypertrophy">Tăng cơ bắp (Hypertrophy)</option>
                  <option value="fatloss">Giảm mỡ & Săn chắc (Fat Loss)</option>
                  <option value="strength">Tăng sức mạnh (Strength)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Số buổi tập mỗi tuần</label>
                <input type="number" min="2" max="7" defaultValue="4" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPlanModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu Kế Hoạch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TÙY CHỈNH BUỔI TẬP */}
      {showCustomizeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "8px" }}>✏️ Tùy Chỉnh Buổi Tập {currentDayInfo.label}</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              Thêm bài tập mới vào danh sách cho buổi {currentDayInfo.defaultTitle}
            </p>
            <form onSubmit={(e) => { e.preventDefault(); setShowCustomizeModal(false); showToast("Đã cập nhật bài tập cho buổi!"); }}>
              <div className="form-group">
                <label>Tên bài tập mới</label>
                <input type="text" required placeholder="VD: Cable Flyes" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Số Sets</label>
                  <input type="number" defaultValue="3" min="1" max="10" />
                </div>
                <div className="form-group">
                  <label>Số Reps</label>
                  <input type="text" defaultValue="12-15" />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCustomizeModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Thêm Bài Tập</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BÁO CÁO TẬP LUYỆN & HEATMAP */}
      {showReportModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "8px" }}>📊 Báo Cáo Rèn Luyện & Tần Suất</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              Theo dõi tần suất tập luyện hàng tháng (Heatmap) và hiệu suất thể chất
            </p>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontWeight: "700", fontSize: "0.88rem", marginBottom: "8px" }}>
                Tần suất rèn luyện 30 ngày qua:
              </div>
              <div className="heatmap-grid">
                {Array.from({ length: 30 }).map((_, idx) => {
                  const dateStr = new Date(Date.now() - (29 - idx) * 86400000).toISOString().split("T")[0];
                  const lvl = reportData?.heatmap?.[dateStr] || (idx % 2 === 0 ? 2 : 0);
                  return (
                    <div
                      key={idx}
                      className={`heatmap-cell ${lvl > 0 ? `heatmap-lvl-${lvl}` : ""}`}
                      title={`${dateStr}: Mức độ ${lvl}`}
                    />
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
              <div style={{ background: "var(--neu-bg)", padding: "14px", borderRadius: "12px", boxShadow: "var(--neu-shadow-inset)" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Tổng thời gian tập</div>
                <div style={{ fontWeight: "800", fontSize: "1.1rem", color: "var(--primary)" }}>
                  {reportData?.tong_thoi_gian_phut || 360} phút
                </div>
              </div>
              <div style={{ background: "var(--neu-bg)", padding: "14px", borderRadius: "12px", boxShadow: "var(--neu-shadow-inset)" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Tổng số buổi tập</div>
                <div style={{ fontWeight: "800", fontSize: "1.1rem", color: "#10b981" }}>
                  {reportData?.tong_buoi_tap || 8} buổi
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={() => setShowReportModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CỘNG ĐỒNG GYMER */}
      {showCommunityModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "8px" }}>👥 Cộng Đồng Gymer Life Planner</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              Giao lưu chia sẻ kinh nghiệm tập luyện, dinh dưỡng và mẹo tăng cơ giảm mỡ
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div style={{ background: "var(--neu-bg)", padding: "14px", borderRadius: "12px", boxShadow: "var(--neu-shadow-inset)" }}>
                <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>💡 Tip: Tối ưu phục hồi cơ bắp</div>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Nghỉ ngơi từ 48-72 giờ giữa các buổi tập cùng một nhóm cơ giúp cơ bắp tái tạo mô tốt nhất.
                </p>
              </div>
              <div style={{ background: "var(--neu-bg)", padding: "14px", borderRadius: "12px", boxShadow: "var(--neu-shadow-inset)" }}>
                <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>🥗 Dinh dưỡng trước và sau tập</div>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Nạp tinh bột hấp thu chậm trước tập 1.5 - 2 tiếng và 20-30g protein sau buổi tập để chống dị hóa cơ.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={() => setShowCommunityModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
