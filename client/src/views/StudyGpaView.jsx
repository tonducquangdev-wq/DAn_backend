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

const formatScheduleDays = (days) => {
  if (!days || !days.length) return "T2";
  const map = { 2: "T2", 3: "T3", 4: "T4", 5: "T5", 6: "T6", 7: "T7", 8: "CN" };
  return days.map(d => map[d] || d).join(", ");
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

  const loadData = () => {
    api.getMonHoc().then(res => res.success && setMonHocs(res.data));
    api.getBaiTap().then(res => res.success && setBaiTaps(res.data));
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleDay = (dayValue) => {
    setMonForm(prev => {
      const exists = prev.ngay_hoc.includes(dayValue);
      const newDays = exists ? prev.ngay_hoc.filter(d => d !== dayValue) : [...prev.ngay_hoc, dayValue];
      return { ...prev, ngay_hoc: newDays.sort((a, b) => a - b) };
    });
  };

  const handleCreateMon = async (e) => {
    e.preventDefault();
    if (!monForm.ngay_hoc || monForm.ngay_hoc.length === 0) {
      alert("Vui lòng chọn ít nhất một ngày học trong tuần.");
      return;
    }
    const res = await api.createMonHoc(monForm);
    if (res.success) {
      setShowMonModal(false);
      setMonForm(initialMonForm);
      loadData();
      showToast(res.message || "Tạo môn học và tự động đồng bộ trang Lịch thành công!");
    } else {
      alert(res.message || "Lỗi tạo môn học");
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
    <div>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 9999,
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "#ffffff",
          padding: "14px 22px",
          borderRadius: "14px",
          boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
          fontWeight: "600",
          fontSize: "0.92rem",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "fadeIn 0.3s ease"
        }}>
          <span>✨</span>
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="header-top">
        <div>
          <h1 className="page-title">🎓 Quản Lý Học Tập</h1>
          <p className="page-subtitle">Theo dõi lịch học, phòng học, giảng viên và hạn nộp bài tập</p>
        </div>
        <div className="action-bar">
          {onOpenDangKyGiaSu && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onOpenDangKyGiaSu}
              style={{
                fontWeight: "700",
                background: "var(--neu-bg)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                boxShadow: "4px 4px 10px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)"
              }}
              title="Đăng ký trở thành Gia Sư chia sẻ kiến thức"
            >
              🎓 Đăng Ký Gia Sư
            </button>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onNavigateToTutor ? onNavigateToTutor() : setIsViewingTutors(true)}
            style={{
              fontWeight: "700",
              background: "rgba(139, 92, 246, 0.12)",
              color: "#7c3aed",
              border: "1px solid rgba(139, 92, 246, 0.25)"
            }}
          >
            👩‍🏫 Tìm Gia Sư Hỗ Trợ
          </button>
          <button className="btn-secondary" onClick={() => setShowBtModal(true)}>➕ Thêm Bài Tập</button>
          <button className="btn-primary" onClick={() => setShowMonModal(true)}>➕ Thêm Môn Học</button>
        </div>
      </div>

      {/* Danh sách môn học */}
      <div className="glass-card" style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
            📚 Danh Sách Môn Học & Lịch Trình
          </h3>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Tổng số: <strong>{monHocs.length}</strong> môn học
          </span>
        </div>

        {monHocs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ color: "var(--text-muted)", fontStyle: "italic", marginBottom: "14px" }}>
              Chưa có môn học nào được thêm. Hãy nhấn "Thêm Môn Học" để bắt đầu và tự động lên lịch học!
            </p>
            <button className="btn-primary" onClick={() => setShowMonModal(true)}>➕ Thêm Môn Học Đầu Tiên</button>
          </div>
        ) : (
          <div className="neu-table-wrapper" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>TÊN MÔN HỌC</th>
                  <th>GIẢNG VIÊN</th>
                  <th>PHÒNG HỌC</th>
                  <th>GIỜ & NGÀY HỌC</th>
                  <th>THỜI GIAN MÔN</th>
                  <th>TRẠNG THÁI</th>
                  <th style={{ textAlign: "center" }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {monHocs.map(m => (
                  <tr key={m._id}>
                    <td style={{ fontWeight: "700" }}>{m.ten_mon}</td>
                    <td>{m.giang_vien || "-"}</td>
                    <td>
                      {m.phong_hoc ? (
                        <span style={{ fontWeight: "600", color: "var(--primary)" }}>📍 {m.phong_hoc}</span>
                      ) : "-"}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.88rem" }}>
                          ⏰ {m.gio_bat_dau || "07:30"} - {m.gio_ket_thuc || "09:30"}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          📅 {formatScheduleDays(m.ngay_hoc)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        {formatDateDisplay(m.ngay_bat_dau)} ➔ {formatDateDisplay(m.ngay_ket_thuc)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${m.trang_thai === 'da_hoan_thanh' ? 'badge-success' : 'badge-primary'}`}>
                        {m.trang_thai === 'da_hoan_thanh' ? 'Đã hoàn thành' : 'Đang học'}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="btn-danger"
                        style={{
                          padding: "6px 12px",
                          fontSize: "0.78rem",
                          borderRadius: "8px",
                          cursor: "pointer",
                          border: "none",
                          background: "#fee2e2",
                          color: "#dc2626",
                          fontWeight: "700"
                        }}
                        onClick={() => handleDeleteMon(m._id, m.ten_mon)}
                        title="Xóa môn học và đồng bộ dọn dẹp lịch"
                      >
                        🗑️ Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Danh sách Bài tập & Deadline môn học */}
      <div className="glass-card" style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
              📝 Bài Tập & Deadline Môn Học
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              ⚡ Tự động đồng bộ và lưu vào trang Lịch dưới mục Deadline
            </span>
          </div>
          <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem", fontWeight: "700" }} onClick={() => setShowBtModal(true)}>
            ➕ Thêm Bài Tập
          </button>
        </div>
        {baiTaps.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>Chưa có bài tập nào cần làm.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                  className="deadline-item"
                  style={{
                    borderLeft: `4px solid ${isCompleted ? "#10b981" : priorityColor}`,
                    opacity: isCompleted ? 0.75 : 1,
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggleBtStatus(bt)}
                        title="Đánh dấu hoàn thành"
                        style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#10b981" }}
                      />
                      <span
                        className="deadline-item-title"
                        style={{
                          textDecoration: isCompleted ? "line-through" : "none",
                          color: isCompleted ? "var(--text-muted)" : "var(--text-main)",
                          fontSize: "0.95rem"
                        }}
                      >
                        {bt.ten_bai_tap}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
                          padding: "3px 8px"
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
                          fontSize: "0.85rem",
                          padding: "2px 6px",
                          borderRadius: "6px"
                        }}
                        title="Xóa bài tập và dọn dẹp deadline trên lịch"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.82rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                    <span>🎓 Môn: <strong>{bt.mon_hoc_id?.ten_mon || "Bài tập chung"}</strong></span>
                    <span>⏰ Hạn nộp: <strong>{formattedTime} ngày {formattedDate}</strong></span>
                    {bt.meo_ghi_nho && <span>💡 {bt.meo_ghi_nho}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Môn học */}
      {showMonModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "620px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "8px" }}>➕ Thêm Môn Học & Tự Động Lên Lịch</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>
              Nhập thông tin môn học. Hệ thống sẽ tự động đồng bộ tất cả các buổi học vào <strong>trang Lịch cá nhân</strong>.
            </p>
            <form onSubmit={handleCreateMon}>
              <div className="form-group">
                <label>Tên môn học *</label>
                <input
                  type="text"
                  required
                  value={monForm.ten_mon}
                  onChange={e => setMonForm({ ...monForm, ten_mon: e.target.value })}
                  placeholder="VD: Cấu trúc dữ liệu & Giải thuật"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label>Phòng học</label>
                  <input
                    type="text"
                    value={monForm.phong_hoc}
                    onChange={e => setMonForm({ ...monForm, phong_hoc: e.target.value })}
                    placeholder="P.302 - Nhà A"
                  />
                </div>
                <div className="form-group">
                  <label>Giảng viên phụ trách</label>
                  <input
                    type="text"
                    value={monForm.giang_vien}
                    onChange={e => setMonForm({ ...monForm, giang_vien: e.target.value })}
                    placeholder="TS. Nguyễn Văn A"
                  />
                </div>
              </div>

              {/* Khung cấu hình lịch học tự động */}
              <div style={{
                background: "rgba(59, 130, 246, 0.05)",
                border: "1px solid rgba(59, 130, 246, 0.15)",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "18px"
              }}>
                <div style={{ fontWeight: "700", fontSize: "0.92rem", marginBottom: "12px", color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>📅 Cấu hình Lịch học (Tự động thêm vào Trang Lịch)</span>
                </div>

                {/* Chọn ngày học trong tuần */}
                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label style={{ marginBottom: "8px", display: "block" }}>Ngày học trong tuần (chọn các thứ):</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {DAYS_OF_WEEK.map(day => {
                      const isSelected = monForm.ngay_hoc.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          style={{
                            padding: "6px 14px",
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

                {/* Giờ học */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Giờ bắt đầu học *</label>
                    <input type="time" required value={monForm.gio_bat_dau} onChange={e => setMonForm({ ...monForm, gio_bat_dau: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Giờ kết thúc học *</label>
                    <input type="time" required value={monForm.gio_ket_thuc} onChange={e => setMonForm({ ...monForm, gio_ket_thuc: e.target.value })} />
                  </div>
                </div>

                {/* Thời gian môn học: Ngày bắt đầu & Thời gian kết thúc môn */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Ngày bắt đầu môn học *</label>
                    <input type="date" required value={monForm.ngay_bat_dau} onChange={e => setMonForm({ ...monForm, ngay_bat_dau: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Thời gian kết thúc môn *</label>
                    <input type="date" required value={monForm.ngay_ket_thuc} onChange={e => setMonForm({ ...monForm, ngay_ket_thuc: e.target.value })} />
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--border-color)"
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>⚡</span>
                  <span>Tự động đồng bộ lịch học vào trang Lịch</span>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn-secondary btn-modal-action"
                    onClick={() => setShowMonModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-primary btn-modal-action"
                  >
                    Lưu Môn Học
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bài tập */}
      {showBtModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "6px" }}>➕ Thêm Bài Tập & Tự Động Lưu Deadline</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              Tạo bài tập mới. Hệ thống sẽ <strong>tự động đồng bộ và lưu deadline vào trang Lịch</strong> để nhắc nhở bạn đúng hạn.
            </p>
            <form onSubmit={handleCreateBt}>
              <div className="form-group">
                <label>Tên bài tập *</label>
                <input
                  type="text"
                  required
                  value={btForm.ten_bai_tap}
                  onChange={e => setBtForm({ ...btForm, ten_bai_tap: e.target.value })}
                  placeholder="VD: Bài tập lớn Đồ họa máy tính, Báo cáo tiểu luận..."
                />
              </div>

              <div className="form-group">
                <label>Môn học liên quan</label>
                <select
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

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "14px", marginBottom: "14px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Ngày nộp (Hạn chót) *</label>
                  <input
                    type="date"
                    required
                    value={btForm.han_nop}
                    onChange={e => setBtForm({ ...btForm, han_nop: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Giờ nộp *</label>
                  <input
                    type="time"
                    required
                    value={btForm.gio_nop}
                    onChange={e => setBtForm({ ...btForm, gio_nop: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label>Mức độ ưu tiên</label>
                  <select value={btForm.do_uu_tien} onChange={e => setBtForm({ ...btForm, do_uu_tien: e.target.value })}>
                    <option value="thap">Thấp</option>
                    <option value="trung_binh">Trung bình</option>
                    <option value="cao">Cao (Khẩn cấp)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ghi chú / Mẹo ghi nhớ</label>
                  <input
                    type="text"
                    value={btForm.meo_ghi_nho}
                    onChange={e => setBtForm({ ...btForm, meo_ghi_nho: e.target.value })}
                    placeholder="VD: Nộp qua Google Classroom, file nén .zip"
                  />
                </div>
              </div>

              {/* Banner thông báo đồng bộ lịch */}
              <div
                style={{
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  marginTop: "8px",
                  marginBottom: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "0.82rem",
                  color: "var(--text-main)"
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>📅</span>
                <div>
                  <strong>Tự động lên Lịch:</strong> Bài tập này sẽ được hiển thị trên <strong>trang Lịch</strong> dưới dạng sự kiện <em>Deadline</em> màu cam và xuất hiện trong danh sách <em>Deadline sắp tới</em>.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--border-color)"
                }}
              >
                <button
                  type="button"
                  className="btn-secondary btn-modal-action"
                  onClick={() => setShowBtModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-modal-action"
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
