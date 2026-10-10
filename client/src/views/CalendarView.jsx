import React, { useEffect, useState } from "react";
import { api } from "../services/api";

const EVENT_TYPE_LABELS = {
  "hoc-tap": { label: "📚 Học tập", color: "#3b82f6", badgeClass: "badge-primary" },
  "tap-luyen": { label: "🏋️ Tập luyện Gym", color: "#10b981", badgeClass: "badge-success" },
  "deadline": { label: "🚨 Deadline", color: "#ef4444", badgeClass: "badge-danger" },
  "ca-nhan": { label: "☕ Cá nhân", color: "#8b5cf6", badgeClass: "badge-warning" }
};

const REPEAT_RULE_LABELS = {
  once: "Không lặp lại",
  daily: "Hàng ngày",
  weekly: "Hàng tuần",
  monthly: "Hàng tháng"
};

// Helper format date sang định dạng YYYY-MM-DDTHH:mm cho datetime-local input
const formatDateForInput = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const pad = (num) => String(num).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const CalendarView = () => {
  // State Danh sách
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State Toast Notification
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'danger' }

  // State Modal Thêm / Sửa
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // null = Thêm mới, object = Đang sửa
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // State Form
  const [formData, setFormData] = useState({
    tieu_de: "",
    loai_su_kien: "hoc-tap",
    thoi_gian_bat_dau: formatDateForInput(new Date()),
    thoi_gian_ket_thuc: formatDateForInput(new Date(Date.now() + 3600000)),
    dia_diem: "",
    mo_ta: "",
    mau_sac: "#3b82f6",
    quy_tac_lap: "once",
    update_mode: "single" // 'single' | 'all'
  });

  // State Modal Xóa
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    event: null,
    deleteMode: "single",
    submitting: false
  });

  // Nạp danh sách sự kiện từ API
  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSuKien();
      if (res.success) {
        setEvents(res.data || []);
      } else {
        setError(res.message || "Không thể tải danh sách sự kiện.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối máy chủ API: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Hiển thị Toast tự động ẩn sau 3.5 giây
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Mở modal thêm mới
  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setFormError(null);
    const now = new Date();
    const oneHourLater = new Date(Date.now() + 3600000);
    setFormData({
      tieu_de: "",
      loai_su_kien: "hoc-tap",
      thoi_gian_bat_dau: formatDateForInput(now),
      thoi_gian_ket_thuc: formatDateForInput(oneHourLater),
      dia_diem: "",
      mo_ta: "",
      mau_sac: "#3b82f6",
      quy_tac_lap: "once",
      update_mode: "single"
    });
    setShowModal(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (event) => {
    setEditingEvent(event);
    setFormError(null);
    setFormData({
      tieu_de: event.tieu_de || "",
      loai_su_kien: event.loai_su_kien || "hoc-tap",
      thoi_gian_bat_dau: formatDateForInput(event.thoi_gian_bat_dau),
      thoi_gian_ket_thuc: formatDateForInput(event.thoi_gian_ket_thuc),
      dia_diem: event.dia_diem || "",
      mo_ta: event.mo_ta || "",
      mau_sac: event.mau_sac || "#3b82f6",
      quy_tac_lap: event.quy_tac_lap || "once",
      update_mode: "single"
    });
    setShowModal(true);
  };

  // Submit Form (Tạo mới hoặc Cập nhật)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError(null);

    // 1. Kiểm tra Tiêu đề
    if (!formData.tieu_de || !formData.tieu_de.trim()) {
      setFormError("Tiêu đề sự kiện không được để trống.");
      return;
    }

    // 2. Kiểm tra Thời gian
    if (!formData.thoi_gian_bat_dau || !formData.thoi_gian_ket_thuc) {
      setFormError("Vui lòng nhập đầy đủ thời gian bắt đầu và thời gian kết thúc.");
      return;
    }

    const start = new Date(formData.thoi_gian_bat_dau);
    const end = new Date(formData.thoi_gian_ket_thuc);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setFormError("Định dạng ngày giờ không hợp lệ.");
      return;
    }

    if (end.getTime() <= start.getTime()) {
      setFormError("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.");
      return;
    }

    setSubmitting(true);

    try {
      if (editingEvent) {
        // CẬP NHẬT SỰ KIỆN
        const payload = {
          tieu_de: formData.tieu_de.trim(),
          loai_su_kien: formData.loai_su_kien,
          thoi_gian_bat_dau: formData.thoi_gian_bat_dau,
          thoi_gian_ket_thuc: formData.thoi_gian_ket_thuc,
          dia_diem: formData.dia_diem ? formData.dia_diem.trim() : null,
          mo_ta: formData.mo_ta ? formData.mo_ta.trim() : null,
          mau_sac: formData.mau_sac,
          quy_tac_lap: formData.quy_tac_lap
        };

        const res = await api.updateSuKien(editingEvent._id, payload, formData.update_mode);
        if (res.success) {
          setShowModal(false);
          showToast("Cập nhật sự kiện thành công! 🎉", "success");
          await loadEvents();
        } else {
          setFormError(res.message || "Lỗi cập nhật sự kiện.");
        }
      } else {
        // TẠO MỚI SỰ KIỆN
        const payload = {
          tieu_de: formData.tieu_de.trim(),
          loai_su_kien: formData.loai_su_kien,
          thoi_gian_bat_dau: formData.thoi_gian_bat_dau,
          thoi_gian_ket_thuc: formData.thoi_gian_ket_thuc,
          dia_diem: formData.dia_diem ? formData.dia_diem.trim() : null,
          mo_ta: formData.mo_ta ? formData.mo_ta.trim() : null,
          mau_sac: formData.mau_sac,
          quy_tac_lap: formData.quy_tac_lap
        };

        const res = await api.createSuKien(payload);
        if (res.success) {
          setShowModal(false);
          showToast("Tạo sự kiện mới thành công! 🚀", "success");
          await loadEvents();
        } else {
          setFormError(res.message || "Lỗi tạo sự kiện mới.");
        }
      }
    } catch (err) {
      setFormError("Có lỗi hệ thống: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal xác nhận xóa
  const handleOpenDeleteModal = (event) => {
    setDeleteModal({
      show: true,
      event,
      deleteMode: "single",
      submitting: false
    });
  };

  // Thực thi xóa sự kiện
  const handleConfirmDelete = async () => {
    if (!deleteModal.event) return;

    setDeleteModal(prev => ({ ...prev, submitting: true }));

    try {
      const res = await api.deleteSuKien(deleteModal.event._id, deleteModal.deleteMode);
      if (res.success) {
        setDeleteModal({ show: false, event: null, deleteMode: "single", submitting: false });
        showToast("Xóa sự kiện thành công! 🗑️", "success");
        await loadEvents();
      } else {
        showToast(res.message || "Không thể xóa sự kiện", "danger");
        setDeleteModal(prev => ({ ...prev, submitting: false }));
      }
    } catch (err) {
      showToast("Lỗi kết nối khi xóa sự kiện: " + err.message, "danger");
      setDeleteModal(prev => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div>
      {/* Toast Notification Banner */}
      {toast && (
        <div 
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 10001,
            padding: "14px 24px",
            borderRadius: "16px",
            background: toast.type === "success" ? "#10b981" : "#ef4444",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "0.9rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Top Bar */}
      <div className="header-top">
        <div>
          <h1 className="page-title">📅 Lịch Cá Nhân & Sự Kiện</h1>
          <p className="page-subtitle">Quản lý lịch học tập, tập gym, deadline và công việc cá nhân</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreateModal}>
          ➕ Thêm Sự Kiện Mới
        </button>
      </div>

      {/* Trang Thái Đang Tải / Lỗi / Danh Sách Sự Kiện */}
      <div className="glass-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0 }}>
            Danh Sách Sự Kiện ({events.length})
          </h3>
          <button className="btn-secondary" onClick={loadEvents} disabled={loading} style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
            {loading ? "⏳ Đang nạp..." : "🔄 Làm mới"}
          </button>
        </div>

        {/* 1. Đang tải */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>
            <p style={{ fontWeight: "600" }}>Đang tải danh sách sự kiện từ máy chủ...</p>
          </div>
        )}

        {/* 2. Lỗi nạp dữ liệu */}
        {!loading && error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "16px", padding: "24px", textAlign: "center", color: "#ef4444" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⚠️</div>
            <h4 style={{ fontWeight: "800", marginBottom: "6px" }}>Không thể nạp danh sách sự kiện</h4>
            <p style={{ fontSize: "0.9rem", marginBottom: "16px" }}>{error}</p>
            <button className="btn-primary" onClick={loadEvents}>
              🔄 Thử nạp lại
            </button>
          </div>
        )}

        {/* 3. Danh sách trống */}
        {!loading && !error && events.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--bg-primary)", borderRadius: "20px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📆</div>
            <h4 style={{ fontWeight: "800", fontSize: "1.1rem", marginBottom: "6px" }}>Chưa có sự kiện nào trong lịch</h4>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "20px" }}>
              Hãy nhấn nút "Thêm Sự Kiện Mới" ở trên để lên kế hoạch học tập, gym hoặc công việc của bạn!
            </p>
            <button className="btn-primary" onClick={handleOpenCreateModal}>
              ➕ Thêm Sự Kiện Mới
            </button>
          </div>
        )}

        {/* 4. Hiển thị Grid danh sách sự kiện */}
        {!loading && !error && events.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {events.map((ev) => {
              const typeInfo = EVENT_TYPE_LABELS[ev.loai_su_kien] || { label: ev.loai_su_kien, badgeClass: "badge-primary" };
              const isRecurring = ev.quy_tac_lap && ev.quy_tac_lap !== "once";

              return (
                <div
                  key={ev._id}
                  style={{
                    padding: "20px",
                    borderRadius: "20px",
                    background: "var(--neu-bg, var(--bg-primary))",
                    borderLeft: `6px solid ${ev.mau_sac || "#3b82f6"}`,
                    boxShadow: "var(--card-shadow)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    {/* Header Thẻ: Loại + Nút Hành động */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span className={`badge ${typeInfo.badgeClass}`}>
                        {typeInfo.label}
                      </span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleOpenEditModal(ev)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "1.1rem",
                            padding: "4px",
                            color: "var(--primary)"
                          }}
                          title="Chỉnh sửa sự kiện"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(ev)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "1.1rem",
                            padding: "4px",
                            color: "#ef4444"
                          }}
                          title="Xóa sự kiện"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Tiêu đề & Mô tả */}
                    <h4 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px", lineHeight: "1.4" }}>
                      {ev.tieu_de}
                    </h4>
                    {ev.mo_ta && (
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                        {ev.mo_ta}
                      </p>
                    )}
                  </div>

                  {/* Thông tin Thời gian & Địa điểm */}
                  <div style={{ marginTop: "12px", borderTop: "1px dashed var(--border-color)", paddingTop: "10px", fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div>
                      ⏰ <strong>Bắt đầu:</strong> {new Date(ev.thoi_gian_bat_dau).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                    <div>
                      ⌛ <strong>Kết thúc:</strong> {new Date(ev.thoi_gian_ket_thuc).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                    {ev.dia_diem && (
                      <div>
                        📍 <strong>Địa điểm:</strong> {ev.dia_diem}
                      </div>
                    )}
                    {isRecurring && (
                      <div style={{ color: "#10b981", fontWeight: "700", marginTop: "2px" }}>
                        🔄 Lặp lại: {REPEAT_RULE_LABELS[ev.quy_tac_lap] || ev.quy_tac_lap}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL THÊM / SỬA SỰ KIỆN */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: "560px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "800", margin: 0 }}>
                {editingEvent ? "✏️ Chỉnh Sửa Sự Kiện" : "➕ Thêm Sự Kiện Mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--text-muted)" }}
              >
                ✖
              </button>
            </div>

            {/* Thông báo lỗi trong Form */}
            {formError && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "12px 16px", borderRadius: "14px", fontSize: "0.85rem", fontWeight: "600", marginBottom: "16px" }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm}>
              {/* Tiêu đề */}
              <div className="form-group">
                <label>Tiêu đề sự kiện *</label>
                <input
                  type="text"
                  required
                  value={formData.tieu_de}
                  onChange={(e) => setFormData({ ...formData, tieu_de: e.target.value })}
                  placeholder="Ví dụ: Ôn thi Lập trình Web / Tập ngực & Tay sau"
                />
              </div>

              {/* Loại & Quy tắc lặp */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label>Loại sự kiện *</label>
                  <select
                    value={formData.loai_su_kien}
                    onChange={(e) => setFormData({ ...formData, loai_su_kien: e.target.value })}
                  >
                    <option value="hoc-tap">📚 Học tập</option>
                    <option value="tap-luyen">🏋️ Tập luyện Gym</option>
                    <option value="deadline">🚨 Deadline</option>
                    <option value="ca-nhan">☕ Cá nhân</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Quy tắc lặp lại</label>
                  <select
                    value={formData.quy_tac_lap}
                    onChange={(e) => setFormData({ ...formData, quy_tac_lap: e.target.value })}
                    disabled={!!editingEvent} // Khi đang sửa thì giữ nguyên chuỗi lặp gốc
                  >
                    <option value="once">Không lặp lại (Chỉ 1 lần)</option>
                    <option value="daily">Hàng ngày (30 ngày)</option>
                    <option value="weekly">Hàng tuần (12 tuần)</option>
                    <option value="monthly">Hàng tháng (6 tháng)</option>
                  </select>
                </div>
              </div>

              {/* Phạm vi áp dụng khi sửa sự kiện lặp */}
              {editingEvent && (editingEvent.quy_tac_lap !== "once" || editingEvent.nhom_lap_id) && (
                <div style={{ background: "rgba(37, 99, 235, 0.08)", padding: "14px", borderRadius: "16px", marginBottom: "16px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--primary)", display: "block", marginBottom: "8px" }}>
                    🔄 Sự kiện này thuộc một chuỗi lặp lại. Chọn phạm vi áp dụng sửa:
                  </label>
                  <div style={{ display: "flex", gap: "16px", fontSize: "0.85rem" }}>
                    <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="radio"
                        name="update_mode"
                        value="single"
                        checked={formData.update_mode === "single"}
                        onChange={() => setFormData({ ...formData, update_mode: "single" })}
                      />
                      <span>Chỉ sự kiện này</span>
                    </label>
                    <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="radio"
                        name="update_mode"
                        value="all"
                        checked={formData.update_mode === "all"}
                        onChange={() => setFormData({ ...formData, update_mode: "all" })}
                      />
                      <span>Toàn bộ chuỗi lặp</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Thời gian Bắt đầu & Kết thúc */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label>Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.thoi_gian_bat_dau}
                    onChange={(e) => setFormData({ ...formData, thoi_gian_bat_dau: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Thời gian kết thúc *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.thoi_gian_ket_thuc}
                    onChange={(e) => setFormData({ ...formData, thoi_gian_ket_thuc: e.target.value })}
                  />
                </div>
              </div>

              {/* Địa điểm & Màu sắc */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label>Địa điểm (nếu có)</label>
                  <input
                    type="text"
                    value={formData.dia_diem}
                    onChange={(e) => setFormData({ ...formData, dia_diem: e.target.value })}
                    placeholder="Phòng B302 / Online Zoom / Gym Fitness"
                  />
                </div>

                <div className="form-group">
                  <label>Màu hiển thị</label>
                  <input
                    type="color"
                    value={formData.mau_sac}
                    onChange={(e) => setFormData({ ...formData, mau_sac: e.target.value })}
                    style={{ height: "46px", padding: "4px", cursor: "pointer" }}
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div className="form-group">
                <label>Ghi chú / Mô tả chi tiết</label>
                <textarea
                  rows="3"
                  value={formData.mo_ta}
                  onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                  placeholder="Ghi chú nội dung môn học, bài tập gym hoặc công việc cần thực hiện..."
                />
              </div>

              {/* Nút hành động */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "⏳ Đang lưu..." : editingEvent ? "Cập Nhật Sự Kiện" : "Lưu Sự Kiện Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {deleteModal.show && deleteModal.event && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: "440px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "12px", color: "#ef4444" }}>
              🗑️ Xác Nhận Xóa Sự Kiện
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-main)", marginBottom: "16px" }}>
              Bạn có chắc chắn muốn xóa sự kiện <strong>"{deleteModal.event.tieu_de}"</strong>?
            </p>

            {/* Nếu là sự kiện lặp, cho phép chọn xóa 1 hay xóa tất cả */}
            {(deleteModal.event.quy_tac_lap !== "once" || deleteModal.event.nhom_lap_id) && (
              <div style={{ background: "rgba(239, 68, 68, 0.08)", padding: "14px", borderRadius: "14px", marginBottom: "20px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#ef4444", display: "block", marginBottom: "8px" }}>
                  🔄 Sự kiện này thuộc một chuỗi lặp lại. Chọn phạm vi xóa:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="radio"
                      name="delete_mode"
                      value="single"
                      checked={deleteModal.deleteMode === "single"}
                      onChange={() => setDeleteModal(prev => ({ ...prev, deleteMode: "single" }))}
                    />
                    <span>Chỉ xóa sự kiện này</span>
                  </label>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="radio"
                      name="delete_mode"
                      value="all"
                      checked={deleteModal.deleteMode === "all"}
                      onChange={() => setDeleteModal(prev => ({ ...prev, deleteMode: "all" }))}
                    />
                    <span>Xóa tất cả các sự kiện trong chuỗi lặp</span>
                  </label>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteModal({ show: false, event: null, deleteMode: "single", submitting: false })}
                disabled={deleteModal.submitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: "#ef4444" }}
                onClick={handleConfirmDelete}
                disabled={deleteModal.submitting}
              >
                {deleteModal.submitting ? "⏳ Đang xóa..." : "Xác Nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
