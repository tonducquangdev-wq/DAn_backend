//Quản lý môn học, tự động tính GPA tích lũy, bài tập & deadline
import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { TutorView } from "./TutorView";

const DAYS_OF_WEEK = [
  { value: 2, label: "Thứ 2", short: "T2" },
  { value: 3, label: "Thứ 3", short: "T3" },
  { value: 4, label: "Thứ 4", short: "T4" },
  { value: 5, label: "Thứ 5", short: "T5" },
  { value: 6, label: "Thứ 6", short: "T6" },
  { value: 7, label: "Thứ 7", short: "T7" },
  { value: 8, label: "Chủ Nhật", short: "CN" }
];

const DAY_SHORT = { 2: "T2", 3: "T3", 4: "T4", 5: "T5", 6: "T6", 7: "T7", 8: "CN" };
const DAY_FULL = { 2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4", 5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7", 8: "CN" };

const formatScheduleDays = (days) => {
  if (!days || !days.length) return "T2";
  return days.map(d => DAY_SHORT[d] || d).join(", ");
};

// Chuẩn hóa lịch học: luôn đồng bộ theo ngay_hoc để không lệch thứ giữa các nơi hiển thị
const getScheduleSessions = (m) => {
  const days = Array.isArray(m.ngay_hoc) ? m.ngay_hoc.map(Number) : [];
  const detail = Array.isArray(m.chi_tiet_lich_hoc) ? m.chi_tiet_lich_hoc : [];
  const sessions = [];

  days.forEach(thu => {
    const found = detail.find(s => Number(s.thu_trong_tuan) === thu);
    sessions.push({
      ...(found || { phong_hoc: "" }),
      thu_trong_tuan: thu,
      gio_bat_dau: found?.gio_bat_dau || m.gio_bat_dau || "07:30",
      gio_ket_thuc: found?.gio_ket_thuc || m.gio_ket_thuc || "09:30"
    });
  });

  // Dữ liệu cũ chưa có ngay_hoc → dùng chi tiết lịch, cuối cùng mới mặc định Thứ 2
  if (sessions.length === 0) {
    const fallback = detail.length > 0 ? detail : [{ thu_trong_tuan: 2 }];
    fallback.forEach(s => {
      sessions.push({
        ...s,
        thu_trong_tuan: Number(s.thu_trong_tuan),
        gio_bat_dau: s.gio_bat_dau || m.gio_bat_dau || "07:30",
        gio_ket_thuc: s.gio_ket_thuc || m.gio_ket_thuc || "09:30"
      });
    });
  }

  return sessions.sort((a, b) => a.thu_trong_tuan - b.thu_trong_tuan);
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
};

