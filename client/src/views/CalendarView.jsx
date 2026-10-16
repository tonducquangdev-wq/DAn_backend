import React, { useEffect, useState, useMemo } from "react";
import { api } from "../services/api";
import { LEAD_TIME_OPTIONS, formatLeadTime } from "../services/notificationService";

// Ánh xạ Loại Sự Kiện cho Filter Pills & Badges
const EVENT_TYPE_MAP = {
  "hoc-tap": { label: "Học tập", icon: "📚", color: "#3b82f6", pillBg: "#eff6ff", textColor: "#2563eb", badgeClass: "badge-primary" },
  "tap-luyen": { label: "Tập luyện", icon: "🏋️", color: "#10b981", pillBg: "#ecfdf5", textColor: "#059669", badgeClass: "badge-success" },
  "deadline": { label: "Deadline", icon: "⏰", color: "#f59e0b", pillBg: "#fff7ed", textColor: "#d97706", badgeClass: "badge-warning" },
  "ca-nhan": { label: "Cá nhân", icon: "☕", color: "#8b5cf6", pillBg: "#faf5ff", textColor: "#9333ea", badgeClass: "badge-warning" },
  "cong-viec": { label: "Công việc", icon: "💼", color: "#6366f1", pillBg: "#e0e7ff", textColor: "#4f46e5", badgeClass: "badge-primary" }
};

const REPEAT_RULE_MAP = {
  once: "Không lặp lại",
  daily: "Hàng ngày",
  weekly: "Hàng tuần",
  monthly: "Hàng tháng"
};

