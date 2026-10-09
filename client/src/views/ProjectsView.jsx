import React, { useEffect, useState } from "react";
import { api } from "../services/api";

export const ProjectsView = () => {
  const [duAns, setDuAns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const [projectForm, setProjectForm] = useState({ ten_du_an: "", mo_ta: "", mau_sac: "#6366f1" });
  const [taskForm, setTaskForm] = useState({ tieu_de: "", du_an_id: "", do_uu_tien: "trung_binh" });

  const loadData = () => {
    api.getDuAn().then(res => res.success && setDuAns(res.data));
    api.getCongViec().then(res => res.success && setTasks(res.data));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const res = await api.createDuAn(projectForm);
    if (res.success) {
      setShowProjectModal(false);
      loadData();
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const res = await api.createCongViec(taskForm);
    if (res.success) {
      setShowTaskModal(false);
      loadData();
    }
  };

  const toggleTaskStatus = async (task) => {
    const nextStatus = task.trang_thai === "hoan_thanh" ? "chua_lam" : "hoan_thanh";
    await api.updateCongViec(task._id, { trang_thai: nextStatus });
    loadData();
  };

  return (
    <div>
      <div className="header-top">
        <div>
          <h1 className="page-title">📋 Quản Lý Dự Án & Công Việc</h1>
          <p className="page-subtitle">Quản lý danh mục các dự án cá nhân và công việc dạng Todo / Task</p>
        </div>
        <div className="action-bar">
          <button className="btn-secondary" onClick={() => setShowTaskModal(true)}>➕ Thêm Task Mới</button>
          <button className="btn-primary" onClick={() => setShowProjectModal(true)}>➕ Tạo Dự Án Mới</button>
        </div>
      </div>

      {/* Danh sách Dự án */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {duAns.map(da => (
          <div key={da._id} className="glass-card" style={{ borderLeft: `5px solid ${da.mau_sac || "#6366f1"}` }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "800" }}>{da.ten_du_an}</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "6px" }}>{da.mo_ta || "Chưa có mô tả dự án"}</p>
            <div style={{ marginTop: "12px" }}>
              <span className="badge badge-primary">{da.trang_thai}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Danh sách Task / Todo */}
      <div className="glass-card">
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>✅ Danh Sách Công Việc (Tasks)</h3>
        {tasks.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Chưa có công việc nào được tạo.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {tasks.map(t => (
              <div key={t._id} style={{ padding: "14px 18px", borderRadius: "12px", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <input
                    type="checkbox"
                    checked={t.trang_thai === "hoan_thanh"}
                    onChange={() => toggleTaskStatus(t)}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  />
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "1rem", textDecoration: t.trang_thai === "hoan_thanh" ? "line-through" : "none", color: t.trang_thai === "hoan_thanh" ? "var(--text-muted)" : "var(--text-main)" }}>
                      {t.tieu_de}
                    </div>
                    {t.du_an_id && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>Dự án: {t.du_an_id.ten_du_an}</div>}
                  </div>
                </div>
                <span className={`badge ${t.do_uu_tien === 'cao' ? 'badge-danger' : 'badge-warning'}`}>
                  {t.do_uu_tien}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dự án */}
      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <h3>➕ Tạo Dự Án Mới</h3>
            <form onSubmit={handleCreateProject} style={{ marginTop: "16px" }}>
              <div className="form-group">
                <label>Tên dự án</label>
                <input type="text" required value={projectForm.ten_du_an} onChange={e => setProjectForm({ ...projectForm, ten_du_an: e.target.value })} placeholder="Ví dụ: Lập trình Website Cá Nhân" />
              </div>
              <div className="form-group">
                <label>Mô tả ngắn</label>
                <textarea rows="3" value={projectForm.mo_ta} onChange={e => setProjectForm({ ...projectForm, mo_ta: e.target.value })} placeholder="Mô tả mục tiêu của dự án..." />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowProjectModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu Dự Án</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Task */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <h3>➕ Thêm Công Việc Mới</h3>
            <form onSubmit={handleCreateTask} style={{ marginTop: "16px" }}>
              <div className="form-group">
                <label>Tiêu đề công việc</label>
                <input type="text" required value={taskForm.tieu_de} onChange={e => setTaskForm({ ...taskForm, tieu_de: e.target.value })} placeholder="Thiết kế giao diện bằng Figma" />
              </div>
              <div className="form-group">
                <label>Thuộc Dự án (nếu có)</label>
                <select value={taskForm.du_an_id} onChange={e => setTaskForm({ ...taskForm, du_an_id: e.target.value })}>
                  <option value="">-- Không thuộc dự án nào --</option>
                  {duAns.map(d => <option key={d._id} value={d._id}>{d.ten_du_an}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
