import React, { useState } from "react";

export const AdminChartsAnalytics = ({ stats, loading }) => {
  const [activeGrowthSeries, setActiveGrowthSeries] = useState("all"); // "all" | "users" | "applications"
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  if (loading || !stats) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.8rem" }}>⏳</div>
        <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Đang nạp và tổng hợp dữ liệu thống kê...</div>
      </div>
    );
  }

  const { users, applications, charts } = stats;
  const dailyGrowth = charts?.daily_growth || [];
  const roleDist = charts?.role_distribution || [];
  const appDist = charts?.app_distribution || [];
  const approvalRate = applications?.approval_rate ?? 100;

  // Tính max value cho biểu đồ cột
  const maxBarValue = Math.max(
    ...dailyGrowth.map(d => Math.max(d.users || 0, d.applications || 0)),
    5
  );

  // Tính tổng người dùng để tính % vai trò
  const totalUsers = users?.total || 1;
  const totalApps = applications?.total || 1;

  // Chuẩn bị dữ liệu cho Donut Chart SVG
  let cumulativeAngle = 0;
  const donutSegments = roleDist.map(item => {
    const percentage = totalUsers > 0 ? (item.count / totalUsers) * 100 : 0;
    const strokeDash = `${percentage} ${100 - percentage}`;
    const strokeOffset = 100 - cumulativeAngle;
    cumulativeAngle += percentage;
    return {
      ...item,
      percentage: Math.round(percentage),
      strokeDash,
      strokeOffset
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
      {/* 1. DẢI METRICS TỔNG QUAN NÂNG CAO */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "1.2rem"
        }}
      >
        {/* Metric 1 */}
        <div
          className="neu-card"
          style={{
            background: "var(--card-bg)",
            borderRadius: "18px",
            padding: "1.2rem 1.4rem",
            border: "1px solid var(--border-color)",
            boxShadow: "6px 6px 14px var(--neu-shadow-dark), -6px -6px 14px var(--neu-shadow-light)",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "14px",
              background: "rgba(59, 130, 246, 0.12)",
              color: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem"
            }}
          >
            👥
          </div>
          <div>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600, display: "block" }}>
              TỔNG NGƯỜI DÙNG
            </span>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.2 }}>
              {users?.total || 0}
            </div>
            <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700 }}>
              ↑ {users?.students || 0} học viên tích cực
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          className="neu-card"
          style={{
            background: "var(--card-bg)",
            borderRadius: "18px",
            padding: "1.2rem 1.4rem",
            border: "1px solid var(--border-color)",
            boxShadow: "6px 6px 14px var(--neu-shadow-dark), -6px -6px 14px var(--neu-shadow-light)",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "14px",
              background: "rgba(16, 185, 129, 0.12)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem"
            }}
          >
            🎓
          </div>
          <div>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600, display: "block" }}>
              ĐỘI NGŨ GIA SƯ & PT
            </span>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.2 }}>
              {(users?.tutors || 0) + (users?.pts || 0)}
            </div>
            <span style={{ fontSize: "0.75rem", color: "#3b82f6", fontWeight: 700 }}>
              {users?.tutors || 0} Gia sư • {users?.pts || 0} HLV PT
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          className="neu-card"
          style={{
            background: "var(--card-bg)",
            borderRadius: "18px",
            padding: "1.2rem 1.4rem",
            border: "1px solid var(--border-color)",
            boxShadow: "6px 6px 14px var(--neu-shadow-dark), -6px -6px 14px var(--neu-shadow-light)",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "14px",
              background: "rgba(245, 158, 11, 0.12)",
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem"
            }}
          >
            📋
          </div>
          <div>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600, display: "block" }}>
              HỒ SƠ CHỜ DUYỆT
            </span>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: applications?.pending > 0 ? "#f59e0b" : "var(--text-main)", lineHeight: 1.2 }}>
              {applications?.pending || 0}
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Tổng {applications?.total || 0} đơn đã nộp
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div
          className="neu-card"
          style={{
            background: "var(--card-bg)",
            borderRadius: "18px",
            padding: "1.2rem 1.4rem",
            border: "1px solid var(--border-color)",
            boxShadow: "6px 6px 14px var(--neu-shadow-dark), -6px -6px 14px var(--neu-shadow-light)",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "14px",
              background: "rgba(139, 92, 246, 0.12)",
              color: "#8b5cf6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem"
            }}
          >
            🎯
          </div>
          <div>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600, display: "block" }}>
              TỶ LỆ DUYỆT THÀNH CÔNG
            </span>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#10b981", lineHeight: 1.2 }}>
              {approvalRate}%
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
              {applications?.approved || 0} duyệt / {applications?.rejected || 0} từ chối
            </span>
          </div>
        </div>
      </div>

      {/* 2. BIỂU ĐỒ CHÍNH: TĂNG TRƯỞNG 7 NGÀY GẦN NHẤT (DUAL COLUMN BAR CHART) */}
      <div
        className="glass-card"
        style={{
          background: "var(--card-bg)",
          borderRadius: "22px",
          padding: "1.6rem 1.8rem",
          border: "1px solid var(--border-color)",
          boxShadow: "8px 8px 20px var(--neu-shadow-dark), -8px -8px 20px var(--neu-shadow-light)"
        }}
      >
        {/* Header biểu đồ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ margin: "0 0 0.3rem 0", fontSize: "1.18rem", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>📈</span>
              <span>Xu Hướng Tăng Trưởng Người Dùng & Hồ Sơ (7 Ngày Gần Nhất)</span>
            </h3>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Theo dõi nhịp độ tham gia hệ thống và số lượng hồ sơ đăng ký gia sư/PT theo thời gian thực
            </span>
          </div>

          {/* Bộ lọc loại dữ liệu hiển thị */}
          {/* Bộ lọc loại dữ liệu hiển thị (Touch-friendly on mobile) */}
          <div
            className="d-flex flex-wrap gap-1 p-1 rounded-3 border w-100 w-sm-auto"
            style={{
              background: "var(--neu-bg)",
              boxShadow: "inset 2px 2px 5px var(--neu-inset-dark), inset -2px -2px 5px var(--neu-inset-light)"
            }}
          >
            <button
              type="button"
              onClick={() => setActiveGrowthSeries("all")}
              className="flex-fill"
              style={{
                minHeight: "38px",
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeGrowthSeries === "all" ? "var(--card-bg)" : "transparent",
                color: activeGrowthSeries === "all" ? "var(--primary)" : "var(--text-muted)",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                boxShadow: activeGrowthSeries === "all" ? "2px 2px 6px var(--neu-shadow-dark)" : "none",
                transition: "all 0.2s"
              }}
            >
              Tất Cả
            </button>
            <button
              type="button"
              onClick={() => setActiveGrowthSeries("users")}
              className="flex-fill"
              style={{
                minHeight: "38px",
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeGrowthSeries === "users" ? "var(--card-bg)" : "transparent",
                color: activeGrowthSeries === "users" ? "#3b82f6" : "var(--text-muted)",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                boxShadow: activeGrowthSeries === "users" ? "2px 2px 6px var(--neu-shadow-dark)" : "none",
                transition: "all 0.2s"
              }}
            >
              👤 Người Dùng
            </button>
            <button
              type="button"
              onClick={() => setActiveGrowthSeries("applications")}
              className="flex-fill"
              style={{
                minHeight: "38px",
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                background: activeGrowthSeries === "applications" ? "var(--card-bg)" : "transparent",
                color: activeGrowthSeries === "applications" ? "#10b981" : "var(--text-muted)",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                boxShadow: activeGrowthSeries === "applications" ? "2px 2px 6px var(--neu-shadow-dark)" : "none",
                transition: "all 0.2s"
              }}
            >
              📑 Hồ Sơ
            </button>
          </div>
        </div>

        {/* Khung vẽ cột biểu đồ (Cuộn ngang an toàn trên màn hình nhỏ) */}
        <div style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
          <div style={{ height: "240px", minWidth: "320px", display: "flex", alignItems: "flex-end", gap: "1rem", padding: "1rem 0 0 0", borderBottom: "1px dashed var(--border-color)", position: "relative" }}>
          {dailyGrowth.map((day, idx) => {
            const userHeight = Math.max((day.users / maxBarValue) * 180, 8);
            const appHeight = Math.max((day.applications / maxBarValue) * 180, 8);
            const isHovered = hoveredBarIndex === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredBarIndex(idx)}
                onMouseLeave={() => setHoveredBarIndex(null)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  height: "100%",
                  cursor: "pointer",
                  position: "relative"
                }}
              >
                {/* Tooltip khi hover */}
                {isHovered && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      background: "var(--modal-bg)",
                      border: "1px solid var(--border-color)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                      borderRadius: "10px",
                      padding: "6px 10px",
                      fontSize: "0.75rem",
                      zIndex: 10,
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                      transform: "translateY(-50%)"
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "var(--text-main)", marginBottom: "2px" }}>
                      📅 {day.date}
                    </div>
                    <div style={{ color: "#3b82f6", fontWeight: 700 }}>
                      • Thành viên mới: {day.users}
                    </div>
                    <div style={{ color: "#10b981", fontWeight: 700 }}>
                      • Hồ sơ nộp: {day.applications}
                    </div>
                  </div>
                )}

                {/* Khung cặp cột */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", width: "100%", justifyContent: "center" }}>
                  {/* Cột User */}
                  {(activeGrowthSeries === "all" || activeGrowthSeries === "users") && (
                    <div
                      style={{
                        width: activeGrowthSeries === "all" ? "16px" : "32px",
                        height: `${userHeight}px`,
                        background: isHovered
                          ? "linear-gradient(180deg, #60a5fa, #2563eb)"
                          : "linear-gradient(180deg, #3b82f6, #1d4ed8)",
                        borderRadius: "8px 8px 0 0",
                        boxShadow: "0 4px 10px rgba(37, 99, 235, 0.3)",
                        transition: "all 0.25s ease",
                        position: "relative"
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "-18px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          color: "#3b82f6"
                        }}
                      >
                        {day.users > 0 ? day.users : ""}
                      </span>
                    </div>
                  )}

                  {/* Cột Hồ Sơ */}
                  {(activeGrowthSeries === "all" || activeGrowthSeries === "applications") && (
                    <div
                      style={{
                        width: activeGrowthSeries === "all" ? "16px" : "32px",
                        height: `${appHeight}px`,
                        background: isHovered
                          ? "linear-gradient(180deg, #34d399, #059669)"
                          : "linear-gradient(180deg, #10b981, #047857)",
                        borderRadius: "8px 8px 0 0",
                        boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)",
                        transition: "all 0.25s ease",
                        position: "relative"
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "-18px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          color: "#10b981"
                        }}
                      >
                        {day.applications > 0 ? day.applications : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Nhãn ngày trục X */}
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: isHovered ? "var(--text-main)" : "var(--text-muted)",
                    marginTop: "8px"
                  }}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

        {/* Chú giải biểu đồ (Legend) */}
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", fontWeight: 700 }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#3b82f6" }} />
            <span style={{ color: "var(--text-main)" }}>Thành viên mới đăng ký</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", fontWeight: 700 }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#10b981" }} />
            <span style={{ color: "var(--text-main)" }}>Hồ sơ đăng ký gia sư/PT nộp mới</span>
          </div>
        </div>
      </div>

      {/* 3. LƯỚI 2 CỘT: CƠ CẤU VAI TRÒ & TIẾN ĐỘ THẨM ĐỊNH HỒ SƠ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.6rem" }}>
        {/* CỘT A: CƠ CẤU PHÂN BỔ VAI TRÒ NGƯỜI DÙNG (DONUT CHART & LIST) */}
        <div
          className="glass-card"
          style={{
            background: "var(--card-bg)",
            borderRadius: "22px",
            padding: "1.6rem",
            border: "1px solid var(--border-color)",
            boxShadow: "6px 6px 16px var(--neu-shadow-dark), -6px -6px 16px var(--neu-shadow-light)"
          }}
        >
          <h4 style={{ margin: "0 0 1.2rem 0", fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>👥</span>
            <span>Cơ Cấu Phân Bổ Vai Trò ({totalUsers} Tài Khoản)</span>
          </h4>

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            {/* SVG Donut Chart */}
            <div style={{ position: "relative", width: "140px", height: "140px" }}>
              <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                {/* Background Ring */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="var(--neu-bg)"
                  strokeWidth="4"
                />
                {/* Segments */}
                {donutSegments.map((seg, sIdx) => (
                  <circle
                    key={sIdx}
                    cx="18"
                    cy="18"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="4.5"
                    strokeDasharray={seg.strokeDash}
                    strokeDashoffset={seg.strokeOffset}
                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                  />
                ))}
              </svg>
              {/* Tâm tròn Neumorphic */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center"
                }}
              >
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>
                  {totalUsers}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700 }}>
                  Thành viên
                </div>
              </div>
            </div>

            {/* Bảng phân tích chi tiết từng Role */}
            <div style={{ flex: 1, minWidth: "180px", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              {roleDist.map((item, idx) => {
                const percent = totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0;
                return (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color }} />
                        {item.label}
                      </span>
                      <span style={{ fontWeight: 800, color: item.color }}>
                        {item.count} ({percent}%)
                      </span>
                    </div>
                    {/* Progress Bar Neumorphic Inset */}
                    <div
                      style={{
                        height: "6px",
                        background: "var(--neu-bg)",
                        boxShadow: "inset 1px 1px 3px var(--neu-inset-dark)",
                        borderRadius: "10px",
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: "100%",
                          background: item.color,
                          borderRadius: "10px",
                          transition: "width 0.6s ease"
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CỘT B: TIẾN ĐỘ THẨM ĐỊNH & PHÊ DUYỆT HỒ SƠ */}
        <div
          className="glass-card"
          style={{
            background: "var(--card-bg)",
            borderRadius: "22px",
            padding: "1.6rem",
            border: "1px solid var(--border-color)",
            boxShadow: "6px 6px 16px var(--neu-shadow-dark), -6px -6px 16px var(--neu-shadow-light)"
          }}
        >
          <h4 style={{ margin: "0 0 1.2rem 0", fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>📑</span>
            <span>Tiến Độ Xử Lý Hồ Sơ Chuyên Môn ({totalApps} Đơn)</span>
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {appDist.map((item, idx) => {
              const percent = totalApps > 0 ? Math.round((item.count / totalApps) * 100) : 0;
              return (
                <div
                  key={idx}
                  style={{
                    background: "var(--neu-bg)",
                    boxShadow: "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)",
                    borderRadius: "14px",
                    padding: "0.85rem 1rem",
                    border: "1px solid var(--border-color)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color }} />
                      {item.label}
                    </span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 800, color: item.color }}>
                      {item.count} đơn ({percent}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: "8px",
                      background: "rgba(0,0,0,0.06)",
                      borderRadius: "10px",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        width: `${percent}%`,
                        height: "100%",
                        background: item.color,
                        borderRadius: "10px",
                        transition: "width 0.6s ease"
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Đánh giá hiệu suất duyệt */}
            <div
              style={{
                marginTop: "0.6rem",
                padding: "0.85rem 1rem",
                borderRadius: "14px",
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: "1.35rem", flexShrink: 0 }}>⚡</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#10b981", lineHeight: 1.3 }}>
                    TỶ LỆ PHÊ DUYỆT ĐẠT CHUẨN: {approvalRate}%
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px", lineHeight: 1.35 }}>
                    Hồ sơ được thẩm định chứng chỉ và cấp quyền nhanh chóng
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  color: "#059669",
                  background: "#ffffff",
                  padding: "0.35rem 0.8rem",
                  borderRadius: "20px",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  letterSpacing: "0.2px"
                }}
              >
                Rất Tốt
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
