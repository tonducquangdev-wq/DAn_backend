const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("life_planner_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || `Lỗi máy chủ (${response.status})`
      };
    }

    if (data && typeof data === "object") {
      const isSuccess = data.success !== undefined ? data.success : true;
      if (isSuccess && options.method && ["POST", "PUT", "PATCH", "DELETE"].includes(options.method.toUpperCase())) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("calendar-refresh"));
        }
      }
      return {
        success: isSuccess,
        ...data
      };
    }

    if (options.method && ["POST", "PUT", "PATCH", "DELETE"].includes(options.method.toUpperCase())) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("calendar-refresh"));
      }
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      message: "Không thể kết nối đến máy chủ API. Vui lòng kiểm tra kết nối mạng."
    };
  }
};

export const api = {
  // Auth
  register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  adminLogin: (data) => request("/auth/admin-login", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => request("/auth/me"),
  updateProfile: (data) => request("/auth/me", { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (data) => request("/auth/me/password", { method: "PUT", body: JSON.stringify(data) }),

  // Dashboard & KPI
  getDashboard: () => request("/dashboard"),
  getThongBao: () => request("/thong-bao"),
  markThongBaoRead: (id) => request(`/thong-bao/${id}/read`, { method: "PATCH" }),
  markAllThongBaoRead: () => request("/thong-bao/read-all", { method: "PATCH" }),
  deleteThongBao: (id) => request(`/thong-bao/${id}`, { method: "DELETE" }),

  // Lịch & Sự kiện
  getSuKien: (params = "") => request(`/su-kien${params}`),
  createSuKien: (data) => request("/su-kien", { method: "POST", body: JSON.stringify(data) }),
  updateSuKien: (id, data, mode = "single") => request(`/su-kien/${id}?update_mode=${mode}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSuKien: (id, mode = "single") => request(`/su-kien/${id}?delete_mode=${mode}`, { method: "DELETE" }),

  // Môn học & GPA
  getMonHoc: () => request("/mon-hoc"),
  createMonHoc: (data) => request("/mon-hoc", { method: "POST", body: JSON.stringify(data) }),
  updateMonHoc: (id, data) => request(`/mon-hoc/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMonHoc: (id) => request(`/mon-hoc/${id}`, { method: "DELETE" }),
  getBaoCaoHocTap: () => request("/bao-cao-hoc-tap"),
  getBaiTap: () => request("/bai-tap"),
  createBaiTap: (data) => request("/bai-tap", { method: "POST", body: JSON.stringify(data) }),
  updateBaiTap: (id, data) => request(`/bai-tap/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBaiTap: (id) => request(`/bai-tap/${id}`, { method: "DELETE" }),
  getGiaSu: (params = "") => request(`/gia-su${params}`),

  // Tập luyện Gym
  getWorkoutSchedule: () => request("/tap-luyen/schedule"),
  completeWorkout: (data) => request("/tap-luyen/hoan-thanh", { method: "POST", body: JSON.stringify(data) }),
  getWorkoutReport: () => request("/tap-luyen/report"),
  getWorkoutPlans: () => request("/tap-luyen/plans"),
  createWorkoutPlan: (data) => request("/tap-luyen/plans", { method: "POST", body: JSON.stringify(data) }),
  updateWorkoutPlan: (id, data) => request(`/tap-luyen/plans/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  activateWorkoutPlan: (id) => request(`/tap-luyen/plans/${id}/activate`, { method: "PATCH" }),
  syncWorkoutPlanToCalendar: (id) => request(`/tap-luyen/plans/${id}/dong-bo-lich`, { method: "POST" }),
  deleteWorkoutPlan: (id) => request(`/tap-luyen/plans/${id}`, { method: "DELETE" }),
  updateBuoiTap: (id, data) => request(`/tap-luyen/buoi-tap/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  addExerciseToBuoi: (buoiId, data) => request(`/tap-luyen/buoi-tap/${buoiId}/exercises`, { method: "POST", body: JSON.stringify(data) }),
  updateExerciseDetail: (id, data) => request(`/tap-luyen/chi-tiet/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteExerciseDetail: (id) => request(`/tap-luyen/chi-tiet/${id}`, { method: "DELETE" }),
  getExerciseCatalog: () => request("/tap-luyen/exercises"),

  // Cộng đồng Gymmer & Chia sẻ mã code giáo án
  createShareCode: (planId, data = {}) => request(`/tap-luyen/plans/${planId}/share-code`, { method: "POST", body: JSON.stringify(data) }),
  previewPlanByCode: (code) => request(`/tap-luyen/community/preview/${encodeURIComponent(code)}`),
  importPlanByCode: (data) => request("/tap-luyen/community/import", { method: "POST", body: JSON.stringify(data) }),
  getCommunityPlans: (params = "") => request(`/tap-luyen/community/explore${params}`),
  toggleLikeCommunityPlan: (planId) => request(`/tap-luyen/community/${planId}/like`, { method: "POST" }),

  // Kênh Chat Tổng Tập Luyện (Workout Community Chat)
  getTinNhanTapLuyen: (query = "") => request(`/chat-tap-luyen${query}`),
  guiTinNhanTapLuyen: (data) => request("/chat-tap-luyen", { method: "POST", body: JSON.stringify(data) }),
  reactTinNhanTapLuyen: (id, icon) => request(`/chat-tap-luyen/${id}/react`, { method: "POST", body: JSON.stringify({ icon }) }),
  xoaTinNhanTapLuyen: (id) => request(`/chat-tap-luyen/${id}`, { method: "DELETE" }),

  // Dự án & Task
  getDuAn: () => request("/du-an"),
  createDuAn: (data) => request("/du-an", { method: "POST", body: JSON.stringify(data) }),
  updateDuAn: (id, data) => request(`/du-an/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDuAn: (id) => request(`/du-an/${id}`, { method: "DELETE" }),
  getCongViec: (query = "") => request(`/cong-viec${query}`),
  createCongViec: (data) => request("/cong-viec", { method: "POST", body: JSON.stringify(data) }),
  updateCongViec: (id, data) => request(`/cong-viec/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCongViec: (id) => request(`/cong-viec/${id}`, { method: "DELETE" }),

  // Ca làm việc & Lịch làm Part-time
  getCaLamViec: (query = "") => request(`/ca-lam-viec${query}`),
  createCaLamViec: (data) => request("/ca-lam-viec", { method: "POST", body: JSON.stringify(data) }),
  bulkCreateCaLamViec: (data) => request("/ca-lam-viec/bulk", { method: "POST", body: JSON.stringify(data) }),
  updateCaLamViec: (id, data) => request(`/ca-lam-viec/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCaLamViec: (id) => request(`/ca-lam-viec/${id}`, { method: "DELETE" }),

  // Đăng ký Chuyên gia (Gia sư & PT)
  dangKyChuyenGia: (data) => request("/chuyen-gia/dang-ky", { method: "POST", body: JSON.stringify(data) }),
  getTrangThaiHoSo: () => request("/chuyen-gia/trang-thai-ho-so"),
  huyHoSo: (id) => request(`/chuyen-gia/huy-ho-so/${id}`, { method: "DELETE" }),
  getPTs: (params = "") => request(`/chuyen-gia/pt${params}`),

  // Quản trị viên (Admin Portal)
  getAdminStats: () => request("/admin/thong-ke"),
  getAdminHoSo: (params = "") => request(`/admin/ho-so${params}`),
  duyetHoSo: (id) => request(`/admin/duyet-ho-so/${id}`, { method: "POST" }),
  tuChoiHoSo: (id, data) => request(`/admin/tu-choi-ho-so/${id}`, { method: "POST", body: JSON.stringify(data) }),
  getAdminUsers: (params = "") => request(`/admin/users${params}`),
  updateAdminUser: (id, data) => request(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  sendAdminNotification: (data) => request("/admin/notifications/broadcast", { method: "POST", body: JSON.stringify(data) }),
  getAdminNotificationHistory: () => request("/admin/notifications/history"),

  // Bạn bè (Friend system)
  getDanhSachBanBe: () => request("/ban-be"),
  getLoiMoiKetBan: () => request("/ban-be/loi-moi"),
  guiLoiMoiKetBan: (nguoi_nhan_id) => request("/ban-be/loi-moi", { method: "POST", body: JSON.stringify({ nguoi_nhan_id }) }),
  chapNhanLoiMoi: (friendshipId) => request(`/ban-be/loi-moi/${friendshipId}/chap-nhan`, { method: "PATCH" }),
  tuChoiLoiMoi: (friendshipId) => request(`/ban-be/loi-moi/${friendshipId}`, { method: "DELETE" }),
  huyKetBan: (friendUserId) => request(`/ban-be/${friendUserId}`, { method: "DELETE" }),
  timKiemNguoiDung: (params = "") => request(`/ban-be/tim-kiem${params}`),

  // Tin nhắn riêng 1-on-1 (Direct Messaging cho Bạn bè & Gia Sư)
  getHoiThoaiRieng: () => request("/tin-nhan-rieng/hoi-thoai"),
  getTinNhanVoiNguoiDung: (partnerId) => request(`/tin-nhan-rieng/user/${partnerId}`),
  guiTinNhanRieng: (data) => request("/tin-nhan-rieng", { method: "POST", body: JSON.stringify(data) }),
  getTongTinNhanChuaDoc: () => request("/tin-nhan-rieng/chua-doc/count"),
  xoaTinNhanRieng: (id) => request(`/tin-nhan-rieng/${id}`, { method: "DELETE" })
};
