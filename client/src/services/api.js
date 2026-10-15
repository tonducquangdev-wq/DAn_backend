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
      return {
        success: data.success !== undefined ? data.success : true,
        ...data
      };
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
  getMe: () => request("/auth/me"),
  updateProfile: (data) => request("/auth/me", { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (data) => request("/auth/me/password", { method: "PUT", body: JSON.stringify(data) }),

  // Dashboard & KPI
  getDashboard: () => request("/dashboard"),
  getThongBao: () => request("/thong-bao"),
  markThongBaoRead: (id) => request(`/thong-bao/${id}/read`, { method: "PATCH" }),

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
  deleteCaLamViec: (id) => request(`/ca-lam-viec/${id}`, { method: "DELETE" })
};
