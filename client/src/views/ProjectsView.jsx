import React, { useEffect, useState, useMemo } from "react";
import { api } from "../services/api";

const PRESET_COLORS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Xanh biển", hex: "#3b82f6" },
  { name: "Xanh lá", hex: "#10b981" },
  { name: "Hổ phách", hex: "#f59e0b" },
  { name: "Đỏ hồng", hex: "#ef4444" },
  { name: "Tím", hex: "#8b5cf6" },
  { name: "Hồng đào", hex: "#ec4899" }
];

const DAYS_OF_WEEK = [
  { day: 1, label: "T2", fullName: "Thứ 2" },
  { day: 2, label: "T3", fullName: "Thứ 3" },
  { day: 3, label: "T4", fullName: "Thứ 4" },
  { day: 4, label: "T5", fullName: "Thứ 5" },
  { day: 5, label: "T6", fullName: "Thứ 6" },
  { day: 6, label: "T7", fullName: "Thứ 7" },
  { day: 0, label: "CN", fullName: "Chủ Nhật" }
];

export const ProjectsView = () => {
  // Tabs chính: 'projects' (Dự án & Tasks) | 'shifts' (Setup Lịch làm & Lương Part-time)
  const [activeTab, setActiveTab] = useState("projects");

  const [duAns, setDuAns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [shiftStats, setShiftStats] = useState({});
  const [selectedShiftProject, setSelectedShiftProject] = useState("all");

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSingleShiftModal, setShowSingleShiftModal] = useState(false);
  const [showBulkShiftModal, setShowBulkShiftModal] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Form Dự Án
  const [projectForm, setProjectForm] = useState({
    ten_du_an: "",
    mo_ta: "",
    loai_du_an: "part_time",
    luong_theo_gio: "",
    luong_co_ban: "",
    dia_chi: "",
    mau_sac: "#6366f1",
    ngay_bat_dau: new Date().toISOString().split("T")[0],
    ngay_ket_thuc: ""
  });

  // Form Task Todo
  const [taskForm, setTaskForm] = useState({
    tieu_de: "",
    du_an_id: "",
    mo_ta: "",
    do_uu_tien: "trung_binh",
    han_chot: ""
  });

  // Form Ca Làm Nhanh (Đơn lẻ)
  const [singleShiftForm, setSingleShiftForm] = useState({
    du_an_id: "",
    tieu_de: "",
    ngay_lam: new Date().toISOString().split("T")[0],
    gio_bat_dau: "08:00",
    gio_ket_thuc: "12:00",
    luong_theo_gio: "",
    dia_diem: "",
    ghi_chu: ""
  });

  // Form Setup Lịch Tuần (Hàng loạt)
  const [bulkShiftForm, setBulkShiftForm] = useState({
    du_an_id: "",
    tieu_de: "",
    days_of_week: [1, 3, 5], // Mặc định T2, T4, T6
    gio_bat_dau: "08:00",
    gio_ket_thuc: "12:00",
    luong_theo_gio: "",
    tu_ngay: new Date().toISOString().split("T")[0],
    den_ngay: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    dia_diem: "",
    ghi_chu: ""
  });

  // Tính số giờ giữa 2 khung giờ HH:mm
  const calculateShiftHours = (start, end) => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(":").map(Number);
    const [h2, m2] = end.split(":").map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff <= 0) diff += 24 * 60;
    return Math.round((diff / 60) * 10) / 10;
  };

  const singleShiftPreview = useMemo(() => {
    const hours = calculateShiftHours(singleShiftForm.gio_bat_dau, singleShiftForm.gio_ket_thuc);
    const rate = Number(singleShiftForm.luong_theo_gio) || 0;
    return {
      hours,
      totalSalary: Math.round(hours * rate)
    };
  }, [singleShiftForm.gio_bat_dau, singleShiftForm.gio_ket_thuc, singleShiftForm.luong_theo_gio]);

  const bulkShiftPreview = useMemo(() => {
    const hoursPerShift = calculateShiftHours(bulkShiftForm.gio_bat_dau, bulkShiftForm.gio_ket_thuc);
    const rate = Number(bulkShiftForm.luong_theo_gio) || 0;
    const salaryPerShift = Math.round(hoursPerShift * rate);
    const numDays = bulkShiftForm.days_of_week?.length || 0;
    return {
      hoursPerShift,
      salaryPerShift,
      weeklySalary: salaryPerShift * numDays
    };
  }, [bulkShiftForm.gio_bat_dau, bulkShiftForm.gio_ket_thuc, bulkShiftForm.luong_theo_gio, bulkShiftForm.days_of_week]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Nạp dữ liệu
  const loadData = () => {
    api.getDuAn().then((res) => {
      if (res.success) {
        setDuAns(res.data || []);
      }
    });
    api.getCongViec().then((res) => {
      if (res.success) {
        setTasks(res.data || []);
      }
    });
    loadShifts();
  };

  const loadShifts = () => {
    const query = selectedShiftProject !== "all" ? `?du_an_id=${selectedShiftProject}` : "";
    api.getCaLamViec(query).then((res) => {
      if (res.success) {
        setShifts(res.data || []);
        setShiftStats(res.stats || {});
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadShifts();
  }, [selectedShiftProject]);

  // Các dự án Part-time
  const partTimeProjects = useMemo(() => {
    return duAns.filter((d) => d.loai_du_an === "part_time");
  }, [duAns]);

  // Handler mở Modal Dự Án (Tạo mới)
  const handleOpenProjectModal = () => {
    setEditingProject(null);
    setProjectForm({
      ten_du_an: "",
      mo_ta: "",
      loai_du_an: "part_time",
      luong_theo_gio: "",
      luong_co_ban: "",
      dia_chi: "",
      mau_sac: "#6366f1",
      ngay_bat_dau: new Date().toISOString().split("T")[0],
      ngay_ket_thuc: ""
    });
    setShowProjectModal(true);
  };

  // Handler mở Modal Dự Án (Chỉnh sửa)
  const handleOpenEditProjectModal = (da) => {
    setEditingProject(da);
    setProjectForm({
      ten_du_an: da.ten_du_an || "",
      mo_ta: da.mo_ta || "",
      loai_du_an: da.loai_du_an || "part_time",
      luong_theo_gio: da.luong_theo_gio !== undefined ? da.luong_theo_gio : "",
      luong_co_ban: da.luong_co_ban !== undefined ? da.luong_co_ban : "",
      dia_chi: da.dia_chi || "",
      mau_sac: da.mau_sac || "#6366f1",
      ngay_bat_dau: da.ngay_bat_dau ? da.ngay_bat_dau.split("T")[0] : "",
      ngay_ket_thuc: da.ngay_ket_thuc ? da.ngay_ket_thuc.split("T")[0] : ""
    });
    setShowProjectModal(true);
  };

  // Handler mở Modal Task
  const handleOpenTaskModal = (defaultProjectId = "") => {
    setTaskForm({
      tieu_de: "",
      du_an_id: defaultProjectId,
      mo_ta: "",
      do_uu_tien: "trung_binh",
      han_chot: ""
    });
    setShowTaskModal(true);
  };

  // Handler mở Modal Ca Làm Nhanh
  const handleOpenSingleShiftModal = (defaultProjectId = "") => {
    const pId = defaultProjectId || (partTimeProjects[0]?._id || "");
    const selectedProj = duAns.find((d) => d._id === pId);
    setSingleShiftForm({
      du_an_id: pId,
      tieu_de: "",
      ngay_lam: new Date().toISOString().split("T")[0],
      gio_bat_dau: "08:00",
      gio_ket_thuc: "12:00",
      luong_theo_gio: selectedProj?.luong_theo_gio !== undefined ? selectedProj.luong_theo_gio : "",
      dia_diem: selectedProj?.dia_chi || "",
      ghi_chu: ""
    });
    setShowSingleShiftModal(true);
  };

  // Handler mở Modal Bulk Shift
  const handleOpenBulkShiftModal = () => {
    const pId = partTimeProjects[0]?._id || "";
    const selectedProj = duAns.find((d) => d._id === pId);
    setBulkShiftForm({
      du_an_id: pId,
      tieu_de: "",
      days_of_week: [1, 3, 5],
      gio_bat_dau: "08:00",
      gio_ket_thuc: "12:00",
      luong_theo_gio: selectedProj?.luong_theo_gio !== undefined ? selectedProj.luong_theo_gio : "",
      tu_ngay: new Date().toISOString().split("T")[0],
      den_ngay: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      dia_diem: selectedProj?.dia_chi || "",
      ghi_chu: ""
    });
    setShowBulkShiftModal(true);
  };

  // Lưu Dự Án (Tạo mới hoặc Cập nhật)
  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectForm.ten_du_an.trim()) {
      showToast("Vui lòng nhập tên nơi làm việc / dự án", "danger");
      return;
    }

    if (editingProject) {
      const res = await api.updateDuAn(editingProject._id, projectForm);
      if (res.success) {
        setShowProjectModal(false);
        setEditingProject(null);
        showToast("Cập nhật dự án thành công và đã đồng bộ lên Lịch! 🎉", "success");
        loadData();
      } else {
        showToast(res.message || "Lỗi cập nhật dự án", "danger");
      }
    } else {
      const res = await api.createDuAn(projectForm);
      if (res.success) {
        setShowProjectModal(false);
        showToast("Tạo dự án thành công và đã tự động đồng bộ vào Lịch! 📅", "success");
        loadData();
      } else {
        showToast(res.message || "Lỗi tạo dự án", "danger");
      }
    }
  };

  // Xóa Dự Án
  const handleDeleteProject = async (id, ten) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${ten}"? Tất cả công việc và ca làm việc trên lịch sẽ bị xóa.`)) {
      const res = await api.deleteDuAn(id);
      if (res.success) {
        showToast("Đã xóa dự án thành công", "success");
        loadData();
      } else {
        showToast(res.message || "Lỗi xóa dự án", "danger");
      }
    }
  };

  // Tạo Task Mới
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.tieu_de.trim()) {
      showToast("Vui lòng nhập tiêu đề công việc", "danger");
      return;
    }
    const res = await api.createCongViec(taskForm);
    if (res.success) {
      setShowTaskModal(false);
      showToast("Thêm công việc thành công và đã đồng bộ vào Lịch! ⏰", "success");
      loadData();
    } else {
      showToast(res.message || "Lỗi thêm công việc", "danger");
    }
  };

  // Xóa Task
  const handleDeleteTask = async (id, tieuDe) => {
    if (window.confirm(`Xóa công việc "${tieuDe}"? Sự kiện trên lịch cũng sẽ được gỡ bỏ.`)) {
      const res = await api.deleteCongViec(id);
      if (res.success) {
        showToast("Đã xóa công việc khỏi danh sách và Lịch", "success");
        loadData();
      } else {
        showToast(res.message || "Lỗi xóa công việc", "danger");
      }
    }
  };

  // Toggle trạng thái Task
  const toggleTaskStatus = async (task) => {
    const nextStatus = task.trang_thai === "hoan_thanh" ? "chua_lam" : "hoan_thanh";
    const res = await api.updateCongViec(task._id, { trang_thai: nextStatus });
    if (res.success) {
      showToast(
        nextStatus === "hoan_thanh" ? "Đã đánh dấu hoàn thành task! ✅" : "Đã mở lại task",
        "success"
      );
      loadData();
    }
  };

  // Tạo Ca Làm Đơn Lẻ
  const handleCreateSingleShift = async (e) => {
    e.preventDefault();
    if (!singleShiftForm.du_an_id) {
      showToast("Vui lòng chọn nơi làm việc", "danger");
      return;
    }
    const res = await api.createCaLamViec(singleShiftForm);
    if (res.success) {
      setShowSingleShiftModal(false);
      showToast("Đã thêm ca làm việc và đồng bộ lên Lịch! 🏪", "success");
      loadShifts();
    } else {
      showToast(res.message || "Lỗi thêm ca làm việc", "danger");
    }
  };

  // Setup Lịch Tuần Hàng Loạt
  const handleCreateBulkShift = async (e) => {
    e.preventDefault();
    if (!bulkShiftForm.du_an_id) {
      showToast("Vui lòng chọn nơi làm việc", "danger");
      return;
    }
    if (bulkShiftForm.days_of_week.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 thứ trong tuần", "danger");
      return;
    }
    const res = await api.bulkCreateCaLamViec(bulkShiftForm);
    if (res.success) {
      setShowBulkShiftModal(false);
      showToast(res.message || "Đã thiết lập lịch làm hàng loạt thành công! 🎉", "success");
      loadShifts();
    } else {
      showToast(res.message || "Lỗi thiết lập lịch", "danger");
    }
  };

  // Xóa Ca Làm
  const handleDeleteShift = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa ca làm này? Sự kiện trên lịch cũng sẽ được gỡ bỏ.")) {
      const res = await api.deleteCaLamViec(id);
      if (res.success) {
        showToast("Đã xóa ca làm việc", "success");
        loadShifts();
      } else {
        showToast(res.message || "Lỗi xóa ca làm", "danger");
      }
    }
  };

  // Đổi trạng thái ca làm (da_hoan_thanh, chua_den, nghi_phep)
  const handleChangeShiftStatus = async (shift, targetStatus) => {
    const res = await api.updateCaLamViec(shift._id, { trang_thai: targetStatus });
    if (res.success) {
      if (targetStatus === "da_hoan_thanh") {
        showToast(`Đã hoàn thành ca và cộng ${Number(shift.tien_luong_ca || 0).toLocaleString("vi-VN")}đ vào lương! 💰`, "success");
      } else if (targetStatus === "nghi_phep") {
        showToast("Đã đánh dấu nghỉ phép ca này 🛌 (Không tính lương)", "warning");
      } else {
        showToast("Đã chuyển ca sang trạng thái sắp tới ⏳", "success");
      }
      loadShifts();
    } else {
      showToast(res.message || "Lỗi cập nhật ca làm", "danger");
    }
  };

  const handleToggleShiftStatus = async (shift) => {
    const nextStatus = shift.trang_thai === "nghi_phep" ? "chua_den" : "nghi_phep";
    handleChangeShiftStatus(shift, nextStatus);
  };



  // Format Helper
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const formatDateTimeDisplay = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 10001,
            padding: "14px 22px",
            borderRadius: "14px",
            background: toast.type === "success" ? "#10b981" : "#ef4444",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "0.9rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Top */}
      <div className="header-top mb-3">
        <div>
          <h1 className="page-title mb-0">💼 Quản Lý Việc Làm, Dự Án & Tasks</h1>
        </div>
        <div className="action-bar">
          {activeTab === "projects" ? (
            <>
              <button className="btn-secondary" onClick={() => handleOpenTaskModal()}>
                ➕ Thêm Task Mới
              </button>
              <button className="btn-primary" onClick={handleOpenProjectModal}>
                ➕ Tạo Dự Án / Việc Làm Mới
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => handleOpenSingleShiftModal()}>
                ➕ Thêm 1 Ca Làm
              </button>
              <button className="btn-primary" onClick={handleOpenBulkShiftModal}>
                ⚡ Setup Lịch Tuần (Hàng Loạt)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Segmented Navigation Tab Bar (Thiết kế viền dịu nhẹ, êm mắt, không chói) */}
      <div className="project-nav-tabs-bar">
        <button
          className={`project-nav-tab-btn ${activeTab === "projects" ? "active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          <span>📁</span> Danh Sách Dự Án & Tasks
        </button>
        <button
          className={`project-nav-tab-btn ${activeTab === "shifts" ? "active" : ""}`}
          onClick={() => setActiveTab("shifts")}
        >
          <span>🏪</span> Setup Lịch Làm & Lương Part-time
        </button>
      </div>

      {/* ============================================================
          TAB 1: QUẢN LÝ DỰ ÁN & TASKS TODO
          ============================================================ */}
      {activeTab === "projects" && (
        <>
          {/* Danh sách Dự án / Nơi làm việc */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                🏢 Nơi Làm Việc & Dự Án ({duAns.length})
              </h3>
            </div>

            {duAns.length === 0 ? (
              <div className="glass-card text-center py-4" style={{ color: "var(--text-muted)" }}>
                <p style={{ margin: "0 0 10px 0" }}>Chưa có dự án hoặc việc làm nào. Bấm "Tạo Dự Án / Việc Làm Mới" để bắt đầu.</p>
                <button className="btn-primary" style={{ fontSize: "0.85rem", padding: "6px 16px" }} onClick={handleOpenProjectModal}>
                  + Tạo Việc Làm / Dự Án Đầu Tiên
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "20px"
                }}
              >
                {duAns.map((da) => {
                  const isPartTime = da.loai_du_an === "part_time";
                  const isFullTime = da.loai_du_an === "cong_viec_chinh";

                  return (
                    <div
                      key={da._id}
                      className="glass-card"
                      style={{
                        borderLeft: `6px solid ${da.mau_sac || "var(--primary)"}`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        position: "relative"
                      }}
                    >
                      <div>
                        {/* Header card */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                          <div>
                            <span
                              className="badge"
                              style={{
                                fontSize: "0.72rem",
                                marginBottom: "6px",
                                display: "inline-block",
                                background: isPartTime ? "rgba(245, 158, 11, 0.15)" : isFullTime ? "rgba(59, 130, 246, 0.15)" : "rgba(139, 92, 246, 0.15)",
                                color: isPartTime ? "#f59e0b" : isFullTime ? "#3b82f6" : "#8b5cf6"
                              }}
                            >
                              {isPartTime ? "🏪 Việc Part-time" : isFullTime ? "🏢 Công việc chính" : "📁 Dự án tự do"}
                            </span>
                            <h4 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                              {da.ten_du_an}
                            </h4>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                            <button
                              type="button"
                              title="Chỉnh sửa dự án"
                              onClick={() => handleOpenEditProjectModal(da)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                fontSize: "0.95rem",
                                padding: "2px 6px",
                                borderRadius: "6px"
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              title="Xóa dự án"
                              onClick={() => handleDeleteProject(da._id, da.ten_du_an)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                fontSize: "0.95rem",
                                padding: "2px 6px",
                                borderRadius: "6px"
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Thông tin Lương & Địa chỉ */}
                        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {isPartTime && (
                            <div style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: 700 }}>
                              💰 Lương: {Number(da.luong_theo_gio || 0).toLocaleString("vi-VN")} đ / giờ
                            </div>
                          )}

                          {isFullTime && (
                            <div style={{ fontSize: "0.85rem", color: "#3b82f6", fontWeight: 700 }}>
                              💼 Lương cơ bản: {Number(da.luong_co_ban || 0).toLocaleString("vi-VN")} đ / tháng
                            </div>
                          )}

                          {da.dia_chi && (
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                              <span>📍</span>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {da.dia_chi}
                              </span>
                            </div>
                          )}

                          {da.ngay_bat_dau && (
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                              <span>📅</span>
                              <span>Bắt đầu từ: {formatDateDisplay(da.ngay_bat_dau)}</span>
                            </div>
                          )}
                        </div>

                        <p
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--text-muted)",
                            marginTop: "8px",
                            lineHeight: "1.4"
                          }}
                        >
                          {da.mo_ta || "Chưa có mô tả chi tiết."}
                        </p>
                      </div>

                      {/* Footer card */}
                      <div
                        style={{
                          marginTop: "16px",
                          paddingTop: "12px",
                          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          flexWrap: "wrap",
                          gap: "8px"
                        }}
                      >
                        <div style={{ display: "flex", gap: "6px" }}>
                          {isPartTime && (
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ fontSize: "0.75rem", padding: "4px 10px", height: "auto" }}
                              onClick={() => {
                                setSelectedShiftProject(da._id);
                                setActiveTab("shifts");
                              }}
                            >
                              📅 Xem Lịch Ca
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "4px 10px", height: "auto" }}
                            onClick={() => handleOpenTaskModal(da._id)}
                          >
                            + Thêm Task
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Danh sách Task / Todo */}
          <div className="glass-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                ✅ Danh Sách Công Việc (Tasks) ({tasks.length})
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Tick checkbox để đánh dấu hoàn thành (sẽ tự cập nhật trên Lịch)
              </span>
            </div>

            {tasks.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "30px 0" }}>
                Chưa có công việc nào được tạo. Hãy bấm "Thêm Task Mới".
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {tasks.map((t) => {
                  const isDone = t.trang_thai === "hoan_thanh";
                  return (
                    <div
                      key={t._id}
                      className="today-event-item"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        opacity: isDone ? 0.72 : 1,
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggleTaskStatus(t)}
                          style={{
                            width: "22px",
                            height: "22px",
                            cursor: "pointer",
                            accentColor: "var(--primary)",
                            flexShrink: 0
                          }}
                          title="Đánh dấu trạng thái"
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: "700",
                              fontSize: "0.95rem",
                              textDecoration: isDone ? "line-through" : "none",
                              color: isDone ? "var(--text-muted)" : "var(--text-main)"
                            }}
                          >
                            {t.tieu_de}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginTop: "4px" }}>
                            {t.du_an_id && (
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                📁 Nơi làm / Dự án:{" "}
                                <span
                                  style={{
                                    fontWeight: "600",
                                    color: t.du_an_id.mau_sac || "var(--primary)"
                                  }}
                                >
                                  {t.du_an_id.ten_du_an}
                                </span>
                              </div>
                            )}

                            {t.han_chot && (
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: isDone ? "var(--text-muted)" : "#f59e0b",
                                  fontWeight: 600,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                <span>⏰ Hạn chót:</span>
                                <span>{formatDateTimeDisplay(t.han_chot)}</span>
                              </div>
                            )}

                            <span
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--text-muted)",
                                background: "rgba(255,255,255,0.06)",
                                padding: "2px 8px",
                                borderRadius: "4px"
                              }}
                            >
                              🗓️ Đồng bộ lịch
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        <span
                          className={`badge ${
                            t.do_uu_tien === "cao"
                              ? "badge-danger"
                              : t.do_uu_tien === "thap"
                              ? "badge-success"
                              : "badge-warning"
                          }`}
                        >
                          {t.do_uu_tien === "cao"
                            ? "Ưu tiên cao"
                            : t.do_uu_tien === "thap"
                            ? "Ưu tiên thấp"
                            : "Ưu tiên trung bình"}
                        </span>

                        <button
                          type="button"
                          title="Xóa công việc"
                          onClick={() => handleDeleteTask(t._id, t.tieu_de)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            fontSize: "0.95rem",
                            padding: "4px 8px",
                            borderRadius: "6px"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================
          TAB 2: SETUP LỊCH LÀM VIỆC & LƯƠNG PART-TIME
          ============================================================ */}
      {activeTab === "shifts" && (
        <div>
          {/* Bộ lọc Nơi làm việc Part-time & Nút Action */}
          <div className="glass-card mb-4" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-main)" }}>
                  🏪 Chọn nơi làm việc:
                </span>
                <select
                  value={selectedShiftProject}
                  onChange={(e) => setSelectedShiftProject(e.target.value)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "10px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-main)",
                    fontWeight: 600,
                    fontSize: "0.88rem"
                  }}
                >
                  <option value="all">-- Tất cả các nơi làm việc --</option>
                  {partTimeProjects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.ten_du_an} ({Number(p.luong_theo_gio || 0).toLocaleString("vi-VN")} đ/h)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: "0.82rem", padding: "6px 14px", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                  onClick={() => {
                    loadShifts();
                    showToast("Đã đồng bộ và tính toán lại lương thành công! 💰", "success");
                  }}
                  title="Kiểm tra và tự động tính toán lại lương tích lũy"
                >
                  🔄 Đồng bộ & Tính lại lương
                </button>
              </div>
            </div>
          </div>

          {/* 4 Thẻ KPI Chỉ Số Giờ Làm & Lương Tích Lũy Thời Gian Thực */}
          <div className="shift-kpi-strip">
            {/* Card 1: Tổng Giờ Đã Làm */}
            <div className="shift-kpi-card">
              <div className="shift-kpi-icon" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                ⏱️
              </div>
              <div>
                <div className="shift-kpi-label">Tổng Giờ Đã Làm</div>
                <div className="shift-kpi-val font-numeric">
                  {shiftStats.tong_gio_da_lam || 0} Giờ
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Đã hoàn thành {shiftStats.so_ca_da_lam || 0} ca
                </div>
              </div>
            </div>

            {/* Card 2: Lương Tích Lũy (Thực Nhận) */}
            <div className="shift-kpi-card">
              <div className="shift-kpi-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                💰
              </div>
              <div>
                <div className="shift-kpi-label">Lương Đã Kiếm Được</div>
                <div className="shift-kpi-val font-numeric" style={{ color: "#10b981" }}>
                  {(shiftStats.luong_tich_luy || 0).toLocaleString("vi-VN")} đ
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Tự cộng dồn theo các ngày đã trôi qua
                </div>
              </div>
            </div>

            {/* Card 3: Lương Dự Kiến Toàn Bộ */}
            <div className="shift-kpi-card">
              <div className="shift-kpi-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                🔮
              </div>
              <div>
                <div className="shift-kpi-label">Lương Dự Kiến Toàn Ca</div>
                <div className="shift-kpi-val font-numeric">
                  {(shiftStats.luong_du_kien_toan_bo || 0).toLocaleString("vi-VN")} đ
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Tổng {shiftStats.tong_gio_toan_bo || 0} giờ đã đăng ký
                </div>
              </div>
            </div>

            {/* Card 4: Ca Làm Việc Tiếp Theo */}
            <div className="shift-kpi-card">
              <div className="shift-kpi-icon" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>
                📅
              </div>
              <div>
                <div className="shift-kpi-label">Ca Làm Tiếp Theo</div>
                {shiftStats.ca_tiep_theo ? (
                  <>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)" }}>
                      {formatDateDisplay(shiftStats.ca_tiep_theo.thoi_gian_bat_dau)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 700, marginTop: "2px" }}>
                      ⏰ {shiftStats.ca_tiep_theo.gio_bat_dau} - {shiftStats.ca_tiep_theo.gio_ket_thuc}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Không có ca làm sắp tới
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bảng Danh Sách Ca Làm Việc */}
          <div className="glass-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                🗓️ Lịch Ca Làm Việc ({shifts.length} Ca)
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Hệ thống tự động cộng dồn giờ và tiền lương khi thời gian ca kết thúc
              </span>
            </div>

            {shifts.length === 0 ? (
              <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
                <p style={{ fontSize: "0.92rem", margin: 0 }}>
                  Chưa có ca làm việc nào được thiết lập. Hãy bấm nút ở trên cùng để thêm ca làm hoặc setup lịch tuần.
                </p>
              </div>
            ) : (
              <div className="neu-table-wrapper table-responsive">
                <table
                  className="table align-middle mb-0"
                  style={{
                    background: "transparent",
                    "--bs-table-bg": "transparent",
                    "--bs-table-accent-bg": "transparent",
                    "--bs-table-striped-bg": "transparent",
                    "--bs-table-hover-bg": "transparent",
                    color: "var(--text-main)"
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border-color)", fontSize: "0.82rem", color: "var(--text-muted)", background: "transparent" }}>
                      <th>Ngày Làm</th>
                      <th>Ca Làm / Tiêu Đề</th>
                      <th>Khung Giờ</th>
                      <th>Số Giờ</th>
                      <th>Nơi Làm Việc</th>
                      <th>Tiền Lương Ca</th>
                      <th>Trạng Thái</th>
                      <th style={{ textAlign: "right", whiteSpace: "nowrap", minWidth: "190px" }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((sh) => {
                      const isPast = sh.trang_thai === "da_hoan_thanh";
                      const isAbsent = sh.trang_thai === "nghi_phep";

                      return (
                        <tr
                          key={sh._id}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                            background: "transparent",
                            opacity: isAbsent ? 0.6 : 1
                          }}
                        >
                          <td style={{ fontWeight: 700 }}>
                            {formatDateDisplay(sh.ngay_lam)}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                              {sh.tieu_de}
                            </div>
                            {sh.ghi_chu && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                💬 {sh.ghi_chu}
                              </div>
                            )}
                          </td>
                          <td className="font-numeric" style={{ fontWeight: 700, color: "var(--primary)" }}>
                            {sh.gio_bat_dau} - {sh.gio_ket_thuc}
                          </td>
                          <td className="font-numeric" style={{ fontWeight: 700 }}>
                            {sh.so_gio_lam} h
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: `${sh.du_an_id?.mau_sac || "#6366f1"}22`,
                                color: sh.du_an_id?.mau_sac || "#6366f1",
                                border: `1px solid ${sh.du_an_id?.mau_sac || "#6366f1"}44`
                              }}
                            >
                              🏪 {sh.du_an_id?.ten_du_an || "Part-time"}
                            </span>
                          </td>
                          <td className="font-numeric" style={{ fontWeight: 800, color: isPast ? "#10b981" : "var(--text-main)" }}>
                            {Number(sh.tien_luong_ca || 0).toLocaleString("vi-VN")} đ
                          </td>
                          <td>
                            {isPast ? (
                              <span className="badge badge-success" style={{ fontSize: "0.74rem" }}>
                                ✓ Đã làm (Đã cộng lương)
                              </span>
                            ) : isAbsent ? (
                              <span className="badge badge-warning" style={{ fontSize: "0.74rem" }}>
                                🛌 Nghỉ phép
                              </span>
                            ) : (
                              <span className="badge badge-primary" style={{ fontSize: "0.74rem" }}>
                                ⏳ Sắp diễn ra
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <div style={{ display: "inline-flex", justifyContent: "flex-end", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
                              {sh.trang_thai === "chua_den" && (
                                <>
                                  <button
                                    type="button"
                                    className="shift-action-btn btn-done"
                                    title="Xác nhận đã làm ca này để tự động cộng lương ngay"
                                    onClick={() => handleChangeShiftStatus(sh, "da_hoan_thanh")}
                                  >
                                    ✓ Đã làm
                                  </button>
                                  <button
                                    type="button"
                                    className="shift-action-btn btn-leave"
                                    title="Đánh dấu nghỉ phép ca này (không tính lương)"
                                    onClick={() => handleChangeShiftStatus(sh, "nghi_phep")}
                                  >
                                    🛌 Nghỉ
                                  </button>
                                </>
                              )}
                              {sh.trang_thai === "da_hoan_thanh" && (
                                <button
                                  type="button"
                                  className="shift-action-btn btn-leave"
                                  title="Đánh dấu nghỉ phép ca này"
                                  onClick={() => handleChangeShiftStatus(sh, "nghi_phep")}
                                >
                                  🛌 Nghỉ
                                </button>
                              )}
                              {sh.trang_thai === "nghi_phep" && (
                                <button
                                  type="button"
                                  className="shift-action-btn btn-rework"
                                  title="Kích hoạt lại ca làm"
                                  onClick={() => handleChangeShiftStatus(sh, "chua_den")}
                                >
                                  ↩️ Đi làm lại
                                </button>
                              )}
                              <button
                                type="button"
                                className="shift-action-btn btn-delete"
                                title="Xóa ca làm"
                                onClick={() => handleDeleteShift(sh._id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 1: TẠO DỰ ÁN / NƠI LÀM VIỆC MỚI
          ============================================================ */}
      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "6px" }}>
              {editingProject ? "✏️ Chỉnh Sửa Việc Làm / Dự Án" : "➕ Tạo Việc Làm / Dự Án Mới"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              {editingProject
                ? "Cập nhật thông tin dự án, mức lương hoặc địa chỉ nơi làm việc."
                : "Chọn loại hình công việc để quản lý lịch trình và tự động tính thu nhập."}
            </p>

            <form onSubmit={handleSaveProject}>
              {/* Chọn Loại Hình: Part-time vs Công Việc Chính vs Dự Án */}
              <div className="form-group mb-3">
                <label style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>
                  Phân loại công việc *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setProjectForm({ ...projectForm, loai_du_an: "part_time" })}
                    style={{
                      padding: "10px 8px",
                      borderRadius: "12px",
                      border: projectForm.loai_du_an === "part_time" ? "2px solid #f59e0b" : "1px solid var(--border-color)",
                      background: projectForm.loai_du_an === "part_time" ? "rgba(245, 158, 11, 0.12)" : "var(--bg-surface)",
                      color: projectForm.loai_du_an === "part_time" ? "#f59e0b" : "var(--text-main)",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    🏪 Part-time / Ca
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectForm({ ...projectForm, loai_du_an: "cong_viec_chinh" })}
                    style={{
                      padding: "10px 8px",
                      borderRadius: "12px",
                      border: projectForm.loai_du_an === "cong_viec_chinh" ? "2px solid #3b82f6" : "1px solid var(--border-color)",
                      background: projectForm.loai_du_an === "cong_viec_chinh" ? "rgba(59, 130, 246, 0.12)" : "var(--bg-surface)",
                      color: projectForm.loai_du_an === "cong_viec_chinh" ? "#3b82f6" : "var(--text-main)",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    🏢 Công việc chính
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectForm({ ...projectForm, loai_du_an: "du_an_tu_do" })}
                    style={{
                      padding: "10px 8px",
                      borderRadius: "12px",
                      border: projectForm.loai_du_an === "du_an_tu_do" ? "2px solid #8b5cf6" : "1px solid var(--border-color)",
                      background: projectForm.loai_du_an === "du_an_tu_do" ? "rgba(139, 92, 246, 0.12)" : "var(--bg-surface)",
                      color: projectForm.loai_du_an === "du_an_tu_do" ? "#8b5cf6" : "var(--text-main)",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    📁 Dự án tự do
                  </button>
                </div>
              </div>

              {/* Tên Dự Án / Nơi Làm Việc */}
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                  {projectForm.loai_du_an === "part_time"
                    ? "Tên nơi làm part-time *"
                    : projectForm.loai_du_an === "cong_viec_chinh"
                    ? "Tên công ty / Nơi làm việc *"
                    : "Tên dự án *"}
                </label>
                <input
                  type="text"
                  required
                  value={projectForm.ten_du_an}
                  onChange={(e) => setProjectForm({ ...projectForm, ten_du_an: e.target.value })}
                  placeholder={
                    projectForm.loai_du_an === "part_time"
                      ? "Ví dụ: Family Mart Quận 1, Highlands Coffee..."
                      : "Ví dụ: Lập trình Website, Đồ án..."
                  }
                />
              </div>

              {/* Nhập Lương Theo Giờ (Nếu là Part-time) */}
              {projectForm.loai_du_an === "part_time" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                      💰 Lương theo giờ (VNĐ/h) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={projectForm.luong_theo_gio}
                      onChange={(e) => setProjectForm({ ...projectForm, luong_theo_gio: e.target.value })}
                      placeholder="VD: 25000 hoặc 30000"
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                      📅 Ngày bắt đầu đi làm
                    </label>
                    <input
                      type="date"
                      value={projectForm.ngay_bat_dau}
                      onChange={(e) => setProjectForm({ ...projectForm, ngay_bat_dau: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Nhập Lương Cơ Bản (Nếu là Công Việc Chính) */}
              {projectForm.loai_du_an === "cong_viec_chinh" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                      💼 Lương cơ bản hàng tháng (VNĐ)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100000"
                      value={projectForm.luong_co_ban}
                      onChange={(e) => setProjectForm({ ...projectForm, luong_co_ban: e.target.value })}
                      placeholder="VD: 10000000"
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                      📅 Ngày bắt đầu làm việc
                    </label>
                    <input
                      type="date"
                      value={projectForm.ngay_bat_dau}
                      onChange={(e) => setProjectForm({ ...projectForm, ngay_bat_dau: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Địa Chỉ Nơi Làm Việc */}
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                  📍 Địa chỉ nơi làm việc
                </label>
                <input
                  type="text"
                  value={projectForm.dia_chi}
                  onChange={(e) => setProjectForm({ ...projectForm, dia_chi: e.target.value })}
                  placeholder="Ví dụ: 12 Nguyễn Thị Minh Khai, Phường Đa Kao, Q1..."
                />
              </div>

              {/* Bảng Màu Sắc Nhận Diện */}
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>
                  🎨 Màu sắc trên Lịch
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setProjectForm({ ...projectForm, mau_sac: c.hex })}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        backgroundColor: c.hex,
                        border: projectForm.mau_sac === c.hex ? "3px solid #ffffff" : "2px solid transparent",
                        boxShadow: projectForm.mau_sac === c.hex ? `0 0 0 2px ${c.hex}` : "none",
                        cursor: "pointer"
                      }}
                      title={c.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={projectForm.mau_sac}
                    onChange={(e) => setProjectForm({ ...projectForm, mau_sac: e.target.value })}
                    style={{ width: "34px", height: "30px", padding: 0, border: "none", cursor: "pointer", background: "none" }}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(99, 102, 241, 0.08)",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: "18px"
                }}
              >
                💡 Sau khi tạo, dự án sẽ tự động xuất hiện trên Lịch. Nếu là việc Part-time, bạn có thể qua tab <strong>Setup Lịch Làm</strong> để đăng ký ca và hệ thống sẽ tự động tính lương khi ngày trôi qua!
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowProjectModal(false);
                    setEditingProject(null);
                  }}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingProject ? "Lưu Thay Đổi & Đồng Bộ Lịch" : "Lưu & Thêm Vào Lịch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: THÊM TASK TODO
          ============================================================ */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "6px" }}>➕ Thêm Công Việc Mới</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              Tạo nhiệm vụ công việc — hệ thống sẽ tự động ghi nhận lên trang Lịch.
            </p>

            <form onSubmit={handleCreateTask}>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                  Tiêu đề công việc *
                </label>
                <input
                  type="text"
                  required
                  value={taskForm.tieu_de}
                  onChange={(e) => setTaskForm({ ...taskForm, tieu_de: e.target.value })}
                  placeholder="Ví dụ: Thiết kế giao diện bằng Figma, Giao hàng đợt 1..."
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                  Thuộc Dự Án / Nơi Làm Việc
                </label>
                <select
                  value={taskForm.du_an_id}
                  onChange={(e) => setTaskForm({ ...taskForm, du_an_id: e.target.value })}
                >
                  <option value="">-- Không thuộc dự án nào (Task độc lập) --</option>
                  {duAns.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.ten_du_an}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                    ⏰ Hạn chót (Deadline)
                  </label>
                  <input
                    type="datetime-local"
                    value={taskForm.han_chot}
                    onChange={(e) => setTaskForm({ ...taskForm, han_chot: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                    🎯 Mức độ ưu tiên
                  </label>
                  <select
                    value={taskForm.do_uu_tien}
                    onChange={(e) => setTaskForm({ ...taskForm, do_uu_tien: e.target.value })}
                  >
                    <option value="thap">🟢 Thấp</option>
                    <option value="trung_binh">🟡 Trung bình</option>
                    <option value="cao">🔴 Cao (Khẩn cấp)</option>
                  </select>
                </div>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                  Ghi chú / Mô tả công việc
                </label>
                <textarea
                  rows="2"
                  value={taskForm.mo_ta}
                  onChange={(e) => setTaskForm({ ...taskForm, mo_ta: e.target.value })}
                  placeholder="Ghi chú chi tiết công việc..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Lưu Task & Vào Lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: THÊM 1 CA LÀM NHANH (SINGLE SHIFT)
          ============================================================ */}
      {showSingleShiftModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "6px" }}>
              🏪 Thêm Ca Làm Việc
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              Đăng ký ca làm cụ thể theo ngày — tự động tính lương và đồng bộ lên Lịch.
            </p>

            <form onSubmit={handleCreateSingleShift}>
              {/* Chọn Nơi Làm Việc Part-time */}
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                  Nơi làm việc *
                </label>
                <select
                  required
                  value={singleShiftForm.du_an_id}
                  onChange={(e) => {
                    const pId = e.target.value;
                    const proj = duAns.find((d) => d._id === pId);
                    setSingleShiftForm({
                      ...singleShiftForm,
                      du_an_id: pId,
                      dia_diem: proj?.dia_chi || "",
                      luong_theo_gio: proj?.luong_theo_gio !== undefined ? proj.luong_theo_gio : ""
                    });
                  }}
                >
                  <option value="">-- Chọn nơi làm việc --</option>
                  {partTimeProjects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.ten_du_an} (Lương: {Number(p.luong_theo_gio || 0).toLocaleString("vi-VN")} đ/h)
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngày Làm Việc */}
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                  📅 Ngày đi làm *
                </label>
                <input
                  type="date"
                  required
                  value={singleShiftForm.ngay_lam}
                  onChange={(e) => setSingleShiftForm({ ...singleShiftForm, ngay_lam: e.target.value })}
                />
              </div>

              {/* Khung Giờ Bắt Đầu - Kết Thúc */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                    ⏱️ Giờ vào ca
                  </label>
                  <input
                    type="time"
                    required
                    value={singleShiftForm.gio_bat_dau}
                    onChange={(e) => setSingleShiftForm({ ...singleShiftForm, gio_bat_dau: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                    ⌛ Giờ tan ca
                  </label>
                  <input
                    type="time"
                    required
                    value={singleShiftForm.gio_ket_thuc}
                    onChange={(e) => setSingleShiftForm({ ...singleShiftForm, gio_ket_thuc: e.target.value })}
                  />
                </div>
              </div>

              {/* Lương Theo Giờ & Xem trước tiền lương */}
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span>💰 Lương theo giờ (VNĐ/h)</span>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 400 }}>Mặc định theo nơi làm việc</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={singleShiftForm.luong_theo_gio}
                  onChange={(e) => setSingleShiftForm({ ...singleShiftForm, luong_theo_gio: e.target.value })}
                  placeholder="Ví dụ: 25000"
                />
                {singleShiftPreview && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px 12px",
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px dashed rgba(16, 185, 129, 0.3)",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      color: "#10b981",
                      fontWeight: 600,
                      display: "flex",
                      justifyContent: "space-between"
                    }}
                  >
                    <span>⏱️ Tổng: {singleShiftPreview.hours} giờ</span>
                    <span>💰 Dự tính: {singleShiftPreview.totalSalary.toLocaleString("vi-VN")} đ</span>
                  </div>
                )}
              </div>

              {/* Tên Ca & Ghi Chú */}
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                  Tiêu đề ca làm (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={singleShiftForm.tieu_de}
                  onChange={(e) => setSingleShiftForm({ ...singleShiftForm, tieu_de: e.target.value })}
                  placeholder="Ví dụ: Ca thu ngân, Ca phụ bếp, Ca kiểm hàng..."
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={singleShiftForm.ghi_chu}
                  onChange={(e) => setSingleShiftForm({ ...singleShiftForm, ghi_chu: e.target.value })}
                  placeholder="Ghi chú thêm nếu có..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowSingleShiftModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Lưu Ca & Đồng Bộ Lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 4: SETUP LỊCH TUẦN HÀNG LOẠT (BULK SHIFT SCHEDULER)
          ============================================================ */}
      {showBulkShiftModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "6px" }}>
              ⚡ Setup Lịch Tuần Hàng Loạt
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              Thiết lập các ca làm việc cố định theo các thứ trong tuần cho cả tháng chỉ với 1 cú click!
            </p>

            <form onSubmit={handleCreateBulkShift}>
              {/* Chọn Nơi Làm Việc Part-time */}
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                  Nơi làm việc *
                </label>
                <select
                  required
                  value={bulkShiftForm.du_an_id}
                  onChange={(e) => {
                    const pId = e.target.value;
                    const proj = duAns.find((d) => d._id === pId);
                    setBulkShiftForm({
                      ...bulkShiftForm,
                      du_an_id: pId,
                      dia_diem: proj?.dia_chi || "",
                      luong_theo_gio: proj?.luong_theo_gio !== undefined ? proj.luong_theo_gio : ""
                    });
                  }}
                >
                  <option value="">-- Chọn nơi làm việc --</option>
                  {partTimeProjects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.ten_du_an} (Lương: {Number(p.luong_theo_gio || 0).toLocaleString("vi-VN")} đ/h)
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn Các Thứ Trong Tuần (Pills) */}
              <div className="form-group mb-3">
                <label style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>
                  📅 Chọn các thứ trong tuần đi làm *
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {DAYS_OF_WEEK.map((item) => {
                    const isSelected = bulkShiftForm.days_of_week.includes(item.day);
                    return (
                      <button
                        key={item.day}
                        type="button"
                        className={`day-pill-btn ${isSelected ? "active" : ""}`}
                        onClick={() => {
                          const exists = bulkShiftForm.days_of_week.includes(item.day);
                          const nextDays = exists
                            ? bulkShiftForm.days_of_week.filter((d) => d !== item.day)
                            : [...bulkShiftForm.days_of_week, item.day];
                          setBulkShiftForm({ ...bulkShiftForm, days_of_week: nextDays });
                        }}
                        title={item.fullName}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                  Đang chọn:{" "}
                  {bulkShiftForm.days_of_week
                    .map((d) => DAYS_OF_WEEK.find((item) => item.day === d)?.fullName)
                    .join(", ") || "Chưa chọn thứ nào"}
                </div>
              </div>



              {/* Khung Giờ Bắt Đầu - Kết Thúc */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                    ⏱️ Giờ vào ca
                  </label>
                  <input
                    type="time"
                    required
                    value={bulkShiftForm.gio_bat_dau}
                    onChange={(e) => setBulkShiftForm({ ...bulkShiftForm, gio_bat_dau: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                    ⌛ Giờ tan ca
                  </label>
                  <input
                    type="time"
                    required
                    value={bulkShiftForm.gio_ket_thuc}
                    onChange={(e) => setBulkShiftForm({ ...bulkShiftForm, gio_ket_thuc: e.target.value })}
                  />
                </div>
              </div>

              {/* Lương Theo Giờ & Dự tính */}
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span>💰 Lương theo giờ (VNĐ/h)</span>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 400 }}>Mặc định theo nơi làm việc</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={bulkShiftForm.luong_theo_gio}
                  onChange={(e) => setBulkShiftForm({ ...bulkShiftForm, luong_theo_gio: e.target.value })}
                  placeholder="Ví dụ: 25000"
                />
                {bulkShiftPreview && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px 12px",
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px dashed rgba(16, 185, 129, 0.3)",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      color: "#10b981",
                      fontWeight: 600,
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>⏱️ Mỗi ca: {bulkShiftPreview.hoursPerShift} giờ</span>
                      <span>💰 Mỗi ca: {bulkShiftPreview.salaryPerShift.toLocaleString("vi-VN")} đ</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed rgba(16, 185, 129, 0.2)", paddingTop: "4px" }}>
                      <span>📅 {bulkShiftForm.days_of_week.length} ca / tuần</span>
                      <span>💵 Thu nhập tuần: {bulkShiftPreview.weeklySalary.toLocaleString("vi-VN")} đ</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Khoảng Thời Gian Áp Dụng (Từ Ngày... Đến Ngày...) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                    📅 Áp dụng từ ngày *
                  </label>
                  <input
                    type="date"
                    required
                    value={bulkShiftForm.tu_ngay}
                    onChange={(e) => setBulkShiftForm({ ...bulkShiftForm, tu_ngay: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                    📅 Đến ngày *
                  </label>
                  <input
                    type="date"
                    required
                    value={bulkShiftForm.den_ngay}
                    onChange={(e) => setBulkShiftForm({ ...bulkShiftForm, den_ngay: e.target.value })}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(16, 185, 129, 0.08)",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: "18px"
                }}
              >
                🚀 Hệ thống sẽ tự động tạo tất cả các ca làm việc khớp với các thứ đã chọn trong khoảng thời gian trên và đồng bộ toàn bộ lên trang Lịch.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowBulkShiftModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Tạo Hàng Loạt & Đồng Bộ Lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
