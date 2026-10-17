import React, { useState, useEffect, useMemo } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { AdminChartsAnalytics } from "../components/AdminChartsAnalytics";
import { AdminNotificationManager } from "../components/AdminNotificationManager";

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
    <div className="admin-portal-view" style={{ padding: "1.5rem", maxWidth: "1350px", margin: "0 auto" }}>
      {/* Toast Alert */}
      {toastMsg.text && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 99999,
            padding: "0.85rem 1.4rem",
            borderRadius: "12px",
            background: toastMsg.type === "success" ? "#10b981" : toastMsg.type === "error" ? "#ef4444" : "#f59e0b",
            color: "#fff",
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            animation: "fadeIn 0.25s ease"
          }}
        >
          {toastMsg.text}
        </div>
      )}

      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.8rem",
          paddingBottom: "1.2rem",
          borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.1))"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.8rem" }}>👑</span>
            <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 800, color: "var(--text-main)" }}>
              TRUNG TÂM QUẢN TRỊ ADMIN
            </h1>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.6rem",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#fff",
                fontWeight: 700
              }}
            >
              RBAC PORTAL
            </span>
          </div>
          <p style={{ margin: "0.3rem 0 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Kiểm duyệt hồ sơ Gia Sư & PT Thể Hình, phân quyền và quản trị toàn bộ người dùng hệ thống.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.8rem" }}>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="neu-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.6rem 1.2rem",
                borderRadius: "10px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              ⬅️ Quay lại ứng dụng
            </button>
          )}
          <button
            onClick={() => {
              fetchStats();
              if (currentTab === "applications") fetchApplications();
              else fetchUsers();
              showToast("info", "Đã làm mới dữ liệu!");
            }}
            className="neu-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.6rem 1.2rem",
              borderRadius: "10px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1.2rem",
          marginBottom: "2rem"
        }}
      >
        {/* Card 1: Users */}
        <div
          style={{
            background: "var(--card-bg, #ffffff)",
            borderRadius: "16px",
            padding: "1.2rem 1.4rem",
            border: "1px solid var(--border-color)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(59, 130, 246, 0.15)",
              color: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem"
            }}
          >
            👥
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Tổng Người Dùng
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-main)" }}>
              {stats?.users?.total || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {stats?.users?.students || 0} Học viên / Sinh viên
            </div>
          </div>
        </div>

        {/* Card 2: Pending Applications */}
        <div
          style={{
            background: "var(--card-bg, #ffffff)",
            borderRadius: "16px",
            padding: "1.2rem 1.4rem",
            border: "2px solid #f59e0b",
            boxShadow: "0 0 15px rgba(245, 158, 11, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem"
            }}
          >
            ⏳
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#f59e0b", textTransform: "uppercase", fontWeight: 700 }}>
              Đơn Chờ Thẩm Định
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f59e0b" }}>
              {stats?.applications?.pending || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Cần Admin xem xét bằng cấp
            </div>
          </div>
        </div>

        {/* Card 3: Tutors */}
        <div
          style={{
            background: "var(--card-bg, #ffffff)",
            borderRadius: "16px",
            padding: "1.2rem 1.4rem",
            border: "1px solid var(--border-color)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem"
            }}
          >
            🎓
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Gia Sư Đã Xác Thực
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-main)" }}>
              {stats?.users?.tutors || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>
              Đủ điều kiện giảng dạy
            </div>
          </div>
        </div>

        {/* Card 4: PTs */}
        <div
          style={{
            background: "var(--card-bg, #ffffff)",
            borderRadius: "16px",
            padding: "1.2rem 1.4rem",
            border: "1px solid var(--border-color)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(139, 92, 246, 0.15)",
              color: "#8b5cf6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem"
            }}
          >
            🏋️
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Huấn Luyện Viên PT
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-main)" }}>
              {stats?.users?.pts || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#8b5cf6", fontWeight: 600 }}>
              Được cấp chứng chỉ thể hình
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div
        style={{
          display: "flex",
          gap: "0.8rem",
          marginBottom: "1.5rem",
          borderBottom: "2px solid var(--border-color, rgba(255,255,255,0.1))",
          paddingBottom: "0.5rem",
          flexWrap: "wrap"
        }}
      >
        <button
          onClick={() => setCurrentTab("analytics")}
          style={{
            background: currentTab === "analytics" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "transparent",
            color: currentTab === "analytics" ? "#fff" : "var(--text-muted)",
            border: "none",
            borderRadius: "12px",
            padding: "0.75rem 1.4rem",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
            boxShadow: currentTab === "analytics" ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none"
          }}
        >
          📊 Biểu Đồ & Thống Kê Trực Quan
        </button>

        <button
          onClick={() => setCurrentTab("applications")}
          style={{
            background: currentTab === "applications" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "transparent",
            color: currentTab === "applications" ? "#fff" : "var(--text-muted)",
            border: "none",
            borderRadius: "12px",
            padding: "0.75rem 1.4rem",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
            boxShadow: currentTab === "applications" ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none"
          }}
        >
          📑 Phê Duyệt Hồ Sơ Gia Sư / PT
          {stats?.applications?.pending > 0 && (
            <span
              style={{
                background: currentTab === "applications" ? "#ef4444" : "#f59e0b",
                color: "#fff",
                borderRadius: "50%",
                padding: "0.1rem 0.5rem",
                fontSize: "0.75rem",
                fontWeight: 800
              }}
            >
              {stats.applications.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab("users")}
          style={{
            background: currentTab === "users" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "transparent",
            color: currentTab === "users" ? "#fff" : "var(--text-muted)",
            border: "none",
            borderRadius: "12px",
            padding: "0.75rem 1.4rem",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
            boxShadow: currentTab === "users" ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none"
          }}
        >
          👥 Quản Lý Người Dùng & Phân Quyền
        </button>

        <button
          onClick={() => {
            setPreselectedNotificationUser(null);
            setCurrentTab("notifications");
          }}
          style={{
            background: currentTab === "notifications" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "transparent",
            color: currentTab === "notifications" ? "#fff" : "var(--text-muted)",
            border: "none",
            borderRadius: "12px",
            padding: "0.75rem 1.4rem",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
            boxShadow: currentTab === "notifications" ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none"
          }}
        >
          📢 Phát Thông Báo Hệ Thống
        </button>
      </div>

      {/* TAB 0: BIỂU ĐỒ & THỐNG KÊ TRỰC QUAN (CHARTS & ANALYTICS) */}
      {currentTab === "analytics" && (
        <AdminChartsAnalytics stats={stats} loading={loadingStats} />
      )}

      {/* TAB 1: APPLICATIONS APPROVAL QUEUE */}
      {currentTab === "applications" && (
        <div>
          {/* Sub-filters for Applications */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              background: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color)",
              padding: "1rem 1.2rem",
              borderRadius: "14px",
              marginBottom: "1.5rem"
            }}
          >
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Trạng thái:</span>
                <select
                  value={filterAppStatus}
                  onChange={(e) => setFilterAppStatus(e.target.value)}
                  style={{
                    padding: "0.5rem 0.8rem",
                    borderRadius: "8px",
                    background: "var(--input-bg, #f8fafc)",
                    color: "var(--text-main)",
                    border: "1px solid var(--input-border, #cbd5e1)",
                    fontWeight: 600
                  }}
                >
                  <option value="pending">⏳ Chờ duyệt (Pending)</option>
                  <option value="approved">✅ Đã phê duyệt (Approved)</option>
                  <option value="rejected">❌ Bị từ chối (Rejected)</option>
                  <option value="all">Tất cả trạng thái</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Loại đơn:</span>
                <select
                  value={filterAppType}
                  onChange={(e) => setFilterAppType(e.target.value)}
                  style={{
                    padding: "0.5rem 0.8rem",
                    borderRadius: "8px",
                    background: "var(--input-bg, #f8fafc)",
                    color: "var(--text-main)",
                    border: "1px solid var(--input-border, #cbd5e1)",
                    fontWeight: 600
                  }}
                >
                  <option value="all">Tất cả (Gia sư & PT)</option>
                  <option value="gia_su">🎓 Gia sư học tập</option>
                  <option value="pt">🏋️ Huấn luyện viên PT</option>
                </select>
              </div>
            </div>

            <div style={{ minWidth: "260px" }}>
              <input
                type="text"
                placeholder="🔍 Tìm tên, email, chuyên môn..."
                value={searchApp}
                onChange={(e) => setSearchApp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchApplications()}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.9rem",
                  borderRadius: "8px",
                  background: "var(--input-bg, #f8fafc)",
                  color: "var(--text-main)",
                  border: "1px solid var(--input-border, #cbd5e1)"
                }}
              />
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
                    style={{
                      background: "var(--card-bg, #ffffff)",
                      borderRadius: "16px",
                      padding: "1.5rem",
                      border: isPending
                        ? "1.5px solid rgba(245, 158, 11, 0.5)"
                        : "1px solid var(--border-color)",
                      boxShadow: "0 6px 25px rgba(0,0,0,0.08)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.2rem"
                    }}
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

                    {/* Middle Info Details */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "0.8rem",
                        background: "var(--input-bg, #f8fafc)",
                        border: "1px solid var(--input-border, #cbd5e1)",
                        padding: "1rem",
                        borderRadius: "12px",
                        fontSize: "0.9rem"
                      }}
                    >
                      <div>
                        <strong style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>
                          CHUYÊN MÔN CHÍNH:
                        </strong>
                        <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{appItem.chuyen_mon}</span>
                      </div>
                      <div>
                        <strong style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>
                          KINH NGHIỆM:
                        </strong>
                        <span style={{ color: "var(--text-main)" }}>{appItem.kinh_nghiem}</span>
                      </div>
                      <div>
                        <strong style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>
                          MỨC GIÁ DỰ KIẾN:
                        </strong>
                        <span style={{ color: "#10b981", fontWeight: 700 }}>
                          {Number(appItem.gia_theo_gio).toLocaleString("vi-VN")} đ / giờ
                        </span>
                      </div>
                      <div>
                        <strong style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>
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
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                padding: "0.5rem 0.8rem",
                                borderRadius: "8px",
                                background: "var(--input-bg, #f8fafc)",
                                border: "1px solid var(--input-border, #cbd5e1)",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
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

                    {/* Action Buttons for Pending Application */}
                    {isPending && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "0.8rem",
                          borderTop: "1px solid var(--border-color)",
                          paddingTop: "1rem"
                        }}
                      >
                        <button
                          onClick={() => openRejectModal(appItem)}
                          disabled={submittingAction}
                          style={{
                            padding: "0.65rem 1.2rem",
                            borderRadius: "10px",
                            border: "1px solid #ef4444",
                            background: "transparent",
                            color: "#ef4444",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem"
                          }}
                        >
                          ❌ Từ Chối Hồ Sơ
                        </button>

                        <button
                          onClick={() => handleApprove(appItem)}
                          disabled={submittingAction}
                          style={{
                            padding: "0.65rem 1.4rem",
                            borderRadius: "10px",
                            border: "none",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "#fff",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)"
                          }}
                        >
                          ✅ Phê Duyệt & Nâng Cấp Quyền
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              background: "var(--card-bg, rgba(30, 41, 59, 0.5))",
              padding: "1rem 1.2rem",
              borderRadius: "14px",
              marginBottom: "1.5rem"
            }}
          >
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Quyền hạn:</span>
                <select
                  value={filterUserRole}
                  onChange={(e) => setFilterUserRole(e.target.value)}
                  style={{
                    padding: "0.5rem 0.8rem",
                    borderRadius: "8px",
                    background: "var(--input-bg)",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
                    fontWeight: 600
                  }}
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="user">👤 Sinh viên / Học viên</option>
                  <option value="tutor">🎓 Gia Sư (Tutor)</option>
                  <option value="pt">🏋️ Huấn Luyện Viên PT</option>
                  <option value="admin">👑 Quản Trị Viên (Admin)</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Trạng thái:</span>
                <select
                  value={filterUserStatus}
                  onChange={(e) => setFilterUserStatus(e.target.value)}
                  style={{
                    padding: "0.5rem 0.8rem",
                    borderRadius: "8px",
                    background: "var(--input-bg)",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
                    fontWeight: 600
                  }}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">🟢 Đang hoạt động</option>
                  <option value="banned">🔴 Đã bị khóa</option>
                </select>
              </div>
            </div>

            <div style={{ minWidth: "260px" }}>
              <input
                type="text"
                placeholder="🔍 Tìm theo Họ tên, Email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.9rem",
                  borderRadius: "8px",
                  background: "var(--input-bg)",
                  color: "var(--text-main)",
                  border: "1px solid var(--border-color, rgba(255,255,255,0.1))"
                }}
              />
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
            <div
              style={{
                background: "var(--card-bg, rgba(30, 41, 59, 0.8))",
                borderRadius: "16px",
                border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
                overflow: "hidden"
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr
                      style={{
                        background: "rgba(0,0,0,0.2)",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        textTransform: "uppercase"
                      }}
                    >
                      <th style={{ padding: "1rem 1.2rem", minWidth: "180px" }}>Thành viên</th>
                      <th style={{ padding: "1rem 1.2rem", minWidth: "180px" }}>Email & SĐT</th>
                      <th style={{ padding: "1rem 1.2rem", minWidth: "160px" }}>Vai trò (Role)</th>
                      <th style={{ padding: "1rem 1.2rem", minWidth: "135px", whiteSpace: "nowrap" }}>Trạng thái</th>
                      <th style={{ padding: "1rem 1.2rem", minWidth: "125px", whiteSpace: "nowrap" }}>Ngày tham gia</th>
                      <th style={{ padding: "1rem 1.2rem", minWidth: "130px", textAlign: "right", whiteSpace: "nowrap" }}>Thao tác</th>
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
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999
          }}
        >
          <div
            style={{
              background: "var(--modal-bg)",
              borderRadius: "18px",
              padding: "1.8rem",
              width: "90%",
              maxWidth: "500px",
              border: "1px solid var(--border-color, rgba(0,0,0,0.1))",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)"
            }}
          >
            <h3 style={{ margin: "0 0 0.8rem 0", color: "#ef4444", fontSize: "1.25rem", fontWeight: 800 }}>
              ❌ Từ Chối Hồ Sơ Của {rejectModal.app?.ho_ten}
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Vui lòng nhập lý do từ chối để hệ thống gửi thông báo phản hồi giúp ứng viên nắm được lý do và bổ sung bằng cấp nếu cần:
            </p>
            <textarea
              rows={4}
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Nhập lý do từ chối..."
              style={{
                width: "100%",
                padding: "0.8rem",
                borderRadius: "10px",
                background: "var(--input-bg)",
                color: "var(--text-main)",
                border: "1px solid var(--input-border, rgba(0,0,0,0.15))",
                fontSize: "0.9rem",
                marginBottom: "1.2rem",
                resize: "vertical"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.8rem" }}>
              <button
                onClick={() => setRejectModal({ open: false, app: null, reason: "" })}
                className="neu-btn"
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={submittingAction}
                style={{
                  padding: "0.6rem 1.4rem",
                  borderRadius: "8px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Xác nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LIGHTBOX XEM PHÓNG TO CHỨNG CHỈ */}
      {previewCert && (
        <div
          onClick={() => setPreviewCert(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
            cursor: "zoom-out"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--modal-bg)",
              borderRadius: "16px",
              padding: "1.5rem",
              maxWidth: "600px",
              width: "90%",
              border: "1px solid var(--border-color, rgba(0,0,0,0.15))",
              textAlign: "center",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)"
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text-main)" }}>{previewCert.ten_chung_chi}</h3>
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
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    objectFit: "contain"
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "260px",
                  background: "var(--card-bg, rgba(59, 130, 246, 0.05))",
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
              onClick={() => setPreviewCert(null)}
              className="btn-secondary"
              style={{
                padding: "0.6rem 1.6rem",
                borderRadius: "12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Đóng xem trước
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
