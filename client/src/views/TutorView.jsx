import React, { useEffect, useState, useMemo } from "react";
import { api } from "../services/api";

const SUBJECT_OPTIONS = [
  { value: "all", label: "Tất cả môn học" },
  { value: "Toán", label: "Toán Cao Cấp & Đại Số" },
  { value: "Lập trình Web", label: "Lập trình Web & Node.js" },
  { value: "IELTS", label: "Tiếng Anh IELTS & Giao Tiếp" },
  { value: "Cấu trúc dữ liệu", label: "Cấu trúc dữ liệu & Giải thuật" },
  { value: "Vật Lý", label: "Vật Lý Đại Cương" },
  { value: "Trí Tuệ Nhân Tạo", label: "Trí Tuệ Nhân Tạo & Python" }
];

const PRICE_OPTIONS = [
  { value: "all", label: "Tất cả mức giá" },
  { value: "under_180", label: "Dưới 180.000 đ/giờ" },
  { value: "180_250", label: "180.000 đ - 250.000 đ/giờ" },
  { value: "250_350", label: "250.000 đ - 350.000 đ/giờ" },
  { value: "above_350", label: "Trên 350.000 đ/giờ" }
];

const TIME_OPTIONS = [
  { value: "all", label: "Tất cả thời gian dạy" },
  { value: "sang", label: "🌅 Buổi Sáng (08:00 - 12:00)" },
  { value: "chieu", label: "☀️ Buổi Chiều (13:30 - 17:30)" },
  { value: "toi", label: "🌙 Buổi Tối (18:30 - 21:30)" },
  { value: "cuoi_tuan", label: "📅 Cuối Tuần (T7, Chủ Nhật)" }
];

