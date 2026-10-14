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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        {duAns.map(da => (
          <div key={da._id} className="glass-card" style={{ borderLeft: `6px solid ${da.mau_sac || "var(--primary)"}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h4 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-main)" }}>{da.ten_du_an}</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "8px", lineHeight: "1.4" }}>
                {da.mo_ta || "Chưa có mô tả dự án"}
              </p>
            </div>
            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="badge badge-primary">{da.trang_thai}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Active Project</span>
            </div>
          </div>
        ))}
      </div>

      {/* Danh sách Task / Todo */}
      <div className="glass-card">
        <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
          ✅ Danh Sách Công Việc (Tasks)
        </h3>
        {tasks.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>Chưa có công việc nào được tạo.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {tasks.map(t => (
              <div key={t._id} className="today-event-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <input
                    type="checkbox"
                    checked={t.trang_thai === "hoan_thanh"}
                    onChange={() => toggleTaskStatus(t)}
                    style={{ width: "22px", height: "22px", cursor: "pointer", accentColor: "var(--primary)" }}
                  />
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "0.95rem", textDecoration: t.trang_thai === "hoan_thanh" ? "line-through" : "none", color: t.trang_thai === "hoan_thanh" ? "var(--text-muted)" : "var(--text-main)" }}>
                      {t.tieu_de}
                    </div>
                    {t.du_an_id && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        📁 Dự án: <span style={{ fontWeight: "600", color: "var(--primary)" }}>{t.du_an_id.ten_du_an}</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className={`badge ${t.do_uu_tien === 'cao' ? 'badge-danger' : 'badge-warning'}`}>
                  Ưu tiên {t.do_uu_tien}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dự án */}
      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "8px" }}>➕ Tạo Dự Án Mới</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>Tạo không gian dự án để tổ chức các công việc liên quan</p>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Tên dự án</label>
                <input type="text" required value={projectForm.ten_du_an} onChange={e => setProjectForm({ ...projectForm, ten_du_an: e.target.value })} placeholder="Ví dụ: Lập trình Website Cá Nhân" />
              </div>
              <div className="form-group">
                <label>Mô tả ngắn</label>
                <textarea rows="3" value={projectForm.mo_ta} onChange={e => setProjectForm({ ...projectForm, mo_ta: e.target.value })} placeholder="Mô tả mục tiêu của dự án..." />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
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
          <div className="modal-content">
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "8px" }}>➕ Thêm Công Việc Mới</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>Tạo nhiệm vụ công việc cần xử lý</p>
            <form onSubmit={handleCreateTask}>
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
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
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
