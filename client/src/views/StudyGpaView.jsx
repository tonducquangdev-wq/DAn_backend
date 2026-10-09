import React, { useEffect, useState } from "react";
import { api } from "../services/api";

export const StudyGpaView = () => {
  const [gpaData, setGpaData] = useState(null);
  const [baiTaps, setBaiTaps] = useState([]);
  const [giaSus, setGiaSus] = useState([]);
  const [showMonModal, setShowMonModal] = useState(false);
  const [showBtModal, setShowBtModal] = useState(false);

  const [monForm, setMonForm] = useState({ ma_mon: "", ten_mon: "", so_tin_chi: 3, diem_so: "", giang_vien: "", phong_hoc: "" });
  const [btForm, setBtForm] = useState({ ten_bai_tap: "", han_nop: new Date().toISOString().slice(0, 10), do_uu_tien: "trung_binh" });

  const loadData = () => {
    api.getBaoCaoHocTap().then(res => res.success && setGpaData(res.data));
    api.getBaiTap().then(res => res.success && setBaiTaps(res.data));
    api.getGiaSu().then(res => res.success && setGiaSus(res.data));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMon = async (e) => {
    e.preventDefault();
    const res = await api.createMonHoc(monForm);
    if (res.success) {
      setShowMonModal(false);
      loadData();
    }
  };

  const handleCreateBt = async (e) => {
    e.preventDefault();
    const res = await api.createBaiTap(btForm);
    if (res.success) {
      setShowBtModal(false);
      loadData();
    }
  };

  return (
    <div>
      <div className="header-top">
        <div>
          <h1 className="page-title">🎓 Quản Lý Học Tập & Báo Cáo GPA</h1>
          <p className="page-subtitle">Tính toán tự động GPA hệ 10 & hệ 4 theo tín chỉ và quản lý deadline bài tập</p>
        </div>
        <div className="action-bar">
          <button className="btn-secondary" onClick={() => setShowBtModal(true)}>➕ Thêm Bài Tập</button>
          <button className="btn-primary" onClick={() => setShowMonModal(true)}>➕ Thêm Môn Học</button>
        </div>
      </div>

      {/* Widgets Thống Kê GPA */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>📊</div>
          <div>
            <div className="kpi-value">{gpaData?.gpa_he_4 || "0.00"}</div>
            <div className="kpi-label">Điểm Tích Lũy GPA (Hệ 4)</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>🏆</div>
          <div>
            <div className="kpi-value">{gpaData?.xep_loai || "Chưa có"}</div>
            <div className="kpi-label">Xếp Loại Học Lực</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" }}>📚</div>
          <div>
            <div className="kpi-value">{gpaData?.tong_tin_chi_co_diem || 0} / {gpaData?.tong_tin_chi || 0}</div>
            <div className="kpi-label">Tín Chỉ Đã Tích Lũy</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>📝</div>
          <div>
            <div className="kpi-value">{gpaData?.gpa_he_10 || "0.00"}</div>
            <div className="kpi-label">Điểm Trung Bình (Hệ 10)</div>
          </div>
        </div>
      </div>

      {/* Danh sách môn học */}
      <div className="glass-card" style={{ marginBottom: "28px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>📚 Danh Sách Môn Học</h3>
        {gpaData?.danh_sach_mon?.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Chưa có môn học nào được thêm.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  <th style={{ padding: "10px" }}>MÃ MÔN</th>
                  <th style={{ padding: "10px" }}>TÊN MÔN HỌC</th>
                  <th style={{ padding: "10px" }}>SỐ TÍN CHỈ</th>
                  <th style={{ padding: "10px" }}>ĐIỂM HỆ 10</th>
                  <th style={{ padding: "10px" }}>GIẢNG VIÊN</th>
                  <th style={{ padding: "10px" }}>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {gpaData?.danh_sach_mon?.map(m => (
                  <tr key={m._id} style={{ borderBottom: "1px solid var(--border-color)", fontSize: "0.9rem" }}>
                    <td style={{ padding: "12px", fontWeight: "700" }}>{m.ma_mon}</td>
                    <td style={{ padding: "12px" }}>{m.ten_mon}</td>
                    <td style={{ padding: "12px" }}>{m.so_tin_chi}</td>
                    <td style={{ padding: "12px", fontWeight: "700", color: "var(--primary)" }}>{m.diem_so !== null ? m.diem_so : "Chưa có"}</td>
                    <td style={{ padding: "12px" }}>{m.giang_vien || "-"}</td>
                    <td style={{ padding: "12px" }}>
                      <span className={`badge ${m.trang_thai === 'da_hoan_thanh' ? 'badge-success' : 'badge-primary'}`}>
                        {m.trang_thai}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gia sư gợi ý */}
      <div className="glass-card">
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>👩‍🏫 Gia Sư Hỗ Trợ Học Tập Gợi Ý</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {giaSus.map(gs => (
            <div key={gs._id} style={{ padding: "16px", borderRadius: "12px", background: "var(--bg-primary)" }}>
              <div style={{ fontWeight: "700", fontSize: "1rem" }}>{gs.ho_ten}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: "600", marginTop: "2px" }}>{gs.mon_hoc_chuyen_mon}</div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "8px" }}>{gs.mo_ta}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#f59e0b" }}>⭐ {gs.rating} / 5.0</span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{gs.gia_theo_gio.toLocaleString()} đ/h</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Môn học */}
      {showMonModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <h3>➕ Thêm Môn Học Mới</h3>
            <form onSubmit={handleCreateMon} style={{ marginTop: "16px" }}>
              <div className="form-group">
                <label>Mã môn</label>
                <input type="text" required value={monForm.ma_mon} onChange={e => setMonForm({ ...monForm, ma_mon: e.target.value })} placeholder="CS101" />
              </div>
              <div className="form-group">
                <label>Tên môn học</label>
                <input type="text" required value={monForm.ten_mon} onChange={e => setMonForm({ ...monForm, ten_mon: e.target.value })} placeholder="Cấu trúc dữ liệu & Giải thuật" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Số tín chỉ</label>
                  <input type="number" required min="1" max="20" value={monForm.so_tin_chi} onChange={e => setMonForm({ ...monForm, so_tin_chi: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Điểm số (Thang 10, nếu có)</label>
                  <input type="number" step="0.1" min="0" max="10" value={monForm.diem_so} onChange={e => setMonForm({ ...monForm, diem_so: e.target.value })} placeholder="8.5" />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowMonModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu Môn Học</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
