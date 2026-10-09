import React, { useEffect, useState } from "react";
import { api } from "../services/api";

export const DashboardView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(res => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Đang nạp số liệu Dashboard...</div>;

  return (
    <div>
      <div className="header-top">
        <div>
          <h1 className="page-title">Tổng Quan Dashboard</h1>
          <p className="page-subtitle">Theo dõi lịch trình, deadline, môn học và luyện tập hôm nay</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>📅</div>
          <div>
            <div className="kpi-value">{data?.su_kien_hom_nay?.length || 0}</div>
            <div className="kpi-label">Sự kiện hôm nay</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>⏳</div>
          <div>
            <div className="kpi-value">{data?.deadline_sap_toi?.length || 0}</div>
            <div className="kpi-label">Deadline sắp đến hạn</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>🎓</div>
          <div>
            <div className="kpi-value">{data?.so_mon_dang_hoc || 0}</div>
            <div className="kpi-label">Môn học đang diễn ra</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(236, 72, 153, 0.15)", color: "#ec4899" }}>🏋️</div>
          <div>
            <div className="kpi-value">{data?.so_buoi_tap_da_xong || 0}</div>
            <div className="kpi-label">Buổi tập Gym đã hoàn thành</div>
          </div>
        </div>
      </div>

      {/* Grid 2 cột */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Sự kiện hôm nay */}
        <div className="glass-card">
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            📅 Lịch Trình Hôm Nay
          </h3>
          {data?.su_kien_hom_nay?.length === 0 ? (
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontStyle: "italic" }}>Hôm nay không có sự kiện nào.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data?.su_kien_hom_nay?.map(sk => (
                <div key={sk._id} style={{ padding: "12px 16px", borderRadius: "10px", background: "var(--bg-primary)", borderLeft: `4px solid ${sk.mau_sac || "#3b82f6"}` }}>
                  <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>{sk.tieu_de}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    ⏰ {new Date(sk.thoi_gian_bat_dau).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(sk.thoi_gian_ket_thuc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | 📍 {sk.dia_diem || "Chưa có địa điểm"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deadline sắp tới */}
        <div className="glass-card">
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            🚨 Bài Tập & Deadline Sắp Tới
          </h3>
          {data?.deadline_sap_toi?.length === 0 ? (
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontStyle: "italic" }}>Tất cả deadline đã được hoàn thành!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data?.deadline_sap_toi?.map(bt => (
                <div key={bt._id} style={{ padding: "12px 16px", borderRadius: "10px", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>{bt.ten_bai_tap}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      Môn: {bt.mon_hoc_id?.ten_mon || "Bài tập chung"} | 📅 {new Date(bt.han_nop).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`badge ${bt.do_uu_tien === 'cao' ? 'badge-danger' : 'badge-warning'}`}>
                    Ưu tiên {bt.do_uu_tien}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