export const StudyGpaView = ({ onNavigateToTutor, onOpenDangKyGiaSu }) => {
  const [monHocs, setMonHocs] = useState([]);
  const [baiTaps, setBaiTaps] = useState([]);
  const [showMonModal, setShowMonModal] = useState(false);
  const [showBtModal, setShowBtModal] = useState(false);
  const [editingMonId, setEditingMonId] = useState(null);
  const [isViewingTutors, setIsViewingTutors] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const initialMonForm = {
    ten_mon: "",
    giang_vien: "",
    phong_hoc: "",
    ngay_bat_dau: new Date().toISOString().slice(0, 10),
    ngay_ket_thuc: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    gio_bat_dau: "07:30",
    gio_ket_thuc: "09:30",
    ngay_hoc: [2, 4],
    chi_tiet_lich_hoc: [
      { thu_trong_tuan: 2, gio_bat_dau: "07:30", gio_ket_thuc: "09:30", phong_hoc: "" },
      { thu_trong_tuan: 4, gio_bat_dau: "07:30", gio_ket_thuc: "09:30", phong_hoc: "" }
    ],
    mau_sac: "#3b82f6"
  };

  const initialBtForm = {
    ten_bai_tap: "",
    mon_hoc_id: "",
    han_nop: new Date().toISOString().slice(0, 10),
    gio_nop: "23:59",
    do_uu_tien: "trung_binh",
    meo_ghi_nho: ""
  };

  const [monForm, setMonForm] = useState(initialMonForm);
  const [btForm, setBtForm] = useState(initialBtForm);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const openEditModal = async (id) => {
    try {
      const res = await api.getMonHocById(id);
      if (!res.success) return alert("Lỗi lấy dữ liệu môn học");
      const m = res.data;
      const form = {
        ten_mon: m.ten_mon,
        giang_vien: m.giang_vien,
        phong_hoc: m.phong_hoc,
        so_tin_chi: m.so_tin_chi,
        diem_so: m.diem_so,
        tien_do: m.tien_do,
        ngay_bat_dau: m.ngay_bat_dau,
        ngay_ket_thuc: m.ngay_ket_thuc,
        gio_bat_dau: m.gio_bat_dau,
        gio_ket_thuc: m.gio_ket_thuc,
        ngay_hoc: m.ngay_hoc,
        chi_tiet_lich_hoc: Array.isArray(m.chi_tiet_lich_hoc) ? m.chi_tiet_lich_hoc : [],
        trang_thai: m.trang_thai,
        mau_sac: m.mau_sac
      };
      setMonForm(form);
      setShowMonModal(true);
      setEditingMonId(id);
    } catch (err) {
      alert("Không thể mở modal sửa");
    }
  };

  const handleEditMon = async (id) => {
    const res = await api.updateMonHoc(id, monForm);
    if (res.success) {
      showToast(res.message || "Cập nhật môn học thành công");
      setShowMonModal(false);
      setMonForm(initialMonForm);
      loadData();
    } else if (res.conflicts && Array.isArray(res.conflicts) && res.conflicts.length > 0) {
      const conflictList = res.conflicts.map(c => `${c.ten_mon} vào ${c.thu_label} (${c.gio_bat_dau} - ${c.gio_ket_thuc})`).join("\n");
      alert(`⚠️ Trùng lịch học!\nMôn học này bị trùng với:\n${conflictList}\n\nVui lòng chọn khung giờ hoặc ngày học khác.`);
    } else {
      alert(res.message || "Lỗi cập nhật môn học");
    }
  };

  const loadData = () => {
    api.getMonHoc().then(res => res.success && setMonHocs(res.data));
    api.getBaiTap().then(res => res.success && setBaiTaps(res.data));
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatSubjectSchedule = (m) => {
    const sessions = getScheduleSessions(m);
    const first = sessions[0];
    const isAllSame = sessions.every(s => s.gio_bat_dau === first.gio_bat_dau && s.gio_ket_thuc === first.gio_ket_thuc);

    return {
      timeStr: isAllSame
        ? `${first.gio_bat_dau} – ${first.gio_ket_thuc}`
        : sessions.map(s => `${DAY_SHORT[s.thu_trong_tuan] || s.thu_trong_tuan}: ${s.gio_bat_dau}-${s.gio_ket_thuc}`).join(" | "),
      daysStr: formatScheduleDays(sessions.map(s => s.thu_trong_tuan)),
      isCustom: !isAllSame,
      sessions
    };
  };

  const toggleDay = (dayValue) => {
    setMonForm(prev => {
      const exists = prev.ngay_hoc.includes(dayValue);
      const newDays = exists ? prev.ngay_hoc.filter(d => d !== dayValue) : [...prev.ngay_hoc, dayValue].sort((a, b) => a - b);

      let updatedChiTiet = [...(prev.chi_tiet_lich_hoc || [])];
      if (exists) {
        updatedChiTiet = updatedChiTiet.filter(item => item.thu_trong_tuan !== dayValue);
      } else {
        const defaultStart = updatedChiTiet[0]?.gio_bat_dau || prev.gio_bat_dau || "07:30";
        const defaultEnd = updatedChiTiet[0]?.gio_ket_thuc || prev.gio_ket_thuc || "09:30";
        updatedChiTiet.push({
          thu_trong_tuan: dayValue,
          gio_bat_dau: defaultStart,
          gio_ket_thuc: defaultEnd,
          phong_hoc: prev.phong_hoc || ""
        });
        updatedChiTiet.sort((a, b) => a.thu_trong_tuan - b.thu_trong_tuan);
      }

      return {
        ...prev,
        ngay_hoc: newDays,
        chi_tiet_lich_hoc: updatedChiTiet
      };
    });
  };

  const updateSessionDetail = (thu, field, value) => {
    setMonForm(prev => {
      const updated = (prev.chi_tiet_lich_hoc || []).map(item => {
        if (item.thu_trong_tuan === thu) {
          return { ...item, [field]: value };
        }
        return item;
      });
      return {
        ...prev,
        chi_tiet_lich_hoc: updated,
        ...(updated[0]?.thu_trong_tuan === thu && (field === "gio_bat_dau" || field === "gio_ket_thuc")
          ? { [field]: value }
          : {})
      };
    });
  };


  const handleSubmitMon = async (e) => {
    e.preventDefault();
    if (!monForm.ngay_hoc || monForm.ngay_hoc.length === 0) {
      alert("Vui lòng chọn ít nhất một ngày học trong tuần.");
      return;
    }
    // Validation: Ngày bắt đầu không được lớn hơn ngày kết thúc
    if (monForm.ngay_bat_dau && monForm.ngay_ket_thuc && monForm.ngay_bat_dau > monForm.ngay_ket_thuc) {
      alert("Ngày bắt đầu môn học không được lớn hơn ngày kết thúc môn học.");
      return;
    }

    if (editingMonId) {
      // EDIT MODE
      const res = await api.updateMonHoc(editingMonId, monForm);
      if (res.success) {
        setShowMonModal(false);
        setMonForm(initialMonForm);
        setEditingMonId(null);
        loadData();
        showToast(res.message || "Cập nhật môn học thành công!");
      } else {
        if (res.conflicts && Array.isArray(res.conflicts) && res.conflicts.length > 0) {
          const conflictList = res.conflicts.map(c => `${c.ten_mon} vào ${c.thu_label} (${c.gio_bat_dau} - ${c.gio_ket_thuc})`).join("\n");
          alert(`⚠️ Trùng lịch học!\nMôn học này bị trùng với:\n${conflictList}\n\nVui lòng chọn khung giờ hoặc ngày học khác.`);
        } else {
          alert(res.message || "Lỗi cập nhật môn học");
        }
      }
    } else {
      // CREATE MODE
      const res = await api.createMonHoc(monForm);
      if (res.success) {
        setShowMonModal(false);
        setMonForm(initialMonForm);
        loadData();
        showToast(res.message || "Tạo môn học và tự động đồng bộ trang Lịch thành công!");
      } else {
        if (res.conflicts && Array.isArray(res.conflicts) && res.conflicts.length > 0) {
          const conflictList = res.conflicts.map(c => `${c.ten_mon} vào ${c.thu_label} (${c.gio_bat_dau} - ${c.gio_ket_thuc})`).join("\n");
          alert(`⚠️ Trùng lịch học!\nMôn học này bị trùng với:\n${conflictList}\n\nVui lòng chọn khung giờ hoặc ngày học khác.`);
        } else {
          alert(res.message || "Lỗi tạo môn học");
        }
      }
    }
  };

  const handleDeleteMon = async (id, tenMon) => {
    if (window.confirm(`Bạn có chắc muốn xóa môn học "${tenMon}"? Lịch học của môn này trên trang Lịch cũng sẽ được tự động xóa.`)) {
      const res = await api.deleteMonHoc(id);
      if (res.success) {
        loadData();
        showToast("Đã xóa môn học và dọn dẹp lịch thành công.");
      } else {
        alert(res.message || "Lỗi xóa môn học");
      }
    }
  };

  const handleCreateBt = async (e) => {
    e.preventDefault();
    const res = await api.createBaiTap(btForm);
    if (res.success) {
      setShowBtModal(false);
      setBtForm(initialBtForm);
      loadData();
      showToast(res.message || "Tạo bài tập và tự động lưu deadline vào trang Lịch thành công! 🚀");
    } else {
      alert(res.message || "Lỗi tạo bài tập");
    }
  };

  const handleDeleteBt = async (id, tenBt) => {
    if (window.confirm(`Bạn có chắc muốn xóa bài tập "${tenBt}"? Sự kiện deadline tương ứng trên trang Lịch cũng sẽ được tự động xóa.`)) {
      const res = await api.deleteBaiTap(id);
      if (res.success) {
        loadData();
        showToast("Đã xóa bài tập và dọn dẹp deadline trên trang Lịch.");
      } else {
        alert(res.message || "Lỗi xóa bài tập");
      }
    }
  };

  const handleToggleBtStatus = async (bt) => {
    const nextStatus = bt.trang_thai === "da_hoan_thanh" ? "chua_hoan_thanh" : "da_hoan_thanh";
    const res = await api.updateBaiTap(bt._id, { trang_thai: nextStatus });
    if (res.success) {
      loadData();
      showToast(nextStatus === "da_hoan_thanh" ? "Đã đánh dấu hoàn thành bài tập! 🎉" : "Đã chuyển bài tập về chưa hoàn thành.");
    } else {
      alert(res.message || "Lỗi cập nhật trạng thái");
    }
  };

  // Nếu người dùng đang bấm xem trang tìm gia sư
  if (isViewingTutors) {
    return <TutorView onBack={() => setIsViewingTutors(false)} />;
  }

  return (
    <div className="study-view-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 99999,
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "#ffffff",
          padding: "12px 20px",
          borderRadius: "14px",
          boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
          fontWeight: "600",
          fontSize: "0.9rem",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "fadeIn 0.3s ease"
        }}>
          <span>✨</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Top - Bootstrap Responsive Flex */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="page-title fs-3 fw-bold mb-0 d-flex align-items-center gap-2">
            <span>🎓</span> Quản Lý Học Tập
          </h1>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 ms-auto">
          {onOpenDangKyGiaSu && (
            <button
              type="button"
              className="btn-secondary flex-grow-1 flex-sm-grow-0 d-inline-flex align-items-center justify-content-center gap-1"
              onClick={onOpenDangKyGiaSu}
              style={{
                fontWeight: "700",
                background: "var(--neu-bg)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                boxShadow: "4px 4px 10px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)",
                padding: "8px 14px",
                fontSize: "0.85rem"
              }}
              title="Đăng ký trở thành Gia Sư chia sẻ kiến thức"
            >
              <span>🎓</span> <span>Đăng Ký Gia Sư</span>
            </button>
          )}
          <button
            type="button"
            className="btn-secondary flex-grow-1 flex-sm-grow-0 d-inline-flex align-items-center justify-content-center gap-1"
            onClick={() => onNavigateToTutor ? onNavigateToTutor() : setIsViewingTutors(true)}
            style={{
              fontWeight: "700",
              background: "rgba(139, 92, 246, 0.12)",
              color: "#7c3aed",
              border: "1px solid rgba(139, 92, 246, 0.25)",
              padding: "8px 14px",
              fontSize: "0.85rem"
            }}
          >
            <span>👩‍🏫</span> <span>Tìm Gia Sư</span>
          </button>
          <button
            type="button"
            className="btn-secondary flex-grow-1 flex-sm-grow-0 d-inline-flex align-items-center justify-content-center gap-1"
            style={{ padding: "8px 14px", fontSize: "0.85rem", fontWeight: "700" }}
            onClick={() => setShowBtModal(true)}
          >
            <span>➕</span> <span>Thêm Bài Tập</span>
          </button>
          <button
            type="button"
            className="btn-primary flex-grow-1 flex-sm-grow-0 d-inline-flex align-items-center justify-content-center gap-1"
            style={{ padding: "8px 14px", fontSize: "0.85rem", fontWeight: "700" }}
            onClick={() => setShowMonModal(true)}
          >
            <span>➕</span> <span>Thêm Môn Học</span>
          </button>
        </div>
      </div>

      {/* 1. DANH SÁCH MÔN HỌC & LỊCH TRÌNH */}
      <div className="glass-card mb-4 p-3 p-sm-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h3 className="fs-5 fw-bold d-flex align-items-center gap-2 m-0">
            <span>📚</span> Danh Sách Môn Học & Lịch Trình
          </h3>
          <span className="badge rounded-pill" style={{ background: "var(--neu-bg)", color: "var(--text-muted)", boxShadow: "var(--neu-shadow-sm)", padding: "6px 12px", fontSize: "0.82rem" }}>
            Tổng số: <strong className="text-primary">{monHocs.length}</strong> môn học
          </span>
        </div>

        {monHocs.length === 0 ? (
          <div className="text-center py-4 px-2">
            <p className="text-muted fst-italic mb-3">
              Chưa có môn học nào được thêm. Hãy nhấn "Thêm Môn Học" để bắt đầu và tự động lên lịch học!
            </p>
            <button className="btn-primary" onClick={() => { setEditingMonId(null); setMonForm(initialMonForm); setShowMonModal(true); }}>
              ➕ Thêm Môn Học Đầu Tiên
            </button>
          </div>
        ) : (
          <>
            {/* Desktop & Tablet View (Table >= 768px) */}
            <div className="d-none d-md-block neu-table-wrapper table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ minWidth: "200px" }}>TÊN MÔN HỌC</th>
                    <th style={{ minWidth: "150px" }}>GIẢNG VIÊN</th>
                    <th style={{ minWidth: "110px" }}>PHÒNG HỌC</th>
                    <th style={{ minWidth: "180px" }}>GIỜ & NGÀY HỌC</th>
                    <th style={{ minWidth: "180px" }}>THỜI GIAN MÔN</th>
                    <th style={{ minWidth: "120px" }}>TRẠNG THÁI</th>
                    <th style={{ minWidth: "100px", textAlign: "center" }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {monHocs.map(m => (
                    <tr key={m._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              backgroundColor: m.mau_sac || "var(--primary)",
                              boxShadow: `0 0 8px ${m.mau_sac || "#3b82f6"}80`,
                              flexShrink: 0
                            }}
                          />
                          <div>
                            <span className="fw-bold d-block text-main" style={{ fontSize: "0.92rem" }}>
                              {m.ten_mon}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1 text-secondary" style={{ fontSize: "0.88rem" }}>
                          <i className="bi bi-person-badge text-muted" style={{ fontSize: "0.85rem" }}></i>
                          <span>{m.giang_vien || "—"}</span>
                        </div>
                      </td>
                      <td>
                        {m.phong_hoc ? (
                          <span
                            className="badge rounded-pill"
                            style={{
                              background: "rgba(59, 130, 246, 0.1)",
                              color: "#2563eb",
                              border: "1px solid rgba(59, 130, 246, 0.25)",
                              fontWeight: "600",
                              padding: "5px 10px",
                              fontSize: "0.8rem",
                              boxShadow: "none"
                            }}
                          >
                            <i className="bi bi-geo-alt-fill text-danger me-1" style={{ fontSize: "0.75rem" }}></i>
                            {m.phong_hoc}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1.5 schedule-times">
                          {formatSubjectSchedule(m).sessions.map(s => (
                            <div
                              key={s.thu_trong_tuan}
                              className="sched-chip"
                            >
                              <span className="sched-chip-day">{DAY_FULL[s.thu_trong_tuan] || `T${s.thu_trong_tuan}`}</span>
                              <span className="sched-chip-time font-numeric">{s.gio_bat_dau} – {s.gio_ket_thuc}</span>
                              {s.phong_hoc && s.phong_hoc !== m.phong_hoc && (
                                <span className="sched-chip-room text-muted">({s.phong_hoc})</span>
                              )}
                            </div>
                          ))}
                          {formatSubjectSchedule(m).sessions.length === 0 && (
                            <span className="text-muted" style={{ fontSize: "0.82rem" }}>{formatSubjectSchedule(m).daysStr || "—"}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div
                          className="d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-3"
                          style={{
                            background: "rgba(0, 0, 0, 0.03)",
                            border: "1px solid var(--border-color)",
                            fontSize: "0.82rem",
                            fontWeight: "500",
                            color: "var(--text-main)"
                          }}
                        >
                          <span>{formatDateDisplay(m.ngay_bat_dau)}</span>
                          <i className="bi bi-arrow-right text-muted mx-1" style={{ fontSize: "0.75rem" }}></i>
                          <span>{formatDateDisplay(m.ngay_ket_thuc)}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge rounded-pill d-inline-flex align-items-center gap-1.5"
                          style={{
                            padding: "5px 12px",
                            fontSize: "0.78rem",
                            fontWeight: "700",
                            background: m.trang_thai === 'da_hoan_thanh' ? "rgba(16, 185, 129, 0.12)" : "rgba(37, 99, 235, 0.12)",
                            color: m.trang_thai === 'da_hoan_thanh' ? "#10b981" : "#2563eb",
                            border: `1px solid ${m.trang_thai === 'da_hoan_thanh' ? "rgba(16, 185, 129, 0.3)" : "rgba(37, 99, 235, 0.3)"}`,
                            boxShadow: "none"
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: m.trang_thai === 'da_hoan_thanh' ? "#10b981" : "#2563eb"
                            }}
                          />
                          {m.trang_thai === 'da_hoan_thanh' ? 'Đã hoàn thành' : 'Đang học'}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div className="d-flex gap-2 flex-wrap justify-content-center">
                          <button
                            type="button"
                            className="btn-primary btn-modal-action flex-grow-1 flex-sm-grow-0"
                            onClick={() => openEditModal(m._id)}
                            style={{ padding: "7px 14px", fontSize: "0.85rem", fontWeight: "700", borderRadius: "6px" }}
                          >
                            <span>✏️</span> Sửa
                          </button>
                          <button
                            type="button"
                            className="btn-table-action-delete flex-grow-1 flex-sm-grow-0"
                            onClick={() => handleDeleteMon(m._id, m.ten_mon)}
                            title="Xóa môn học và đồng bộ dọn dẹp lịch"
                            style={{ padding: "7px 14px", fontSize: "0.85rem", fontWeight: "700", borderRadius: "6px" }}
                          >
                            <i className="bi bi-trash3-fill"></i> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Cards < 768px) */}
            <div className="d-block d-md-none">
              <div className="row g-3">
                {monHocs.map(m => (
                  <div key={m._id} className="col-12">
                    <div
                      className="p-3 rounded-4"
                      style={{
                        background: "var(--neu-bg)",
                        border: "1px solid var(--border-color)",
                        boxShadow: "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)"
                      }}
                    >
                      {/* Card Header: Tên môn, Trạng thái, Nút xóa */}
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: m.mau_sac || "var(--primary)",
                                flexShrink: 0
                              }}
                            />
                            <h4 className="fw-bold mb-0 text-truncate text-main" style={{ fontSize: "0.98rem" }}>
                              {m.ten_mon}
                            </h4>
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span
                              className="badge rounded-pill"
                              style={{
                                padding: "4px 10px",
                                fontSize: "0.72rem",
                                fontWeight: "700",
                                background: m.trang_thai === 'da_hoan_thanh' ? "rgba(16, 185, 129, 0.12)" : "rgba(37, 99, 235, 0.12)",
                                color: m.trang_thai === 'da_hoan_thanh' ? "#10b981" : "#2563eb",
                                border: `1px solid ${m.trang_thai === 'da_hoan_thanh' ? "rgba(16, 185, 129, 0.3)" : "rgba(37, 99, 235, 0.3)"}`,
                                boxShadow: "none"
                              }}
                            >
                              {m.trang_thai === 'da_hoan_thanh' ? 'Đã hoàn thành' : 'Đang học'}
                            </span>
                            {m.phong_hoc && (
                              <span
                                className="badge rounded-pill"
                                style={{
                                  background: "rgba(59, 130, 246, 0.1)",
                                  color: "var(--primary)",
                                  border: "1px solid rgba(59, 130, 246, 0.25)",
                                  fontSize: "0.72rem",
                                  boxShadow: "none"
                                }}
                              >
                                <i className="bi bi-geo-alt-fill me-1 text-danger"></i>{m.phong_hoc}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="d-flex gap-2 flex-shrink-0">
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                            onClick={() => openEditModal(m._id)}
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            type="button"
                            className="btn-table-action-delete"
                            style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                            onClick={() => handleDeleteMon(m._id, m.ten_mon)}
                            title="Xóa môn học"
                          >
                            <i className="bi bi-trash3-fill"></i>
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>

                      {/* Card Details Grid */}
                      <div className="row g-2 pt-2 border-top" style={{ fontSize: "0.82rem", borderColor: "var(--border-color)" }}>
                        <div className="col-12 text-muted">
                          {(() => {
                            const sched = formatSubjectSchedule(m);
                            return (
                              <div className="d-flex flex-wrap gap-1 align-items-center schedule-times">
                                {sched.sessions.map(s => (
                                  <div
                                    key={s.thu_trong_tuan}
                                    className="sched-chip"
                                  >
                                    <span className="sched-chip-day">{DAY_FULL[s.thu_trong_tuan] || `T${s.thu_trong_tuan}`}</span>
                                    <span className="sched-chip-time font-numeric">{s.gio_bat_dau} – {s.gio_ket_thuc}</span>
                                    {s.phong_hoc && s.phong_hoc !== m.phong_hoc && (
                                      <span className="sched-chip-room text-muted">({s.phong_hoc})</span>
                                    )}
                                  </div>
                                ))}
                                {sched.sessions.length === 0 && (
                                  <span className="text-muted" style={{ fontSize: "0.82rem" }}>{sched.daysStr || "—"}</span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="col-12 col-sm-6 text-muted">
                          <i className="bi bi-person me-1 text-muted"></i> GV: <strong className="text-main">{m.giang_vien || "Chưa cập nhật"}</strong>
                        </div>
                        <div className="col-12 col-sm-6 text-muted">
                          <i className="bi bi-calendar-range me-1 text-muted"></i> Khóa: <span className="text-main fw-medium">{formatDateDisplay(m.ngay_bat_dau)} → {formatDateDisplay(m.ngay_ket_thuc)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. DANH SÁCH BÀI TẬP & DEADLINE MÔN HỌC */}
      <div className="glass-card mb-4 p-3 p-sm-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h3 className="fs-5 fw-bold d-flex align-items-center gap-2 m-0">
            <span>📝</span> Bài Tập & Deadline Môn Học
          </h3>
          <button
            className="btn-secondary d-inline-flex align-items-center gap-1"
            style={{ padding: "8px 16px", fontSize: "0.85rem", fontWeight: "700" }}
            onClick={() => setShowBtModal(true)}
          >
            <span>➕</span> <span>Thêm Bài Tập</span>
          </button>
        </div>

        {baiTaps.length === 0 ? (
          <p className="text-muted text-center fst-italic py-4 mb-0">Chưa có bài tập nào cần làm.</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {baiTaps.map(bt => {
              const isCompleted = bt.trang_thai === "da_hoan_thanh";
              const dueDateObj = new Date(bt.han_nop);
              const formattedDate = !isNaN(dueDateObj.getTime())
                ? dueDateObj.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
                : bt.han_nop;
              const formattedTime = !isNaN(dueDateObj.getTime())
                ? dueDateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                : "23:59";

              const priorityColor =
                bt.do_uu_tien === "cao" ? "#ef4444" : bt.do_uu_tien === "trung_binh" ? "#f59e0b" : "#3b82f6";
              const priorityLabel =
                bt.do_uu_tien === "cao" ? "Ưu tiên: Cao" : bt.do_uu_tien === "trung_binh" ? "Ưu tiên: Trung bình" : "Ưu tiên: Thấp";

              return (
                <div
                  key={bt._id}
                  className="deadline-item p-3 rounded-4"
                  style={{
                    borderLeft: `5px solid ${isCompleted ? "#10b981" : priorityColor}`,
                    opacity: isCompleted ? 0.75 : 1,
                    transition: "all 0.2s ease",
                    background: "var(--neu-bg)",
                    boxShadow: "4px 4px 10px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)"
                  }}
                >
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-2">
                    <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggleBtStatus(bt)}
                        title="Đánh dấu hoàn thành"
                        style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#10b981", flexShrink: 0 }}
                      />
                      <span
                        className="deadline-item-title fw-bold"
                        style={{
                          textDecoration: isCompleted ? "line-through" : "none",
                          color: isCompleted ? "var(--text-muted)" : "var(--text-main)",
                          fontSize: "0.95rem",
                          wordBreak: "break-word"
                        }}
                      >
                        {bt.ten_bai_tap}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap ms-auto ms-sm-0">
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: isCompleted ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: isCompleted ? "#10b981" : "#f59e0b",
                          border: `1px solid ${isCompleted ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
                        }}
                      >
                        📅 Lịch: Deadline
                      </span>

                      <span
                        className="badge"
                        style={{
                          background: `${priorityColor}20`,
                          color: priorityColor,
                          border: `1px solid ${priorityColor}40`,
                          fontSize: "0.72rem",
                          padding: "4px 8px"
                        }}
                      >
                        {priorityLabel}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteBt(bt._id, bt.ten_bai_tap)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          padding: "2px 6px",
                          borderRadius: "6px"
                        }}
                        title="Xóa bài tập và dọn dẹp deadline trên lịch"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap align-items-center gap-2 gap-sm-3 small text-muted pt-1">
                    <span>🎓 Môn: <strong className="text-body">{bt.mon_hoc_id?.ten_mon || "Bài tập chung"}</strong></span>
                    <span>⏰ Hạn nộp: <strong className="text-body">{formattedTime} ngày {formattedDate}</strong></span>
                    {bt.meo_ghi_nho && <span>💡 {bt.meo_ghi_nho}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. MODAL THÊM MÔN HỌC */}
      {showMonModal && (
        <div className="modal-overlay">
          <div
            className="modal-content p-3 p-sm-4"
            style={{ maxWidth: "620px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h3 className="fs-5 fw-bold mb-0">{editingMonId ? "✏️ Sửa Môn Học" : "➕ Thêm Môn Học"}</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => { setShowMonModal(false); setEditingMonId(null); setMonForm(initialMonForm); }}
                aria-label="Đóng"
                style={{ filter: "var(--close-btn-filter, none)" }}
              />
            </div>
            <form onSubmit={handleSubmitMon}>
              <div className="form-group mb-3">
                <label className="form-label fw-semibold small mb-1">Tên môn học *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={monForm.ten_mon}
                  onChange={e => setMonForm({ ...monForm, ten_mon: e.target.value })}
                  placeholder="VD: Cấu trúc dữ liệu & Giải thuật"
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                  <div className="form-group mb-0">
                    <label className="form-label fw-semibold small mb-1">Phòng học</label>
                    <input
                      type="text"
                      className="form-control"
                      value={monForm.phong_hoc}
                      onChange={e => setMonForm({ ...monForm, phong_hoc: e.target.value })}
                      placeholder="P.302 - Nhà A"
                    />
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="form-group mb-0">
                    <label className="form-label fw-semibold small mb-1">Giảng viên phụ trách</label>
                    <input
                      type="text"
                      className="form-control"
                      value={monForm.giang_vien}
                      onChange={e => setMonForm({ ...monForm, giang_vien: e.target.value })}
                      placeholder="TS. Nguyễn Văn A"
                    />
                  </div>
                </div>
              </div>

              {/* Khung cấu hình lịch học tự động */}
              <div
                className="p-3 rounded-4 mb-3"
                style={{
                  background: "rgba(59, 130, 246, 0.05)",
                  border: "1px solid rgba(59, 130, 246, 0.15)"
                }}
              >
                <div className="fw-bold small mb-2 text-primary d-flex align-items-center gap-2">
                  <span>📅 Cấu hình Lịch học</span>
                </div>

                {/* Chọn ngày học trong tuần */}
                <div className="form-group mb-3">
                  <label className="form-label fw-semibold small mb-2 d-block">
                    Ngày học trong tuần:
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => {
                      const isSelected = monForm.ngay_hoc.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className="btn btn-sm"
                          style={{
                            padding: "7px 14px",
                            borderRadius: "10px",
                            fontSize: "0.85rem",
                            fontWeight: "700",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            background: isSelected ? "var(--primary)" : "var(--neu-bg)",
                            color: isSelected ? "#ffffff" : "var(--text-main)",
                            boxShadow: isSelected ? "0 4px 12px rgba(59, 130, 246, 0.35)" : "var(--neu-shadow-sm)"
                          }}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Giờ học: 1 buổi đơn vs từ 2 buổi trở lên */}
                {(!monForm.chi_tiet_lich_hoc || monForm.chi_tiet_lich_hoc.length <= 1) ? (
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="form-group mb-0">
                        <label className="form-label fw-semibold small mb-1">Giờ bắt đầu *</label>
                        <input
                          type="time"
                          required
                          className="form-control"
                          value={monForm.gio_bat_dau}
                          onChange={e => {
                            const val = e.target.value;
                            setMonForm(prev => ({
                              ...prev,
                              gio_bat_dau: val,
                              chi_tiet_lich_hoc: (prev.chi_tiet_lich_hoc || []).map(item => ({ ...item, gio_bat_dau: val }))
                            }));
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="form-group mb-0">
                        <label className="form-label fw-semibold small mb-1">Giờ kết thúc *</label>
                        <input
                          type="time"
                          required
                          className="form-control"
                          value={monForm.gio_ket_thuc}
                          onChange={e => {
                            const val = e.target.value;
                            setMonForm(prev => ({
                              ...prev,
                              gio_ket_thuc: val,
                              chi_tiet_lich_hoc: (prev.chi_tiet_lich_hoc || []).map(item => ({ ...item, gio_ket_thuc: val }))
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">


                    <div className="d-flex flex-column gap-3">
                      {monForm.chi_tiet_lich_hoc.map((session, sIdx) => {
                        const dayInfo = DAYS_OF_WEEK.find(d => d.value === session.thu_trong_tuan) || { label: `Thứ ${session.thu_trong_tuan}` };
                        return (
                          <div
                            key={session.thu_trong_tuan}
                            style={{
                              background: "rgba(255, 255, 255, 0.03)",
                              border: "1px solid var(--border-color)",
                              borderRadius: "14px",
                              padding: "14px 16px",
                              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)"
                            }}
                          >
                            {/* Header buổi học */}
                            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                              <span
                                style={{
                                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(139, 92, 246, 0.18))",
                                  color: "var(--primary)",
                                  border: "1px solid rgba(59, 130, 246, 0.35)",
                                  padding: "4px 12px",
                                  borderRadius: "20px",
                                  fontWeight: 700,
                                  fontSize: "0.85rem",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px"
                                }}
                              >
                                <span>📅</span> {dayInfo.label} <span style={{ opacity: 0.75, fontWeight: 500 }}>(Buổi {sIdx + 1})</span>
                              </span>
                              <span
                                className="font-numeric"
                                style={{
                                  fontSize: "0.82rem",
                                  fontWeight: 700,
                                  color: "var(--text-main)",
                                  background: "rgba(0, 0, 0, 0.04)",
                                  padding: "3px 10px",
                                  borderRadius: "8px",
                                  border: "1px solid var(--border-color)"
                                }}
                              >
                                {session.gio_bat_dau} ➜ {session.gio_ket_thuc}
                              </span>
                            </div>

                            {/* Khung giờ 2 cột rộng rãi */}
                            <div className="row g-3 mb-2.5">
                              <div className="col-12 col-sm-6">
                                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px", display: "block" }}>
                                  ⏰ Giờ bắt đầu
                                </label>
                                <input
                                  type="time"
                                  required
                                  className="form-control"
                                  value={session.gio_bat_dau}
                                  onChange={e => updateSessionDetail(session.thu_trong_tuan, "gio_bat_dau", e.target.value)}
                                  style={{
                                    height: "40px",
                                    fontSize: "0.92rem",
                                    fontWeight: 700,
                                    borderRadius: "10px",
                                    padding: "6px 12px"
                                  }}
                                />
                              </div>
                              <div className="col-12 col-sm-6">
                                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px", display: "block" }}>
                                  ⏰ Giờ kết thúc
                                </label>
                                <input
                                  type="time"
                                  required
                                  className="form-control"
                                  value={session.gio_ket_thuc}
                                  onChange={e => updateSessionDetail(session.thu_trong_tuan, "gio_ket_thuc", e.target.value)}
                                  style={{
                                    height: "40px",
                                    fontSize: "0.92rem",
                                    fontWeight: 700,
                                    borderRadius: "10px",
                                    padding: "6px 12px"
                                  }}
                                />
                              </div>
                            </div>

                            {/* Phòng học riêng cho buổi */}
                            <div>
                              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>
                                📍 Phòng học riêng cho {dayInfo.label} (tùy chọn)
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder={monForm.phong_hoc ? `Mặc định theo phòng chung: ${monForm.phong_hoc}` : "Nhập phòng học riêng nếu khác phòng chính..."}
                                value={session.phong_hoc || ""}
                                onChange={e => updateSessionDetail(session.thu_trong_tuan, "phong_hoc", e.target.value)}
                                style={{
                                  height: "36px",
                                  fontSize: "0.82rem",
                                  borderRadius: "10px",
                                  padding: "6px 12px",
                                  background: "rgba(0, 0, 0, 0.02)"
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Thời gian môn học: Ngày bắt đầu & Thời gian kết thúc môn */}
                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <div className="form-group mb-0">
                      <label className="form-label fw-semibold small mb-1">Ngày bắt đầu môn *</label>
                      <input
                        type="date"
                        required
                        className="form-control"
                        value={monForm.ngay_bat_dau}
                        onChange={e => setMonForm({ ...monForm, ngay_bat_dau: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-group mb-0">
                      <label className="form-label fw-semibold small mb-1">Ngày kết thúc môn *</label>
                      <input
                        type="date"
                        required
                        className="form-control"
                        value={monForm.ngay_ket_thuc}
                        onChange={e => setMonForm({ ...monForm, ngay_ket_thuc: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column-reverse flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 pt-3 border-top mt-3">
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary btn-modal-action flex-grow-1 flex-sm-grow-0"
                    onClick={() => { setShowMonModal(false); setEditingMonId(null); setMonForm(initialMonForm); }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-primary btn-modal-action flex-grow-1 flex-sm-grow-0"
                  >
                    {editingMonId ? "Cập nhật Môn Học" : "Lưu Môn Học"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL THÊM BÀI TẬP */}
      {showBtModal && (
        <div className="modal-overlay">
          <div
            className="modal-content p-3 p-sm-4"
            style={{ maxWidth: "560px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h3 className="fs-5 fw-bold mb-0">➕ Thêm Bài Tập</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowBtModal(false)}
                aria-label="Đóng"
                style={{ filter: "var(--close-btn-filter, none)" }}
              />
            </div>
            <form onSubmit={handleCreateBt}>
              <div className="form-group mb-3">
                <label className="form-label fw-semibold small mb-1">Tên bài tập *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={btForm.ten_bai_tap}
                  onChange={e => setBtForm({ ...btForm, ten_bai_tap: e.target.value })}
                  placeholder="VD: Bài tập lớn Đồ họa máy tính, Báo cáo tiểu luận..."
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label fw-semibold small mb-1">Môn học liên quan</label>
                <select
                  className="form-select"
                  value={btForm.mon_hoc_id}
                  onChange={e => setBtForm({ ...btForm, mon_hoc_id: e.target.value })}
                >
                  <option value="">-- Bài tập chung / Môn khác --</option>
                  {monHocs.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.ten_mon}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-12 col-sm-7">
                  <div className="form-group mb-0">
                    <label className="form-label fw-semibold small mb-1">Ngày nộp (Hạn chót) *</label>
                    <input
                      type="date"
                      required
                      className="form-control"
                      value={btForm.han_nop}
                      onChange={e => setBtForm({ ...btForm, han_nop: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-12 col-sm-5">
                  <div className="form-group mb-0">
                    <label className="form-label fw-semibold small mb-1">Giờ nộp *</label>
                    <input
                      type="time"
                      required
                      className="form-control"
                      value={btForm.gio_nop}
                      onChange={e => setBtForm({ ...btForm, gio_nop: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-12 col-sm-6">
                  <div className="form-group mb-0">
                    <label className="form-label fw-semibold small mb-1">Mức độ ưu tiên</label>
                    <select
                      className="form-select"
                      value={btForm.do_uu_tien}
                      onChange={e => setBtForm({ ...btForm, do_uu_tien: e.target.value })}
                    >
                      <option value="thap">Thấp</option>
                      <option value="trung_binh">Trung bình</option>
                      <option value="cao">Cao (Khẩn cấp)</option>
                    </select>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="form-group mb-0">
                    <label className="form-label fw-semibold small mb-1">Ghi chú / Mẹo ghi nhớ</label>
                    <input
                      type="text"
                      className="form-control"
                      value={btForm.meo_ghi_nho}
                      onChange={e => setBtForm({ ...btForm, meo_ghi_nho: e.target.value })}
                      placeholder="VD: Nộp qua Google Classroom, file zip"
                    />
                  </div>
                </div>
              </div>



              <div className="d-flex flex-column-reverse flex-sm-row justify-content-end gap-2 pt-3 border-top">
                <button
                  type="button"
                  className="btn-secondary btn-modal-action flex-grow-1 flex-sm-grow-0"
                  onClick={() => setShowBtModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-modal-action flex-grow-1 flex-sm-grow-0"
                >
                  Lưu Bài Tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
