import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export const AdminNotificationManager = ({ usersList = [], onSelectUser, initialRecipient = null }) => {
  const [targetType, setTargetType] = useState(initialRecipient ? "specific" : "all");
  const [selectedUserId, setSelectedUserId] = useState(initialRecipient?._id || "");
  const [tieuDe, setTieuDe] = useState("");
  const [noiDung, setNoiDung] = useState("");
  const [loai, setLoai] = useState("info"); // "info" | "success" | "warning" | "danger"
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  // Lịch sử phát thông báo
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (initialRecipient) {
      setTargetType("specific");
      setSelectedUserId(initialRecipient._id);
    }
  }, [initialRecipient]);

  // Nạp lịch sử các đợt phát
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getAdminNotificationHistory();
      if (res.success && Array.isArray(res.data)) {
        setHistory(res.data);
      }
    } catch (e) {
      console.error("Lỗi nạp lịch sử thông báo:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!tieuDe.trim() || !noiDung.trim()) {
      setFeedback({ type: "error", text: "Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!" });
      return;
    }

    if (targetType === "specific" && !selectedUserId) {
      setFeedback({ type: "error", text: "Vui lòng chọn một người dùng cụ thể để gửi!" });
      return;
    }

    setSending(true);
    setFeedback({ type: "", text: "" });

    try {
      const payload = {
        target_type: targetType,
        target_user_id: targetType === "specific" ? selectedUserId : null,
        tieu_de: tieuDe.trim(),
        noi_dung: noiDung.trim(),
        loai
      };

      const res = await api.sendAdminNotification(payload);
      if (res.success) {
        setFeedback({
          type: "success",
          text: `🎉 ${res.message || "Đã phát thông báo thành công!"}`
        });
        // Reset form
        setTieuDe("");
        setNoiDung("");
        fetchHistory();
      } else {
        setFeedback({ type: "error", text: res.message || "Gửi thông báo thất bại." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: "Lỗi kết nối máy chủ: " + err.message });
    } finally {
      setSending(false);
    }
  };

  // Màu sắc & Icon tương ứng với loại thông báo
  const getBadgeStyle = (type) => {
    switch (type) {
      case "success":
        return { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", icon: "🎉", label: "Tin Vui / Chúc Mừng" };
      case "warning":
        return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", icon: "⚠️", label: "Nhắc Nhở / Lưu Ý" };
      case "danger":
        return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", icon: "🚨", label: "Khẩn Cấp / Bảo Trì" };
      default:
        return { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", icon: "ℹ️", label: "Thông Tin Chung" };
    }
  };

  const currentBadge = getBadgeStyle(loai);

  // Thống kê đối tượng dự kiến nhận
  const estimateRecipientCount = () => {
    if (targetType === "all") return usersList.length;
    if (targetType === "user") return usersList.filter(u => (!u.role || u.role === "user")).length;
    if (targetType === "tutor") return usersList.filter(u => u.role === "tutor").length;
    if (targetType === "pt") return usersList.filter(u => u.role === "pt").length;
    if (targetType === "specific") return 1;
    return 0;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* 1. SOẠN THẢO VÀ PHÁT THÔNG BÁO (NOTIFICATION COMPOSER) */}
      <div
        className="glass-card"
        style={{
          background: "var(--card-bg, #ffffff)",
          borderRadius: "24px",
          padding: "2rem",
          border: "1px solid var(--border-color)",
          boxShadow: "10px 10px 24px var(--neu-shadow-dark), -10px -10px 24px var(--neu-shadow-light)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span>📢</span>
              <span>Trung Tâm Phát Thông Báo Toàn Hệ Thống</span>
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Gửi thông điệp quản trị tức thời tới Toàn bộ Server, Học viên, Gia sư, PT hoặc từng cá nhân
            </p>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "20px",
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              color: "#d97706",
              fontSize: "0.82rem",
              fontWeight: 700
            }}
          >
            <span>👥 Dự kiến gửi tới:</span>
            <strong>{estimateRecipientCount()} người</strong>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback.text && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "14px",
              marginBottom: "1.5rem",
              fontSize: "0.88rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: feedback.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
              color: feedback.type === "success" ? "#10b981" : "#ef4444",
              border: `1px solid ${feedback.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
            }}
          >
            <span>{feedback.type === "success" ? "✅" : "⚠️"}</span>
            <span>{feedback.text}</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          {/* CỘT TRÁI: FORM NHẬP LIỆU */}
          <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {/* 1. Chọn đối tượng nhận */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.6rem" }}>
                1. Chọn Phạm Vi Người Nhận (Target Audience):
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { id: "all", label: "🌐 Cả Server (Tất cả)", count: usersList.length },
                  { id: "user", label: "👤 Học Viên / Sinh Viên", count: usersList.filter(u => (!u.role || u.role === "user")).length },
                  { id: "tutor", label: "🎓 Gia Sư (Tutors)", count: usersList.filter(u => u.role === "tutor").length },
                  { id: "pt", label: "🏋️ Huấn Luyện Viên PT", count: usersList.filter(u => u.role === "pt").length },
                  { id: "specific", label: "🎯 Gửi Riêng Cá Nhân", count: 1 }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTargetType(item.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "14px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: targetType === item.id ? "1px solid #3b82f6" : "1px solid var(--border-color)",
                      background: targetType === item.id ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "var(--neu-bg)",
                      color: targetType === item.id ? "#ffffff" : "var(--text-main)",
                      boxShadow: targetType === item.id
                        ? "0 4px 12px rgba(59, 130, 246, 0.35)"
                        : "2px 2px 5px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {item.label} ({item.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Chọn người dùng cụ thể nếu chọn specific */}
            {targetType === "specific" && (
              <div style={{ animation: "fadeIn 0.25s ease" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                  Chỉ định Người Nhận Cụ Thể:
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: "var(--neu-bg)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-main)",
                    fontWeight: 600,
                    outline: "none"
                  }}
                  required
                >
                  <option value="">-- Chọn thành viên nhận thông báo --</option>
                  {usersList.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email}) - [{(u.role || "user").toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 2. Chọn mức độ / Loại thông báo */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.6rem" }}>
                2. Mức Độ / Phân Loại Thông Báo:
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { id: "info", icon: "ℹ️", label: "Thông Tin Chung", color: "#3b82f6" },
                  { id: "success", icon: "🎉", label: "Tin Vui / Chúc Mừng", color: "#10b981" },
                  { id: "warning", icon: "⚠️", label: "Nhắc Nhở / Lưu Ý", color: "#f59e0b" },
                  { id: "danger", icon: "🚨", label: "Khẩn Cấp / Bảo Trì", color: "#ef4444" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLoai(item.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "12px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      border: loai === item.id ? `2px solid ${item.color}` : "1px solid var(--border-color)",
                      background: loai === item.id ? `${item.color}22` : "var(--neu-bg)",
                      color: loai === item.id ? item.color : "var(--text-muted)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Tiêu đề thông báo */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                3. Tiêu Đề Thông Báo:
              </label>
              <input
                type="text"
                placeholder="VD: [Bảo trì hệ thống] Nâng cấp máy chủ từ 23h00 tối nay..."
                value={tieuDe}
                onChange={(e) => setTieuDe(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "14px",
                  background: "var(--neu-bg)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-main)",
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  outline: "none",
                  boxShadow: "inset 2px 2px 5px var(--neu-inset-dark), inset -2px -2px 5px var(--neu-inset-light)",
                  boxSizing: "border-box"
                }}
                required
              />
            </div>

            {/* 4. Nội dung thông báo */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                4. Nội Dung Chi Tiết:
              </label>
              <textarea
                rows={4}
                placeholder="Nhập nội dung thông điệp gửi tới người dùng..."
                value={noiDung}
                onChange={(e) => setNoiDung(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "14px",
                  background: "var(--neu-bg)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-main)",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxShadow: "inset 2px 2px 5px var(--neu-inset-dark), inset -2px -2px 5px var(--neu-inset-light)",
                  resize: "vertical",
                  boxSizing: "border-box",
                  lineHeight: 1.5
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              style={{
                marginTop: "0.5rem",
                padding: "14px 24px",
                borderRadius: "16px",
                border: "none",
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "#ffffff",
                fontSize: "0.95rem",
                fontWeight: 800,
                cursor: sending ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 6px 18px rgba(37, 99, 235, 0.35)",
                transition: "all 0.25s ease"
              }}
            >
              {sending ? (
                <>
                  <span>⏳</span>
                  <span>Đang phát thông báo tới hệ thống...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Phát Thông Báo Ngay</span>
                </>
              )}
            </button>
          </form>

          {/* CỘT PHẢI: LIVE PREVIEW & GỢI Ý MẪU */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
              👁️ Xem Trước Thực Tế (Mô Phỏng Màn Hình Người Nhận):
            </label>

            {/* Card Mô phỏng Notification Banner */}
            <div
              style={{
                background: "var(--card-bg, #ffffff)",
                borderRadius: "18px",
                border: `2px solid ${currentBadge.color}`,
                borderLeft: `8px solid ${currentBadge.color}`,
                padding: "1.2rem",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "1.2rem" }}>{currentBadge.icon}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: currentBadge.color, textTransform: "uppercase" }}>
                    {currentBadge.label}
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.05)", padding: "2px 8px", borderRadius: "10px" }}>
                  Vừa xong
                </span>
              </div>

              <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--text-main)" }}>
                {tieuDe || "Tiêu đề thông báo mẫu sẽ xuất hiện ở đây"}
              </h4>

              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {noiDung || "Nội dung chi tiết thông điệp quản trị viên sẽ hiển thị tại đây khi người dùng mở ứng dụng hoặc qua thông báo đẩy trình duyệt."}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", paddingTop: "8px", borderTop: "1px dashed var(--border-color)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                <span>Người gửi: <strong>Quản Trị Viên Hệ Thống</strong></span>
                <span style={{ color: "#3b82f6", fontWeight: 700 }}>Đánh dấu đã đọc ✓</span>
              </div>
            </div>

            {/* Mẫu thông báo gợi ý nhanh */}
            <div
              style={{
                background: "var(--neu-bg)",
                borderRadius: "16px",
                padding: "1.2rem",
                border: "1px solid var(--border-color)"
              }}
            >
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "8px" }}>
                💡 Gợi Ý Mẫu Thông Báo Nhanh:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  {
                    type: "info",
                    target: "all",
                    title: "Chào mừng bạn đến với phiên bản Life Planner 2026 mới!",
                    content: "Hệ thống đã cập nhật thêm tính năng Đăng ký Gia Sư & Huấn Luyện Viên PT trực tuyến cùng Bảng điều khiển Quản trị viên mới."
                  },
                  {
                    type: "success",
                    target: "tutor",
                    title: "Cộng đồng Gia Sư: Mở đợt kết nối học viên kỳ mới",
                    content: "Kính gửi quý Gia sư, hệ thống vừa ghi nhận nhu cầu học tập gia tăng đột biến. Quý thầy cô vui lòng cập nhật lịch rảnh để nhận lớp sớm nhất!"
                  },
                  {
                    type: "warning",
                    target: "all",
                    title: "Bảo trì nâng cấp cơ sở dữ liệu định kỳ",
                    content: "Hệ thống sẽ tiến hành tối ưu hóa cơ sở dữ liệu trong 15 phút vào 00:00 đêm nay. Vui lòng lưu lại tiến độ công việc trước giờ bảo trì."
                  }
                ].map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setLoai(tpl.type);
                      setTargetType(tpl.target);
                      setTieuDe(tpl.title);
                      setNoiDung(tpl.content);
                    }}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color)",
                      background: "var(--card-bg, #fff)",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      color: "var(--text-main)",
                      transition: "all 0.2s"
                    }}
                  >
                    <strong>{tpl.title}</strong>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LỊCH SỬ CÁC ĐỢT PHÁT THÔNG BÁO (BROADCAST HISTORY) */}
      <div
        className="glass-card"
        style={{
          background: "var(--card-bg, #ffffff)",
          borderRadius: "24px",
          padding: "2rem",
          border: "1px solid var(--border-color)",
          boxShadow: "10px 10px 24px var(--neu-shadow-dark), -10px -10px 24px var(--neu-shadow-light)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>📜</span>
              <span>Lịch Sử Các Đợt Phát Thông Báo</span>
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Danh sách các đợt phát tin gần nhất của Ban Quản Trị
            </p>
          </div>

          <button
            type="button"
            onClick={fetchHistory}
            style={{
              padding: "6px 14px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              background: "var(--neu-bg)",
              color: "var(--text-main)",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            🔄 Làm Mới
          </button>
        </div>

        {loadingHistory ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            ⏳ Đang tải lịch sử thông báo...
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)", background: "var(--neu-bg)", borderRadius: "16px" }}>
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>📭</span>
            Chưa có đợt phát thông báo nào được thực hiện. Hãy soạn thông báo ở biểu mẫu phía trên để gửi thông báo đầu tiên!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.78rem" }}>
                  <th style={{ padding: "0.85rem 1rem" }}>Thời Gian</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Tiêu Đề & Nội Dung</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Phân Loại</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Đối Tượng Nhận</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Số Người Nhận</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => {
                  const badge = getBadgeStyle(item.loai);
                  return (
                    <tr key={item._id || idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem", whiteSpace: "nowrap", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "Gần đây"}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 800, color: "var(--text-main)", marginBottom: "4px" }}>
                          {item.tieu_de}
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: "380px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.noi_dung}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.color,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.82rem" }}>
                          {item.target_desc || (item.target_type === "all" ? "Cả Server" : item.target_type)}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "12px",
                            background: "rgba(59, 130, 246, 0.15)",
                            color: "#2563eb",
                            fontWeight: 800,
                            fontSize: "0.82rem"
                          }}
                        >
                          👥 {item.recipient_count || 1}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