// Helper format date sang YYYY-MM-DDTHH:mm cho datetime-local input
const formatDateForInput = (dateObj) => {
  if (!dateObj) return "";
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Helper so sánh 2 ngày trùng ngày/tháng/năm
const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const CalendarView = () => {
  // State Quản lý Dữ liệu Sự kiện
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State Tìm kiếm & Bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // State Chế độ xem & Điều hướng thời gian
  const [viewMode, setViewMode] = useState("month"); // 'month' | 'week' | 'day' | 'list'
  const [currentDate, setCurrentDate] = useState(new Date());

  // State Thời gian thực tế hiện tại (tự động cập nhật mỗi 10 giây để đảm bảo realtime)
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // State Toast Notification
  const [toast, setToast] = useState(null);

  // State Modals
  const [showModal, setShowModal] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [selectedDayDate, setSelectedDayDate] = useState(null);

  // State Form Thêm/Sửa
  const [formData, setFormData] = useState({
    tieu_de: "",
    loai_su_kien: "hoc-tap",
    thoi_gian_bat_dau: formatDateForInput(new Date()),
    thoi_gian_ket_thuc: formatDateForInput(new Date(Date.now() + 3600000)),
    dia_diem: "",
    mo_ta: "",
    mau_sac: "#3b82f6",
    quy_tac_lap: "once",
    bat_thong_bao: true,
    thoi_gian_nhac_truoc: 15,
    update_mode: "single"
  });

  // State Modal Xóa
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    event: null,
    deleteMode: "single",
    submitting: false
  });

  // Nạp danh sách sự kiện từ API (có hỗ trợ silent mode khi đồng bộ ngầm)
  const loadEvents = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.getSuKien();
      if (res.success) {
        setEvents(res.data || []);
      } else {
        if (!silent) setError(res.message || "Không thể tải danh sách sự kiện từ máy chủ.");
      }
    } catch (err) {
      if (!silent) setError("Lỗi kết nối máy chủ API: " + err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    // 1. Tự động tick đồng hồ thời gian thực mỗi 10 giây
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);

    // 2. Tự động nạp lại sự kiện trong nền mỗi 30 giây
    const pollInterval = setInterval(() => {
      loadEvents(true);
    }, 30000);

    // 3. Tự động cập nhật ngay khi tab trình duyệt được active / focus lại
    const handleFocus = () => {
      setCurrentTime(new Date());
      loadEvents(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleFocus();
      }
    };

    // 4. Lắng nghe tín hiệu đồng bộ sự kiện từ các màn hình khác (Bài tập, Dự án...)
    const handleCalendarRefresh = () => {
      setCurrentTime(new Date());
      loadEvents(true);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("calendar-refresh", handleCalendarRefresh);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("calendar-refresh", handleCalendarRefresh);
    };
  }, []);

  // Thông báo Toast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Lọc sự kiện theo Từ khóa & Loại sự kiện
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesSearch =
        !searchTerm.trim() ||
        ev.tieu_de.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ev.dia_diem && ev.dia_diem.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = filterType === "all" || ev.loai_su_kien === filterType;

      return matchesSearch && matchesType;
    });
  }, [events, searchTerm, filterType]);

  // Danh sách sự kiện HÔM NAY (Cập nhật thời gian thực theo currentTime)
  const todayEvents = useMemo(() => {
    return filteredEvents.filter((ev) => isSameDay(ev.thoi_gian_bat_dau, currentTime));
  }, [filteredEvents, currentTime]);

  // Danh sách sự kiện thuộc Ô Ngày được chọn
  const selectedDayEvents = useMemo(() => {
    if (!selectedDayDate) return [];
    return filteredEvents.filter((ev) => isSameDay(ev.thoi_gian_bat_dau, selectedDayDate));
  }, [filteredEvents, selectedDayDate]);

  // Xử lý khi bấm vào 1 ô lịch (ngày trong tháng hoặc cột tuần) -> hiện tab danh sách sự kiện trước
  const handleDayClick = (date) => {
    setSelectedDayDate(new Date(date));
  };

  // Danh sách DEADLINE SẮP TỚI (Tự động cập nhật theo thời gian thực)
  const upcomingDeadlines = useMemo(() => {
    const now = currentTime;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return events
      .filter((ev) => {
        // Chỉ lấy các sự kiện loại deadline hoặc liên kết với bài tập
        const isDeadline = ev.loai_su_kien === "deadline" || Boolean(ev.bai_tap_id) || (ev.tieu_de && /deadline/i.test(ev.tieu_de));
        if (!isDeadline) return false;

        // Bỏ qua các sự kiện đã hoàn thành
        if (ev.tieu_de && (ev.tieu_de.includes("(Đã xong)") || ev.tieu_de.includes("(Đã hoàn thành)"))) {
          return false;
        }

        const endDate = new Date(ev.thoi_gian_ket_thuc || ev.thoi_gian_bat_dau);
        if (isNaN(endDate.getTime())) return false;

        // Chỉ lấy các deadline còn hạn (thời gian kết thúc >= thời điểm hiện tại thực tế)
        return endDate.getTime() >= now.getTime();
      })
      .map((ev) => {
        const endDate = new Date(ev.thoi_gian_ket_thuc || ev.thoi_gian_bat_dau);
        const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        // Số ngày còn lại tính từ ngày hiện tại
        const diffDays = Math.round((endDay.getTime() - startOfToday.getTime()) / (1000 * 3600 * 24));

        const diffMs = endDate.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 3600));
        const diffMinutes = Math.floor((diffMs % (1000 * 3600)) / (1000 * 60));

        return {
          ...ev,
          endDate,
          diffDays,
          diffHours,
          diffMinutes
        };
      })
      .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
      .slice(0, 4);
  }, [events, currentTime]);

  // Điều hướng ngày
  const handleToday = () => setCurrentDate(new Date());

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  // Mở modal tạo mới
  const handleOpenCreateModal = (presetDate = null, presetHour = 9) => {
    setEditingEvent(null);
    setFormError(null);
    setDetailEvent(null);

    let start = presetDate ? new Date(presetDate) : new Date();
    if (presetDate) {
      start.setHours(presetHour, 0, 0, 0);
    }
    let end = new Date(start.getTime() + 3600000);

    setFormData({
      tieu_de: "",
      loai_su_kien: "hoc-tap",
      thoi_gian_bat_dau: formatDateForInput(start),
      thoi_gian_ket_thuc: formatDateForInput(end),
      dia_diem: "",
      mo_ta: "",
      mau_sac: "#3b82f6",
      quy_tac_lap: "once",
      bat_thong_bao: true,
      thoi_gian_nhac_truoc: 15,
      update_mode: "single"
    });
    setShowModal(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (event) => {
    setDetailEvent(null);
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
      bat_thong_bao: event.bat_thong_bao !== false,
      thoi_gian_nhac_truoc: event.thoi_gian_nhac_truoc !== undefined ? Number(event.thoi_gian_nhac_truoc) : 15,
      update_mode: "single"
    });
    setShowModal(true);
  };

  // Bật/tắt nhanh thông báo cho sự kiện (1-click)
  const handleQuickToggleNotification = async (event) => {
    try {
      const nextBatThongBao = !(event.bat_thong_bao !== false);
      const res = await api.updateSuKien(event._id, {
        bat_thong_bao: nextBatThongBao,
        thoi_gian_nhac_truoc: event.thoi_gian_nhac_truoc !== undefined ? Number(event.thoi_gian_nhac_truoc) : 15
      });
      if (res.success) {
        const updated = { ...event, bat_thong_bao: nextBatThongBao };
        if (detailEvent && detailEvent._id === event._id) {
          setDetailEvent(updated);
        }
        showToast(nextBatThongBao ? `Đã bật thông báo cho "${event.tieu_de}"! 🔔` : `Đã tắt thông báo cho "${event.tieu_de}"! 🔕`, "success");
        await loadEvents();
      } else {
        showToast(res.message || "Không thể cập nhật thông báo", "danger");
      }
    } catch (err) {
      showToast("Lỗi cập nhật: " + err.message, "danger");
    }
  };

  // Đổi nhanh số phút thông báo trước cho sự kiện
  const handleQuickChangeLeadTime = async (event, newMinutes) => {
    try {
      const minutes = Number(newMinutes);
      const res = await api.updateSuKien(event._id, {
        thoi_gian_nhac_truoc: minutes,
        bat_thong_bao: true
      });
      if (res.success) {
        const updated = { ...event, thoi_gian_nhac_truoc: minutes, bat_thong_bao: true };
        if (detailEvent && detailEvent._id === event._id) {
          setDetailEvent(updated);
        }
        showToast(`Đã đổi thời gian nhắc sự kiện: ${formatLeadTime(minutes)}! ⏰`, "success");
        await loadEvents();
      } else {
        showToast(res.message || "Không thể cập nhật thời gian nhắc", "danger");
      }
    } catch (err) {
      showToast("Lỗi cập nhật: " + err.message, "danger");
    }
  };

  // Submit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.tieu_de || !formData.tieu_de.trim()) {
      setFormError("Tiêu đề sự kiện không được để trống.");
      return;
    }

    const isDeadline = formData.loai_su_kien === "deadline";

    if (isDeadline) {
      if (!formData.thoi_gian_bat_dau) {
        setFormError("Vui lòng chọn thời hạn cho deadline.");
        return;
      }
      const start = new Date(formData.thoi_gian_bat_dau);
      if (isNaN(start.getTime())) {
        setFormError("Định dạng thời hạn deadline không hợp lệ.");
        return;
      }
    } else {
      if (!formData.thoi_gian_bat_dau || !formData.thoi_gian_ket_thuc) {
        setFormError("Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc.");
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
    }

    setSubmitting(true);

    try {
      const payload = {
        tieu_de: formData.tieu_de.trim(),
        loai_su_kien: formData.loai_su_kien,
        thoi_gian_bat_dau: formData.thoi_gian_bat_dau,
        thoi_gian_ket_thuc: isDeadline ? formData.thoi_gian_bat_dau : formData.thoi_gian_ket_thuc,
        dia_diem: formData.dia_diem ? formData.dia_diem.trim() : null,
        mo_ta: formData.mo_ta ? formData.mo_ta.trim() : null,
        mau_sac: formData.mau_sac,
        quy_tac_lap: formData.quy_tac_lap,
        bat_thong_bao: formData.bat_thong_bao,
        thoi_gian_nhac_truoc: Number(formData.thoi_gian_nhac_truoc) || 15
      };

      if (editingEvent) {
        const res = await api.updateSuKien(editingEvent._id, payload, formData.update_mode);
        if (res.success) {
          setShowModal(false);
          showToast("Cập nhật sự kiện thành công! 🎉", "success");
          await loadEvents();
        } else {
          setFormError(res.message || "Lỗi cập nhật sự kiện.");
        }
      } else {
        const res = await api.createSuKien(payload);
        if (res.success) {
          setShowModal(false);
          showToast("Tạo sự kiện mới thành công! 🚀", "success");
          await loadEvents();
        } else {
          setFormError(res.message || "Lỗi tạo sự kiện.");
        }
      }
    } catch (err) {
      setFormError("Lỗi hệ thống: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal xác nhận xóa
  const handleOpenDeleteModal = (event) => {
    setDetailEvent(null);
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
    setDeleteModal((prev) => ({ ...prev, submitting: true }));

    try {
      const res = await api.deleteSuKien(deleteModal.event._id, deleteModal.deleteMode);
      if (res.success) {
        setDeleteModal({ show: false, event: null, deleteMode: "single", submitting: false });
        showToast("Xóa sự kiện thành công! 🗑️", "success");
        await loadEvents();
      } else {
        showToast(res.message || "Không thể xóa sự kiện", "danger");
        setDeleteModal((prev) => ({ ...prev, submitting: false }));
      }
    } catch (err) {
      showToast("Lỗi kết nối khi xóa sự kiện: " + err.message, "danger");
      setDeleteModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Grid Các Ngày Trong Tháng (CN, T2, T3, T4, T5, T6, T7)
  const monthDaysGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Xử lý Chủ Nhật là ngày đầu tiên (0 = CN, 1 = T2, ..., 6 = T7)
    let startDayOfWeek = firstDay.getDay();

    const days = [];

    // Các ngày thuộc tháng trước
    for (let i = startDayOfWeek; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Các ngày trong tháng hiện tại
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currDate = new Date(year, month, i);
      days.push({ date: currDate, isCurrentMonth: true });
    }

    // Các ngày thuộc tháng sau cho đủ 35 ô
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // 7 Ngày Tuần Hiện Tại
  const weekDaysGrid = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 = CN
    const first = new Date(curr);
    first.setDate(curr.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(first);
      d.setDate(first.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  const rowCount = monthDaysGrid.length > 35 ? 6 : 5;

  return (
    <div className="calendar-page-container h-100 d-flex flex-column gap-2">
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

      {/* ============================================================
          TOP CONTROL BAR (BOOTSTRAP RESPONSIVE FLEX)
          ============================================================ */}
      <div className="cal-header-bar flex-shrink-0">
        {/* Nút Date Picker & Điều hướng Prev/Next */}
        <div className="cal-date-nav d-flex align-items-center gap-2 gap-md-3">
          <div className="cal-date-badge">
            <span className="cal-date-icon">📅</span>
            <span className="cal-date-text">
              {currentDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </div>
          <div className="cal-nav-buttons">
            <button className="cal-nav-btn" onClick={handlePrev} title="Trước">
              &lt;
            </button>
            <button className="cal-nav-btn" onClick={handleNext} title="Tiếp">
              &gt;
            </button>
          </div>
        </div>

        {/* Filter Pills (Tất cả, Học tập, Tập luyện, Deadline, Cá nhân, Công việc) */}
        <div className="cal-filter-pills d-flex align-items-center gap-1.5 gap-md-2 flex-wrap">
          <button
            className={`filter-pill ${filterType === "all" ? "active-all" : ""}`}
            onClick={() => setFilterType("all")}
          >
            <span>⣿</span> Tất cả
          </button>
          {Object.keys(EVENT_TYPE_MAP).map((typeKey) => {
            const info = EVENT_TYPE_MAP[typeKey];
            const isActive = filterType === typeKey;
            return (
              <button
                key={typeKey}
                className={`filter-pill pill-${typeKey} ${isActive ? "active-type" : ""}`}
                onClick={() => setFilterType(typeKey)}
              >
                <span>●</span> {info.label}
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher & Nút Tạo Sự Kiện Nhanh */}
        <div className="d-flex align-items-center gap-2">
          <div className="cal-view-switcher">
            <button
              className={`view-switcher-btn ${viewMode === "week" ? "active" : ""}`}
              onClick={() => setViewMode("week")}
            >
              📅 Tuần
            </button>
            <button
              className={`view-switcher-btn ${viewMode === "month" ? "active" : ""}`}
              onClick={() => setViewMode("month")}
            >
              🗓️ Tháng
            </button>
          </div>

          <button
            className="btn-primary d-none d-sm-flex align-items-center gap-1.5"
            style={{ padding: "6px 14px", fontSize: "0.82rem", whiteSpace: "nowrap" }}
            onClick={() => handleOpenCreateModal(currentDate)}
          >
            <span>➕</span>
            <span>Tạo sự kiện</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          MAIN 2-COLUMN GRID LAYOUT (DESKTOP: GRID / MOBILE: FLEX)
          ============================================================ */}
      <div className="cal-main-layout flex-grow-1 min-vh-0">

        {/* LEFT COLUMN: CỘT CHÍNH LỊCH */}
        <div className="cal-left-column d-flex flex-column h-100 min-vh-0">

          {/* HIỂN THỊ CHẾ ĐỘ XEM THÁNG (MONTH VIEW - 100VH GRID FIT) */}
          {viewMode === "month" && (
            <div className="cal-month-card h-100 d-flex flex-column min-vh-0">
              {/* Header Tên Thứ (CN, T2, T3, T4, T5, T6, T7) */}
              <div className="cal-month-header flex-shrink-0">
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((dName, idx) => (
                  <div
                    key={idx}
                    className={`month-header-cell ${idx === 0 || idx === 6 ? "weekend" : ""}`}
                  >
                    {dName}
                  </div>
                ))}
              </div>

              {/* Grid Ô Ngày trong Tháng (Chia Đều 100vh) */}
              <div
                className="cal-month-body flex-grow-1 min-vh-0"
                style={{
                  gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`
                }}
              >
                {monthDaysGrid.map((item, index) => {
                  const dayEvents = filteredEvents.filter((ev) => isSameDay(ev.thoi_gian_bat_dau, item.date));
                  const isToday = isSameDay(item.date, currentTime);

                  return (
                    <div
                      key={index}
                      className={`month-day-cell ${!item.isCurrentMonth ? "other-month" : ""} ${isToday ? "today-cell" : ""}`}
                      onClick={() => handleDayClick(item.date)}
                    >
                      {/* Tiêu đề Ngày */}
                      <div className="day-cell-top flex-shrink-0">
                        <span className={`day-number ${isToday ? "today-num" : ""}`}>
                          {item.date.getDate()}
                        </span>
                        {isToday && <span className="today-badge">Hôm nay</span>}
                      </div>

                      {/* Danh sách Sự kiện thuộc Ngày */}
                      <div className="day-events-list flex-grow-1 overflow-y-auto">
                        {dayEvents.slice(0, 2).map((ev) => {
                          const typeInfo = EVENT_TYPE_MAP[ev.loai_su_kien] || { color: ev.mau_sac || "#3b82f6" };
                          return (
                            <div
                              key={ev._id}
                              className="day-event-chip"
                              style={{ background: ev.mau_sac || typeInfo.color }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDayClick(item.date);
                              }}
                              title={ev.tieu_de}
                            >
                              <span className="event-chip-dot">●</span>
                              <span className="event-chip-title">
                                {ev.tieu_de} {ev.bat_thong_bao !== false ? "🔔" : ""}
                              </span>
                            </div>
                          );
                        })}

                        {dayEvents.length > 2 && (
                          <div
                            className="event-overflow-text"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDayClick(item.date);
                            }}
                          >
                            +{dayEvents.length - 2} sự kiện
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HIỂN THỊ CHẾ ĐỘ XEM TUẦN (WEEK VIEW) */}
          {viewMode === "week" && (
            <div className="cal-week-card h-100 d-flex flex-column min-vh-0 overflow-y-auto">
              <div className="week-days-container">
                {weekDaysGrid.map((dayDate, idx) => {
                  const isToday = isSameDay(dayDate, currentTime);
                  const dayEvents = filteredEvents.filter((ev) => isSameDay(ev.thoi_gian_bat_dau, dayDate));
                  const dayName = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][dayDate.getDay()];

                  return (
                    <div
                      key={idx}
                      className={`week-day-column ${isToday ? "active-week-column" : ""}`}
                      onClick={() => handleDayClick(dayDate)}
                    >
                      <div className="week-day-header">
                        <span className="week-day-name">{dayName}</span>
                        <span className="week-day-date">{dayDate.getDate()}</span>
                      </div>

                      <div className="week-day-body">
                        {dayEvents.length === 0 ? (
                          <div className="week-empty-text">Chưa có lịch</div>
                        ) : (
                          dayEvents.map((ev) => {
                            const startTime = new Date(ev.thoi_gian_bat_dau).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                            const endTime = new Date(ev.thoi_gian_ket_thuc).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

                            return (
                              <div
                                key={ev._id}
                                className="week-event-card"
                                style={{
                                  borderLeft: `4px solid ${ev.mau_sac || "#3b82f6"}`
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDayClick(dayDate);
                                }}
                              >
                                <div className="week-event-title">📖 {ev.tieu_de} {ev.bat_thong_bao !== false ? "🔔" : ""}</div>
                                {ev.loai_su_kien === "deadline" ? (
                                  <div className="week-event-time">⏰ Hạn: {startTime}</div>
                                ) : (
                                  <div className="week-event-time">🕒 {startTime} - {endTime}</div>
                                )}
                                {ev.dia_diem && <div className="week-event-loc">📍 {ev.dia_diem}</div>}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: WIDGETS PHỤ (LỊCH TRÌNH & DEADLINE) */}
        <div className="cal-right-column d-flex flex-column gap-2 h-100 min-vh-0">
          
          {/* WIDGET 1: LỊCH TRÌNH HÔM NAY */}
          <div className="widget-card">
            <div className="widget-header">
              <div className="widget-title">
                <span>🕒</span>
                <span>Lịch trình hôm nay</span>
              </div>
              <span className="widget-count-badge">{todayEvents.length}</span>
            </div>

            <div className="widget-body">
              {todayEvents.length === 0 ? (
                <div className="widget-empty-msg">
                  Hôm nay không có lịch trình nào.
                </div>
              ) : (
                <div className="today-events-list">
                  {todayEvents.map((ev) => (
                    <div
                      key={ev._id}
                      className="today-event-item"
                      style={{ borderLeftColor: ev.mau_sac || "#3b82f6" }}
                      onClick={() => setDetailEvent(ev)}
                    >
                      <div className="today-event-title">● {ev.tieu_de} {ev.bat_thong_bao !== false ? "🔔" : ""}</div>
                      <div className="today-event-meta">
                        <span>🕒 {new Date(ev.thoi_gian_bat_dau).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                        {ev.dia_diem && <span>📍 {ev.dia_diem}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* WIDGET 2: DEADLINE SẮP TỚI */}
          <div className="widget-card">
            <div className="widget-header">
              <div className="widget-title">
                <span>⏳</span>
                <span>Deadline sắp tới</span>
              </div>
              <span className="widget-count-badge warning">{upcomingDeadlines.length}</span>
            </div>

            <div className="widget-body">
              {upcomingDeadlines.length === 0 ? (
                <div className="widget-empty-msg">
                  Hiện không có deadline sắp tới.
                </div>
              ) : (
                <div className="deadlines-list">
                  {upcomingDeadlines.map((dl) => {
                    const isTodayDl = dl.diffDays === 0;
                    let badgeText = isTodayDl ? "Hôm nay" : `Còn ${dl.diffDays} ngày`;
                    if (isTodayDl) {
                      if (dl.diffHours > 0) {
                        badgeText = `Hôm nay (còn ${dl.diffHours}h)`;
                      } else if (dl.diffMinutes > 0) {
                        badgeText = `Hôm nay (còn ${dl.diffMinutes}p)`;
                      } else {
                        badgeText = "Hôm nay";
                      }
                    }
                    const badgeClass = isTodayDl ? "dl-badge-today" : "dl-badge-warning";
                    const timeStr = dl.endDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                    const dateStr = dl.endDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

                    return (
                      <div
                        key={dl._id}
                        className="deadline-item"
                        style={{ borderLeftColor: isTodayDl ? "#ef4444" : "#f59e0b" }}
                        onClick={() => setDetailEvent(dl)}
                      >
                        <div className="deadline-item-top">
                          <div className="deadline-item-title">
                            <span style={{ color: isTodayDl ? "#ef4444" : "#f59e0b" }}>●</span> {dl.tieu_de}
                          </div>
                          <span className={`dl-badge ${badgeClass}`}>{badgeText}</span>
                        </div>

                        <div className="deadline-item-bottom">
                          <span className="dl-subject">🎓 {dl.dia_diem || "Công việc"}</span>
                          <span className="dl-time">🕒 {timeStr} • {dateStr}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ============================================================
          CỬA SỔ MODAL DANH SÁCH SỰ KIỆN TRONG Ô LỊCH (DAY EVENTS LIST)
          ============================================================ */}
      {selectedDayDate && (
        <div className="modal-overlay" onClick={() => setSelectedDayDate(null)}>
          <div
            className="modal-content day-events-modal"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="day-modal-header d-flex justify-content-between align-items-center mb-3">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: "1.3rem" }}>📋</span>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0, color: "var(--text-main)" }}>
                    Sự Kiện Trong Ngày
                  </h3>
                  <span className="badge badge-primary" style={{ fontSize: "0.75rem", padding: "4px 8px" }}>
                    {selectedDayEvents.length} sự kiện
                  </span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px", fontWeight: "600" }}>
                  📅 {selectedDayDate.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                </div>
              </div>
              <button
                onClick={() => setSelectedDayDate(null)}
                style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--text-muted)", lineHeight: 1 }}
                title="Đóng"
              >
                ✖
              </button>
            </div>

            {/* Danh sách sự kiện hoặc Trạng thái trống */}
            <div className="day-modal-body" style={{ maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
              {selectedDayEvents.length === 0 ? (
                <div className="day-modal-empty text-center py-4">
                  <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>☕</div>
                  <h5 style={{ fontWeight: "700", color: "var(--text-main)", marginBottom: "6px", fontSize: "1rem" }}>
                    Chưa có sự kiện nào trong ngày này
                  </h5>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                    Bạn có thể bấm nút "Thêm sự kiện mới" bên dưới để lên kế hoạch học tập, tập luyện hoặc công việc!
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2.5">
                  {selectedDayEvents.map((ev) => {
                    const typeInfo = EVENT_TYPE_MAP[ev.loai_su_kien] || {
                      label: "Sự kiện",
                      icon: "📌",
                      badgeClass: "badge-primary",
                      color: ev.mau_sac || "#3b82f6"
                    };
                    const startTime = new Date(ev.thoi_gian_bat_dau).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                    const endTime = new Date(ev.thoi_gian_ket_thuc).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

                    return (
                      <div
                        key={ev._id}
                        className="day-modal-event-card"
                        style={{
                          borderLeft: `5px solid ${ev.mau_sac || typeInfo.color}`
                        }}
                        onClick={() => {
                          setSelectedDayDate(null);
                          setDetailEvent(ev);
                        }}
                        title="Bấm để xem chi tiết sự kiện"
                      >
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div className="flex-grow-1 min-w-0">
                            {/* Phân loại & Quy tắc lặp */}
                            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                              <span className={`badge ${typeInfo.badgeClass}`} style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
                                {typeInfo.icon} {typeInfo.label}
                              </span>
                              {ev.quy_tac_lap && ev.quy_tac_lap !== "once" && (
                                <span style={{ fontSize: "0.72rem", color: "var(--accent-success)", fontWeight: "700" }}>
                                  🔄 {REPEAT_RULE_MAP[ev.quy_tac_lap]}
                                </span>
                              )}
                              {ev.bat_thong_bao !== false ? (
                                <span style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: "700", background: "rgba(16, 185, 129, 0.12)", padding: "2px 8px", borderRadius: "6px" }}>
                                  🔔 Nhắc trước {formatLeadTime(ev.thoi_gian_nhac_truoc !== undefined ? ev.thoi_gian_nhac_truoc : 15)}
                                </span>
                              ) : (
                                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "rgba(100, 116, 139, 0.12)", padding: "2px 8px", borderRadius: "6px" }}>
                                  🔕 Tắt thông báo
                                </span>
                              )}
                            </div>

                            {/* Tiêu đề */}
                            <div className="day-modal-event-title" style={{ fontWeight: "800", fontSize: "0.95rem", color: "var(--text-main)", marginBottom: "4px" }}>
                              {ev.tieu_de}
                            </div>

                            {/* Thời gian & Địa điểm */}
                            <div className="d-flex align-items-center gap-3 flex-wrap" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {ev.loai_su_kien === "deadline" ? (
                                <span>⏰ Hạn chót: {startTime}</span>
                              ) : (
                                <span>🕒 {startTime} - {endTime}</span>
                              )}
                              {ev.dia_diem && <span>📍 {ev.dia_diem}</span>}
                            </div>

                            {/* Mô tả tóm tắt nếu có */}
                            {ev.mo_ta && (
                              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                📝 {ev.mo_ta}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons: 🔔 Bật/Tắt, ✏️ Sửa & 🗑️ Xóa */}
                          <div className="day-modal-event-actions d-flex align-items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="day-action-btn"
                              style={{
                                color: ev.bat_thong_bao !== false ? "#10b981" : "var(--text-muted)",
                                background: ev.bat_thong_bao !== false ? "rgba(16, 185, 129, 0.12)" : "rgba(100, 116, 139, 0.12)",
                                padding: "4px 8px",
                                fontSize: "0.78rem",
                                borderRadius: "6px"
                              }}
                              onClick={() => handleQuickToggleNotification(ev)}
                              title={ev.bat_thong_bao !== false ? "Bấm để TẮT thông báo" : "Bấm để BẬT thông báo"}
                            >
                              {ev.bat_thong_bao !== false ? "🔔 Bật" : "🔕 Tắt"}
                            </button>
                            <button
                              type="button"
                              className="day-action-btn edit-btn"
                              onClick={() => {
                                setSelectedDayDate(null);
                                handleOpenEditModal(ev);
                              }}
                              title="Chỉnh sửa sự kiện"
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              type="button"
                              className="day-action-btn delete-btn"
                              onClick={() => {
                                setSelectedDayDate(null);
                                handleOpenDeleteModal(ev);
                              }}
                              title="Xóa sự kiện"
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="day-modal-footer d-flex justify-content-between align-items-center mt-3 pt-3" style={{ borderTop: "1px solid var(--border-color)" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedDayDate(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const targetDate = selectedDayDate;
                  setSelectedDayDate(null);
                  handleOpenCreateModal(targetDate);
                }}
              >
                ➕ Thêm Sự Kiện Mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          CỬA SỔ MODAL CHI TIẾT SỰ KIỆN (EVENT DETAIL MODAL)
          ============================================================ */}
      {detailEvent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span className={`badge ${EVENT_TYPE_MAP[detailEvent.loai_su_kien]?.badgeClass || "badge-primary"}`}>
                {EVENT_TYPE_MAP[detailEvent.loai_su_kien]?.icon} {EVENT_TYPE_MAP[detailEvent.loai_su_kien]?.label || detailEvent.loai_su_kien}
              </span>
              <button
                onClick={() => setDetailEvent(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--text-muted)" }}
              >
                ✖
              </button>
            </div>

            <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "12px", lineHeight: "1.4" }}>
              {detailEvent.tieu_de}
            </h3>

            {detailEvent.mo_ta && (
              <div className="modal-desc-box">
                {detailEvent.mo_ta}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem", color: "var(--text-main)", marginBottom: "20px" }}>
              {detailEvent.loai_su_kien === "deadline" ? (
                <div>⏰ <strong>Hạn Deadline:</strong> {new Date(detailEvent.thoi_gian_ket_thuc || detailEvent.thoi_gian_bat_dau).toLocaleString("vi-VN", { dateStyle: "full", timeStyle: "short" })}</div>
              ) : (
                <>
                  <div>⏰ <strong>Thời gian bắt đầu:</strong> {new Date(detailEvent.thoi_gian_bat_dau).toLocaleString("vi-VN", { dateStyle: "full", timeStyle: "short" })}</div>
                  {detailEvent.thoi_gian_ket_thuc && (
                    <div>⌛ <strong>Thời gian kết thúc:</strong> {new Date(detailEvent.thoi_gian_ket_thuc).toLocaleString("vi-VN", { dateStyle: "full", timeStyle: "short" })}</div>
                  )}
                </>
              )}
              {detailEvent.dia_diem && <div>📍 <strong>Địa điểm:</strong> {detailEvent.dia_diem}</div>}
              {detailEvent.quy_tac_lap !== "once" && (
                <div style={{ color: "var(--accent-success)", fontWeight: "700" }}>
                  🔄 <strong>Quy tắc lặp:</strong> {REPEAT_RULE_MAP[detailEvent.quy_tac_lap]}
                </div>
              )}
            </div>

            {/* THẺ ĐIỀU KHIỂN BẬT/TẮT THÔNG BÁO CHO SỰ KIỆN */}
            <div
              style={{
                background: detailEvent.bat_thong_bao !== false ? "rgba(16, 185, 129, 0.08)" : "rgba(100, 116, 139, 0.08)",
                border: `1px solid ${detailEvent.bat_thong_bao !== false ? "rgba(16, 185, 129, 0.25)" : "rgba(100, 116, 139, 0.25)"}`,
                borderRadius: "14px",
                padding: "14px 16px",
                marginBottom: "20px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.3rem" }}>
                    {detailEvent.bat_thong_bao !== false ? "🔔" : "🔕"}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: detailEvent.bat_thong_bao !== false ? "var(--accent-success)" : "var(--text-muted)" }}>
                      {detailEvent.bat_thong_bao !== false ? "Thông báo ĐANG BẬT" : "Thông báo ĐANG TẮT"}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {detailEvent.bat_thong_bao !== false
                        ? `Nhắc trước: ${formatLeadTime(detailEvent.thoi_gian_nhac_truoc !== undefined ? detailEvent.thoi_gian_nhac_truoc : 15)}`
                        : "Sự kiện này hiện không gửi thông báo chuông"}
                    </div>
                  </div>
                </div>

                {/* Nút bật/tắt nhanh 1-click */}
                <button
                  type="button"
                  className={detailEvent.bat_thong_bao !== false ? "btn-secondary" : "btn-primary"}
                  onClick={() => handleQuickToggleNotification(detailEvent)}
                  style={{
                    padding: "6px 14px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    borderRadius: "9999px",
                    whiteSpace: "nowrap"
                  }}
                  title={detailEvent.bat_thong_bao !== false ? "Bấm để Tắt thông báo cho sự kiện này" : "Bấm để Bật thông báo cho sự kiện này"}
                >
                  {detailEvent.bat_thong_bao !== false ? "🔕 Tắt thông báo" : "🔔 Bật thông báo"}
                </button>
              </div>

              {/* Lựa chọn số phút nhắc trước khi đang bật */}
              {detailEvent.bat_thong_bao !== false && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed rgba(16, 185, 129, 0.25)" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", whiteSpace: "nowrap" }}>
                    ⏰ Nhắc trước:
                  </label>
                  <select
                    value={detailEvent.thoi_gian_nhac_truoc !== undefined ? detailEvent.thoi_gian_nhac_truoc : 15}
                    onChange={(e) => handleQuickChangeLeadTime(detailEvent, e.target.value)}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      border: "1px solid var(--border-color)",
                      background: "var(--card-bg)",
                      color: "var(--text-main)",
                      cursor: "pointer"
                    }}
                  >
                    {LEAD_TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="btn-secondary" onClick={() => setDetailEvent(null)}>
                Đóng
              </button>
              <button className="btn-primary" onClick={() => handleOpenEditModal(detailEvent)}>
                ✏️ Chỉnh sửa
              </button>
              <button className="btn-primary" style={{ background: "#ef4444" }} onClick={() => handleOpenDeleteModal(detailEvent)}>
                🗑️ Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          CỬA SỔ MODAL THÊM / SỬA SỰ KIỆN (CREATE / EDIT FORM MODAL)
          ============================================================ */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "800", margin: 0 }}>
                {editingEvent ? "✏️ Chỉnh Sửa Sự Kiện" : "➕ Tạo Sự Kiện Mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--text-muted)" }}
              >
                ✖
              </button>
            </div>

            {formError && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--accent-danger)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "12px 16px", borderRadius: "14px", fontSize: "0.85rem", fontWeight: "600", marginBottom: "16px" }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm}>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label>Loại sự kiện *</label>
                  <select
                    value={formData.loai_su_kien}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const nextData = { ...formData, loai_su_kien: newType };
                      if (newType === "deadline") {
                        if (formData.mau_sac === "#3b82f6" || !formData.mau_sac) {
                          nextData.mau_sac = "#f59e0b";
                        }
                        nextData.thoi_gian_ket_thuc = formData.thoi_gian_bat_dau;
                      } else {
                        const start = new Date(formData.thoi_gian_bat_dau || Date.now());
                        const end = new Date(formData.thoi_gian_ket_thuc || Date.now());
                        if (end.getTime() <= start.getTime()) {
                          nextData.thoi_gian_ket_thuc = formatDateForInput(new Date(start.getTime() + 3600000));
                        }
                      }
                      setFormData(nextData);
                    }}
                  >
                    <option value="hoc-tap">📚 Học tập</option>
                    <option value="tap-luyen">🏋️ Tập luyện</option>
                    <option value="deadline">⏰ Deadline</option>
                    <option value="ca-nhan">☕ Cá nhân</option>
                    <option value="cong-viec">💼 Công việc</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Quy tắc lặp lại</label>
                  <select
                    value={formData.quy_tac_lap}
                    onChange={(e) => setFormData({ ...formData, quy_tac_lap: e.target.value })}
                    disabled={!!editingEvent}
                  >
                    <option value="once">Không lặp lại (Chỉ 1 lần)</option>
                    <option value="daily">Hàng ngày (30 ngày)</option>
                    <option value="weekly">Hàng tuần (12 tuần)</option>
                    <option value="monthly">Hàng tháng (6 tháng)</option>
                  </select>
                </div>
              </div>

              {editingEvent && (editingEvent.quy_tac_lap !== "once" || editingEvent.nhom_lap_id) && (
                <div className="modal-notice-box info">
                  <label className="notice-label">
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

              {/* NẾU LÀ DEADLINE: CHỈ HIỂN THỊ HẠN DEADLINE (ẨN THỜI GIAN KẾT THÚC) */}
              {formData.loai_su_kien === "deadline" ? (
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--text-main)" }}>
                    <span>⏰</span> Hạn chót Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.thoi_gian_bat_dau}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        thoi_gian_bat_dau: e.target.value,
                        thoi_gian_ket_thuc: e.target.value
                      })
                    }
                  />
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    💡 Đối với Deadline, chỉ cần chọn hạn chót. Hệ thống sẽ theo dõi và nhắc bạn đúng hạn.
                  </div>
                </div>
              ) : (
                /* NẾU LÀ LOẠI SỰ KIỆN KHÁC: HIỂN THỊ CẢ THỜI GIAN BẮT ĐẦU VÀ KẾT THÚC */
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
              )}

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

              <div className="form-group">
                <label>Ghi chú / Mô tả chi tiết</label>
                <textarea
                  rows="3"
                  value={formData.mo_ta}
                  onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                  placeholder="Ghi chú nội dung môn học, bài tập gym hoặc công việc cần thực hiện..."
                />
              </div>

              {/* CỤM CÀI ĐẶT THÔNG BÁO CHO SỰ KIỆN */}
              <div
                style={{
                  background: formData.bat_thong_bao ? "rgba(59, 130, 246, 0.08)" : "rgba(100, 116, 139, 0.08)",
                  border: `1px solid ${formData.bat_thong_bao ? "rgba(59, 130, 246, 0.25)" : "rgba(100, 116, 139, 0.2)"}`,
                  borderRadius: "14px",
                  padding: "14px 16px",
                  marginBottom: "18px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <label style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", marginBottom: "2px" }}>
                      <span>{formData.bat_thong_bao ? "🔔" : "🔕"}</span>
                      <span>Bật thông báo sự kiện</span>
                    </label>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Hệ thống sẽ nhắc nhở và phát chuông khi sự kiện sắp diễn ra
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <label style={{ cursor: "pointer", position: "relative", display: "inline-block", width: "46px", height: "24px", margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={formData.bat_thong_bao}
                      onChange={(e) => setFormData({ ...formData, bat_thong_bao: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: formData.bat_thong_bao ? "var(--primary)" : "#cbd5e1",
                        transition: "0.3s",
                        borderRadius: "24px"
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          content: '""',
                          height: "18px",
                          width: "18px",
                          left: formData.bat_thong_bao ? "24px" : "3px",
                          bottom: "3px",
                          backgroundColor: "white",
                          transition: "0.3s",
                          borderRadius: "50%",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }}
                      />
                    </span>
                  </label>
                </div>

                {formData.bat_thong_bao && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed rgba(59, 130, 246, 0.2)" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", display: "block" }}>
                      ⏰ Thời gian thông báo trước:
                    </label>
                    <select
                      value={formData.thoi_gian_nhac_truoc}
                      onChange={(e) => setFormData({ ...formData, thoi_gian_nhac_truoc: Number(e.target.value) })}
                      style={{ width: "100%" }}
                    >
                      {LEAD_TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

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

      {/* ============================================================
          CỬA SỔ MODAL XÁC NHẬN XÓA (DELETE CONFIRMATION MODAL)
          ============================================================ */}
      {deleteModal.show && deleteModal.event && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "440px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "12px", color: "var(--accent-danger)" }}>
              🗑️ Xác Nhận Xóa Sự Kiện
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-main)", marginBottom: "16px" }}>
              Bạn có chắc chắn muốn xóa sự kiện <strong>"{deleteModal.event.tieu_de}"</strong>?
            </p>

            {(deleteModal.event.quy_tac_lap !== "once" || deleteModal.event.nhom_lap_id) && (
              <div className="modal-notice-box danger">
                <label className="notice-label danger">
                  🔄 Sự kiện này thuộc một chuỗi lặp lại. Chọn phạm vi xóa:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="radio"
                      name="delete_mode"
                      value="single"
                      checked={deleteModal.deleteMode === "single"}
                      onChange={() => setDeleteModal((prev) => ({ ...prev, deleteMode: "single" }))}
                    />
                    <span>Chỉ xóa sự kiện này</span>
                  </label>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="radio"
                      name="delete_mode"
                      value="all"
                      checked={deleteModal.deleteMode === "all"}
                      onChange={() => setDeleteModal((prev) => ({ ...prev, deleteMode: "all" }))}
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
