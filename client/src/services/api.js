const API_BASE = "http://localhost:5000/api";

const getHeaders = () => {
  const token = localStorage.getItem("life_planner_token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  register: (data) => fetch(`${API_BASE}/auth/register`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  login: (data) => fetch(`${API_BASE}/auth/login`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  getMe: () => fetch(`${API_BASE}/auth/me`, { headers: getHeaders() }).then(r => r.json()),
  updateProfile: (data) => fetch(`${API_BASE}/auth/me`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  changePassword: (data) => fetch(`${API_BASE}/auth/me/password`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),

  // Dashboard & KPI
  getDashboard: () => fetch(`${API_BASE}/dashboard`, { headers: getHeaders() }).then(r => r.json()),
  getThongBao: () => fetch(`${API_BASE}/thong-bao`, { headers: getHeaders() }).then(r => r.json()),
  markThongBaoRead: (id) => fetch(`${API_BASE}/thong-bao/${id}/read`, { method: "PATCH", headers: getHeaders() }).then(r => r.json()),

  // Lịch & Sự kiện
  getSuKien: (params = "") => fetch(`${API_BASE}/su-kien${params}`, { headers: getHeaders() }).then(r => r.json()),
  createSuKien: (data) => fetch(`${API_BASE}/su-kien`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  updateSuKien: (id, data, mode = "single") => fetch(`${API_BASE}/su-kien/${id}?update_mode=${mode}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteSuKien: (id, mode = "single") => fetch(`${API_BASE}/su-kien/${id}?delete_mode=${mode}`, { method: "DELETE", headers: getHeaders() }).then(r => r.json()),

  // Môn học & GPA
  getMonHoc: () => fetch(`${API_BASE}/mon-hoc`, { headers: getHeaders() }).then(r => r.json()),
  createMonHoc: (data) => fetch(`${API_BASE}/mon-hoc`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  updateMonHoc: (id, data) => fetch(`${API_BASE}/mon-hoc/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteMonHoc: (id) => fetch(`${API_BASE}/mon-hoc/${id}`, { method: "DELETE", headers: getHeaders() }).then(r => r.json()),
  getBaoCaoHocTap: () => fetch(`${API_BASE}/bao-cao-hoc-tap`, { headers: getHeaders() }).then(r => r.json()),
  getBaiTap: () => fetch(`${API_BASE}/bai-tap`, { headers: getHeaders() }).then(r => r.json()),
  createBaiTap: (data) => fetch(`${API_BASE}/bai-tap`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  updateBaiTap: (id, data) => fetch(`${API_BASE}/bai-tap/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteBaiTap: (id) => fetch(`${API_BASE}/bai-tap/${id}`, { method: "DELETE", headers: getHeaders() }).then(r => r.json()),
  getGiaSu: () => fetch(`${API_BASE}/gia-su`).then(r => r.json()),

  // Tập luyện Gym
  getWorkoutSchedule: () => fetch(`${API_BASE}/tap-luyen/schedule`, { headers: getHeaders() }).then(r => r.json()),
  completeWorkout: (data) => fetch(`${API_BASE}/tap-luyen/hoan-thanh`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  getWorkoutReport: () => fetch(`${API_BASE}/tap-luyen/report`, { headers: getHeaders() }).then(r => r.json()),

  // Dự án & Task
  getDuAn: () => fetch(`${API_BASE}/du-an`, { headers: getHeaders() }).then(r => r.json()),
  createDuAn: (data) => fetch(`${API_BASE}/du-an`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteDuAn: (id) => fetch(`${API_BASE}/du-an/${id}`, { method: "DELETE", headers: getHeaders() }).then(r => r.json()),
  getCongViec: (query = "") => fetch(`${API_BASE}/cong-viec${query}`, { headers: getHeaders() }).then(r => r.json()),
  createCongViec: (data) => fetch(`${API_BASE}/cong-viec`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  updateCongViec: (id, data) => fetch(`${API_BASE}/cong-viec/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteCongViec: (id) => fetch(`${API_BASE}/cong-viec/${id}`, { method: "DELETE", headers: getHeaders() }).then(r => r.json())
};
