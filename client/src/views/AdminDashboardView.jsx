import React, { useState, useEffect, useMemo } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { AdminChartsAnalytics } from "../components/AdminChartsAnalytics";
import { AdminNotificationManager } from "../components/AdminNotificationManager";
import "../styles/admin.css";

export const AdminDashboardView = ({ onBackToApp }) => {
  const { user, refreshUser } = useAuth();

  // Tab: "analytics" | "applications" | "users" | "notifications"
  const [currentTab, setCurrentTab] = useState("analytics");
  const [preselectedNotificationUser, setPreselectedNotificationUser] = useState(null);

  // State Thống kê
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // State Danh sách Hồ sơ
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [filterAppStatus, setFilterAppStatus] = useState("pending");
  const [filterAppType, setFilterAppType] = useState("all");
  const [searchApp, setSearchApp] = useState("");

  // State Danh sách Users
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [filterUserRole, setFilterUserRole] = useState("all");
  const [filterUserStatus, setFilterUserStatus] = useState("all");
  const [searchUser, setSearchUser] = useState("");

  // Modal Từ chối hồ sơ
  const [rejectModal, setRejectModal] = useState({ open: false, app: null, reason: "" });
  const [submittingAction, setSubmittingAction] = useState(false);

  // Modal Phóng to Chứng chỉ
  const [previewCert, setPreviewCert] = useState(null);

  // Thông báo Toast nhanh
  const [toastMsg, setToastMsg] = useState({ type: "", text: "" });

  const showToast = (type, text) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg({ type: "", text: "" }), 4000);
  };

  // Nạp thống kê
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.getAdminStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (e) {
      console.error("Lỗi nạp thống kê:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  // Nạp danh sách hồ sơ
  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      let query = `?trang_thai=${filterAppStatus}&loai=${filterAppType}`;
      if (searchApp.trim()) {
        query += `&search=${encodeURIComponent(searchApp.trim())}`;
      }
      const res = await api.getAdminHoSo(query);
      if (res.success && Array.isArray(res.data)) {
        setApplications(res.data);
      }
    } catch (e) {
      console.error("Lỗi nạp hồ sơ:", e);
    } finally {
      setLoadingApps(false);
    }
  };

  // Nạp danh sách users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      let query = `?role=${filterUserRole}&status=${filterUserStatus}`;
      if (searchUser.trim()) {
        query += `&search=${encodeURIComponent(searchUser.trim())}`;
      }
      const res = await api.getAdminUsers(query);
      if (res.success && Array.isArray(res.data)) {
        setUsersList(res.data);
      }
    } catch (e) {
      console.error("Lỗi nạp người dùng:", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (currentTab === "applications") {
      fetchApplications();
    } else if (currentTab === "users") {
      fetchUsers();
    }
  }, [currentTab, filterAppStatus, filterAppType, filterUserRole, filterUserStatus]);

  // Hành động Phê duyệt hồ sơ
  const handleApprove = async (appItem) => {
    const roleName = appItem.loai === "gia_su" ? "Gia Sư Học Tập" : "Huấn Luyện Viên PT";
    if (!window.confirm(`Bạn có chắc chắn muốn PHÊ DUYỆT hồ sơ của "${appItem.ho_ten}" làm ${roleName}?`)) {
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await api.duyetHoSo(appItem._id);
      if (res.success) {
        showToast("success", `✅ Đã phê duyệt thành công hồ sơ của ${appItem.ho_ten}!`);
        fetchApplications();
        fetchStats();
      } else {
        showToast("error", `❌ ${res.message || "Lỗi phê duyệt"}`);
      }
    } catch (e) {
      showToast("error", "Lỗi kết nối máy chủ");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Mở modal từ chối
  const openRejectModal = (appItem) => {
    setRejectModal({
      open: true,
      app: appItem,
      reason: "Bằng cấp hoặc thông tin xác thực chưa đầy đủ/rõ ràng."
    });
  };

  // Xác nhận từ chối hồ sơ
  const handleConfirmReject = async () => {
    if (!rejectModal.app) return;
    setSubmittingAction(true);
    try {
      const res = await api.tuChoiHoSo(rejectModal.app._id, { ly_do: rejectModal.reason });
      if (res.success) {
        showToast("info", `Đã từ chối hồ sơ của ${rejectModal.app.ho_ten}.`);
        setRejectModal({ open: false, app: null, reason: "" });
        fetchApplications();
        fetchStats();
      } else {
        showToast("error", res.message || "Lỗi từ chối hồ sơ");
      }
    } catch (e) {
      showToast("error", "Lỗi gửi yêu cầu");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Cập nhật role người dùng
  const handleChangeRole = async (targetUserId, newRole, userName) => {
    if (!window.confirm(`Chuyển đổi quyền của "${userName}" sang [${newRole.toUpperCase()}]?`)) return;

    try {
      const res = await api.updateAdminUser(targetUserId, { role: newRole });
      if (res.success) {
        showToast("success", `Đã cập nhật quyền của ${userName} thành ${newRole}`);
        fetchUsers();
        fetchStats();
        if (targetUserId === user._id) {
          refreshUser();
        }
      } else {
        showToast("error", res.message);
      }
    } catch (e) {
      showToast("error", "Lỗi cập nhật người dùng");
    }
  };

  // Khóa / Mở khóa tài khoản
  const handleToggleBan = async (targetUser) => {
    const nextStatus = targetUser.status === "banned" ? "active" : "banned";
    const actionText = nextStatus === "banned" ? "KHÓA" : "MỞ KHÓA";

    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của "${targetUser.name}"?`)) return;

    try {
      const res = await api.updateAdminUser(targetUser._id, { status: nextStatus });
      if (res.success) {
        showToast(nextStatus === "banned" ? "warning" : "success", `Đã ${actionText.toLowerCase()} tài khoản thành công!`);
        fetchUsers();
        fetchStats();
      } else {
        showToast("error", res.message);
      }
    } catch (e) {
      showToast("error", "Lỗi xử lý tài khoản");
    }
  };

  return (
    <div className="admin-portal-view">
      {/* Toast Alert */}
      {toastMsg.text && (
        <div
          className="admin-toast-banner"
          style={{
            background: toastMsg.type === "success" ? "#10b981" : toastMsg.type === "error" ? "#ef4444" : "#f59e0b"
          }}
        >
          <span>{toastMsg.text}</span>
          <button
            type="button"
            className="btn-close btn-close-white btn-sm ms-2"
            onClick={() => setToastMsg({ type: "", text: "" })}
            aria-label="Close"
          />
        </div>
      )}

      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 pb-3 mb-4 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span style={{ fontSize: "1.75rem" }}>👑</span>
            <h1 className="admin-header-title m-0">
              TRUNG TÂM QUẢN TRỊ ADMIN
            </h1>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.65rem",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#fff",
                fontWeight: 700
              }}
            >
              RBAC PORTAL
            </span>
          </div>
          <p className="mt-1 mb-0 text-muted" style={{ fontSize: "0.88rem" }}>
            Kiểm duyệt hồ sơ Gia Sư & PT Thể Hình, phân quyền và quản trị toàn bộ người dùng hệ thống.
          </p>
        </div>

        {/* Action Buttons in Header */}
        <div className="d-flex flex-wrap gap-2 w-100 w-md-auto">
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="btn btn-outline-secondary admin-header-btn flex-grow-1 flex-md-grow-0"
              type="button"
              title="Quay trở lại ứng dụng Life Planner"
            >
              <span>⬅️</span>
              <span>Quay lại ứng dụng</span>
            </button>
          )}
          <button
            onClick={() => {
              fetchStats();
              if (currentTab === "applications") fetchApplications();
              else if (currentTab === "users") fetchUsers();
              showToast("info", "Đã làm mới dữ liệu!");
            }}
            className="btn btn-primary admin-header-btn flex-grow-1 flex-md-grow-0"
            type="button"
            title="Làm mới dữ liệu thống kê & danh sách"
          >
            <span>🔄</span>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards (Bootstrap Responsive Grid) */}
      <div className="row g-3 mb-4">
        {/* Card 1: Users */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-stat-card">
            <div
              className="admin-stat-icon"
              style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}
            >
              👥
            </div>
            <div>
              <div className="admin-stat-label">Tổng Người Dùng</div>
              <div className="admin-stat-value">{stats?.users?.total || 0}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {stats?.users?.students || 0} Học viên / Sinh viên
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Applications */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="admin-stat-card"
            style={{
              border: "2px solid #f59e0b",
              boxShadow: "0 0 15px rgba(245, 158, 11, 0.2)"
            }}
          >
            <div
              className="admin-stat-icon"
              style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}
            >
              ⏳
            </div>
            <div>
              <div className="admin-stat-label" style={{ color: "#f59e0b" }}>Đơn Chờ Thẩm Định</div>
              <div className="admin-stat-value" style={{ color: "#f59e0b" }}>
                {stats?.applications?.pending || 0}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Cần Admin xem xét bằng cấp
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Tutors */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-stat-card">
            <div
              className="admin-stat-icon"
              style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}
            >
              🎓
            </div>
            <div>
              <div className="admin-stat-label">Gia Sư Đã Xác Thực</div>
              <div className="admin-stat-value">{stats?.users?.tutors || 0}</div>
              <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>
                Đủ điều kiện giảng dạy
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: PTs */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-stat-card">
            <div
              className="admin-stat-icon"
              style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}
            >
              🏋️
            </div>
            <div>
              <div className="admin-stat-label">Huấn Luyện Viên PT</div>
              <div className="admin-stat-value">{stats?.users?.pts || 0}</div>
              <div style={{ fontSize: "0.75rem", color: "#8b5cf6", fontWeight: 600 }}>
                Được cấp chứng chỉ thể hình
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Controls (Scrollable on Mobile, Thumb-friendly) */}
      <div className="admin-tabs-nav-wrapper">
        <div className="admin-tabs-scroll">
          <button
            onClick={() => setCurrentTab("analytics")}
            className={`admin-tab-btn ${currentTab === "analytics" ? "active" : ""}`}
            type="button"
          >
            <span>📊</span>
            <span>Biểu Đồ & Thống Kê</span>
          </button>

          <button
            onClick={() => setCurrentTab("applications")}
            className={`admin-tab-btn ${currentTab === "applications" ? "active" : ""}`}
            type="button"
          >
            <span>📑</span>
            <span>Phê Duyệt Hồ Sơ</span>
            {stats?.applications?.pending > 0 && (
              <span
                className="admin-tab-badge"
                style={{
                  background: currentTab === "applications" ? "#ef4444" : "#f59e0b",
                  color: "#fff"
                }}
              >
                {stats.applications.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab("users")}
            className={`admin-tab-btn ${currentTab === "users" ? "active" : ""}`}
            type="button"
          >
            <span>👥</span>
            <span>Quản Lý Người Dùng & Phân Quyền</span>
          </button>

          <button
            onClick={() => {
              setPreselectedNotificationUser(null);
              setCurrentTab("notifications");
            }}
            className={`admin-tab-btn ${currentTab === "notifications" ? "active" : ""}`}
            type="button"
          >
            <span>📢</span>
            <span>Phát Thông Báo</span>
          </button>
        </div>
      </div>

      {/* TAB 0: BIỂU ĐỒ & THỐNG KÊ TRỰC QUAN (CHARTS & ANALYTICS) */}
      {currentTab === "analytics" && (
        <AdminChartsAnalytics stats={stats} loading={loadingStats} />
      )}

      {/* TAB 1: APPLICATIONS APPROVAL QUEUE */}
      {currentTab === "applications" && (
        <div>
          {/* Sub-filters for Applications */}
          <div className="admin-filter-bar">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-sm-6 col-md-auto">
                <div className="admin-filter-item">
                  <label className="admin-filter-label">
                    Trạng thái:
                  </label>
                  <select
                    value={filterAppStatus}
                    onChange={(e) => setFilterAppStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="pending">⏳ Chờ duyệt (Pending)</option>
                    <option value="approved">✅ Đã phê duyệt (Approved)</option>
                    <option value="rejected">❌ Bị từ chối (Rejected)</option>
                    <option value="all">Tất cả trạng thái</option>
                  </select>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-auto">
                <div className="admin-filter-item">
                  <label className="admin-filter-label">
                    Loại đơn:
                  </label>
                  <select
                    value={filterAppType}
                    onChange={(e) => setFilterAppType(e.target.value)}
                    className="form-select"
                  >
                    <option value="all">Tất cả (Gia sư & PT)</option>
                    <option value="gia_su">🎓 Gia sư học tập</option>
                    <option value="pt">🏋️ Huấn luyện viên PT</option>
                  </select>
                </div>
              </div>

              <div className="col-12 col-md ms-md-auto">
                <div className="admin-search-box">
                  <span className="admin-search-icon">🔍</span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Tìm tên, email, chuyên môn..."
                    value={searchApp}
                    onChange={(e) => setSearchApp(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchApplications()}
                  />
                  <button
                    className="admin-search-btn"
                    type="button"
                    onClick={fetchApplications}
                    title="Tìm kiếm hồ sơ"
                  >
                    Tìm
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Applications Content List */}
          {loadingApps ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontWeight: 600 }}>
              ⏳ Đang nạp danh sách hồ sơ...
            </div>
          ) : applications.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3.5rem 2rem",
                background: "var(--card-bg, #ffffff)",
                borderRadius: "16px",
                border: "1px dashed var(--border-color)"
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "0.8rem" }}>🎉</div>
              <h3 style={{ margin: "0 0 0.4rem 0", color: "var(--text-main)" }}>
                Không có hồ sơ nào ở mục này!
              </h3>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Hiện không có hồ sơ nào cần duyệt hoặc khớp với bộ lọc tìm kiếm.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1.2rem" }}>
              {applications.map((appItem) => {
                const isGiaSu = appItem.loai === "gia_su";
                const isPending = appItem.trang_thai === "pending";
                const isApproved = appItem.trang_thai === "approved";
                const isRejected = appItem.trang_thai === "rejected";

                return (
                  <div
                    key={appItem._id}
                    className={`admin-app-card ${isPending ? "pending-border" : ""}`}
                  >
                    {/* Header Row of Application */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "0.8rem"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div
                          style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "50%",
                            background: isGiaSu
                              ? "linear-gradient(135deg, #10b981, #059669)"
                              : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "1.3rem"
                          }}
                        >
                          {isGiaSu ? "🎓" : "🏋️"}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>
                              {appItem.ho_ten}
                            </h3>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                padding: "0.2rem 0.6rem",
                                borderRadius: "8px",
                                background: isGiaSu ? "rgba(16, 185, 129, 0.2)" : "rgba(139, 92, 246, 0.2)",
                                color: isGiaSu ? "#10b981" : "#a78bfa"
                              }}
                            >
                              {isGiaSu ? "ỨNG TUYỂN GIA SƯ" : "ỨNG TUYỂN HLV PT"}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "1rem",
                              fontSize: "0.85rem",
                              color: "var(--text-muted)",
                              marginTop: "0.2rem",
                              flexWrap: "wrap"
                            }}
                          >
                            <span>📧 {appItem.email}</span>
                            <span>📞 {appItem.so_dien_thoai}</span>
                            <span>📍 {appItem.khu_vuc}</span>
                            <span>⏰ {new Date(appItem.createdAt).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isPending && (
                          <span
                            style={{
                              background: "rgba(245, 158, 11, 0.2)",
                              color: "#f59e0b",
                              padding: "0.4rem 0.8rem",
                              borderRadius: "20px",
                              fontSize: "0.85rem",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem"
                            }}
                          >
                            ⏳ Đang chờ duyệt
                          </span>
                        )}
                        {isApproved && (
                          <span
                            style={{
                              background: "rgba(16, 185, 129, 0.2)",
                              color: "#10b981",
                              padding: "0.4rem 0.8rem",
                              borderRadius: "20px",
                              fontSize: "0.85rem",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem"
                            }}
                          >
                            ✅ Đã Phê Duyệt
                          </span>
                        )}
                        {isRejected && (
                          <span
                            style={{
                              background: "rgba(239, 68, 68, 0.2)",
                              color: "#ef4444",
                              padding: "0.4rem 0.8rem",
                              borderRadius: "20px",
                              fontSize: "0.85rem",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem"
                            }}
                          >
                            ❌ Đã Từ Chối
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Info Details (Responsive Grid) */}
                    <div className="admin-app-details-grid">
                      <div>
                        <strong style={{ color: "var(--text-muted)", fontSize: "0.78rem", display: "block" }}>
                          CHUYÊN MÔN CHÍNH:
                        </strong>
                        <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{appItem.chuyen_mon}</span>
                      </div>
                      <div>
                        <strong style={{ color: "var(--text-muted)", fontSize: "0.78rem", display: "block" }}>
                          KINH NGHIỆM:
                        </strong>
                        <span style={{ color: "var(--text-main)" }}>{appItem.kinh_nghiem}</span>
                      </div>
                      <div>
                        <strong style={{ color: "var(--text-muted)", fontSize: "0.78rem", display: "block" }}>
                          MỨC GIÁ DỰ KIẾN:
                        </strong>
                        <span style={{ color: "#10b981", fontWeight: 700 }}>
                          {Number(appItem.gia_theo_gio).toLocaleString("vi-VN")} đ / giờ
                        </span>
                      </div>
                      <div>
                        <strong style={{ color: "var(--text-muted)", fontSize: "0.78rem", display: "block" }}>
                          BẰNG CẤP / CHỨNG CHỈ:
                        </strong>
                        <span style={{ color: "var(--text-main)" }}>
                          {appItem.hoc_vi_hoac_the_hinh || (isGiaSu ? "Cử nhân Đại học" : "HLV Thể hình")}
                        </span>
                      </div>
                    </div>

                    {/* Mô tả ứng viên */}
                    {appItem.mo_ta && (
                      <div style={{ fontSize: "0.9rem", color: "var(--text-main)", lineHeight: 1.5 }}>
                        <strong style={{ color: "var(--text-muted)" }}>Lời giới thiệu: </strong>
                        {appItem.mo_ta}
                      </div>
                    )}

                    {/* Danh sách Chứng Chỉ & Bằng Cấp Đính Kèm */}
                    {appItem.chung_chi && appItem.chung_chi.length > 0 && (
                      <div>
                        <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                          🎖️ Chứng chỉ & Bằng cấp thẩm định ({appItem.chung_chi.length}):
                        </strong>
                        <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                          {appItem.chung_chi.map((cert, cIdx) => (
                            <div
                              key={cIdx}
                              onClick={() => setPreviewCert(cert)}
                              className="admin-cert-chip"
                              title="Click để phóng to xem chứng chỉ"
                            >
                              {cert.hinh_anh ? (
                                <img
                                  src={cert.hinh_anh}
                                  alt="Thumb"
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    objectFit: "cover",
                                    borderRadius: "6px",
                                    border: "1px solid var(--border-color)"
                                  }}
                                />
                              ) : (
                                <span style={{ fontSize: "1.2rem" }}>📜</span>
                              )}
                              <div>
                                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                  <span>{cert.ten_chung_chi}</span>
                                  {cert.hinh_anh && (
                                    <span style={{ fontSize: "0.68rem", color: "#10b981", background: "rgba(16, 185, 129, 0.15)", padding: "1px 6px", borderRadius: "10px" }}>
                                      📷 Có ảnh gốc
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  {cert.noi_cap || "Đơn vị đào tạo"} • {cert.nam_cap || "2025"} (Click xem to 🔍)
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lý do từ chối nếu có */}
                    {isRejected && appItem.ly_do_tu_choi && (
                      <div
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          borderLeft: "4px solid #ef4444",
                          padding: "0.8rem 1rem",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          color: "#ef4444"
                        }}
                      >
                        <strong>Lý do từ chối:</strong> {appItem.ly_do_tu_choi}
                      </div>
                    )}

                    {/* Action Buttons for Pending Application (Touch-friendly & Stacked on Mobile) */}
                    {isPending && (
                      <div className="d-flex flex-column-reverse flex-sm-row justify-content-sm-end gap-2 pt-3 border-top w-100">
                        <button
                          onClick={() => openRejectModal(appItem)}
                          disabled={submittingAction}
                          className="btn btn-outline-danger admin-app-action-btn w-100 w-sm-auto"
                          type="button"
                        >
                          <span>❌</span>
                          <span>Từ Chối Hồ Sơ</span>
                        </button>

                        <button
                          onClick={() => handleApprove(appItem)}
                          disabled={submittingAction}
                          className="btn btn-success admin-app-action-btn w-100 w-sm-auto shadow-sm"
                          type="button"
                        >
                          <span>✅</span>
                          <span>Phê Duyệt & Nâng Cấp Quyền</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT & ROLE ASSIGNMENT */}
      {currentTab === "users" && (
        <div>
          {/* Filters for Users */}
          <div className="admin-filter-bar">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-sm-6 col-md-auto">
                <div className="admin-filter-item">
                  <label className="admin-filter-label">
                    Quyền hạn:
                  </label>
                  <select
                    value={filterUserRole}
                    onChange={(e) => setFilterUserRole(e.target.value)}
                    className="form-select"
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="user">👤 Sinh viên / Học viên</option>
                    <option value="tutor">🎓 Gia Sư (Tutor)</option>
                    <option value="pt">🏋️ Huấn Luyện Viên PT</option>
                    <option value="admin">👑 Quản Trị Viên (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-auto">
                <div className="admin-filter-item">
                  <label className="admin-filter-label">
                    Trạng thái:
                  </label>
                  <select
                    value={filterUserStatus}
                    onChange={(e) => setFilterUserStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">🟢 Đang hoạt động</option>
                    <option value="banned">🔴 Đã bị khóa</option>
                  </select>
                </div>
              </div>

              <div className="col-12 col-md ms-md-auto">
                <div className="admin-search-box">
                  <span className="admin-search-icon">🔍</span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Tìm theo Họ tên, Email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                  />
                  <button
                    className="admin-search-btn"
                    type="button"
                    onClick={fetchUsers}
                    title="Tìm kiếm người dùng"
                  >
                    Tìm
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* User Table */}
          {loadingUsers ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontWeight: 600 }}>
              ⏳ Đang nạp danh sách tài khoản...
            </div>
          ) : usersList.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3.5rem 2rem",
                background: "var(--card-bg, rgba(30, 41, 59, 0.4))",
                borderRadius: "16px",
                border: "1px dashed var(--border-color, rgba(255,255,255,0.1))"
              }}
            >
              <h3 style={{ margin: "0 0 0.4rem 0", color: "var(--text-main)" }}>Không tìm thấy người dùng!</h3>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc.
              </p>
            </div>
          ) : (
            <div>
              {/* 1. MOBILE CARDS VIEW (< 768px): Thumb-friendly & No Horizontal Table Squish */}
              <div className="d-block d-md-none">
                {usersList.map((uItem) => {
                  const isSelf = uItem._id === user?._id;
                  const isBanned = uItem.status === "banned";

                  return (
                    <div key={uItem._id} className="admin-user-card-mobile">
                      {/* Top Header of Card */}
                      <div className="d-flex justify-content-between align-items-center gap-2">
                        <div className="d-flex align-items-center gap-2 min-w-0 flex-grow-1" style={{ minWidth: 0 }}>
                          <div
                            style={{
                              width: "42px",
                              height: "42px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "1rem",
                              flexShrink: 0
                            }}
                          >
                            {uItem.name ? uItem.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="min-w-0 flex-grow-1" style={{ minWidth: 0, overflow: "hidden" }}>
                            <div
                              className="fw-bold text-truncate"
                              style={{ color: "var(--text-main)", fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                              title={uItem.name}
                            >
                              {uItem.name} {isSelf && <span className="badge bg-primary-subtle text-primary ms-1">Bạn</span>}
                            </div>
                            <div
                              className="text-muted text-truncate"
                              style={{ fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                              title={uItem.email}
                            >
                              {uItem.email}
                            </div>
                          </div>
                        </div>

                        {/* Status badge */}
                        <span
                          className={`badge rounded-pill flex-shrink-0 text-nowrap ${isBanned ? "bg-danger-subtle text-danger border border-danger-subtle" : "bg-success-subtle text-success border border-success-subtle"}`}
                          style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem", flexShrink: 0, whiteSpace: "nowrap" }}
                        >
                          {isBanned ? "🔴 Bị Khóa" : "🟢 Hoạt Động"}
                        </span>
                      </div>

                      {/* Contact & Date Info */}
                      <div className="p-2 rounded-2 border" style={{ background: "var(--input-bg, #f8fafc)", fontSize: "0.82rem" }}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Điện thoại:</span>
                          <span className="fw-semibold">{uItem.phone || "Chưa có"}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Ngày tham gia:</span>
                          <span>{new Date(uItem.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                        {uItem.is_expert_verified && (
                          <div className="text-success fw-bold mt-1" style={{ fontSize: "0.75rem" }}>
                            ✓ Verified Expert
                          </div>
                        )}
                      </div>

                      {/* Role Selector on mobile */}
                      <div>
                        <label className="text-muted fw-bold mb-1" style={{ fontSize: "0.75rem" }}>
                          VAI TRÒ (ROLE):
                        </label>
                        <select
                          value={uItem.role || "user"}
                          disabled={isSelf}
                          onChange={(e) => handleChangeRole(uItem._id, e.target.value, uItem.name)}
                          className="form-select form-select-sm fw-bold"
                          style={{
                            background:
                              uItem.role === "admin"
                                ? "rgba(245, 158, 11, 0.15)"
                                : uItem.role === "tutor"
                                ? "rgba(16, 185, 129, 0.15)"
                                : uItem.role === "pt"
                                ? "rgba(139, 92, 246, 0.15)"
                                : "rgba(59, 130, 246, 0.15)",
                            color:
                              uItem.role === "admin"
                                ? "#d97706"
                                : uItem.role === "tutor"
                                ? "#059669"
                                : uItem.role === "pt"
                                ? "#7c3aed"
                                : "#2563eb",
                            minHeight: "42px"
                          }}
                        >
                          <option value="user">👤 Sinh viên / User</option>
                          <option value="tutor">🎓 Gia Sư (Tutor)</option>
                          <option value="pt">🏋️ Huấn Luyện Viên PT</option>
                          <option value="admin">👑 Quản Trị Viên (Admin)</option>
                        </select>
                      </div>

                      {/* Action buttons on mobile card (Full-width Touch Target, Separated) */}
                      {!isSelf && (
                        <div className="d-flex gap-2 pt-2 border-top">
                          <button
                            type="button"
                            onClick={() => {
                              setPreselectedNotificationUser(uItem);
                              setCurrentTab("notifications");
                            }}
                            className="btn btn-outline-primary admin-user-card-btn flex-fill"
                            title={`Soạn thông báo gửi riêng cho ${uItem.name}`}
                          >
                            <span>✉️</span>
                            <span>Gửi Tin</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleBan(uItem)}
                            className={`btn ${isBanned ? "btn-outline-success" : "btn-outline-danger"} admin-user-card-btn flex-fill`}
                            title={isBanned ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                          >
                            <span>{isBanned ? "🔓" : "🔒"}</span>
                            <span>{isBanned ? "Mở Khóa" : "Khóa TK"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 2. DESKTOP TABLE VIEW (>= 768px) */}
              <div className="d-none d-md-block admin-table-container">
                <div className="table-responsive">
                  <table className="admin-desktop-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: "180px" }}>Thành viên</th>
                        <th style={{ minWidth: "180px" }}>Email & SĐT</th>
                        <th style={{ minWidth: "160px" }}>Vai trò (Role)</th>
                        <th style={{ minWidth: "135px", whiteSpace: "nowrap" }}>Trạng thái</th>
                        <th style={{ minWidth: "125px", whiteSpace: "nowrap" }}>Ngày tham gia</th>
                        <th style={{ minWidth: "160px", textAlign: "right", whiteSpace: "nowrap" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                    {usersList.map((uItem) => {
                      const isSelf = uItem._id === user?._id;
                      const isBanned = uItem.status === "banned";

                      return (
                        <tr
                          key={uItem._id}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            transition: "background 0.2s"
                          }}
                        >
                          {/* Member info */}
                          <td style={{ padding: "1rem 1.2rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "50%",
                                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 800,
                                  fontSize: "0.9rem"
                                }}
                              >
                                {uItem.name ? uItem.name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.95rem" }}>
                                  {uItem.name} {isSelf && <span style={{ color: "#3b82f6", fontSize: "0.8rem" }}>(Bạn)</span>}
                                </div>
                                {uItem.is_expert_verified && (
                                  <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>
                                    ✓ Verified Expert
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Email & Phone */}
                          <td style={{ padding: "1rem 1.2rem", fontSize: "0.9rem", color: "var(--text-main)" }}>
                            <div>{uItem.email}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {uItem.phone || "Chưa có SĐT"}
                            </div>
                          </td>

                          {/* Role selector */}
                          <td style={{ padding: "1rem 1.2rem" }}>
                            <select
                              value={uItem.role || "user"}
                              disabled={isSelf}
                              onChange={(e) => handleChangeRole(uItem._id, e.target.value, uItem.name)}
                              style={{
                                padding: "0.4rem 0.7rem",
                                borderRadius: "12px",
                                background:
                                  uItem.role === "admin"
                                    ? "rgba(245, 158, 11, 0.2)"
                                    : uItem.role === "tutor"
                                    ? "rgba(16, 185, 129, 0.2)"
                                    : uItem.role === "pt"
                                    ? "rgba(139, 92, 246, 0.2)"
                                    : "rgba(59, 130, 246, 0.2)",
                                color:
                                  uItem.role === "admin"
                                    ? "#f59e0b"
                                    : uItem.role === "tutor"
                                    ? "#10b981"
                                    : uItem.role === "pt"
                                    ? "#a78bfa"
                                    : "#60a5fa",
                                border: "1px solid rgba(255,255,255,0.1)",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                cursor: isSelf ? "not-allowed" : "pointer",
                                outline: "none"
                              }}
                            >
                              <option value="user">👤 Sinh viên / User</option>
                              <option value="tutor">🎓 Gia Sư (Tutor)</option>
                              <option value="pt">🏋️ Huấn Luyện Viên PT</option>
                              <option value="admin">👑 Quản Trị Viên (Admin)</option>
                            </select>
                          </td>

                          {/* Status Badge */}
                          <td style={{ padding: "1rem 1.2rem", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.45rem",
                                padding: "0.35rem 0.75rem",
                                borderRadius: "20px",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                background: isBanned ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                                color: isBanned ? "#ef4444" : "#10b981",
                                border: isBanned ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15)",
                                whiteSpace: "nowrap"
                              }}
                            >
                              <span
                                style={{
                                  width: "7px",
                                  height: "7px",
                                  borderRadius: "50%",
                                  background: isBanned ? "#ef4444" : "#10b981",
                                  boxShadow: isBanned ? "0 0 8px #ef4444" : "0 0 8px #10b981"
                                }}
                              />
                              <span>{isBanned ? "Bị Khóa" : "Hoạt Động"}</span>
                            </span>
                          </td>

                          {/* Joined Date */}
                          <td style={{ padding: "1rem 1.2rem", fontSize: "0.85rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            {new Date(uItem.createdAt).toLocaleDateString("vi-VN")}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: "1rem 1.2rem", textAlign: "right", whiteSpace: "nowrap" }}>
                            {!isSelf && (
                              <button
                                onClick={() => {
                                  setPreselectedNotificationUser(uItem);
                                  setCurrentTab("notifications");
                                }}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "0.35rem",
                                  padding: "0.42rem 0.8rem",
                                  borderRadius: "20px",
                                  border: "1px solid rgba(59, 130, 246, 0.35)",
                                  background: "rgba(59, 130, 246, 0.08)",
                                  color: "#2563eb",
                                  fontWeight: 700,
                                  fontSize: "0.8rem",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  boxShadow: "0 2px 6px rgba(59, 130, 246, 0.12)",
                                  transition: "all 0.25s ease",
                                  marginRight: "6px"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                  e.currentTarget.style.background = "linear-gradient(135deg, #3b82f6, #2563eb)";
                                  e.currentTarget.style.color = "#ffffff";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.08)";
                                  e.currentTarget.style.color = "#2563eb";
                                }}
                                title={`Soạn thông báo gửi riêng cho ${uItem.name}`}
                              >
                                <span>✉️</span>
                                <span>Gửi Tin</span>
                              </button>
                            )}

                            {!isSelf && (
                              <button
                                onClick={() => handleToggleBan(uItem)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "0.4rem",
                                  padding: "0.42rem 0.95rem",
                                  borderRadius: "20px",
                                  border: isBanned ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(239, 68, 68, 0.35)",
                                  background: isBanned ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.08)",
                                  color: isBanned ? "#10b981" : "#ef4444",
                                  fontWeight: 700,
                                  fontSize: "0.8rem",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  boxShadow: isBanned 
                                    ? "0 2px 8px rgba(16, 185, 129, 0.15)"
                                    : "0 2px 8px rgba(239, 68, 68, 0.15)",
                                  transition: "all 0.25s ease"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                  if (isBanned) {
                                    e.currentTarget.style.background = "linear-gradient(135deg, #10b981, #059669)";
                                    e.currentTarget.style.color = "#ffffff";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.35)";
                                  } else {
                                    e.currentTarget.style.background = "linear-gradient(135deg, #ef4444, #dc2626)";
                                    e.currentTarget.style.color = "#ffffff";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.35)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  if (isBanned) {
                                    e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                                    e.currentTarget.style.color = "#10b981";
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(16, 185, 129, 0.15)";
                                  } else {
                                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                                    e.currentTarget.style.color = "#ef4444";
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(239, 68, 68, 0.15)";
                                  }
                                }}
                                title={isBanned ? "Mở khóa tài khoản cho người dùng này" : "Khóa tài khoản người dùng này"}
                              >
                                <span>{isBanned ? "🔓" : "🔒"}</span>
                                <span>{isBanned ? "Mở Khóa" : "Khóa TK"}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* TAB 3: PHÁT THÔNG BÁO HỆ THỐNG (BROADCAST HUB) */}
      {currentTab === "notifications" && (
        <AdminNotificationManager
          usersList={usersList}
          initialRecipient={preselectedNotificationUser}
        />
      )}

      {/* MODAL 1: TỪ CHỐI HỒ SƠ & NHẬP LÝ DO */}
      {rejectModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <h3 style={{ margin: "0 0 0.8rem 0", color: "#ef4444", fontSize: "1.25rem", fontWeight: 800 }}>
              ❌ Từ Chối Hồ Sơ Của {rejectModal.app?.ho_ten}
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Vui lòng nhập lý do từ chối để hệ thống gửi thông báo phản hồi giúp ứng viên nắm được lý do và bổ sung bằng cấp nếu cần:
            </p>
            <textarea
              rows={4}
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Nhập lý do từ chối..."
              className="form-control mb-3"
              style={{ fontSize: "0.9rem", resize: "vertical" }}
            />
            <div className="d-flex flex-column-reverse flex-sm-row justify-content-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, app: null, reason: "" })}
                className="btn btn-secondary admin-modal-btn w-100 w-sm-auto"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={submittingAction}
                className="btn btn-danger admin-modal-btn w-100 w-sm-auto"
              >
                {submittingAction ? "Đang xử lý..." : "Xác nhận Từ Chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LIGHTBOX XEM PHÓNG TO CHỨNG CHỈ */}
      {previewCert && (
        <div
          className="admin-modal-overlay"
          onClick={() => setPreviewCert(null)}
          style={{ cursor: "zoom-out" }}
        >
          <div
            className="admin-modal-content text-center"
            style={{ maxWidth: "680px", cursor: "default" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text-main)", fontSize: "1.2rem", fontWeight: 800 }}>
              {previewCert.ten_chung_chi}
            </h3>
            <p style={{ margin: "0 0 1rem 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Nơi cấp: {previewCert.noi_cap || "Đại học / Tổ chức Thể thao"} • Năm: {previewCert.nam_cap || "2025"}
            </p>
            {previewCert.hinh_anh ? (
              <div
                style={{
                  width: "100%",
                  maxHeight: "65vh",
                  overflow: "auto",
                  borderRadius: "12px",
                  border: "1px solid var(--border-color)",
                  background: "rgba(0,0,0,0.05)",
                  marginBottom: "1.2rem"
                }}
              >
                <img
                  src={previewCert.hinh_anh}
                  alt={previewCert.ten_chung_chi}
                  className="img-fluid"
                  style={{
                    maxHeight: "60vh",
                    display: "block",
                    margin: "0 auto",
                    objectFit: "contain"
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "240px",
                  background: "rgba(59, 130, 246, 0.05)",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed #3b82f6",
                  marginBottom: "1.2rem"
                }}
              >
                <span style={{ fontSize: "3.5rem" }}>📜</span>
                <div style={{ color: "#3b82f6", fontWeight: 700, marginTop: "0.5rem" }}>
                  CHỨNG CHỈ XÁC THỰC BẢN GỐC
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.3rem" }}>
                  Mã chứng chỉ số: LP-CERT-{Math.floor(100000 + Math.random() * 900000)}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setPreviewCert(null)}
              className="btn btn-secondary admin-modal-btn w-100 w-sm-auto px-4"
            >
              Đóng xem trước
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
