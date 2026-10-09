import React, { useEffect, useState } from "react";
import { api } from "../services/api";

export const WorkoutView = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [streak, setStreak] = useState(0);

  const loadWorkout = () => {
    api.getWorkoutSchedule().then(res => res.success && setScheduleData(res.data));
    api.getWorkoutReport().then(res => {
      if (res.success) {
        setReportData(res.data);
      }
    });
  };

  useEffect(() => {
    loadWorkout();
  }, []);

  const handleComplete = async (buoiId, buoiName) => {
    const res = await api.completeWorkout({
      buoi_tap_id: buoiId,
      thoi_gian_tap_phut: 45,
      ghi_chu: `Đã hoàn thành ${buoiName}`
    });

    if (res.success) {
      setStreak(res.data.streak);
      alert(`🎉 ${res.message}`);
      loadWorkout();
    }
  };

  return (
    <div>
      <div className="header-top">
        <div>
          <h1 className="page-title">🏋️ Rèn Luyện Thể Chất & Gym</h1>
          <p className="page-subtitle">Giáo án tập 7 ngày trong tuần, theo dõi chuỗi ngày tập liên tiếp (Streak) & Heatmap</p>
        </div>
      </div>

      {/* Streak Widget & Total Minutes */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>🔥</div>
          <div>
            <div className="kpi-value">{streak > 0 ? streak : (reportData?.tong_buoi_tap || 0)} Ngày</div>
            <div className="kpi-label">Workout Streak Liên Tiếp</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>⏱️</div>
          <div>
            <div className="kpi-value">{reportData?.tong_thoi_gian_phut || 0} Phút</div>
            <div className="kpi-label">Tổng Thời Gian Rèn Luyện</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>💪</div>
          <div>
            <div className="kpi-value">{scheduleData?.ke_hoach?.ten_ke_hoach || "Giáo án Gym"}</div>
            <div className="kpi-label">Kế Hoạch Hiện Tại</div>
          </div>
        </div>
      </div>

      {/* Monthly Heatmap */}
      <div className="glass-card" style={{ marginBottom: "28px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "12px" }}>🟩 Tần Suất Rèn Luyện Hàng Tháng (Heatmap)</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>Mỗi ô vuông đại diện cho 1 ngày trong tháng. Màu càng đậm thể hiện cường độ tập luyện càng cao.</p>
        
        <div className="heatmap-grid">
          {Array.from({ length: 30 }).map((_, idx) => {
            const dateStr = new Date(Date.now() - (29 - idx) * 86400000).toISOString().split('T')[0];
            const lvl = reportData?.heatmap?.[dateStr] || 0;
            return (
              <div
                key={idx}
                className={`heatmap-cell ${lvl > 0 ? `heatmap-lvl-${lvl}` : ''}`}
                title={`${dateStr}: Mức độ ${lvl}`}
              />
            );
          })}
        </div>
      </div>

      {/* Lịch tập 7 ngày */}
      <div className="glass-card">
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>📅 Lịch Tập Trong Tuần</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {scheduleData?.danh_sach_buoi_tap?.map(buoi => (
            <div key={buoi._id} style={{ padding: "20px", borderRadius: "14px", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: "6px" }}>Thứ {buoi.ngay_trong_tuan}</span>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "800", marginTop: "4px" }}>{buoi.ten_buoi_tap}</h4>
              </div>
              <button
                className="btn-primary"
                onClick={() => handleComplete(buoi._id, buoi.ten_buoi_tap)}
              >
                ✅ Hoàn Thành Buổi Tập
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
