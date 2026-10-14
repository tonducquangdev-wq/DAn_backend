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

export const TutorView = ({ onBack }) => {
  const [giaSus, setGiaSus] = useState([]);
  const [loading, setLoading] = useState(true);

  // States bộ lọc
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedTime, setSelectedTime] = useState("all");
  const [minRating, setMinRating] = useState("all");

  // State Modal Liên hệ / Đặt lịch
  const [selectedTutor, setSelectedTutor] = useState(null);
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
        <div className="action-bar">
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
                padding: "24px",
                transition: "transform 0.2s ease, box-shadow 0.2s ease"
              }}
            >
              <div>
                {/* Header card gia sư */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "800",
                      fontSize: "1.2rem",
                      boxShadow: "0 6px 16px rgba(59, 130, 246, 0.3)"
                    }}>
                      {gs.ho_ten ? gs.ho_ten.charAt(0) : "G"}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: "800", fontSize: "1.1rem", margin: 0 }}>{gs.ho_ten}</h4>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>
                        💼 {gs.kinh_nghiem || "Giảng dạy chuyên sâu"}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: "0.88rem",
                    fontWeight: "800",
                    color: "#f59e0b",
                    background: "rgba(245, 158, 11, 0.12)",
                    padding: "4px 10px",
                    borderRadius: "8px"
                  }}>
                    ⭐ {gs.rating || 5.0}
                  </span>
                </div>

                {/* Chuyên môn môn học */}
                <div style={{
                  display: "inline-block",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  background: "rgba(59, 130, 246, 0.1)",
                  color: "var(--primary)",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  marginBottom: "12px"
                }}>
                  📚 {gs.mon_hoc_chuyen_mon}
                </div>

                {/* Khung giờ dạy */}
                <div style={{
                  background: "var(--neu-bg)",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  boxShadow: "var(--neu-shadow-inset)",
                  marginBottom: "14px",
                  fontSize: "0.84rem"
                }}>
                  <div style={{ fontWeight: "700", color: "var(--text-main)", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🕒 Lịch dạy:</span>
                    <span style={{ color: "var(--primary)" }}>{gs.khung_gio_day || "Linh hoạt thỏa thuận"}</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    📍 {gs.khu_vuc || "Online toàn quốc"}
                  </div>
                </div>

                {/* Mô tả gia sư */}
                <p style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  lineHeight: "1.5",
                  marginBottom: "18px",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {gs.mo_ta}
                </p>
              </div>

              {/* Phần chân Card: Giá tiền & Nút hành động */}
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: "600" }}>Học phí:</span>
                  <span style={{ fontSize: "1.15rem", fontWeight: "800", color: "#10b981" }}>
                    {gs.gia_theo_gio ? gs.gia_theo_gio.toLocaleString() : "200.000"} đ<span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)" }}>/giờ</span>
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: "8px 12px", fontSize: "0.82rem", textAlign: "center", fontWeight: "700" }}
                    onClick={() => setSelectedTutor(gs)}
                  >
                    📞 Liên Hệ
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: "8px 12px", fontSize: "0.82rem", textAlign: "center", fontWeight: "700" }}
                    onClick={() => setBookingModal({ open: true, tutor: gs })}
                  >
                    📅 Đặt Học Thử
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CHI TIẾT LIÊN HỆ */}
      {selectedTutor && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "6px" }}>
              📞 Thông Tin Liên Hệ Gia Sư
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              Liên hệ trực tiếp với gia sư qua số điện thoại hoặc email dưới đây
            </p>

            <div style={{
              background: "var(--neu-bg)",
              padding: "16px",
              borderRadius: "14px",
              boxShadow: "var(--neu-shadow-inset)",
              marginBottom: "18px"
            }}>
              <div style={{ fontWeight: "800", fontSize: "1.1rem", marginBottom: "4px" }}>
                {selectedTutor.ho_ten}
              </div>
              <div style={{ color: "var(--primary)", fontWeight: "700", fontSize: "0.88rem", marginBottom: "12px" }}>
                📚 {selectedTutor.mon_hoc_chuyen_mon}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem" }}>
                <div>
                  <strong>📱 Số điện thoại / Zalo:</strong>{" "}
                  <a href={`tel:${selectedTutor.so_dien_thoai || "0912345678"}`} style={{ color: "var(--primary)", fontWeight: "700" }}>
                    {selectedTutor.so_dien_thoai || "0912 345 678"}
                  </a>
                </div>
                <div>
                  <strong>✉️ Email:</strong>{" "}
                  <a href={`mailto:${selectedTutor.email || "giasu@lifeplanner.vn"}`} style={{ color: "var(--primary)", fontWeight: "700" }}>
                    {selectedTutor.email || "giasu@lifeplanner.vn"}
                  </a>
                </div>
                <div>
                  <strong>🕒 Khung giờ dạy:</strong> {selectedTutor.khung_gio_day || "Linh hoạt"}
                </div>
                <div>
                  <strong>💰 Học phí:</strong> {selectedTutor.gia_theo_gio?.toLocaleString()} đ/giờ
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" className="btn-secondary" onClick={() => setSelectedTutor(null)}>Đóng</button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const tutor = selectedTutor;
                  setSelectedTutor(null);
                  setBookingModal({ open: true, tutor });
                }}
              >
                📅 Đặt Lịch Học Thử Ngay
              </button>
            </div>
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
