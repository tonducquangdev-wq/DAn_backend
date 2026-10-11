import React, { useEffect, useState, useRef } from "react";
import { api } from "../services/api";
import "../styles/tap-luyen.css";

// Helper map ngày trong tuần theo chuẩn VN (2 = T2, ..., 8 = CN)
const DAYS_OF_WEEK = [
  { day: 2, label: "T2", fullName: "Thứ Hai" },
  { day: 3, label: "T3", fullName: "Thứ Ba" },
  { day: 4, label: "T4", fullName: "Thứ Tư" },
  { day: 5, label: "T5", fullName: "Thứ Năm" },
  { day: 6, label: "T6", fullName: "Thứ Sáu" },
  { day: 7, label: "T7", fullName: "Thứ Bảy" },
  { day: 8, label: "CN", fullName: "Chủ Nhật" }
];

export const WorkoutView = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState("today"); // "today" | "plans" | "history"

  // Dữ liệu từ API
  const [scheduleData, setScheduleData] = useState(null);
  const [plansList, setPlansList] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [exerciseCatalog, setExerciseCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ngày đang chọn trên Weekly Strip
  const getTodayDayNumber = () => {
    const jsDay = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    return jsDay === 0 ? 8 : jsDay + 1; // 0->8, 1->2, 2->3...
  };
  const [selectedDay, setSelectedDay] = useState(getTodayDayNumber());

  // Trạng thái bài tập & checklist
  const [completedExercises, setCompletedExercises] = useState([]);
  const [activeExercise, setActiveExercise] = useState(null);

  // Đồng hồ tập luyện (Stopwatch) & Rest timer
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchRef = useRef(null);

  const [restCountdown, setRestCountdown] = useState(0);
  const restTimerRef = useRef(null);

  // Modals state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ ten_ke_hoach: "", mo_ta: "", is_active: false });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState(null);
  const [planDetailSessions, setPlanDetailSessions] = useState([]);

  const [showAddExModal, setShowAddExModal] = useState(false);
  const [currentBuoiForEx, setCurrentBuoiForEx] = useState(null);
  const [exForm, setExForm] = useState({
    bai_tap_the_chat_id: "",
    ten_bai_tap: "",
    nhom_co: "Ngực",
    loai_bai_tap: "strength",
    so_sets: 3,
    so_reps: 10,
    thoi_luong_phut: 10
  });

  const [showEditDetailModal, setShowEditDetailModal] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [detailForm, setDetailForm] = useState({ so_sets: 3, so_reps: 10, thoi_luong_phut: "" });

  // Nạp toàn bộ dữ liệu khi khởi động
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [scheduleRes, plansRes, reportRes, catalogRes] = await Promise.all([
        api.getWorkoutSchedule(),
        api.getWorkoutPlans(),
        api.getWorkoutReport(),
        api.getExerciseCatalog()
      ]);

      if (scheduleRes.success) setScheduleData(scheduleRes.data);
      if (plansRes.success) setPlansList(plansRes.data || []);
      if (reportRes.success) setReportData(reportRes.data);
      if (catalogRes.success) setExerciseCatalog(catalogRes.data || []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu tập luyện:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Quản lý Stopwatch
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchRef.current = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    }
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [isStopwatchRunning]);

  // Quản lý Rest Countdown
  useEffect(() => {
    if (restCountdown > 0) {
      restTimerRef.current = setInterval(() => {
        setRestCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [restCountdown]);

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Xác định buổi tập của ngày đang chọn trong Kế hoạch active
  const currentSession = scheduleData?.danh_sach_buoi_tap?.find(
    (b) => b.ngay_trong_tuan === selectedDay
  );

  // Set active exercise mặc định khi đổi ngày hoặc có dữ liệu mới
  useEffect(() => {
    if (currentSession?.chi_tiet && currentSession.chi_tiet.length > 0) {
      if (!activeExercise || !currentSession.chi_tiet.some((c) => c._id === activeExercise._id)) {
        setActiveExercise(currentSession.chi_tiet[0]);
      }
    } else {
      setActiveExercise(null);
    }
  }, [selectedDay, currentSession]);

  // Checklist hoàn thành bài tập
  const toggleExerciseCheck = (detailId) => {
    setCompletedExercises((prev) =>
      prev.includes(detailId) ? prev.filter((id) => id !== detailId) : [...prev, detailId]
    );
  };

  const exerciseCount = currentSession?.chi_tiet?.length || 0;
  const completedCount = currentSession?.chi_tiet?.filter((c) =>
    completedExercises.includes(c._id)
  ).length || 0;
  const progressPercent =
    exerciseCount > 0 ? Math.round((completedCount / exerciseCount) * 100) : 0;

  // Hoàn thành buổi tập
  const handleCompleteWorkout = async () => {
    if (!currentSession) return;

    const workoutMinutes = Math.max(1, Math.round(stopwatchSeconds / 60)) || 45;
    const res = await api.completeWorkout({
      buoi_tap_id: currentSession._id,
      ten_buoi_tap: currentSession.ten_buoi_tap,
      thoi_gian_tap_phut: workoutMinutes,
      ghi_chu: `Hoàn thành ${completedCount}/${exerciseCount} bài tập (${workoutMinutes} phút)`
    });

    if (res.success) {
      alert(`🎉 ${res.message}`);
      setIsStopwatchRunning(false);
      setStopwatchSeconds(0);
      setCompletedExercises([]);
      loadAllData();
    } else {
      alert("⚠️ " + (res.message || "Không thể lưu buổi tập"));
    }
  };

  // Kích hoạt một kế hoạch tập luyện
  const handleActivatePlan = async (planId) => {
    const res = await api.activateWorkoutPlan(planId);
    if (res.success) {
      alert(`⚡ ${res.message}`);
      loadAllData();
    } else {
      alert("⚠️ " + res.message);
    }
  };

  // Mở modal tạo / sửa kế hoạch
  const handleOpenPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        ten_ke_hoach: plan.ten_ke_hoach,
        mo_ta: plan.mo_ta || "",
        is_active: plan.is_active || false
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        ten_ke_hoach: "",
        mo_ta: "",
        is_active: plansList.length === 0
      });
    }
    setShowPlanModal(true);
  };

  // Lưu kế hoạch
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.ten_ke_hoach.trim()) {
      alert("Vui lòng nhập tên giáo án!");
      return;
    }

    if (editingPlan) {
      const res = await api.updateWorkoutPlan(editingPlan._id, {
        ten_ke_hoach: planForm.ten_ke_hoach,
        mo_ta: planForm.mo_ta
      });
      if (res.success) {
        setShowPlanModal(false);
        loadAllData();
      } else {
        alert("⚠️ " + res.message);
      }
    } else {
      const res = await api.createWorkoutPlan(planForm);
      if (res.success) {
        setShowPlanModal(false);
        loadAllData();
      } else {
        alert("⚠️ " + res.message);
      }
    }
  };

  // Xóa kế hoạch có xác nhận
  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) return;
    const res = await api.deleteWorkoutPlan(planToDelete._id);
    if (res.success) {
      setShowDeleteModal(false);
      setPlanToDelete(null);
      if (selectedPlanForEdit?._id === planToDelete._id) {
        setSelectedPlanForEdit(null);
      }
      loadAllData();
    } else {
      alert("⚠️ " + res.message);
    }
  };

  // Chuyển đổi trạng thái ngày nghỉ / ngày tập
  const handleToggleRestDay = async (buoiId, currentRestState) => {
    const res = await api.updateBuoiTap(buoiId, {
      is_rest_day: !currentRestState,
      ten_buoi_tap: !currentRestState ? "Nghỉ ngơi phục hồi (Rest Day)" : "Buổi tập chính"
    });
    if (res.success) {
      loadAllData();
      if (selectedPlanForEdit) {
        loadPlanForEdit(selectedPlanForEdit);
      }
    } else {
      alert("⚠️ " + res.message);
    }
  };

  // Đổi tên buổi tập
  const handleUpdateSessionName = async (buoiId, newName) => {
    if (!newName.trim()) return;
    await api.updateBuoiTap(buoiId, { ten_buoi_tap: newName.trim() });
    loadAllData();
  };

  // Tải chi tiết các buổi tập của 1 kế hoạch để chỉnh sửa
  const loadPlanForEdit = async (plan) => {
    setSelectedPlanForEdit(plan);
    if (scheduleData?.ke_hoach?._id === plan._id) {
      setPlanDetailSessions(scheduleData.danh_sach_buoi_tap);
    } else {
      const res = await api.getWorkoutSchedule();
      if (res.success) {
        setPlanDetailSessions(res.data.danh_sach_buoi_tap);
      }
    }
  };

  // Mở modal thêm bài tập vào buổi
  const handleOpenAddExModal = (buoi) => {
    setCurrentBuoiForEx(buoi);
    setExForm({
      bai_tap_the_chat_id: exerciseCatalog[0]?._id || "",
      ten_bai_tap: "",
      nhom_co: "Ngực",
      loai_bai_tap: "strength",
      so_sets: 3,
      so_reps: 10,
      thoi_luong_phut: 10
    });
    setShowAddExModal(true);
  };

  // Lưu bài tập mới vào buổi
  const handleSaveExercise = async (e) => {
    e.preventDefault();
    if (!currentBuoiForEx) return;

    const payload = exForm.bai_tap_the_chat_id
      ? {
          bai_tap_the_chat_id: exForm.bai_tap_the_chat_id,
          so_sets: exForm.so_sets,
          so_reps: exForm.so_reps,
          thoi_luong_phut: exForm.thoi_luong_phut
        }
      : {
          ten_bai_tap: exForm.ten_bai_tap,
          nhom_co: exForm.nhom_co,
          loai_bai_tap: exForm.loai_bai_tap,
          so_sets: exForm.so_sets,
          so_reps: exForm.so_reps,
          thoi_luong_phut: exForm.thoi_luong_phut
        };

    const res = await api.addExerciseToBuoi(currentBuoiForEx._id, payload);
    if (res.success) {
      setShowAddExModal(false);
      loadAllData();
      if (selectedPlanForEdit) loadPlanForEdit(selectedPlanForEdit);
    } else {
      alert("⚠️ " + res.message);
    }
  };

  // Mở modal sửa thông số bài tập
  const handleOpenEditDetailModal = (detail) => {
    setEditingDetail(detail);
    setDetailForm({
      so_sets: detail.so_sets || 3,
      so_reps: detail.so_reps || 10,
      thoi_luong_phut: detail.thoi_luong_phut || ""
    });
    setShowEditDetailModal(true);
  };

  // Lưu sửa bài tập
  const handleSaveEditDetail = async (e) => {
    e.preventDefault();
    if (!editingDetail) return;

    const res = await api.updateExerciseDetail(editingDetail._id, detailForm);
    if (res.success) {
      setShowEditDetailModal(false);
      loadAllData();
      if (selectedPlanForEdit) loadPlanForEdit(selectedPlanForEdit);
    } else {
      alert("⚠️ " + res.message);
    }
  };

  // Xóa bài tập
  const handleDeleteExercise = async (detailId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài tập này khỏi buổi?")) return;
    const res = await api.deleteExerciseDetail(detailId);
    if (res.success) {
      loadAllData();
      if (selectedPlanForEdit) loadPlanForEdit(selectedPlanForEdit);
    } else {
      alert("⚠️ " + res.message);
    }
  };

  const todayDayNum = getTodayDayNumber();

  return (
    <div className="workout-container">
      {/* 1. Header Block & Visual Hierarchy */}
      <div className="workout-header-block">
        <div className="workout-title-row">
          <div className="workout-title-icon-badge">🏋️</div>
          <div className="workout-title-content">
            <h1 className="workout-page-title">Thể Chất & Gym Routine</h1>
            <p className="workout-page-subtitle">
              Quản lý giáo án rèn luyện thể chất, theo dõi chuỗi ngày tập liên tiếp (Streak) & Heatmap 30 ngày
            </p>
          </div>
        </div>

        {/* Standalone Segmented Navigation Bar */}
        <div className="workout-nav-tabs-bar">
          <button
            id="workout-tab-today"
            className={`workout-nav-tab-btn ${activeTab === "today" ? "active" : ""}`}
            onClick={() => setActiveTab("today")}
          >
            <span>📅</span> Lịch Tuần & Tập Luyện
          </button>
          <button
            id="workout-tab-plans"
            className={`workout-nav-tab-btn ${activeTab === "plans" ? "active" : ""}`}
            onClick={() => setActiveTab("plans")}
          >
            <span>📋</span> Quản Lý Giáo Án ({plansList.length})
          </button>
          <button
            id="workout-tab-history"
            className={`workout-nav-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <span>📊</span> Báo Cáo & Nhật Ký
          </button>
        </div>
      </div>

      {/* 2. KPI Quick Stats Strip (4 Uniform Balanced Cards) */}
      <div className="workout-kpi-strip">
        <div className="workout-kpi-card">
          <div className="workout-kpi-icon" style={{ background: "rgba(239, 68, 68, 0.14)", color: "#ef4444" }}>
            🔥
          </div>
          <div className="workout-kpi-text-area">
            <div className="workout-kpi-label">Workout Streak</div>
            <div className="workout-kpi-val font-numeric">
              {reportData?.streak !== undefined ? reportData.streak : 0} Ngày
            </div>
          </div>
        </div>

        <div className="workout-kpi-card">
          <div className="workout-kpi-icon" style={{ background: "rgba(16, 185, 129, 0.14)", color: "#10b981" }}>
            ⏱️
          </div>
          <div className="workout-kpi-text-area">
            <div className="workout-kpi-label">Tổng Thời Gian</div>
            <div className="workout-kpi-val font-numeric">
              {reportData?.tong_thoi_gian_phut || 0} Phút
            </div>
          </div>
        </div>

        <div className="workout-kpi-card">
          <div className="workout-kpi-icon" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
            🎯
          </div>
          <div className="workout-kpi-text-area">
            <div className="workout-kpi-label">Số Buổi Đã Tập</div>
            <div className="workout-kpi-val font-numeric">
              {reportData?.tong_buoi_tap || 0} Buổi
            </div>
          </div>
        </div>

        <div className="workout-kpi-card">
          <div className="workout-kpi-icon" style={{ background: "rgba(245, 158, 11, 0.14)", color: "#f59e0b" }}>
            ⚡
          </div>
          <div className="workout-kpi-text-area">
            <div className="workout-kpi-label">Giáo Án Đang Dùng</div>
            <div
              className="workout-kpi-val font-numeric"
              style={{ fontSize: "0.98rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={scheduleData?.ke_hoach?.ten_ke_hoach || "Chưa chọn giáo án"}
            >
              {scheduleData?.ke_hoach?.ten_ke_hoach || "Chưa có giáo án"}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: HÔM NAY & LỊCH TUẦN (WEEKLY STRIP + HERO PROGRESS + CHECKLIST + TIMER)
          ========================================================================= */}
      {activeTab === "today" && (
        <>
          {/* Weekly 7-Day Strip with Separated Title & Plan Tag */}
          <div className="schedule-strip-card">
            <div className="schedule-header-row">
              <div className="schedule-header-left">
                <h3 className="schedule-header-title">
                  <span>🗓️</span> Lịch Tập 7 Ngày Trong Tuần
                </h3>
                {scheduleData?.ke_hoach && (
                  <span className="schedule-plan-badge">
                    ⚡ {scheduleData.ke_hoach.ten_ke_hoach}
                  </span>
                )}
              </div>
              <button
                className="btn-action-pill btn-pill-primary"
                onClick={() => setSelectedDay(todayDayNum)}
              >
                📍 Hôm Nay ({DAYS_OF_WEEK.find((d) => d.day === todayDayNum)?.fullName})
              </button>
            </div>

            <div className="weekly-schedule-grid">
              {DAYS_OF_WEEK.map((item) => {
                const daySession = scheduleData?.danh_sach_buoi_tap?.find(
                  (b) => b.ngay_trong_tuan === item.day
                );
                const isToday = item.day === todayDayNum;
                const isSelected = item.day === selectedDay;
                const isRest = daySession?.is_rest_day;

                return (
                  <div
                    key={item.day}
                    id={`schedule-day-${item.day}`}
                    className={`schedule-day-box ${isToday ? "is-today" : ""} ${
                      isSelected ? "is-selected" : ""
                    } ${isRest ? "is-rest" : ""}`}
                    onClick={() => setSelectedDay(item.day)}
                  >
                    <div className="day-code-wrap">
                      <span className="day-code">{item.label}</span>
                      {isToday && <span className="today-dot" title="Hôm nay" />}
                    </div>
                    <div className="session-name">
                      {isRest ? "🛌 Nghỉ ngơi" : daySession?.ten_buoi_tap || "Chưa có lịch"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nếu ngày được chọn là ngày nghỉ */}
          {currentSession?.is_rest_day ? (
            <div className="rest-day-card">
              <div className="rest-day-icon-bounce">🛌</div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px 0" }}>
                {DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.fullName}: Ngày Nghỉ Phục Hồi
              </h3>
              <p
                style={{
                  maxWidth: "540px",
                  margin: "0 auto 18px auto",
                  color: "var(--lp-text-muted)",
                  fontSize: "0.88rem",
                  lineHeight: 1.5
                }}
              >
                Cơ bắp phát triển và tự chữa lành trong những ngày nghỉ ngơi. Hãy ăn uống đủ chất đạm,
                uống nhiều nước và ngủ đủ giấc để sẵn sàng cho buổi tập tiếp theo!
              </p>
              <div className="d-flex justify-content-center">
                <button
                  className="btn-action-pill btn-pill-primary"
                  onClick={() => handleToggleRestDay(currentSession._id, true)}
                >
                  ⚡ Chuyển thành ngày tập nếu bạn muốn
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Workout Progress Hero Banner */}
              <div className="workout-progress-card">
                <div className="workout-progress-left">
                  <div className="workout-progress-icon-badge">🎯</div>
                  <div>
                    <h3 className="workout-progress-title">
                      {currentSession?.ten_buoi_tap || "Buổi tập chính"}
                    </h3>
                    <p className="workout-progress-sub">
                      {DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.fullName} • Hoàn thành{" "}
                      {completedCount}/{exerciseCount} bài tập
                    </p>
                  </div>
                </div>

                <div className="workout-progress-bar-wrap">
                  <div className="workout-slim-progress">
                    <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                <div className="workout-progress-percent font-numeric">
                  {progressPercent}%
                </div>
              </div>

              {/* Main Workout Cards: Left = Checklist (7 cols), Right = Timer & Player (5 cols) */}
              <div className="row g-3">
                {/* Cột trái: Checklist bài tập */}
                <div className="col-lg-7">
                  <div className="workout-main-card">
                    <div className="checklist-header-box">
                      <div className="checklist-header-title-wrap">
                        <span style={{ fontSize: "1.1rem" }}>📋</span>
                        <h4 className="checklist-header-title">Danh Sách Bài Tập Cần Thực Hiện</h4>
                      </div>
                      <div className="checklist-header-actions">
                        <button
                          className="btn-action-pill btn-pill-primary"
                          onClick={() => handleOpenAddExModal(currentSession)}
                        >
                          + Thêm Bài
                        </button>
                        <button
                          className="btn-action-pill btn-pill-warning"
                          onClick={() => handleToggleRestDay(currentSession._id, false)}
                          title="Đổi ngày này thành ngày nghỉ ngơi"
                        >
                          🛌 Đánh Dấu Nghỉ
                        </button>
                      </div>
                    </div>

                    {/* Danh sách checklist */}
                    {exerciseCount === 0 ? (
                      <div className="text-center py-5" style={{ color: "var(--lp-text-muted)" }}>
                        <p style={{ fontSize: "0.92rem", marginBottom: "14px" }}>
                          Chưa có bài tập nào cho buổi này.
                        </p>
                        <button
                          className="btn-action-pill btn-pill-primary"
                          onClick={() => handleOpenAddExModal(currentSession)}
                        >
                          + Thêm bài tập ngay
                        </button>
                      </div>
                    ) : (
                      <div className="workout-checklist-container">
                        {currentSession.chi_tiet.map((item) => {
                          const isDone = completedExercises.includes(item._id);
                          const isActive = activeExercise?._id === item._id;
                          const exInfo = item.bai_tap_the_chat_id;

                          return (
                            <div
                              key={item._id}
                              className={`checklist-exercise-item ${isDone ? "completed" : ""} ${
                                isActive ? "active-exercise" : ""
                              }`}
                              onClick={() => setActiveExercise(item)}
                            >
                              <div
                                className="checklist-item-checkbox-col"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExerciseCheck(item._id);
                                }}
                              >
                                <input
                                  type="checkbox"
                                  className="custom-check-box"
                                  checked={isDone}
                                  onChange={() => {}}
                                />
                              </div>

                              <div className="checklist-item-content">
                                <div className="checklist-item-title-col">
                                  <h5 className="exercise-title">
                                    {exInfo?.ten_bai_tap || "Bài tập"}
                                  </h5>
                                  {exInfo?.meo_tap && (
                                    <div
                                      style={{
                                        fontSize: "0.72rem",
                                        color: "var(--lp-text-muted)",
                                        marginTop: "2px"
                                      }}
                                    >
                                      💡 {exInfo.meo_tap}
                                    </div>
                                  )}
                                </div>

                                <div className="checklist-item-meta-col">
                                  <span className="badge-group-tag">
                                    {exInfo?.nhom_co || "Tổng hợp"}
                                  </span>
                                  <span className="badge-metric-tag font-numeric">
                                    {item.so_sets} Sets × {item.so_reps} Reps
                                  </span>
                                </div>

                                <div className="checklist-item-action-area">
                                  <button
                                    className="btn-icon-circle"
                                    title="Sửa bài tập"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditDetailModal(item);
                                    }}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="btn-icon-circle text-danger"
                                    title="Xóa bài tập"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteExercise(item._id);
                                    }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Nút Hoàn Thành Buổi Tập */}
                    <div className="mt-3 pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <span style={{ fontSize: "0.82rem", color: "var(--lp-text-muted)" }}>
                        {completedCount === exerciseCount && exerciseCount > 0
                          ? "🌟 Bạn đã hoàn thành toàn bộ bài tập trong buổi!"
                          : "Tập luyện theo khả năng và ghi nhận khi hoàn thành."}
                      </span>
                      <button
                        className="btn-finish-workout"
                        onClick={handleCompleteWorkout}
                      >
                        ✅ Hoàn Thành Buổi Tập
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Timer, Rest Timer & Active Exercise Player */}
                <div className="col-lg-5">
                  <div className="workout-main-card workout-timer-sticky">
                    <div className="workout-timer-box">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase" }}>
                          ⏱️ Đồng Hồ Bấm Giờ
                        </span>
                        <span
                          className={`workout-status-badge ${
                            isStopwatchRunning ? "badge-running" : "badge-not-started"
                          }`}
                        >
                          {isStopwatchRunning ? "Đang tập..." : "Tạm dừng"}
                        </span>
                      </div>

                      <div className="timer-display font-numeric">{formatTime(stopwatchSeconds)}</div>

                      <div className="d-flex justify-content-center gap-2 mt-2">
                        <button
                          className={`btn-action-pill ${isStopwatchRunning ? "btn-pill-warning" : "btn-pill-primary"}`}
                          onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                        >
                          {isStopwatchRunning ? "⏸️ Tạm Dừng" : "▶️ Bắt Đầu Tập"}
                        </button>
                        <button
                          className="btn-action-pill btn-pill-primary"
                          onClick={() => {
                            setIsStopwatchRunning(false);
                            setStopwatchSeconds(0);
                          }}
                        >
                          🔄 Đặt Lại
                        </button>
                      </div>
                    </div>

                    {/* Rest Timer Countdown */}
                    <div className="active-exercise-card mb-3 p-3 text-center">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                          🛑 Nghỉ Giữa Các Hiệp (Rest Timer)
                        </span>
                        <span className="font-numeric" style={{ fontWeight: 800, color: "var(--lp-warning)", fontSize: "1rem" }}>
                          {restCountdown > 0 ? `${restCountdown}s` : "0s"}
                        </span>
                      </div>

                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn-action-pill btn-pill-primary"
                          style={{ height: "30px", fontSize: "0.74rem", padding: "0 10px" }}
                          onClick={() => setRestCountdown(30)}
                        >
                          +30s
                        </button>
                        <button
                          className="btn-action-pill btn-pill-primary"
                          style={{ height: "30px", fontSize: "0.74rem", padding: "0 10px" }}
                          onClick={() => setRestCountdown(60)}
                        >
                          +60s
                        </button>
                        <button
                          className="btn-action-pill btn-pill-primary"
                          style={{ height: "30px", fontSize: "0.74rem", padding: "0 10px" }}
                          onClick={() => setRestCountdown(90)}
                        >
                          +90s
                        </button>
                        {restCountdown > 0 && (
                          <button
                            className="btn-action-pill btn-pill-warning"
                            style={{ height: "30px", fontSize: "0.74rem", padding: "0 10px" }}
                            onClick={() => setRestCountdown(0)}
                          >
                            Tắt
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Active Exercise Detail Card */}
                    {activeExercise ? (
                      <div className="active-exercise-card">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="badge-metric-tag" style={{ fontSize: "0.72rem" }}>
                            Đang Thực Hiện
                          </span>
                          <span className="badge-group-tag">
                            {activeExercise.bai_tap_the_chat_id?.nhom_co || "Nhóm cơ"}
                          </span>
                        </div>
                        <h4 className="active-exercise-title">
                          {activeExercise.bai_tap_the_chat_id?.ten_bai_tap}
                        </h4>
                        <div
                          className="d-flex align-items-center gap-3 my-2 p-2 rounded"
                          style={{ background: "var(--lp-bg-card)", border: "1px solid var(--lp-card-border)" }}
                        >
                          <div style={{ flex: 1, textAlign: "center" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--lp-text-muted)" }}>Mục tiêu</div>
                            <div className="font-numeric" style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--lp-primary)" }}>
                              {activeExercise.so_sets} Sets
                            </div>
                          </div>
                          <div style={{ width: "1px", height: "28px", background: "var(--lp-card-border)" }} />
                          <div style={{ flex: 1, textAlign: "center" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--lp-text-muted)" }}>Lặp lại</div>
                            <div className="font-numeric" style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--lp-primary)" }}>
                              {activeExercise.so_reps} Reps
                            </div>
                          </div>
                        </div>

                        {activeExercise.bai_tap_the_chat_id?.meo_tap && (
                          <p style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)", margin: "8px 0 0 0" }}>
                            📌 <b>Mẹo kỹ thuật:</b> {activeExercise.bai_tap_the_chat_id.meo_tap}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4" style={{ color: "var(--lp-text-muted)", fontSize: "0.82rem" }}>
                        Click vào một bài tập ở danh sách bên trái để theo dõi chi tiết tại đây.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Monthly Heatmap 30 Ngày */}
          <div className="workout-main-card mt-4">
            <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
              <h3 style={{ fontSize: "1rem", fontWeight: "700", margin: 0 }}>
                🟩 Tần Suất Rèn Luyện 30 Ngày Gần Nhất (Heatmap)
              </h3>
              <span style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)" }}>
                Màu càng đậm thể hiện thời lượng tập càng nhiều
              </span>
            </div>

            <div className="heatmap-grid">
              {Array.from({ length: 30 }).map((_, idx) => {
                const dateStr = new Date(Date.now() - (29 - idx) * 86400000).toISOString().split("T")[0];
                const lvl = reportData?.heatmap?.[dateStr] || 0;
                return (
                  <div
                    key={idx}
                    className={`heatmap-cell ${lvl > 0 ? `heatmap-lvl-${lvl}` : ""}`}
                    title={`${dateStr}: Mức độ rèn luyện ${lvl}/4`}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 2: QUẢN LÝ GIÁO ÁN (CRUD, KÍCH HOẠT, TÙY CHỈNH NGÀY/BÀI TẬP)
          ========================================================================= */}
      {activeTab === "plans" && (
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Danh Sách Giáo Án Cá Nhân</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--lp-text-muted)", margin: "4px 0 0 0" }}>
                Tạo nhiều kế hoạch tập luyện khác nhau và chuyển đổi lịch đang sử dụng bất kỳ lúc nào.
              </p>
            </div>
            <button className="btn-action-pill btn-pill-primary" onClick={() => handleOpenPlanModal()}>
              + Tạo Giáo Án Mới
            </button>
          </div>

          {/* Danh sách các kế hoạch (Grid) */}
          <div className="row g-3 mb-4">
            {plansList.map((plan) => (
              <div key={plan._id} className="col-md-6 col-lg-4">
                <div className={`plan-card-item ${plan.is_active ? "is-active-plan" : ""}`}>
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      {plan.is_active ? (
                        <span className="badge-metric-tag">⚡ ĐANG SỬ DỤNG</span>
                      ) : (
                        <span className="badge-group-tag">Giáo án lưu trữ</span>
                      )}
                      {plan.is_default && (
                        <span className="badge-group-tag" style={{ fontSize: "0.68rem" }}>
                          Mẫu mặc định
                        </span>
                      )}
                    </div>

                    <h4 className="plan-card-title">{plan.ten_ke_hoach}</h4>
                    <p className="plan-card-desc">{plan.mo_ta || "Không có mô tả chi tiết."}</p>
                  </div>

                  <div className="mt-3 pt-3 border-top">
                    <div className="d-flex align-items-center justify-content-between mb-3" style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)" }}>
                      <span>💪 {plan.so_buoi_tap || 0} Ngày tập</span>
                      <span>🛌 {plan.so_ngay_nghi || 0} Ngày nghỉ</span>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {!plan.is_active && (
                        <button
                          className="btn-action-pill btn-pill-primary"
                          style={{ height: "30px", fontSize: "0.74rem" }}
                          onClick={() => handleActivatePlan(plan._id)}
                        >
                          ⚡ Kích Hoạt
                        </button>
                      )}
                      <button
                        className="btn-action-pill btn-pill-primary"
                        style={{ height: "30px", fontSize: "0.74rem" }}
                        onClick={() => loadPlanForEdit(plan)}
                      >
                        ⚙️ Chi Tiết
                      </button>
                      <button
                        className="btn-icon-circle"
                        style={{ width: "30px", height: "30px" }}
                        onClick={() => handleOpenPlanModal(plan)}
                        title="Đổi tên giáo án"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon-circle text-danger"
                        style={{ width: "30px", height: "30px" }}
                        onClick={() => {
                          setPlanToDelete(plan);
                          setShowDeleteModal(true);
                        }}
                        title="Xóa giáo án này"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trình Tùy Chỉnh 7 Ngày Trong Tuần Của Kế Hoạch Đang Chọn */}
          {selectedPlanForEdit && (
            <div className="workout-main-card mt-4">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <div>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                    🛠️ Tùy Chỉnh 7 Ngày: {selectedPlanForEdit.ten_ke_hoach}
                  </h4>
                  <span style={{ fontSize: "0.8rem", color: "var(--lp-text-muted)" }}>
                    Điều chỉnh ngày tập, đánh dấu ngày nghỉ và thêm/sửa/xóa bài tập cho từng ngày
                  </span>
                </div>
                <button
                  className="btn-action-pill btn-pill-primary"
                  onClick={() => setSelectedPlanForEdit(null)}
                >
                  Đóng ✕
                </button>
              </div>

              <div className="d-flex flex-column gap-3">
                {DAYS_OF_WEEK.map((d) => {
                  const s = planDetailSessions?.find((b) => b.ngay_trong_tuan === d.day);
                  if (!s) return null;

                  return (
                    <div
                      key={d.day}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        background: s.is_rest_day ? "var(--lp-bg-surface)" : "var(--lp-bg-card)",
                        border: s.is_rest_day ? "1.5px dashed var(--lp-card-border)" : "1px solid var(--lp-card-border)"
                      }}
                    >
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge-metric-tag">{d.fullName}</span>
                          <input
                            type="text"
                            defaultValue={s.ten_buoi_tap}
                            onBlur={(e) => handleUpdateSessionName(s._id, e.target.value)}
                            style={{
                              border: "none",
                              background: "transparent",
                              fontWeight: 700,
                              fontSize: "0.92rem",
                              color: "var(--lp-text-main)",
                              borderBottom: "1px dashed var(--lp-card-border)",
                              outline: "none"
                            }}
                          />
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <button
                            className={`btn-action-pill ${s.is_rest_day ? "btn-pill-warning" : "btn-pill-primary"}`}
                            style={{ height: "30px", fontSize: "0.74rem" }}
                            onClick={() => handleToggleRestDay(s._id, s.is_rest_day)}
                          >
                            {s.is_rest_day ? "🛌 Đang Là Ngày Nghỉ" : "💪 Đang Là Ngày Tập"}
                          </button>
                          {!s.is_rest_day && (
                            <button
                              className="btn-action-pill btn-pill-primary"
                              style={{ height: "30px", fontSize: "0.74rem" }}
                              onClick={() => handleOpenAddExModal(s)}
                            >
                              + Thêm Bài Tập
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bài tập trong ngày */}
                      {!s.is_rest_day && (
                        <div className="ps-2">
                          {s.chi_tiet && s.chi_tiet.length > 0 ? (
                            <div className="d-flex flex-column gap-2 mt-2">
                              {s.chi_tiet.map((it) => (
                                <div
                                  key={it._id}
                                  className="d-flex align-items-center justify-content-between p-2 rounded"
                                  style={{
                                    background: "var(--lp-bg-surface)",
                                    border: "1px solid var(--lp-card-border)",
                                    fontSize: "0.82rem"
                                  }}
                                >
                                  <div>
                                    <span style={{ fontWeight: 600 }}>
                                      {it.bai_tap_the_chat_id?.ten_bai_tap}
                                    </span>
                                    <span className="badge-group-tag ms-2">
                                      {it.bai_tap_the_chat_id?.nhom_co}
                                    </span>
                                    <span className="badge-metric-tag ms-2 font-numeric">
                                      {it.so_sets} Sets × {it.so_reps} Reps
                                    </span>
                                  </div>
                                  <div className="d-flex gap-1">
                                    <button
                                      className="btn-icon-circle"
                                      onClick={() => handleOpenEditDetailModal(it)}
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      className="btn-icon-circle text-danger"
                                      onClick={() => handleDeleteExercise(it._id)}
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: "0.8rem", color: "var(--lp-text-muted)", marginTop: "6px" }}>
                              Chưa có bài tập nào. Hãy bấm "+ Thêm Bài Tập".
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: BÁO CÁO & NHẬT KÝ TẬP LUYỆN
          ========================================================================= */}
      {activeTab === "history" && (
        <div className="workout-main-card">
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 6px 0" }}>
            📊 Nhật Ký & Lịch Sử Rèn Luyện
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--lp-text-muted)", margin: "0 0 16px 0" }}>
            Toàn bộ các buổi tập đã hoàn thành được ghi nhận bền vững và bảo toàn trong hệ thống.
          </p>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Ngày Tập</th>
                  <th>Buổi Tập / Nội Dung</th>
                  <th>Thời Gian</th>
                  <th>Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {reportData?.recent_logs && reportData.recent_logs.length > 0 ? (
                  reportData.recent_logs.map((log) => (
                    <tr key={log._id}>
                      <td className="font-numeric" style={{ fontWeight: 600 }}>
                        {new Date(log.ngay_tap).toLocaleDateString("vi-VN", {
                          weekday: "short",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit"
                        })}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: "var(--lp-primary)" }}>
                          {log.ten_buoi_tap || "Buổi tập hoàn thành"}
                        </span>
                      </td>
                      <td className="font-numeric">{log.thoi_gian_tap_phut || 45} phút</td>
                      <td style={{ color: "var(--lp-text-muted)", fontSize: "0.82rem" }}>
                        {log.ghi_chu || "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted">
                      Chưa có nhật ký tập luyện nào được ghi nhận. Hãy hoàn thành buổi tập đầu tiên của bạn!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS (GLASSMORPHIC & CLEAN)
          ========================================================================= */}

      {/* Modal 1: Tạo / Sửa Kế Hoạch */}
      {showPlanModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold" style={{ fontSize: "1.05rem" }}>
                  {editingPlan ? "✏️ Chỉnh Sửa Kế Hoạch" : "➕ Tạo Kế Hoạch Mới"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPlanModal(false)}
                />
              </div>
              <form onSubmit={handleSavePlan}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      Tên Kế Hoạch / Giáo Án *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: Giáo Án Push Pull Legs, Tăng Cơ 4 Buổi..."
                      value={planForm.ten_ke_hoach}
                      onChange={(e) => setPlanForm({ ...planForm, ten_ke_hoach: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      Mô Tả Kế Hoạch
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Mục tiêu tập luyện, phân bổ nhóm cơ..."
                      value={planForm.mo_ta}
                      onChange={(e) => setPlanForm({ ...planForm, mo_ta: e.target.value })}
                    />
                  </div>
                  {!editingPlan && (
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="setAsActivePlan"
                        checked={planForm.is_active}
                        onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="setAsActivePlan" style={{ fontSize: "0.85rem" }}>
                        Kích hoạt làm giáo án sử dụng chính ngay sau khi tạo
                      </label>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-action-pill btn-pill-primary"
                    onClick={() => setShowPlanModal(false)}
                  >
                    Hủy Bỏ
                  </button>
                  <button type="submit" className="btn-action-pill btn-pill-primary" style={{ background: "var(--lp-primary)", color: "#fff" }}>
                    {editingPlan ? "Cập Nhật" : "Tạo Kế Hoạch"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Xác Nhận Xóa Kế Hoạch */}
      {showDeleteModal && planToDelete && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-danger">
                <h5 className="modal-title text-danger font-weight-bold" style={{ fontSize: "1.05rem" }}>
                  ⚠️ Xác Nhận Xóa Kế Hoạch
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                />
              </div>
              <div className="modal-body">
                <p style={{ fontSize: "0.92rem", marginBottom: "12px" }}>
                  Bạn có chắc chắn muốn xóa giáo án <b>"{planToDelete.ten_ke_hoach}"</b>?
                </p>
                <div
                  className="p-3 rounded"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    fontSize: "0.82rem",
                    color: "var(--lp-danger)",
                    lineHeight: 1.5
                  }}
                >
                  🛡️ <b>Bảo toàn dữ liệu:</b> Các buổi tập trong giáo án này sẽ bị xóa, nhưng toàn bộ{" "}
                  <b>Lịch sử tập luyện, Chuỗi Streak và Heatmap</b> trước đây của bạn vẫn được lưu giữ an toàn!
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-action-pill btn-pill-primary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  className="btn-action-pill btn-pill-warning"
                  style={{ background: "var(--lp-danger)", color: "#fff", border: "none" }}
                  onClick={handleConfirmDeletePlan}
                >
                  Xác Nhận Xóa Vĩnh Viễn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Thêm Bài Tập Vào Buổi */}
      {showAddExModal && currentBuoiForEx && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold" style={{ fontSize: "1.05rem" }}>
                  ➕ Thêm Bài Tập Vào: {currentBuoiForEx.ten_buoi_tap}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddExModal(false)}
                />
              </div>
              <form onSubmit={handleSaveExercise}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      Chọn Từ Danh Mục Bài Tập Mẫu
                    </label>
                    <select
                      className="form-select"
                      value={exForm.bai_tap_the_chat_id}
                      onChange={(e) => setExForm({ ...exForm, bai_tap_the_chat_id: e.target.value })}
                    >
                      <option value="">-- Hoặc nhập bài tập tùy chỉnh bên dưới --</option>
                      {exerciseCatalog.map((ex) => (
                        <option key={ex._id} value={ex._id}>
                          [{ex.nhom_co}] {ex.ten_bai_tap}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!exForm.bai_tap_the_chat_id && (
                    <div className="p-3 mb-3 rounded" style={{ background: "var(--lp-bg-surface)" }}>
                      <div className="mb-2">
                        <label className="form-label" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                          Tên Bài Tập Tùy Chỉnh *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="VD: Hít đất, Kéo xà đơn..."
                          value={exForm.ten_bai_tap}
                          onChange={(e) => setExForm({ ...exForm, ten_bai_tap: e.target.value })}
                        />
                      </div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: "0.82rem" }}>
                            Nhóm Cơ
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ngực, Lưng, Chân..."
                            value={exForm.nhom_co}
                            onChange={(e) => setExForm({ ...exForm, nhom_co: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: "0.82rem" }}>
                            Loại
                          </label>
                          <select
                            className="form-select"
                            value={exForm.loai_bai_tap}
                            onChange={(e) => setExForm({ ...exForm, loai_bai_tap: e.target.value })}
                          >
                            <option value="strength">Sức mạnh (Strength)</option>
                            <option value="cardio">Cardio</option>
                            <option value="core">Core / Bụng</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="row g-2">
                    <div className="col-4">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                        Số Sets
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        className="form-control font-numeric"
                        value={exForm.so_sets}
                        onChange={(e) => setExForm({ ...exForm, so_sets: e.target.value })}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                        Số Reps
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="form-control font-numeric"
                        value={exForm.so_reps}
                        onChange={(e) => setExForm({ ...exForm, so_reps: e.target.value })}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                        Phút (Tùy chọn)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        className="form-control font-numeric"
                        value={exForm.thoi_luong_phut}
                        onChange={(e) => setExForm({ ...exForm, thoi_luong_phut: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-action-pill btn-pill-primary"
                    onClick={() => setShowAddExModal(false)}
                  >
                    Hủy Bỏ
                  </button>
                  <button type="submit" className="btn-action-pill btn-pill-primary" style={{ background: "var(--lp-primary)", color: "#fff" }}>
                    Thêm Vào Buổi Tập
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Sửa Thông Số Bài Tập */}
      {showEditDetailModal && editingDetail && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold" style={{ fontSize: "1.05rem" }}>
                  ✏️ Sửa Thông Số: {editingDetail.bai_tap_the_chat_id?.ten_bai_tap}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditDetailModal(false)}
                />
              </div>
              <form onSubmit={handleSaveEditDetail}>
                <div className="modal-body">
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                        Số Sets
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        className="form-control font-numeric"
                        value={detailForm.so_sets}
                        onChange={(e) => setDetailForm({ ...detailForm, so_sets: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                        Số Reps
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="form-control font-numeric"
                        value={detailForm.so_reps}
                        onChange={(e) => setDetailForm({ ...detailForm, so_reps: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-action-pill btn-pill-primary"
                    onClick={() => setShowEditDetailModal(false)}
                  >
                    Hủy Bỏ
                  </button>
                  <button type="submit" className="btn-action-pill btn-pill-primary" style={{ background: "var(--lp-primary)", color: "#fff" }}>
                    Lưu Thay Đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
