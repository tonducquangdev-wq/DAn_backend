import React, { useEffect, useState, useMemo, useRef } from "react";
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

// Helper hiển thị thời gian nhắc nhở ngắn gọn cho thẻ sự kiện
const formatShortLeadTime = (minutes) => {
  const m = Number(minutes !== undefined ? minutes : 15);
  if (m === 0) return "Đúng giờ";
  if (m < 60) return `${m} phút`;
  if (m < 1440) return `${Math.floor(m / 60)} tiếng`;
  return `${Math.floor(m / 1440)} ngày`;
};

export const CalendarView = () => {
  // State Quản lý Dữ liệu Sự kiện
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State Tìm kiếm & Bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Nhận diện thiết bị Mobile (< 992px) vs Laptop/Desktop (>= 992px)
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 992);

  // State Chế độ xem: Trên Laptop/Web mặc định là "month", trên Mobile tự động là "week"
  const [viewMode, setViewMode] = useState("month");
  const currentView = isMobile ? "week" : viewMode;

  const [currentDate, setCurrentDate] = useState(new Date());

  // Ref và state phục vụ trượt ngang (Horizontal Swipe & Scroll)
  const weekContainerRef = useRef(null);
  const dayRefs = useRef({});
  const touchStartX = useRef(null);
  const [activeDayIdx, setActiveDayIdx] = useState(null);

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

    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("calendar-refresh", handleCalendarRefresh);
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("calendar-refresh", handleCalendarRefresh);
      window.removeEventListener("resize", handleResize);
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

  // Cuộn mượt đến ngày được chọn trên thanh trượt ngang (chỉ cuộn bên trong week-days-container)
  const scrollToDay = (idx) => {
    setActiveDayIdx(idx);
    const container = weekContainerRef.current;
    const targetCol = dayRefs.current[idx];
    if (container && targetCol) {
      // Đảm bảo thẻ cha cal-week-card không bao giờ bị cuộn ngang
      if (container.parentElement) {
        container.parentElement.scrollLeft = 0;
      }
      const targetLeft = targetCol.offsetLeft;
      const targetWidth = targetCol.offsetWidth;
      const containerWidth = container.clientWidth;
      const desiredScrollLeft = Math.max(0, targetLeft - (containerWidth - targetWidth) / 2);
      container.scrollTo({
        left: desiredScrollLeft,
        behavior: "smooth"
      });
    }
  };

  // Điều hướng ngày & tuần
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    const todayIndex = weekDaysGrid.findIndex((d) => isSameDay(d, now));
    if (todayIndex !== -1) {
      scrollToDay(todayIndex);
    }
  };

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (currentView === "month") d.setMonth(d.getMonth() - 1);
    else if (currentView === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (currentView === "month") d.setMonth(d.getMonth() + 1);
    else if (currentView === "week") d.setDate(d.getDate() + 7);
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

  // Lắng nghe sự kiện mở modal thêm sự kiện từ nút [+] ở thanh footer MobileBottomNav
  useEffect(() => {
    if (sessionStorage.getItem("autoOpenCreateEvent") === "true") {
      sessionStorage.removeItem("autoOpenCreateEvent");
      handleOpenCreateModal(currentDate || new Date());
    }

    const handleExternalOpenCreate = (e) => {
      const targetDate = e?.detail?.date || currentDate || new Date();
      handleOpenCreateModal(targetDate);
    };

    window.addEventListener("open-create-event-modal", handleExternalOpenCreate);
    return () => {
      window.removeEventListener("open-create-event-modal", handleExternalOpenCreate);
    };
  }, [currentDate]);

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

  // 7 Ngày Tuần Hiện Tại (Thứ Hai -> Chủ Nhật theo lịch Việt Nam)
  const weekDaysGrid = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 = CN, 1 = T2, 2 = T3, ..., 6 = T7
    const diff = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(curr);
    monday.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Nhãn hiển thị khoảng ngày tuần (VD: 11/10 - 17/10/2026)
  const weekRangeLabel = useMemo(() => {
    if (!weekDaysGrid || weekDaysGrid.length < 7) return "";
    const start = weekDaysGrid[0];
    const end = weekDaysGrid[6];
    const startDay = String(start.getDate()).padStart(2, "0");
    const startMonth = String(start.getMonth() + 1).padStart(2, "0");
    const endDay = String(end.getDate()).padStart(2, "0");
    const endMonth = String(end.getMonth() + 1).padStart(2, "0");
    const endYear = end.getFullYear();

    if (start.getMonth() === end.getMonth()) {
      return `${startDay} - ${endDay}/${endMonth}/${endYear}`;
    }
    return `${startDay}/${startMonth} - ${endDay}/${endMonth}/${endYear}`;
  }, [weekDaysGrid]);

  // Tự động cuộn đến ngày hôm nay khi đổi tuần hoặc vào màn hình tuần
  const weekStartStr = weekDaysGrid.length > 0 ? weekDaysGrid[0].toDateString() : "";

  useEffect(() => {
    if (currentView === "week" && weekDaysGrid.length > 0) {
      const todayIdx = weekDaysGrid.findIndex((d) => isSameDay(d, currentTime));
      const targetIdx = todayIdx !== -1 ? todayIdx : 0;
      setActiveDayIdx(targetIdx);
      const timer = setTimeout(() => {
        const container = weekContainerRef.current;
        const targetCol = dayRefs.current[targetIdx];
        if (container && targetCol) {
          if (container.parentElement) {
            container.parentElement.scrollLeft = 0;
          }
          const targetLeft = targetCol.offsetLeft;
          const targetWidth = targetCol.offsetWidth;
          const containerWidth = container.clientWidth;
          const desiredScrollLeft = Math.max(0, targetLeft - (containerWidth - targetWidth) / 2);
          container.scrollTo({
            left: desiredScrollLeft,
            behavior: "smooth"
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [weekStartStr, currentView]);

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
      {/* ============================================================
          TOP CONTROL BAR (BOOTSTRAP RESPONSIVE FLEX)
          ============================================================ */}
      {/* TOP CONTROL BAR: CHỈ HIỂN THỊ TRÊN LAPTOP/DESKTOP (d-none d-lg-block) */}
      {!isMobile && (
        <div className="cal-header-bar flex-shrink-0">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 w-100">
            {/* Nút Date Picker & Điều hướng Prev/Next + Hôm Nay */}
            <div className="cal-date-nav d-flex align-items-center gap-2">
              <div className="cal-date-badge">
                <span className="cal-date-icon">📅</span>
                <span className="cal-date-text">
                  {currentView === "week"
                    ? `Tuần: ${weekRangeLabel}`
                    : `Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`}
                </span>
              </div>
              <div className="cal-nav-buttons d-flex gap-1">
                <button className="cal-nav-btn" onClick={handlePrev} title="Thời gian trước">
                  &lt;
                </button>
                <button className="cal-nav-btn" onClick={handleNext} title="Thời gian sau">
                  &gt;
                </button>
                <button
                  type="button"
                  className="cal-nav-btn px-2.5"
                  style={{ width: "auto", fontSize: "0.75rem", fontWeight: 700 }}
                  onClick={handleToday}
                  title="Quay về hôm nay"
                >
                  Hôm nay
                </button>
              </div>
            </div>

            {/* View Mode Switcher & Nút Tạo Sự Kiện Nhanh trên Laptop */}
            <div className="d-flex align-items-center gap-2 ms-auto">
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
                className="btn-primary d-flex align-items-center gap-1.5"
                style={{ padding: "6px 14px", fontSize: "0.82rem", whiteSpace: "nowrap" }}
                onClick={() => handleOpenCreateModal(currentDate)}
              >
                <span>➕</span>
                <span>Tạo sự kiện</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="cal-filter-pills d-flex align-items-center gap-1.5 gap-md-2 flex-nowrap overflow-x-auto mt-2 pt-0.5 pb-0.5 w-100" style={{ scrollbarWidth: "none" }}>
            <button
              className={`filter-pill flex-shrink-0 ${filterType === "all" ? "active-all" : ""}`}
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
                  className={`filter-pill flex-shrink-0 pill-${typeKey} ${isActive ? "active-type" : ""}`}
                  onClick={() => setFilterType(typeKey)}
                >
                  <span>●</span> {info.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          MAIN 2-COLUMN GRID LAYOUT (BOOTSTRAP RESPONSIVE: DESKTOP 2 CỘT / TABLET 2 CỘT WIDGET / MOBILE FULL)
          ============================================================ */}
      <div className="row gx-0 gy-0 flex-grow-1 min-vh-0 m-0 w-100 cal-main-layout-row">

        {/* LEFT COLUMN: CỘT CHÍNH LỊCH (col-12 col-xl-8 col-xxl-9) */}
        <div className="col-12 col-xl-8 col-xxl-9 d-flex flex-column h-100 min-vh-0 p-0 cal-left-column mb-4 mb-xl-0">

          {/* HIỂN THỊ CHẾ ĐỘ XEM THÁNG (MONTH VIEW TRÊN LAPTOP / DESKTOP) */}
          {currentView === "month" && (
            <div className="cal-month-card flex-grow-1 d-flex flex-column min-vh-0">
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
                        {isToday && <span className="today-badge d-none d-sm-inline">Hôm nay</span>}
                      </div>

                      {/* Danh sách Sự kiện thuộc Ngày */}
                      <div className="day-events-list flex-grow-1 overflow-y-auto">
                        {/* 1. Trên Desktop & Tablet (>= 768px): Hiển thị thanh chip sự kiện chi tiết */}
                        <div className="d-none d-md-flex flex-column gap-1">
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

                        {/* 2. Trên Mobile (< 768px): Hiển thị các chấm màu (Event Dots) siêu gọn gàng */}
                        <div className="d-flex d-md-none flex-wrap gap-1 align-items-center justify-content-center mt-1">
                          {dayEvents.slice(0, 3).map((ev) => {
                            const typeColor = ev.mau_sac || (EVENT_TYPE_MAP[ev.loai_su_kien]?.color || "#3b82f6");
                            return (
                              <span
                                key={ev._id}
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  backgroundColor: typeColor,
                                  display: "inline-block"
                                }}
                                title={ev.tieu_de}
                              />
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "var(--primary)" }}>
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

              {/* HIỂN THỊ CHẾ ĐỘ XEM TUẦN (WEEK VIEW TRÊN MOBILE HOẶC KHI CHỌN TRÊN DESKTOP) */}
              {currentView === "week" && (
                <div className="cal-week-card flex-grow-1 d-flex flex-column min-vh-0">
              {/* 1. TOP HEADER: 📅 DD/MM/YYYY + NÚT HÔM NAY */}
              <div className="cal-week-card-header d-flex align-items-center justify-content-between mb-2.5 flex-shrink-0">
                <div className="d-flex align-items-center gap-1.5 ps-1">
                  <span className="cal-card-calendar-icon">📅</span>
                  <span className="cal-card-date-title">
                    {currentDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </span>
                </div>

                <div className="d-flex align-items-center me-1">
                  <button
                    type="button"
                    className="cal-today-circle-btn"
                    onClick={handleToday}
                    title="Quay về hôm nay"
                  >
                    Hôm nay
                  </button>
                </div>
              </div>

              {/* Thanh Lọc Sự Kiện (Filter Pills) Trượt Ngang trên Mobile */}
              <div className="cal-filter-pills d-flex align-items-center gap-1.5 flex-nowrap overflow-x-auto w-100 mb-2 px-1 flex-shrink-0" style={{ scrollbarWidth: "none" }}>
                <button
                  className={`filter-pill flex-shrink-0 ${filterType === "all" ? "active-all" : ""}`}
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
                      className={`filter-pill flex-shrink-0 pill-${typeKey} ${isActive ? "active-type" : ""}`}
                      onClick={() => setFilterType(typeKey)}
                    >
                      <span>●</span> {info.label}
                    </button>
                  );
                })}
              </div>

              {/* 2. KHU VỰC CÁC CỘT NGÀY TRƯỢT NGANG (2 CỘT SONG SONG TRÊN MOBILE) */}
              <div
                ref={weekContainerRef}
                className="week-days-container flex-grow-1 min-vh-0"
                onTouchStart={(e) => {
                  touchStartX.current = e.touches[0].clientX;
                }}
                onTouchEnd={(e) => {
                  if (touchStartX.current === null) return;
                  const container = e.currentTarget;
                  const diff = touchStartX.current - e.changedTouches[0].clientX;
                  const atStart = container.scrollLeft <= 5;
                  const atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;

                  if (diff > 70 && atEnd) {
                    handleNext();
                  } else if (diff < -70 && atStart) {
                    handlePrev();
                  }
                  touchStartX.current = null;
                }}
              >
                {weekDaysGrid.map((dayDate, idx) => {
                  const isToday = isSameDay(dayDate, currentTime);
                  const isSelected = activeDayIdx === idx;
                  const dayEvents = filteredEvents.filter((ev) => isSameDay(ev.thoi_gian_bat_dau, dayDate));
                  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
                  const dayName = dayNames[dayDate.getDay()];
                  const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

                  return (
                    <div
                      key={idx}
                      ref={(el) => (dayRefs.current[idx] = el)}
                      className={`week-day-column ${isToday ? "today-week-column" : "regular-week-column"}`}
                      onClick={() => {
                        setActiveDayIdx(idx);
                        setCurrentDate(dayDate);
                        scrollToDay(idx);
                        handleDayClick(dayDate);
                      }}
                    >
                      {/* Header Cột Ngày: Tên Thứ + Badge Hôm nay + Số ngày (Đồng bộ chuẩn Lịch Tháng) */}
                      <div className="week-day-header-box">
                        <div className="d-flex align-items-center justify-content-between w-100 mb-1">
                          <span className={`week-day-title ${isWeekend ? "weekend-title" : ""}`}>{dayName}</span>
                          {isToday && <span className="today-badge">Hôm nay</span>}
                        </div>
                        <div className="d-flex align-items-center justify-content-center">
                          <span className={`day-number ${isToday ? "today-num" : "week-day-num-standard"}`}>
                            {dayDate.getDate()}
                          </span>
                        </div>
                      </div>

                      {/* Danh sách Sự Kiện: Thẻ Chip Sự Kiện đồng bộ màu sắc & dot với Lịch Tháng */}
                      <div className="week-day-body">
                        {dayEvents.length === 0 ? (
                          <div className="week-empty-box text-center my-auto py-3">
                            <span className="week-empty-text">Trống lịch</span>
                            <button
                              type="button"
                              className="week-empty-add-btn mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreateModal(dayDate);
                              }}
                            >
                              + Thêm
                            </button>
                          </div>
                        ) : (
                          dayEvents.map((ev) => {
                            const typeInfo = EVENT_TYPE_MAP[ev.loai_su_kien] || { color: ev.mau_sac || "#3b82f6", icon: "📌" };
                            const eventBg = ev.mau_sac || typeInfo.color || "#3b82f6";
                            const startTime = new Date(ev.thoi_gian_bat_dau).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                            const endTime = new Date(ev.thoi_gian_ket_thuc).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

                            return (
                              <div
                                key={ev._id}
                                className="week-event-chip-card"
                                style={{ background: eventBg }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isMobile) {
                                    handleDayClick(dayDate);
                                  } else {
                                    setDetailEvent(ev);
                                  }
                                }}
                                title="Bấm để xem danh sách hoặc chi tiết sự kiện"
                              >
                                {/* Dòng 1: Chấm tròn ● + Tiêu đề sự kiện + Chuông 🔔 */}
                                <div className="week-event-chip-header">
                                  <span className="event-chip-dot">●</span>
                                  <span className="week-event-chip-title">{ev.tieu_de}</span>
                                  {ev.bat_thong_bao !== false && <span className="week-event-chip-bell">🔔</span>}
                                </div>

                                {/* Dòng 2: Thời gian diễn ra 🕒 */}
                                <div className="week-event-chip-time d-flex align-items-center gap-1 mt-1">
                                  <i className="bi bi-clock week-chip-sub-icon"></i>
                                  {ev.loai_su_kien === "deadline" ? (
                                    <span>Hạn: {startTime}</span>
                                  ) : (
                                    <span>{startTime} - {endTime}</span>
                                  )}
                                </div>

                                {/* Dòng 3 (nếu có địa điểm): Địa điểm 📍 */}
                                {ev.dia_diem && (
                                  <div className="week-event-chip-loc d-flex align-items-center gap-1 mt-0.5">
                                    <i className="bi bi-geo-alt week-chip-sub-icon"></i>
                                    <span className="week-chip-loc-text">{ev.dia_diem}</span>
                                  </div>
                                )}
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

        {/* RIGHT COLUMN: WIDGETS PHỤ (BOOTSTRAP RESPONSIVE: TABLET 2 CỘT / DESKTOP STACK) */}
        <div className="col-12 col-xl-4 col-xxl-3 d-flex flex-column p-0 cal-right-column">
          <div className="row gx-0 gy-0 flex-grow-1 m-0">
            
            {/* WIDGET 1: LỊCH TRÌNH HÔM NAY (Tablet: col-md-6 / Desktop: col-xl-12) */}
            <div className="col-12 col-md-6 col-xl-12 d-flex flex-column m-0 p-0 pe-md-2 pe-xl-0">
              <div className="widget-card flex-grow-1">
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
            </div>

            {/* WIDGET 2: DEADLINE SẮP TỚI (Tablet: col-md-6 / Desktop: col-xl-12) */}
            <div className="col-12 col-md-6 col-xl-12 d-flex flex-column m-0 p-0 ps-md-2 ps-xl-0 pt-3 pt-md-0 pt-xl-3">
              <div className="widget-card flex-grow-1">
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
        </div>

      </div>

      {/* ============================================================
          CỬA SỔ MODAL DANH SÁCH SỰ KIỆN TRONG Ô LỊCH (DAY EVENTS LIST)
          ============================================================ */}
      {selectedDayDate && (
        <div className="modal-overlay" onClick={() => setSelectedDayDate(null)}>
          <div
            className="modal-content day-events-modal"
            style={{
              maxWidth: "600px",
              maxHeight: "min(calc(100vh - 40px), calc(100dvh - 40px))",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              padding: "24px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-shrink-0">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-5">📋</span>
                  <h4 className="fw-bold m-0 fs-5" style={{ color: "var(--text-main)" }}>
                    Sự Kiện Trong Ngày
                  </h4>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1" style={{ fontSize: "0.74rem" }}>
                    {selectedDayEvents.length} sự kiện
                  </span>
                </div>
                <div className="text-secondary small mt-1 fw-semibold">
                  📅 {selectedDayDate.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0"
                style={{ width: "32px", height: "32px" }}
                onClick={() => setSelectedDayDate(null)}
                title="Đóng"
              >
                ✖
              </button>
            </div>

            {/* Danh sách sự kiện hoặc Trạng thái trống */}
            <div
              className="day-modal-body overflow-y-auto pe-1"
              style={{
                flex: 1,
                minHeight: 0,
                maxHeight: "none",
                overflowY: "auto",
                overflowX: "hidden"
              }}
            >
              {selectedDayEvents.length === 0 ? (
                <div className="day-modal-empty text-center py-4">
                  <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>☕</div>
                  <h5 className="fw-bold mb-1 fs-6" style={{ color: "var(--text-main)" }}>
                    Chưa có sự kiện nào trong ngày này
                  </h5>
                  <p className="small text-secondary m-0">
                    Bạn có thể bấm nút "Thêm sự kiện mới" bên dưới để lên kế hoạch học tập, tập luyện hoặc công việc!
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3.5">
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
                        className="day-modal-event-card p-3.5 rounded-3"
                        style={{
                          borderLeft: `5px solid ${ev.mau_sac || typeInfo.color}`,
                          padding: "16px 18px",
                          overflow: "hidden"
                        }}
                        onClick={() => {
                          setSelectedDayDate(null);
                          setDetailEvent(ev);
                        }}
                        title="Bấm để xem chi tiết sự kiện"
                      >
                        {/* Hàng 1: Huy hiệu phân loại & Cụm nút thao tác (Tách bạch 2 bên rộng rãi) */}
                        <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-2.5 pb-0.5">
                          {/* Huy hiệu bên trái */}
                          <div className="d-flex align-items-center gap-2 flex-wrap min-w-0">
                            <span className={`badge ${typeInfo.badgeClass}`} style={{ fontSize: "0.74rem", padding: "4px 9px", borderRadius: "8px" }}>
                              {typeInfo.icon} {typeInfo.label}
                            </span>
                            {ev.quy_tac_lap && ev.quy_tac_lap !== "once" && (
                              <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: "0.73rem", padding: "4px 9px", borderRadius: "8px" }}>
                                🔄 {REPEAT_RULE_MAP[ev.quy_tac_lap]}
                              </span>
                            )}
                            {ev.bat_thong_bao !== false ? (
                              <span
                                className="badge text-success border border-success-subtle"
                                style={{
                                  fontSize: "0.73rem",
                                  padding: "4px 9px",
                                  borderRadius: "8px",
                                  background: "rgba(16, 185, 129, 0.12)"
                                }}
                              >
                                🔔 {formatShortLeadTime(ev.thoi_gian_nhac_truoc)}
                              </span>
                            ) : (
                              <span
                                className="badge text-secondary border border-secondary-subtle"
                                style={{
                                  fontSize: "0.73rem",
                                  padding: "4px 9px",
                                  borderRadius: "8px",
                                  background: "rgba(100, 116, 139, 0.12)"
                                }}
                              >
                                🔕 Tắt chuông
                              </span>
                            )}
                          </div>

                          {/* Cụm nút thao tác bên phải (Giãn cách 10px rõ ràng, độc lập) */}
                          <div
                            className="day-action-btn-group flex-shrink-0 ms-auto"
                            style={{ display: "flex", alignItems: "center", gap: "10px" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className={`day-action-btn notify-btn ${ev.bat_thong_bao === false ? "off" : ""}`}
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

                        {/* Hàng 2: Tiêu đề sự kiện (Tách biệt rõ ràng, dễ đọc) */}
                        <div
                          className="day-modal-event-title fw-bold mb-2"
                          style={{
                            fontSize: "1.04rem",
                            color: "var(--text-main)",
                            lineHeight: "1.4",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere"
                          }}
                        >
                          {ev.tieu_de}
                        </div>

                        {/* Hàng 3: Thời gian & Địa điểm (Có khoảng cách thoáng đãng) */}
                        <div className="d-flex align-items-center gap-3 flex-wrap small text-secondary mb-1">
                          {ev.loai_su_kien === "deadline" ? (
                            <span className="d-inline-flex align-items-center gap-1.5 fw-medium">
                              <span className="fs-6">⏰</span> Hạn: <strong className="text-danger">{startTime}</strong>
                            </span>
                          ) : (
                            <span className="d-inline-flex align-items-center gap-1.5 fw-medium">
                              <span className="fs-6 text-primary">🕒</span> {startTime} – {endTime}
                            </span>
                          )}
                          {ev.dia_diem && (
                            <span className="d-inline-flex align-items-center gap-1.5 text-truncate" style={{ maxWidth: "260px" }}>
                              <span className="fs-6 text-danger">📍</span> {ev.dia_diem}
                            </span>
                          )}
                        </div>

                        {/* Hàng 4: Ghi chú mô tả (Cách biệt bằng đường kẻ đứt tinh tế) */}
                        {ev.mo_ta && (
                          <div
                            className="small text-secondary mt-2.5 pt-2"
                            style={{
                              borderTop: "1px dashed rgba(100, 116, 139, 0.2)",
                              lineHeight: "1.55",
                              fontSize: "0.85rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              wordBreak: "break-word"
                            }}
                          >
                            📝 {ev.mo_ta}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Buttons (Bootstrap Grid Responsive) */}
            <div className="row g-2 pt-3 mt-2 border-top w-100 m-0 flex-shrink-0">
              <div className="col-4 col-sm-auto">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100 py-2 rounded-3"
                  onClick={() => setSelectedDayDate(null)}
                >
                  Đóng
                </button>
              </div>
              <div className="col-8 col-sm-auto ms-sm-auto">
                <button
                  type="button"
                  className="btn btn-primary w-100 py-2 rounded-3 fw-bold"
                  onClick={() => {
                    const targetDate = selectedDayDate;
                    setSelectedDayDate(null);
                    handleOpenCreateModal(targetDate);
                  }}
                >
                  ➕ Thêm Sự Kiện
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          CỬA SỔ MODAL CHI TIẾT SỰ KIỆN (BOOTSTRAP RESPONSIVE)
          ============================================================ */}
      {detailEvent && (
        <div className="modal-overlay" onClick={() => setDetailEvent(null)}>
          <div
            className="modal-content"
            style={{
              maxWidth: "500px",
              maxHeight: "min(calc(100vh - 40px), calc(100dvh - 40px))",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              padding: "24px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-shrink-0">
              <span className={`badge ${EVENT_TYPE_MAP[detailEvent.loai_su_kien]?.badgeClass || "badge-primary"} rounded-pill px-3 py-1.5`}>
                {EVENT_TYPE_MAP[detailEvent.loai_su_kien]?.icon} {EVENT_TYPE_MAP[detailEvent.loai_su_kien]?.label || detailEvent.loai_su_kien}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0"
                style={{ width: "32px", height: "32px" }}
                onClick={() => setDetailEvent(null)}
                title="Đóng"
              >
                ✖
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div
              className="modal-detail-body overflow-y-auto pe-1"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden"
              }}
            >
              <h4
                className="fw-bold mb-3 fs-5"
                style={{
                  color: "var(--text-main)",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere"
                }}
              >
                {detailEvent.tieu_de}
              </h4>

              {detailEvent.mo_ta && (
                <div
                  className="modal-desc-box mb-3.5"
                  style={{
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    whiteSpace: "pre-wrap",
                    maxHeight: "180px",
                    overflowY: "auto"
                  }}
                >
                  {detailEvent.mo_ta}
                </div>
              )}

              <div className="d-flex flex-column gap-2.5 mb-3.5 small text-secondary">
                {detailEvent.loai_su_kien === "deadline" ? (
                  <div style={{ wordBreak: "break-word" }}>
                    ⏰ <strong>Hạn Deadline:</strong> {new Date(detailEvent.thoi_gian_ket_thuc || detailEvent.thoi_gian_bat_dau).toLocaleString("vi-VN", { dateStyle: "full", timeStyle: "short" })}
                  </div>
                ) : (
                  <>
                    <div style={{ wordBreak: "break-word" }}>
                      ⏰ <strong>Thời gian bắt đầu:</strong> {new Date(detailEvent.thoi_gian_bat_dau).toLocaleString("vi-VN", { dateStyle: "full", timeStyle: "short" })}
                    </div>
                    {detailEvent.thoi_gian_ket_thuc && (
                      <div style={{ wordBreak: "break-word" }}>
                        ⌛ <strong>Thời gian kết thúc:</strong> {new Date(detailEvent.thoi_gian_ket_thuc).toLocaleString("vi-VN", { dateStyle: "full", timeStyle: "short" })}
                      </div>
                    )}
                  </>
                )}
                {detailEvent.dia_diem && (
                  <div style={{ wordBreak: "break-word" }}>
                    📍 <strong>Địa điểm:</strong> {detailEvent.dia_diem}
                  </div>
                )}
                {detailEvent.quy_tac_lap !== "once" && (
                  <div className="text-success fw-bold">
                    🔄 <strong>Quy tắc lặp:</strong> {REPEAT_RULE_MAP[detailEvent.quy_tac_lap]}
                  </div>
                )}
              </div>

              {/* THẺ ĐIỀU KHIỂN BẬT/TẮT THÔNG BÁO CHO SỰ KIỆN */}
              <div
                className="card p-3.5 rounded-3 mb-3.5 border"
                style={{
                  background: detailEvent.bat_thong_bao !== false ? "rgba(16, 185, 129, 0.08)" : "rgba(100, 116, 139, 0.08)",
                  borderColor: detailEvent.bat_thong_bao !== false ? "rgba(16, 185, 129, 0.25)" : "rgba(100, 116, 139, 0.25)"
                }}
              >
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                  <div className="d-flex align-items-center gap-2 min-w-0">
                    <span className="fs-4 flex-shrink-0">
                      {detailEvent.bat_thong_bao !== false ? "🔔" : "🔕"}
                    </span>
                    <div className="min-w-0">
                      <div className="fw-bold small" style={{ color: detailEvent.bat_thong_bao !== false ? "var(--accent-success)" : "var(--text-muted)" }}>
                        {detailEvent.bat_thong_bao !== false ? "Thông báo ĐANG BẬT" : "Thông báo ĐANG TẮT"}
                      </div>
                      <div className="small text-secondary text-truncate" style={{ fontSize: "0.78rem" }}>
                        {detailEvent.bat_thong_bao !== false
                          ? `Nhắc trước: ${formatLeadTime(detailEvent.thoi_gian_nhac_truoc !== undefined ? detailEvent.thoi_gian_nhac_truoc : 15)}`
                          : "Sự kiện này hiện không gửi thông báo chuông"}
                      </div>
                    </div>
                  </div>

                  {/* Nút bật/tắt nhanh 1-click */}
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold flex-shrink-0 ${
                      detailEvent.bat_thong_bao !== false ? "btn-outline-success" : "btn-outline-secondary"
                    }`}
                    onClick={() => handleQuickToggleNotification(detailEvent)}
                    title={detailEvent.bat_thong_bao !== false ? "Bấm để Tắt thông báo cho sự kiện này" : "Bấm để Bật thông báo cho sự kiện này"}
                  >
                    {detailEvent.bat_thong_bao !== false ? "🔕 Tắt chuông" : "🔔 Bật chuông"}
                  </button>
                </div>

                {/* Lựa chọn số phút nhắc trước khi đang bật */}
                {detailEvent.bat_thong_bao !== false && (
                  <div className="d-flex align-items-center gap-2 mt-2.5 pt-2.5 border-top border-success-subtle">
                    <label className="small fw-bold text-nowrap m-0" style={{ color: "var(--text-main)" }}>
                      ⏰ Nhắc trước:
                    </label>
                    <select
                      className="form-select form-select-sm rounded-3"
                      value={detailEvent.thoi_gian_nhac_truoc !== undefined ? detailEvent.thoi_gian_nhac_truoc : 15}
                      onChange={(e) => handleQuickChangeLeadTime(detailEvent, e.target.value)}
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
            </div>

            {/* Footer Buttons (Bootstrap Responsive Grid) */}
            <div className="row g-2 pt-3 mt-2 border-top w-100 m-0 flex-shrink-0">
              <div className="col-6 col-sm-auto">
                <button
                  type="button"
                  className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold shadow-sm"
                  onClick={() => handleOpenEditModal(detailEvent)}
                >
                  ✏️ Chỉnh sửa
                </button>
              </div>
              <div className="col-6 col-sm-auto">
                <button
                  type="button"
                  className="btn btn-danger w-100 py-2.5 rounded-3 fw-bold shadow-sm"
                  onClick={() => handleOpenDeleteModal(detailEvent)}
                >
                  🗑️ Xóa
                </button>
              </div>
              <div className="col-12 col-sm-auto ms-sm-auto">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100 py-2.5 rounded-3"
                  onClick={() => setDetailEvent(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          CỬA SỔ MODAL THÊM / SỬA SỰ KIỆN (BOOTSTRAP RESPONSIVE FORM)
          ============================================================ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            style={{
              maxWidth: "560px",
              maxHeight: "min(calc(100vh - 40px), calc(100dvh - 40px))",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              padding: "24px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-shrink-0">
              <h4 className="fw-bold m-0 fs-5 text-truncate" style={{ color: "var(--text-main)" }}>
                {editingEvent ? "✏️ Chỉnh Sửa Sự Kiện" : "➕ Tạo Sự Kiện Mới"}
              </h4>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0"
                style={{ width: "32px", height: "32px" }}
                onClick={() => setShowModal(false)}
                title="Đóng"
              >
                ✖
              </button>
            </div>

            {formError && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 fw-semibold flex-shrink-0">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="d-flex flex-column flex-grow-1 min-vh-0" style={{ overflow: "hidden", minHeight: 0 }}>
              <div className="overflow-y-auto pe-1 flex-grow-1" style={{ minHeight: 0 }}>
                {/* Tiêu đề sự kiện */}
                <div className="mb-3">
                  <label className="form-label fw-bold small text-secondary mb-1">
                    Tiêu đề sự kiện <span className="text-danger">*</span>
                  </label>
                <input
                  type="text"
                  className="form-control form-control-md rounded-3"
                  required
                  value={formData.tieu_de}
                  onChange={(e) => setFormData({ ...formData, tieu_de: e.target.value })}
                  placeholder="Ví dụ: Ôn thi Lập trình Web / Tập ngực & Tay sau"
                />
              </div>

              {/* Hàng 1: Loại sự kiện & Quy tắc lặp (Bootstrap Grid) */}
              <div className="row g-2 g-sm-3 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-bold small text-secondary mb-1">
                    Loại sự kiện <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select rounded-3"
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

                <div className="col-12 col-sm-6">
                  <label className="form-label fw-bold small text-secondary mb-1">
                    Quy tắc lặp lại
                  </label>
                  <select
                    className="form-select rounded-3"
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
                <div className="alert alert-info py-2 px-3 mb-3 rounded-3 small">
                  <div className="fw-bold mb-1">
                    🔄 Sự kiện này thuộc một chuỗi lặp lại. Chọn phạm vi áp dụng sửa:
                  </div>
                  <div className="d-flex gap-3 flex-wrap">
                    <div className="form-check m-0">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="upSingle"
                        name="update_mode"
                        value="single"
                        checked={formData.update_mode === "single"}
                        onChange={() => setFormData({ ...formData, update_mode: "single" })}
                      />
                      <label className="form-check-label" htmlFor="upSingle">
                        Chỉ sự kiện này
                      </label>
                    </div>
                    <div className="form-check m-0">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="upAll"
                        name="update_mode"
                        value="all"
                        checked={formData.update_mode === "all"}
                        onChange={() => setFormData({ ...formData, update_mode: "all" })}
                      />
                      <label className="form-check-label" htmlFor="upAll">
                        Toàn bộ chuỗi lặp
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* NẾU LÀ DEADLINE: CHỈ HIỂN THỊ HẠN DEADLINE */}
              {formData.loai_su_kien === "deadline" ? (
                <div className="mb-3">
                  <label className="form-label fw-bold small text-secondary mb-1">
                    ⏰ Hạn chót Deadline <span className="text-danger">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control rounded-3"
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
                  <div className="small text-secondary mt-1">
                    💡 Đối với Deadline, chỉ cần chọn hạn chót. Hệ thống sẽ theo dõi và nhắc bạn đúng hạn.
                  </div>
                </div>
              ) : (
                /* NẾU LÀ LOẠI SỰ KIỆN KHÁC: HIỂN THỊ CẢ BẮT ĐẦU VÀ KẾT THÚC */
                <div className="row g-2 g-sm-3 mb-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label fw-bold small text-secondary mb-1">
                      Thời gian bắt đầu <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control rounded-3"
                      required
                      value={formData.thoi_gian_bat_dau}
                      onChange={(e) => setFormData({ ...formData, thoi_gian_bat_dau: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label fw-bold small text-secondary mb-1">
                      Thời gian kết thúc <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control rounded-3"
                      required
                      value={formData.thoi_gian_ket_thuc}
                      onChange={(e) => setFormData({ ...formData, thoi_gian_ket_thuc: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Hàng: Địa điểm & Màu sắc (Bootstrap Grid) */}
              <div className="row g-2 g-sm-3 mb-3">
                <div className="col-8 col-sm-8">
                  <label className="form-label fw-bold small text-secondary mb-1">
                    Địa điểm (nếu có)
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    value={formData.dia_diem}
                    onChange={(e) => setFormData({ ...formData, dia_diem: e.target.value })}
                    placeholder="Phòng B302 / Online Zoom / Gym"
                  />
                </div>

                <div className="col-4 col-sm-4">
                  <label className="form-label fw-bold small text-secondary mb-1">
                    Màu sắc
                  </label>
                  <input
                    type="color"
                    className="form-control form-control-color w-100 rounded-3"
                    style={{ height: "38px" }}
                    value={formData.mau_sac}
                    onChange={(e) => setFormData({ ...formData, mau_sac: e.target.value })}
                  />
                </div>
              </div>

              {/* Ghi chú / Mô tả chi tiết */}
              <div className="mb-3">
                <label className="form-label fw-bold small text-secondary mb-1">
                  Ghi chú / Mô tả chi tiết
                </label>
                <textarea
                  className="form-control rounded-3"
                  rows="3"
                  value={formData.mo_ta}
                  onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                  placeholder="Ghi chú nội dung môn học, bài tập hoặc công việc cần thực hiện..."
                />
              </div>

              {/* CỤM CÀI ĐẶT THÔNG BÁO CHO SỰ KIỆN (Bootstrap Switch & Card) */}
              <div
                className="card p-3 rounded-3 mb-3 border"
                style={{
                  background: formData.bat_thong_bao ? "rgba(59, 130, 246, 0.08)" : "rgba(100, 116, 139, 0.08)",
                  borderColor: formData.bat_thong_bao ? "rgba(59, 130, 246, 0.25)" : "rgba(100, 116, 139, 0.2)"
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold small d-flex align-items-center gap-1.5 mb-0.5" style={{ color: "var(--text-main)" }}>
                      <span>{formData.bat_thong_bao ? "🔔" : "🔕"}</span>
                      <span>Bật thông báo sự kiện</span>
                    </div>
                    <div className="small text-secondary" style={{ fontSize: "0.78rem" }}>
                      Hệ thống sẽ nhắc nhở và phát chuông khi sự kiện sắp diễn ra
                    </div>
                  </div>

                  {/* Bootstrap Switch */}
                  <div className="form-check form-switch m-0 fs-5">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="eventNotifySwitch"
                      checked={formData.bat_thong_bao}
                      onChange={(e) => setFormData({ ...formData, bat_thong_bao: e.target.checked })}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </div>

                {formData.bat_thong_bao && (
                  <div className="mt-2.5 pt-2.5 border-top border-primary-subtle">
                    <label className="form-label small fw-bold text-secondary mb-1">
                      ⏰ Thời gian thông báo trước:
                    </label>
                    <select
                      className="form-select form-select-sm rounded-3"
                      value={formData.thoi_gian_nhac_truoc}
                      onChange={(e) => setFormData({ ...formData, thoi_gian_nhac_truoc: Number(e.target.value) })}
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
            </div>

            {/* Footer Buttons (Bootstrap Grid Responsive) */}
            <div className="row g-2 pt-3 mt-2 border-top w-100 m-0 pb-1 flex-shrink-0">
              <div className="col-6 col-sm-auto ms-sm-auto">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100 px-4 py-2.5 rounded-3 fw-semibold"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Hủy
                </button>
              </div>
              <div className="col-6 col-sm-auto">
                <button
                  type="submit"
                  className="btn btn-primary w-100 px-4 py-2.5 rounded-3 fw-bold shadow-sm"
                  disabled={submitting}
                >
                  {submitting ? "⏳ Đang lưu..." : editingEvent ? "Cập Nhật" : "Lưu Sự Kiện"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* ============================================================
          CỬA SỔ MODAL XÁC NHẬN XÓA (BOOTSTRAP RESPONSIVE)
          ============================================================ */}
      {deleteModal.show && deleteModal.event && (
        <div
          className="modal-overlay"
          onClick={() => !deleteModal.submitting && setDeleteModal({ show: false, event: null, deleteMode: "single", submitting: false })}
        >
          <div className="modal-content" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex align-items-center gap-2 mb-2 text-danger">
              <span className="fs-4">🗑️</span>
              <h5 className="fw-bold m-0 fs-5">Xác Nhận Xóa Sự Kiện</h5>
            </div>
            <p className="small text-secondary mb-3">
              Bạn có chắc chắn muốn xóa sự kiện <strong>"{deleteModal.event.tieu_de}"</strong>?
            </p>

            {(deleteModal.event.quy_tac_lap !== "once" || deleteModal.event.nhom_lap_id) && (
              <div className="alert alert-danger py-2.5 px-3 mb-3 rounded-3 small">
                <div className="fw-bold mb-2">
                  🔄 Sự kiện này thuộc một chuỗi lặp lại. Chọn phạm vi xóa:
                </div>
                <div className="d-flex flex-column gap-1.5">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      id="delSingle"
                      name="delete_mode"
                      value="single"
                      checked={deleteModal.deleteMode === "single"}
                      onChange={() => setDeleteModal((prev) => ({ ...prev, deleteMode: "single" }))}
                    />
                    <label className="form-check-label" htmlFor="delSingle">
                      Chỉ xóa sự kiện này
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      id="delAll"
                      name="delete_mode"
                      value="all"
                      checked={deleteModal.deleteMode === "all"}
                      onChange={() => setDeleteModal((prev) => ({ ...prev, deleteMode: "all" }))}
                    />
                    <label className="form-check-label" htmlFor="delAll">
                      Xóa tất cả sự kiện trong chuỗi lặp
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="row g-2 pt-3 mt-3 border-top w-100 m-0 pb-1">
              <div className="col-6">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100 py-2.5 rounded-3 fw-semibold"
                  onClick={() => setDeleteModal({ show: false, event: null, deleteMode: "single", submitting: false })}
                  disabled={deleteModal.submitting}
                >
                  Hủy
                </button>
              </div>
              <div className="col-6">
                <button
                  type="submit"
                  className="btn btn-danger w-100 py-2.5 rounded-3 fw-bold shadow-sm"
                  onClick={handleConfirmDelete}
                  disabled={deleteModal.submitting}
                >
                  {deleteModal.submitting ? "⏳ Đang xóa..." : "Xác Nhận Xóa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