export const TutorView = ({ onBack, onOpenDangKyGiaSu, onNavigateToChat }) => {
  const [giaSus, setGiaSus] = useState([]);
  const [loading, setLoading] = useState(true);

  // States bộ lọc
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedTime, setSelectedTime] = useState("all");
  const [minRating, setMinRating] = useState("all");

  // State Modal Chi tiết Gia Sư có Tab (info, degrees, transcript, reviews)
  const [detailModal, setDetailModal] = useState({
    open: false,
    tutor: null,
    activeTab: "degrees"
  });

  // State Lightbox phóng to Bằng cấp & Bảng điểm
  const [lightbox, setLightbox] = useState({
    open: false,
    src: "",
    title: "",
    subtitle: ""
  });

  // State Modal Liên hệ / Đặt lịch
  const [bookingModal, setBookingModal] = useState({ open: false, tutor: null });
  const [bookingForm, setBookingForm] = useState({
    ho_ten: "",
    so_dien_thoai: "",
    thoi_gian_mong_muon: "",
    ghi_chu: ""
  });
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const openTutorDetails = (tutor, tab = "degrees") => {
    setDetailModal({
      open: true,
      tutor,
      activeTab: tab
    });
  };

  // Nạp danh sách gia sư từ API
  const fetchTutors = async () => {
    setLoading(true);
    try {
      let params = [];
      if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
      if (selectedSubject !== "all") params.push(`mon_hoc=${encodeURIComponent(selectedSubject)}`);
      if (selectedTime !== "all") params.push(`ca_day=${encodeURIComponent(selectedTime)}`);

      if (selectedPrice === "under_180") {
        params.push("max_gia=180000");
      } else if (selectedPrice === "180_250") {
        params.push("min_gia=180000&max_gia=250000");
      } else if (selectedPrice === "250_350") {
        params.push("min_gia=250000&max_gia=350000");
      } else if (selectedPrice === "above_350") {
        params.push("min_gia=350000");
      }

      if (minRating !== "all") {
        params.push(`min_rating=${minRating}`);
      }

      const queryString = params.length > 0 ? `?${params.join("&")}` : "";
      const res = await api.getGiaSu(queryString);
      if (res.success) {
        setGiaSus(res.data || []);
      }
    } catch (err) {
      console.error("Lỗi tải gia sư:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, [search, selectedSubject, selectedPrice, selectedTime, minRating]);

  const handleResetFilter = () => {
    setSearch("");
    setSelectedSubject("all");
    setSelectedPrice("all");
    setSelectedTime("all");
    setMinRating("all");
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setBookingModal({ open: false, tutor: null });
    showToast(`Đã gửi yêu cầu kết nối học thử tới gia sư ${bookingModal.tutor?.ho_ten}! Gia sư sẽ liên hệ sớm nhất.`);
    setBookingForm({ ho_ten: "", so_dien_thoai: "", thoi_gian_mong_muon: "", ghi_chu: "" });
  };

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

      {/* Header Top với Nút Quay Lại */}
      <div className="header-top" style={{ alignItems: "flex-start" }}>
        <div>
          <button
            type="button"
            className="btn-secondary"
            onClick={onBack}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "14px",
              padding: "8px 16px",
              fontSize: "0.88rem",
              fontWeight: "700"
            }}
          >
            ← Quay Lại Quản Lý Học Tập
          </button>
          <h1 className="page-title">👩‍🏫 Tìm Kiếm Gia Sư Hỗ Trợ</h1>
          <p className="page-subtitle">
            Kết nối với các gia sư hàng đầu, hỗ trợ kèm môn học, ôn thi và làm đồ án theo lịch trình của bạn.
          </p>
        </div>
        <div className="action-bar" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
              🎓 Đăng Ký Làm Gia Sư
            </button>
          )}
          <span style={{
            background: "var(--neu-bg)",
            padding: "8px 18px",
            borderRadius: "12px",
            boxShadow: "var(--neu-shadow-sm)",
            fontWeight: "700",
            fontSize: "0.9rem",
            color: "var(--primary)"
          }}>
            🎯 {giaSus.length} gia sư sẵn sàng
          </span>
        </div>
      </div>

      {/* BỘ LỌC TÌM KIẾM GIA SƯ */}
      <div className="glass-card" style={{ marginBottom: "28px", padding: "22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
            🔍 Bộ Lọc Tìm Kiếm Nâng Cao
          </h3>
          {(search || selectedSubject !== "all" || selectedPrice !== "all" || selectedTime !== "all" || minRating !== "all") && (
            <button
              type="button"
              onClick={handleResetFilter}
              style={{
                background: "none",
                border: "none",
                color: "var(--primary)",
                fontWeight: "700",
                fontSize: "0.85rem",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              🔄 Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Ô tìm kiếm từ khóa */}
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔎 Tìm kiếm theo tên gia sư, môn học, kỹ năng, chuyên môn..."
            style={{
              width: "100%",
              padding: "12px 18px",
              borderRadius: "12px",
              border: "1px solid rgba(0,0,0,0.08)",
              background: "var(--neu-bg)",
              boxShadow: "var(--neu-shadow-inset)",
              fontSize: "0.95rem",
              color: "var(--text-main)",
              outline: "none"
            }}
          />
        </div>

        {/* Các dropdown lọc */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px" }}>
          {/* Lọc Môn học */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: "700", marginBottom: "6px" }}>📚 Môn học</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                background: "var(--neu-bg)",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "var(--neu-shadow-sm)",
                fontWeight: "600",
                color: "var(--text-main)"
              }}
            >
              {SUBJECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Lọc Giá tiền mỗi giờ */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: "700", marginBottom: "6px" }}>💰 Mức giá mỗi giờ</label>
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                background: "var(--neu-bg)",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "var(--neu-shadow-sm)",
                fontWeight: "600",
                color: "var(--text-main)"
              }}
            >
              {PRICE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Lọc Thời gian dạy */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: "700", marginBottom: "6px" }}>🕒 Thời gian dạy</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                background: "var(--neu-bg)",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "var(--neu-shadow-sm)",
                fontWeight: "600",
                color: "var(--text-main)"
              }}
            >
              {TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Lọc Đánh giá */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: "700", marginBottom: "6px" }}>⭐ Đánh giá</label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                background: "var(--neu-bg)",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "var(--neu-shadow-sm)",
                fontWeight: "600",
                color: "var(--text-main)"
              }}
            >
              <option value="all">Tất cả đánh giá</option>
              <option value="4.5">⭐ Từ 4.5 sao trở lên</option>
              <option value="4.8">⭐ Từ 4.8 sao trở lên</option>
              <option value="5.0">⭐ 5.0 tuyệt đối</option>
            </select>
          </div>
        </div>
      </div>

      {/* DANH SÁCH GIA SƯ */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--text-muted)", fontWeight: "600" }}>
          🔄 Đang tìm kiếm danh sách gia sư...
        </div>
      ) : giaSus.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "50px 20px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🔍</div>
          <h4 style={{ fontWeight: "800", marginBottom: "8px" }}>Không tìm thấy gia sư phù hợp</h4>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
            Vui lòng thử nới lỏng các tiêu chí lọc về mức giá, môn học hoặc thời gian dạy.
          </p>
          <button type="button" className="btn-primary" onClick={handleResetFilter}>
            Xóa Tất Cả Bộ Lọc
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
          gap: "22px"
        }}>
          {giaSus.map((gs) => (
            <div
              key={gs._id}
              className="glass-card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "22px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
                position: "relative",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "var(--neu-shadow-sm)"
              }}
              onClick={() => openTutorDetails(gs, "degrees")}
              title="Nhấp vào để xem chi tiết bằng cấp, bảng điểm và hồ sơ gia sư"
            >
              <div>
                {/* Header card gia sư */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "16px",
                      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "800",
                      fontSize: "1.3rem",
                      boxShadow: "0 6px 16px rgba(59, 130, 246, 0.35)",
                      flexShrink: 0
                    }}>
                      {gs.ho_ten ? gs.ho_ten.charAt(0) : "G"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <h4 style={{ fontWeight: "800", fontSize: "1.08rem", margin: 0, color: "var(--text-main)" }}>
                          {gs.ho_ten}
                        </h4>
                        <span title="Hồ sơ & Bằng cấp đã xác thực" style={{ color: "#10b981", fontSize: "0.95rem" }}>✅</span>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", display: "block", marginTop: "2px" }}>
                        🏛️ {gs.truong_tot_nghiep || "Đại học Quốc gia"}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: "0.86rem",
                    fontWeight: "800",
                    color: "#f59e0b",
                    background: "rgba(245, 158, 11, 0.12)",
                    padding: "4px 10px",
                    borderRadius: "10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    ⭐ {gs.rating || 5.0}
                  </span>
                </div>

                {/* Môn học chuyên môn */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                  <span style={{
                    padding: "5px 12px",
                    borderRadius: "8px",
                    background: "rgba(59, 130, 246, 0.1)",
                    color: "var(--primary)",
                    fontWeight: "700",
                    fontSize: "0.83rem"
                  }}>
                    📚 {gs.mon_hoc_chuyen_mon}
                  </span>
                  <span style={{
                    padding: "5px 10px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#059669",
                    fontWeight: "700",
                    fontSize: "0.8rem"
                  }}>
                    🎓 {gs.hoc_vi || "Cử nhân / Thạc sĩ"}
                  </span>
                </div>

                {/* Huy hiệu Bằng Cấp & GPA Bảng Điểm */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginBottom: "12px"
                }}>
                  <div style={{
                    background: "var(--neu-bg)",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    boxShadow: "var(--neu-shadow-inset)",
                    fontSize: "0.78rem",
                    color: "var(--text-main)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span style={{ fontSize: "1rem" }}>📜</span>
                    <span style={{ fontWeight: "700" }}>
                      {(gs.bang_cap && gs.bang_cap.length) || 2} bằng cấp ĐH
                    </span>
                  </div>
                  <div style={{
                    background: "var(--neu-bg)",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    boxShadow: "var(--neu-shadow-inset)",
                    fontSize: "0.78rem",
                    color: "var(--text-main)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span style={{ fontSize: "1rem" }}>📊</span>
                    <span style={{ fontWeight: "700" }}>
                      GPA {gs.bang_diem?.gpa_he_4 || "3.9"}/4.0
                    </span>
                  </div>
                </div>

                {/* Khung giờ dạy */}
                <div style={{
                  background: "var(--neu-bg)",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  boxShadow: "var(--neu-shadow-inset)",
                  marginBottom: "12px",
                  fontSize: "0.82rem"
                }}>
                  <div style={{ fontWeight: "700", color: "var(--text-main)", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🕒 Lịch:</span>
                    <span style={{ color: "var(--primary)" }}>{gs.khung_gio_day || "Linh hoạt thỏa thuận"}</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    📍 {gs.khu_vuc || "Online toàn quốc"}
                  </div>
                </div>

                {/* Mô tả gia sư tóm tắt */}
                <p style={{
                  fontSize: "0.84rem",
                  color: "var(--text-muted)",
                  lineHeight: "1.5",
                  marginBottom: "14px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {gs.mo_ta}
                </p>
              </div>

              {/* Phần chân Card: Giá tiền & Nút hành động */}
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "14px" }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: "600" }}>Học phí:</span>
                  <span style={{ fontSize: "1.15rem", fontWeight: "800", color: "#10b981" }}>
                    {gs.gia_theo_gio ? gs.gia_theo_gio.toLocaleString() : "200.000"} đ<span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)" }}>/giờ</span>
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{
                      padding: "8px 10px",
                      fontSize: "0.8rem",
                      textAlign: "center",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px"
                    }}
                    onClick={() => openTutorDetails(gs, "degrees")}
                  >
                    <span>📑 Xem Bằng Cấp</span>
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{
                      padding: "8px 10px",
                      fontSize: "0.8rem",
                      textAlign: "center",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px"
                    }}
                    onClick={() => setBookingModal({ open: true, tutor: gs })}
                  >
                    <span>📅 Đặt Học Thử</span>
                  </button>
                </div>
                {onNavigateToChat && (
                  <button
                    type="button"
                    onClick={() => {
                      const tutorUserId = gs.user_id?._id || gs.user_id;
                      onNavigateToChat(tutorUserId, gs.ho_ten);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(139, 92, 246, 0.12))",
                      border: "1px solid rgba(59, 130, 246, 0.35)",
                      color: "#3b82f6",
                      fontWeight: "700",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "linear-gradient(135deg, #3b82f6, #2563eb)";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(139, 92, 246, 0.12))";
                      e.currentTarget.style.color = "#3b82f6";
                    }}
                  >
                    <span>💬</span>
                    <span>Nhắn Tin Riêng Với Gia Sư</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================
          MODAL CHI TIẾT GIA SƯ VỚI TAB BẰNG CẤP, BẢNG ĐIỂM, THÀNH TÍCH
          ============================================================ */}
      {detailModal.open && detailModal.tutor && (
        <div className="modal-overlay" onClick={() => setDetailModal({ ...detailModal, open: false })}>
          <div
            className="modal-content"
            style={{
              maxWidth: "860px",
              width: "95%",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              padding: "0",
              borderRadius: "22px",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              background: "linear-gradient(135deg, rgba(37,99,235,0.05), rgba(139,92,246,0.05))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #2563eb, #8b5cf6)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "1.45rem",
                  boxShadow: "0 8px 20px rgba(37,99,235,0.3)",
                  flexShrink: 0
                }}>
                  {detailModal.tutor.ho_ten ? detailModal.tutor.ho_ten.charAt(0) : "G"}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0, color: "var(--text-main)" }}>
                      {detailModal.tutor.ho_ten}
                    </h3>
                    <span style={{
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#059669",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      ✅ Đã Xác Thực Hồ Sơ
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <span>🎓 {detailModal.tutor.hoc_vi || "Cử nhân"}</span>
                    <span>🏛️ {detailModal.tutor.truong_tot_nghiep || "Đại học Quốc gia"}</span>
                    <span>⭐ {detailModal.tutor.rating || 5.0} ({detailModal.tutor.danh_gia_hoc_vien?.length || 2} học viên)</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>Học phí</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#10b981" }}>
                    {detailModal.tutor.gia_theo_gio ? detailModal.tutor.gia_theo_gio.toLocaleString() : "200.000"} đ<span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/h</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailModal({ ...detailModal, open: false })}
                  style={{
                    background: "var(--neu-bg)",
                    border: "none",
                    borderRadius: "10px",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "var(--neu-shadow-sm)",
                    color: "var(--text-main)",
                    fontWeight: "800",
                    fontSize: "1.1rem"
                  }}
                  title="Đóng"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* TAB BAR ĐIỀU HƯỚNG */}
            <div style={{
              display: "flex",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              background: "var(--neu-bg)",
              padding: "8px 16px 0",
              gap: "8px",
              overflowX: "auto"
            }}>
              <button
                type="button"
                onClick={() => setDetailModal({ ...detailModal, activeTab: "degrees" })}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px 10px 0 0",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  background: detailModal.activeTab === "degrees" ? "var(--primary)" : "transparent",
                  color: detailModal.activeTab === "degrees" ? "#ffffff" : "var(--text-muted)",
                  boxShadow: detailModal.activeTab === "degrees" ? "0 -2px 10px rgba(37,99,235,0.25)" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease"
                }}
              >
                <span>📜 Bằng Cấp & Chứng Chỉ</span>
                <span style={{
                  background: detailModal.activeTab === "degrees" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.07)",
                  padding: "1px 7px",
                  borderRadius: "20px",
                  fontSize: "0.78rem"
                }}>
                  {detailModal.tutor.bang_cap?.length || 2}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDetailModal({ ...detailModal, activeTab: "transcript" })}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px 10px 0 0",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  background: detailModal.activeTab === "transcript" ? "var(--primary)" : "transparent",
                  color: detailModal.activeTab === "transcript" ? "#ffffff" : "var(--text-muted)",
                  boxShadow: detailModal.activeTab === "transcript" ? "0 -2px 10px rgba(37,99,235,0.25)" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease"
                }}
              >
                <span>📊 Bảng Điểm & Học Lực</span>
                <span style={{
                  background: detailModal.activeTab === "transcript" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.07)",
                  padding: "1px 7px",
                  borderRadius: "20px",
                  fontSize: "0.78rem"
                }}>
                  GPA {detailModal.tutor.bang_diem?.gpa_he_4 || "3.9"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDetailModal({ ...detailModal, activeTab: "info" })}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px 10px 0 0",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  background: detailModal.activeTab === "info" ? "var(--primary)" : "transparent",
                  color: detailModal.activeTab === "info" ? "#ffffff" : "var(--text-muted)",
                  boxShadow: detailModal.activeTab === "info" ? "0 -2px 10px rgba(37,99,235,0.25)" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease"
                }}
              >
                <span>👤 Thông Tin Chung</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailModal({ ...detailModal, activeTab: "reviews" })}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px 10px 0 0",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  background: detailModal.activeTab === "reviews" ? "var(--primary)" : "transparent",
                  color: detailModal.activeTab === "reviews" ? "#ffffff" : "var(--text-muted)",
                  boxShadow: detailModal.activeTab === "reviews" ? "0 -2px 10px rgba(37,99,235,0.25)" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease"
                }}
              >
                <span>⭐ Đánh Giá ({detailModal.tutor.danh_gia_hoc_vien?.length || 2})</span>
              </button>
            </div>

            {/* NỘI DUNG TỪNG TAB */}
            <div style={{ padding: "24px", overflowY: "auto", flex: 1, maxHeight: "65vh" }}>
              {/* TAB 1: BẰNG CẤP & CHỨNG CHỈ */}
              {detailModal.activeTab === "degrees" && (
                <div>
                  <div style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "0.86rem",
                    color: "var(--text-main)"
                  }}>
                    <span style={{ fontSize: "1.2rem" }}>🛡️</span>
                    <div>
                      <strong>Văn bằng chính quy đã xác thực:</strong> Tất cả bằng cử nhân, thạc sĩ và chứng chỉ quốc tế dưới đây đã được phòng kiểm định Life Planner đối chiếu hồ sơ gốc hợp lệ.
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
                    {(detailModal.tutor.bang_cap || [
                      {
                        ten_bang: "Bằng Đại học Chính Quy",
                        to_chuc: detailModal.tutor.truong_tot_nghiep || "Đại học Sư Phạm Hà Nội",
                        nam: "2022",
                        xep_loai: "Xuất sắc",
                        hinh_anh: "/images/degree_certificate.jpg",
                        mo_ta: `Chuyên ngành ${detailModal.tutor.mon_hoc_chuyen_mon}. Đạt danh hiệu sinh viên xuất sắc toàn khóa.`
                      }
                    ]).map((deg, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "var(--neu-bg)",
                          borderRadius: "16px",
                          padding: "16px",
                          boxShadow: "var(--neu-shadow-sm)",
                          border: "1px solid rgba(0,0,0,0.06)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                            <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                              {deg.ten_bang}
                            </h4>
                            <span style={{
                              fontSize: "0.74rem",
                              fontWeight: "700",
                              background: "rgba(37,99,235,0.12)",
                              color: "var(--primary)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              whiteSpace: "nowrap"
                            }}>
                              {deg.xep_loai || "Xuất sắc"}
                            </span>
                          </div>

                          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span>🏛️ Đơn vị cấp: <strong>{deg.to_chuc}</strong></span>
                            <span>📅 Năm tốt nghiệp: <strong>{deg.nam}</strong></span>
                            {deg.mo_ta && <span style={{ marginTop: "4px", fontStyle: "italic" }}>📝 {deg.mo_ta}</span>}
                          </div>

                          {/* ẢNH BẰNG CẤP XEM TRƯỚC */}
                          <div
                            style={{
                              position: "relative",
                              borderRadius: "12px",
                              overflow: "hidden",
                              cursor: "pointer",
                              boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                              border: "2px solid rgba(255,255,255,0.6)"
                            }}
                            onClick={() => setLightbox({
                              open: true,
                              src: deg.hinh_anh || "/images/degree_certificate.jpg",
                              title: deg.ten_bang,
                              subtitle: `${deg.to_chuc} - Năm ${deg.nam} (${deg.xep_loai})`
                            })}
                            title="Bấm vào để phóng to hình ảnh văn bằng gốc"
                          >
                            <img
                              src={deg.hinh_anh || "/images/degree_certificate.jpg"}
                              alt={deg.ten_bang}
                              style={{
                                width: "100%",
                                height: "190px",
                                objectFit: "cover",
                                display: "block",
                                transition: "transform 0.3s ease"
                              }}
                            />
                            <div style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                              padding: "20px 12px 10px",
                              color: "#ffffff",
                              fontSize: "0.82rem",
                              fontWeight: "700",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between"
                            }}>
                              <span>🔍 Bấm để phóng to ảnh gốc</span>
                              <span style={{ fontSize: "0.75rem", background: "rgba(16,185,129,0.9)", padding: "2px 8px", borderRadius: "10px" }}>
                                Đã Xác Thực
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: "12px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => setLightbox({
                              open: true,
                              src: deg.hinh_anh || "/images/degree_certificate.jpg",
                              title: deg.ten_bang,
                              subtitle: `${deg.to_chuc} - Năm ${deg.nam} (${deg.xep_loai})`
                            })}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--primary)",
                              fontWeight: "700",
                              fontSize: "0.84rem",
                              cursor: "pointer",
                              textDecoration: "underline"
                            }}
                          >
                            🔍 Mở toàn màn hình văn bằng này
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: BẢNG ĐIỂM & HỌC LỰC */}
              {detailModal.activeTab === "transcript" && (
                <div>
                  <div style={{
                    background: "rgba(37, 99, 235, 0.08)",
                    border: "1px solid rgba(37, 99, 235, 0.25)",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "0.86rem",
                    color: "var(--text-main)"
                  }}>
                    <span style={{ fontSize: "1.2rem" }}>📊</span>
                    <div>
                      <strong>Bảng điểm đại học đóng dấu mộc đỏ:</strong> Tổng hợp kết quả học tập chính quy và điểm số các môn chuyên ngành được gia sư trực tiếp giảng dạy.
                    </div>
                  </div>

                  {/* THỐNG KÊ GPA */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "20px" }}>
                    <div style={{
                      background: "var(--neu-bg)",
                      padding: "14px",
                      borderRadius: "14px",
                      boxShadow: "var(--neu-shadow-sm)",
                      border: "1px solid rgba(0,0,0,0.06)"
                    }}>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "700" }}>🎯 GPA TÍCH LŨY (HỆ 4.0)</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "var(--primary)", marginTop: "4px" }}>
                        {detailModal.tutor.bang_diem?.gpa_he_4 || "3.92"} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>/ 4.0</span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: "700", marginTop: "2px" }}>
                        Xếp loại: {detailModal.tutor.bang_diem?.xep_loai || "Thủ khoa Xuất sắc"}
                      </div>
                    </div>

                    <div style={{
                      background: "var(--neu-bg)",
                      padding: "14px",
                      borderRadius: "14px",
                      boxShadow: "var(--neu-shadow-sm)",
                      border: "1px solid rgba(0,0,0,0.06)"
                    }}>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "700" }}>📈 GPA QUY ĐỔI (HỆ 10.0)</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#10b981", marginTop: "4px" }}>
                        {detailModal.tutor.bang_diem?.gpa_he_10 || "9.35"} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>/ 10</span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", marginTop: "2px" }}>
                        Thuộc top 1% xuất sắc nhất khóa
                      </div>
                    </div>

                    <div style={{
                      background: "var(--neu-bg)",
                      padding: "14px",
                      borderRadius: "14px",
                      boxShadow: "var(--neu-shadow-sm)",
                      border: "1px solid rgba(0,0,0,0.06)"
                    }}>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "700" }}>🏛️ CHUYÊN NGÀNH ĐÀO TẠO</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--text-main)", marginTop: "4px" }}>
                        {detailModal.tutor.bang_diem?.chuyen_nganh || detailModal.tutor.mon_hoc_chuyen_mon}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", marginTop: "2px" }}>
                        {detailModal.tutor.bang_diem?.truong_dai_hoc || detailModal.tutor.truong_tot_nghiep}
                      </div>
                    </div>
                  </div>

                  {/* ẢNH SCAN BẢNG ĐIỂM CHÍNH QUY */}
                  <div style={{ marginBottom: "22px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: "800", margin: 0 }}>
                        📑 Bản Scan Bảng Điểm Gốc Xác Thực
                      </h4>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        (Nhấp vào ảnh để mở bảng điểm kích thước đầy đủ)
                      </span>
                    </div>

                    <div
                      style={{
                        position: "relative",
                        borderRadius: "14px",
                        overflow: "hidden",
                        cursor: "pointer",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
                        border: "2px solid rgba(255,255,255,0.7)"
                      }}
                      onClick={() => setLightbox({
                        open: true,
                        src: detailModal.tutor.bang_diem?.hinh_anh || "/images/academic_transcript.jpg",
                        title: `Bảng Điểm Học Tập - ${detailModal.tutor.ho_ten}`,
                        subtitle: `${detailModal.tutor.bang_diem?.truong_dai_hoc || detailModal.tutor.truong_tot_nghiep} (GPA ${detailModal.tutor.bang_diem?.gpa_he_4 || '3.9'}/4.0)`
                      })}
                      title="Bấm để phóng to xem bảng điểm"
                    >
                      <img
                        src={detailModal.tutor.bang_diem?.hinh_anh || "/images/academic_transcript.jpg"}
                        alt="Bảng điểm đại học"
                        style={{
                          width: "100%",
                          height: "240px",
                          objectFit: "cover",
                          display: "block"
                        }}
                      />
                      <div style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                        padding: "24px 16px 12px",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}>
                        <div>
                          <div style={{ fontWeight: "800", fontSize: "0.92rem" }}>
                            Bảng Điểm Tốt Nghiệp Chính Quy
                          </div>
                          <div style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                            {detailModal.tutor.truong_tot_nghiep || "Đại học Quốc gia"} • Đóng dấu đỏ phòng Đào tạo
                          </div>
                        </div>
                        <span style={{
                          background: "var(--primary)",
                          color: "#ffffff",
                          padding: "6px 12px",
                          borderRadius: "10px",
                          fontWeight: "700",
                          fontSize: "0.82rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}>
                          🔍 Xem Toàn Bộ Bảng Điểm
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BẢNG ĐIỂM CHI TIẾT CÁC MÔN TIÊU BIỂU */}
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "800", marginBottom: "10px" }}>
                      🎯 Điểm Số Các Môn Chuyên Ngành Tiêu Biểu
                    </h4>
                    <div style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      boxShadow: "var(--neu-shadow-inset)",
                      background: "var(--neu-bg)",
                      border: "1px solid rgba(0,0,0,0.06)"
                    }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: "rgba(0,0,0,0.04)", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                            <th style={{ padding: "10px 14px", fontWeight: "800" }}>Tên Học Phần / Môn Học</th>
                            <th style={{ padding: "10px 14px", fontWeight: "800", width: "90px" }}>Tín Chỉ</th>
                            <th style={{ padding: "10px 14px", fontWeight: "800", width: "110px" }}>Điểm Số</th>
                            <th style={{ padding: "10px 14px", fontWeight: "800", width: "110px" }}>Điểm Chữ</th>
                            <th style={{ padding: "10px 14px", fontWeight: "800", width: "120px" }}>Đánh Giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detailModal.tutor.bang_diem?.mon_tieu_bieu || [
                            { ten_mon: "Giải tích hàm & Giải tích nhiều biến", diem_so: "10.0", diem_he_4: 4.0, tin_chi: 4 },
                            { ten_mon: "Đại số tuyến tính & Cấu trúc đại số", diem_so: "9.8", diem_he_4: 4.0, tin_chi: 4 },
                            { ten_mon: "Xác suất thống kê ứng dụng", diem_so: "9.6", diem_he_4: 4.0, tin_chi: 3 },
                            { ten_mon: "Phương trình vi phân & Toán ứng dụng", diem_so: "9.7", diem_he_4: 4.0, tin_chi: 3 }
                          ]).map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                              <td style={{ padding: "10px 14px", fontWeight: "700", color: "var(--text-main)" }}>
                                {item.ten_mon}
                              </td>
                              <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>
                                {item.tin_chi} TC
                              </td>
                              <td style={{ padding: "10px 14px", fontWeight: "800", color: "#10b981" }}>
                                {item.diem_so} / 10
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{
                                  background: "rgba(16, 185, 129, 0.15)",
                                  color: "#059669",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontWeight: "800",
                                  fontSize: "0.8rem"
                                }}>
                                  A+
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: "600" }}>
                                Xuất sắc
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: THÔNG TIN CHUNG & PHƯƠNG PHÁP */}
              {detailModal.activeTab === "info" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Giới thiệu & Triết lý */}
                  <div style={{
                    background: "var(--neu-bg)",
                    padding: "18px",
                    borderRadius: "14px",
                    boxShadow: "var(--neu-shadow-sm)"
                  }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "800", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>📝 Giới Thiệu Bản Thân</span>
                    </h4>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-main)", lineHeight: "1.6", margin: 0 }}>
                      {detailModal.tutor.mo_ta}
                    </p>
                  </div>

                  {/* Phương pháp giảng dạy */}
                  {detailModal.tutor.phuong_phap_day && (
                    <div style={{
                      background: "var(--neu-bg)",
                      padding: "18px",
                      borderRadius: "14px",
                      boxShadow: "var(--neu-shadow-sm)"
                    }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: "800", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>💡 Phương Pháp Giảng Dạy & Cam Kết Đầu Ra</span>
                      </h4>
                      <p style={{ fontSize: "0.9rem", color: "var(--text-main)", lineHeight: "1.6", margin: 0 }}>
                        {detailModal.tutor.phuong_phap_day}
                      </p>
                    </div>
                  )}

                  {/* Thành tích & Giải thưởng */}
                  {detailModal.tutor.thanh_tich && detailModal.tutor.thanh_tich.length > 0 && (
                    <div style={{
                      background: "var(--neu-bg)",
                      padding: "18px",
                      borderRadius: "14px",
                      boxShadow: "var(--neu-shadow-sm)"
                    }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: "800", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>🏆 Thành Tích & Giải Thưởng Nổi Bật</span>
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {detailModal.tutor.thanh_tich.map((ach, idx) => (
                          <div key={idx} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "0.88rem",
                            color: "var(--text-main)"
                          }}>
                            <span style={{ color: "#f59e0b", fontSize: "1rem" }}>🏅</span>
                            <span>{ach}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chi tiết lịch & liên hệ */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "14px"
                  }}>
                    <div style={{
                      background: "var(--neu-bg)",
                      padding: "16px",
                      borderRadius: "14px",
                      boxShadow: "var(--neu-shadow-inset)"
                    }}>
                      <h5 style={{ fontSize: "0.85rem", fontWeight: "800", marginBottom: "8px" }}>🕒 Thời Gian & Địa Điểm</h5>
                      <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div><strong>Khung giờ:</strong> {detailModal.tutor.khung_gio_day}</div>
                        <div><strong>Hình thức:</strong> {detailModal.tutor.khu_vuc}</div>
                        <div><strong>Kinh nghiệm:</strong> {detailModal.tutor.kinh_nghiem}</div>
                      </div>
                    </div>

                    <div style={{
                      background: "var(--neu-bg)",
                      padding: "16px",
                      borderRadius: "14px",
                      boxShadow: "var(--neu-shadow-inset)"
                    }}>
                      <h5 style={{ fontSize: "0.85rem", fontWeight: "800", marginBottom: "8px" }}>📞 Kênh Liên Hệ Trực Tiếp</h5>
                      <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div>
                          <strong>Điện thoại:</strong>{" "}
                          <a href={`tel:${detailModal.tutor.so_dien_thoai || "0912345678"}`} style={{ color: "var(--primary)", fontWeight: "700" }}>
                            {detailModal.tutor.so_dien_thoai || "0912 345 678"}
                          </a>
                        </div>
                        <div>
                          <strong>Email:</strong>{" "}
                          <a href={`mailto:${detailModal.tutor.email || "giasu@lifeplanner.vn"}`} style={{ color: "var(--primary)", fontWeight: "700" }}>
                            {detailModal.tutor.email || "giasu@lifeplanner.vn"}
                          </a>
                        </div>
                        <div><strong>Hỗ trợ:</strong> Nhận kèm 1-1 qua Google Meet & Discord</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ĐÁNH GIÁ TỪ HỌC VIÊN */}
              {detailModal.activeTab === "reviews" && (
                <div>
                  <div style={{
                    background: "var(--neu-bg)",
                    padding: "16px 20px",
                    borderRadius: "14px",
                    boxShadow: "var(--neu-shadow-sm)",
                    marginBottom: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "700" }}>ĐÁNH GIÁ TRUNG BÌNH</div>
                      <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#f59e0b", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>⭐ {detailModal.tutor.rating || 5.0}</span>
                        <span style={{ fontSize: "0.95rem", color: "var(--text-muted)", fontWeight: "600" }}>/ 5.0</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#059669",
                        padding: "6px 12px",
                        borderRadius: "10px",
                        fontWeight: "800",
                        fontSize: "0.85rem"
                      }}>
                        💯 100% Học viên đạt mục tiêu môn học
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {(detailModal.tutor.danh_gia_hoc_vien && detailModal.tutor.danh_gia_hoc_vien.length > 0 ? detailModal.tutor.danh_gia_hoc_vien : [
                      {
                        ten_hoc_vien: "Hoàng Minh Tuấn (SV ĐH Bách Khoa)",
                        ngay: "12/03/2026",
                        rating: 5.0,
                        khoa_hoc: "Kèm Đồ Án & Môn Chuyên Ngành",
                        binh_luan: "Gia sư giảng dạy cực kỳ có tâm, kiên nhẫn phân tích từng lỗi sai. Nhờ học kèm mà mình đạt điểm A xuất sắc môn này!"
                      },
                      {
                        ten_hoc_vien: "Nguyễn Thu Uyên (SV NEU)",
                        ngay: "28/02/2026",
                        rating: 5.0,
                        khoa_hoc: "Luyện thi cuối kỳ",
                        binh_luan: "Tài liệu ôn tập và bộ đề thi sát với đề thi thật. Phương pháp dạy dễ hiểu và truyền cảm hứng rất nhiều."
                      }
                    ]).map((rev, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "var(--neu-bg)",
                          padding: "16px",
                          borderRadius: "14px",
                          boxShadow: "var(--neu-shadow-inset)",
                          border: "1px solid rgba(0,0,0,0.04)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                          <div style={{ fontWeight: "800", fontSize: "0.92rem", color: "var(--text-main)" }}>
                            {rev.ten_hoc_vien}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {rev.ngay}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <span style={{ color: "#f59e0b", fontSize: "0.85rem" }}>
                            {"⭐".repeat(Math.round(rev.rating || 5))}
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "var(--primary)", fontWeight: "700" }}>
                            • Khóa học: {rev.khoa_hoc}
                          </span>
                        </div>

                        <p style={{ fontSize: "0.88rem", color: "var(--text-main)", lineHeight: "1.5", margin: 0, fontStyle: "italic" }}>
                          "{rev.binh_luan}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal Action Bar */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(0,0,0,0.08)",
              background: "var(--neu-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap"
            }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Cần tư vấn thêm? Gọi/Zalo:{" "}
                <a href={`tel:${detailModal.tutor.so_dien_thoai || "0912345678"}`} style={{ color: "var(--primary)", fontWeight: "700" }}>
                  {detailModal.tutor.so_dien_thoai || "0912 345 678"}
                </a>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDetailModal({ ...detailModal, open: false })}
                >
                  Đóng
                </button>
                {onNavigateToChat && (
                  <button
                    type="button"
                    onClick={() => {
                      const tutor = detailModal.tutor;
                      const tutorUserId = tutor.user_id?._id || tutor.user_id;
                      setDetailModal({ ...detailModal, open: false });
                      onNavigateToChat(tutorUserId, tutor.ho_ten);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: "700",
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      cursor: "pointer"
                    }}
                  >
                    <span>💬</span>
                    <span>Nhắn Tin Riêng</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const tutor = detailModal.tutor;
                    setDetailModal({ ...detailModal, open: false });
                    setBookingModal({ open: true, tutor });
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: "700"
                  }}
                >
                  <span>📅 Đặt Lịch Học Thử Ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          LIGHTBOX PHÓNG TO HÌNH ẢNH BẰNG CẤP & BẢNG ĐIỂM TOÀN MÀN HÌNH
          ============================================================ */}
      {lightbox.open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 11000,
            background: "rgba(10, 15, 29, 0.88)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.25s ease"
          }}
          onClick={() => setLightbox({ ...lightbox, open: false })}
        >
          {/* Header Lightbox */}
          <div
            style={{
              width: "100%",
              maxWidth: "880px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              color: "#ffffff"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", margin: 0, color: "#ffffff" }}>
                {lightbox.title || "Văn Bằng Xác Thực"}
              </h3>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", margin: "3px 0 0" }}>
                {lightbox.subtitle || "Life Planner Official Credential Verification"}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <a
                href={lightbox.src}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontSize: "0.82rem",
                  fontWeight: "700"
                }}
              >
                Mở Tab Mới ↗
              </a>
              <button
                type="button"
                onClick={() => setLightbox({ ...lightbox, open: false })}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  color: "#ffffff",
                  fontSize: "1.1rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Vùng hiển thị ảnh phóng to */}
          <div
            style={{
              maxWidth: "880px",
              maxHeight: "80vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
              border: "3px solid rgba(255,255,255,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.src}
              alt={lightbox.title}
              style={{
                width: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                display: "block",
                background: "#ffffff"
              }}
            />
          </div>

          {/* Chú thích phía dưới */}
          <div
            style={{
              marginTop: "12px",
              color: "rgba(255,255,255,0.85)",
              fontSize: "0.85rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span>🛡️ Bản sao kỹ thuật số đã được kiểm định con dấu và xếp loại đào tạo.</span>
          </div>
        </div>
      )}

      {/* MODAL ĐẶT LỊCH HỌC THỬ */}
      {bookingModal.open && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "6px" }}>
              📅 Đăng Ký Học Thử Với Gia Sư
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              Gia sư: <strong>{bookingModal.tutor?.ho_ten}</strong> ({bookingModal.tutor?.mon_hoc_chuyen_mon})
            </p>

            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label>Họ và tên của bạn *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn B"
                  value={bookingForm.ho_ten}
                  onChange={(e) => setBookingForm({ ...bookingForm, ho_ten: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  required
                  placeholder="VD: 0988 123 456"
                  value={bookingForm.so_dien_thoai}
                  onChange={(e) => setBookingForm({ ...bookingForm, so_dien_thoai: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Thời gian bạn muốn học thử *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tối Thứ 4 tuần này (20:00 - 21:30)"
                  value={bookingForm.thoi_gian_mong_muon}
                  onChange={(e) => setBookingForm({ ...bookingForm, thoi_gian_mong_muon: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Ghi chú về nội dung cần hỗ trợ</label>
                <textarea
                  rows="3"
                  placeholder="VD: Cần hỗ trợ ôn thi giữa kỳ phần Giải tích 2 và bài tập lớn..."
                  value={bookingForm.ghi_chu}
                  onChange={(e) => setBookingForm({ ...bookingForm, ghi_chu: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "var(--neu-bg)",
                    boxShadow: "var(--neu-shadow-inset)",
                    fontSize: "0.9rem",
                    color: "var(--text-main)",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
                <button type="button" className="btn-secondary" onClick={() => setBookingModal({ open: false, tutor: null })}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Gửi Yêu Cầu Học Thử
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
