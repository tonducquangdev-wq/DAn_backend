import React, { useEffect, useState } from "react";
import { api } from "../services/api";

export const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tieu_de: "",
    loai_su_kien: "hoc-tap",
    thoi_gian_bat_dau: new Date().toISOString().slice(0, 16),
    thoi_gian_ket_thuc: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    dia_diem: "",
    mo_ta: "",
    mau_sac: "#3b82f6",
    quy_tac_lap: "once"
  });

  const loadEvents = () => {
    api.getSuKien().then(res => {
      if (res.success) setEvents(res.data);
    });
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await api.createSuKien(formData);
    if (res.success) {
      setShowModal(false);
      loadEvents();
    } else {
      alert(res.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa sự kiện này?")) {
      await api.deleteSuKien(id);
      loadEvents();
    }
  };

  return (
    <div>
      <div className="header-top">
        <div>
          <h1 className="page-title">📅 Lịch Cá Nhân & Sự Kiện</h1>
          <p className="page-subtitle">Quản lý lịch học tập, tập gym, deadline và công việc hàng ngày</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          ➕ Thêm Sự Kiện Mới
        </button>
      </div>

      {/* Grid Danh sách Sự kiện */}
      <div className="glass-card">
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "20px" }}>Danh Sách Sự Kiện</h3>
        {events.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Chưa có sự kiện nào. Hãy nhấn "Thêm Sự Kiện Mới" ở trên!</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {events.map(ev => (
              <div key={ev._id} style={{ padding: "16px", borderRadius: "12px", background: "var(--bg-primary)", borderLeft: `5px solid ${ev.mau_sac || "#3b82f6"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span className="badge badge-primary">{ev.loai_su_kien}</span>
                  <button onClick={() => handleDelete(ev._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>🗑️</button>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: "700", margin: "10px 0 6px 0" }}>{ev.tieu_de}</h4>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  ⏰ {new Date(ev.thoi_gian_bat_dau).toLocaleString()}
                </div>
                {ev.dia_diem && <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>📍 {ev.dia_diem}</div>}
                {ev.quy_tac_lap !== 'once' && <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "6px", fontWeight: "600" }}>🔄 Lặp lại: {ev.quy_tac_lap}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Thêm sự kiện */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "16px" }}>➕ Thêm Sự Kiện Mới</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Tiêu đề sự kiện</label>
                <input type="text" required value={formData.tieu_de} onChange={e => setFormData({ ...formData, tieu_de: e.target.value })} placeholder="Ví dụ: Ôn thi môn Lập trình Web" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Loại sự kiện</label>
                  <select value={formData.loai_su_kien} onChange={e => setFormData({ ...formData, loai_su_kien: e.target.value })}>
                    <option value="hoc-tap">📚 Học tập</option>
                    <option value="tap-luyen">🏋️ Tập luyện Gym</option>
                    <option value="deadline">🚨 Deadline</option>
                    <option value="ca-nhan">☕ Cá nhân</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Quy tắc lặp lại</label>
                  <select value={formData.quy_tac_lap} onChange={e => setFormData({ ...formData, quy_tac_lap: e.target.value })}>
                    <option value="once">Không lặp lại</option>
                    <option value="daily">Hàng ngày</option>
                    <option value="weekly">Hàng tuần</option>
                    <option value="monthly">Hàng tháng</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Thời gian bắt đầu</label>
                  <input type="datetime-local" required value={formData.thoi_gian_bat_dau} onChange={e => setFormData({ ...formData, thoi_gian_bat_dau: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Thời gian kết thúc</label>
                  <input type="datetime-local" required value={formData.thoi_gian_ket_thuc} onChange={e => setFormData({ ...formData, thoi_gian_ket_thuc: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Địa điểm (nếu có)</label>
                <input type="text" value={formData.dia_diem} onChange={e => setFormData({ ...formData, dia_diem: e.target.value })} placeholder="Phòng B302 hoặc Online Zoom" />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu Sự Kiện</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
