import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export const DangKyChuyenGiaModal = ({ show, onClose, onSuccess }) => {
  const { user, refreshUser } = useAuth();

  // Tab: "gia_su" hoặc "pt"
  const [loai, setLoai] = useState("gia_su");

  // State các hồ sơ hiện có
  const [existingApplications, setExistingApplications] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // Form states
  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [email, setEmail] = useState("");
  const [chuyenMon, setChuyenMon] = useState("");
  const [kinhNghiem, setKinhNghiem] = useState("1-2 năm kinh nghiệm");
  const [khuVuc, setKhuVuc] = useState("Online toàn quốc");
  const [giaTheoGio, setGiaTheoGio] = useState(200000);
  const [moTa, setMoTa] = useState("");
  const [hocVi, setHocVi] = useState("");
  const [truongTotNghiep, setTruongTotNghiep] = useState("");

  // Chứng chỉ
  const [tenChungChi, setTenChungChi] = useState("");
  const [noiCap, setNoiCap] = useState("");
  const [namCap, setNamCap] = useState("2025");
  const [hinhAnhChungChi, setHinhAnhChungChi] = useState("");
  const [tenFileAnh, setTenFileAnh] = useState("");
  const [chungChiList, setChungChiList] = useState([]);
  const [previewModalImg, setPreviewModalImg] = useState(null);
  const fileInputRef = React.useRef(null);

  // Trạng thái submit
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Nạp thông tin ban đầu khi mở modal
  useEffect(() => {
    if (show && user) {
      setHoTen(user.name || "");
      setEmail(user.email || "");
      setSoDienThoai(user.phone || "");
      fetchExistingApps();
    }
  }, [show, user]);

  const fetchExistingApps = async () => {
    setLoadingExisting(true);
    try {
      const res = await api.getTrangThaiHoSo();
      if (res.success && Array.isArray(res.data)) {
        setExistingApplications(res.data);
      }
    } catch (e) {
      console.error("Lỗi nạp trạng thái hồ sơ:", e);
    } finally {
      setLoadingExisting(false);
    }
  };

  // Xử lý chọn tệp hình ảnh chứng chỉ
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback({ type: "error", message: "Vui lòng chọn tệp định dạng hình ảnh (JPG, PNG, WebP)!" });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFeedback({ type: "error", message: "Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 8MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      setHinhAnhChungChi(uploadEvt.target.result);
      setTenFileAnh(file.name);
      setFeedback({ type: "success", message: `Đã đính kèm ảnh: ${file.name}` });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Thêm một chứng chỉ vào danh sách
  const handleAddCert = () => {
    if (!tenChungChi.trim()) {
      setFeedback({ type: "error", message: "Vui lòng nhập Tên chứng chỉ trước khi thêm!" });
      return;
    }
    setChungChiList([
      ...chungChiList,
      {
        ten_chung_chi: tenChungChi.trim(),
        noi_cap: noiCap.trim() || "Tổ chức uy tín",
        nam_cap: namCap.trim() || "2025",
        hinh_anh: hinhAnhChungChi || ""
      }
    ]);
    setTenChungChi("");
    setNoiCap("");
    setHinhAnhChungChi("");
    setTenFileAnh("");
    setFeedback({ type: "success", message: "Đã thêm chứng chỉ vào danh sách hồ sơ!" });
  };

  const handleRemoveCert = (index) => {
    setChungChiList(chungChiList.filter((_, i) => i !== index));
  };

  // Nộp đơn đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (!hoTen.trim() || !soDienThoai.trim() || !email.trim() || !chuyenMon.trim()) {
      setFeedback({ type: "error", message: "Vui lòng nhập đầy đủ Họ tên, Số điện thoại, Email và Chuyên môn!" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        loai,
        ho_ten: hoTen.trim(),
        so_dien_thoai: soDienThoai.trim(),
        email: email.trim(),
        chuyen_mon: chuyenMon.trim(),
        kinh_nghiem: kinhNghiem,
        khu_vuc: khuVuc,
        gia_theo_gio: Number(giaTheoGio) || 200000,
        mo_ta: moTa.trim(),
        hoc_vi_hoac_the_hinh: hocVi.trim() || (loai === "gia_su" ? "Cử nhân Đại học" : "Chứng chỉ Huấn luyện viên"),
        truong_tot_nghiep: truongTotNghiep.trim(),
        chung_chi: chungChiList.length > 0 ? chungChiList : [
          {
            ten_chung_chi: loai === "gia_su" ? "Chứng chỉ Nghiệp vụ Sư phạm / Bằng Đại học" : "Chứng chỉ Huấn Luyện Viên Thể Hình Cấp Quốc Gia",
            noi_cap: truongTotNghiep.trim() || "Đại học / Liên đoàn Thể hình",
            nam_cap: "2025"
          }
        ]
      };

      const res = await api.dangKyChuyenGia(payload);
      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || "Nộp hồ sơ thành công! Ban Quản Trị sẽ xem xét và phê duyệt sớm."
        });
        fetchExistingApps();
        if (onSuccess) onSuccess();
      } else {
        setFeedback({ type: "error", message: res.message || "Lỗi khi nộp hồ sơ." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Lỗi kết nối tới máy chủ." });
    } finally {
      setSubmitting(false);
    }
  };

  // Hủy hồ sơ đang chờ duyệt
  const handleCancelApplication = async (appId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy hồ sơ đăng ký này?")) return;
    try {
      const res = await api.huyHoSo(appId);
      if (res.success) {
        setFeedback({ type: "info", message: "Đã hủy đơn đăng ký thành công." });
        fetchExistingApps();
      } else {
        setFeedback({ type: "error", message: res.message });
      }
    } catch (e) {
      setFeedback({ type: "error", message: "Lỗi kết nối máy chủ" });
    }
  };

  if (!show) return null;

  // Kiểm tra xem hiện tại người dùng có đơn pending cho loại này không
  const pendingApp = existingApplications.find((app) => app.trang_thai === "pending" && app.loai === loai);
  const approvedApp = existingApplications.find((app) => app.trang_thai === "approved" && app.loai === loai);
  const rejectedApp = existingApplications.find((app) => app.trang_thai === "rejected" && app.loai === loai);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 10050 }}
    >
      <div
        className="modal-content neu-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--neu-bg)",
          color: "var(--text-main)",
          borderRadius: "26px",
          width: "95%",
          maxWidth: "700px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          border: "1px solid var(--border-color)",
          boxShadow: "16px 16px 36px var(--neu-shadow-dark), -16px -16px 36px var(--neu-shadow-light)",
          overflow: "hidden"
        }}
      >
        {/* Header Modal theo style Neumorphism */}
        <div
          style={{
            padding: "1.3rem 1.8rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border-color)",
            background: "var(--neu-bg)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "var(--neu-bg)",
                boxShadow: "4px 4px 10px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                color: "var(--primary)"
              }}
            >
              🎓
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.28rem",
                  fontWeight: 800,
                  color: "var(--text-main)",
                  letterSpacing: "-0.01em"
                }}
              >
                ĐĂNG KÝ GIA SƯ
              </h2>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Tham gia đội ngũ Gia Sư Học Tập & Huấn Luyện Viên PT uy tín
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neu-circle-btn"
            style={{
              width: "36px",
              height: "36px",
              fontSize: "1rem",
              color: "var(--text-muted)",
              boxShadow: "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)"
            }}
            title="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        {/* Body Container (Scrollable) */}
        <div
          style={{
            padding: "1.6rem 1.8rem",
            overflowY: "auto",
            flex: 1,
            background: "var(--neu-bg)"
          }}
        >
          {/* Feedback Alert theo style Neumorphic Card */}
          {feedback.message && (
            <div
              style={{
                padding: "0.9rem 1.2rem",
                borderRadius: "14px",
                marginBottom: "1.4rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                background: "var(--neu-bg)",
                boxShadow: "4px 4px 10px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)",
                border: `1px solid ${
                  feedback.type === "success"
                    ? "#10b981"
                    : feedback.type === "error"
                    ? "#ef4444"
                    : "#3b82f6"
                }`,
                color:
                  feedback.type === "success"
                    ? "#10b981"
                    : feedback.type === "error"
                    ? "#ef4444"
                    : "#3b82f6",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem"
              }}
            >
              <span>{feedback.type === "success" ? "✅" : feedback.type === "error" ? "⚠️" : "ℹ️"}</span>
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Neumorphic Segmented Tab Switcher (Khay rãnh chìm với 2 tab) */}
          <div
            style={{
              background: "var(--neu-bg)",
              boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
              borderRadius: "18px",
              padding: "6px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "1.6rem"
            }}
          >
            <button
              type="button"
              onClick={() => {
                setLoai("gia_su");
                setGiaTheoGio(200000);
              }}
              style={{
                padding: "0.85rem 0.6rem",
                borderRadius: "14px",
                border: loai === "gia_su" ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid transparent",
                background: loai === "gia_su" ? "var(--card-bg, #ffffff)" : "transparent",
                color: loai === "gia_su" ? "#10b981" : "var(--text-muted)",
                boxShadow:
                  loai === "gia_su"
                    ? "4px 4px 10px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)"
                    : "none",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.3rem",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>🎓</span>
              <span style={{ color: loai === "gia_su" ? "#10b981" : "var(--text-main)", fontWeight: 800, fontSize: "0.92rem" }}>
                GIA SƯ HỌC TẬP
              </span>
              <span style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--text-muted)" }}>
                Dạy kèm Toán, Tin học, Ngoại ngữ...
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoai("pt");
                setGiaTheoGio(250000);
              }}
              style={{
                padding: "0.85rem 0.6rem",
                borderRadius: "14px",
                border: loai === "pt" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid transparent",
                background: loai === "pt" ? "var(--card-bg, #ffffff)" : "transparent",
                color: loai === "pt" ? "#8b5cf6" : "var(--text-muted)",
                boxShadow:
                  loai === "pt"
                    ? "4px 4px 10px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)"
                    : "none",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.3rem",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>🏋️</span>
              <span style={{ color: loai === "pt" ? "#8b5cf6" : "var(--text-main)", fontWeight: 800, fontSize: "0.92rem" }}>
                HUẤN LUYỆN VIÊN (PT)
              </span>
              <span style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--text-muted)" }}>
                Kèm Gym, Thể hình, Dinh dưỡng...
              </span>
            </button>
          </div>

          {/* Pending Application State (Neumorphic Card) */}
          {pendingApp && (
            <div
              style={{
                background: "var(--neu-bg)",
                boxShadow: "6px 6px 14px var(--neu-shadow-dark), -6px -6px 14px var(--neu-shadow-light)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                borderRadius: "18px",
                padding: "1.5rem",
                marginBottom: "1.6rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#f59e0b", fontWeight: 800, fontSize: "1rem" }}>
                <span style={{ fontSize: "1.4rem" }}>⏳</span>
                <span>HỒ SƠ ĐANG CHỜ ADMIN PHÊ DUYỆT</span>
              </div>
              <p style={{ margin: "0.8rem 0", fontSize: "0.9rem", color: "var(--text-main)", lineHeight: 1.6 }}>
                Bạn đã nộp hồ sơ đăng ký <strong>{loai === "gia_su" ? "Gia Sư Học Tập" : "Huấn Luyện Viên PT"}</strong> vào ngày{" "}
                <strong>{new Date(pendingApp.createdAt).toLocaleDateString("vi-VN")}</strong>. Ban Quản Trị đang tiến hành thẩm định
                chứng chỉ và sẽ phản hồi sớm cho bạn!
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => handleCancelApplication(pendingApp._id)}
                  className="neu-btn"
                  style={{
                    padding: "0.55rem 1.2rem",
                    borderRadius: "12px",
                    background: "var(--neu-bg)",
                    color: "#ef4444",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)"
                  }}
                >
                  Hủy đơn đăng ký này
                </button>
              </div>
            </div>
          )}

          {/* Approved State (Neumorphic Card) */}
          {approvedApp && (
            <div
              style={{
                background: "var(--neu-bg)",
                boxShadow: "6px 6px 14px var(--neu-shadow-dark), -6px -6px 14px var(--neu-shadow-light)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "18px",
                padding: "1.5rem",
                marginBottom: "1.6rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#10b981", fontWeight: 800, fontSize: "1.05rem" }}>
                <span style={{ fontSize: "1.4rem" }}>🎉</span>
                <span>BẠN ĐÃ LÀ {loai === "gia_su" ? "GIA SƯ ĐÃ XÁC THỰC" : "HUẤN LUYỆN VIÊN ĐÃ XÁC THỰC"}!</span>
              </div>
              <p style={{ margin: "0.7rem 0 0 0", fontSize: "0.92rem", color: "var(--text-main)", lineHeight: 1.6 }}>
                Hồ sơ của bạn đã được Ban Quản Trị phê duyệt chính thức. Bạn đã có quyền nhận học viên và kết nối hỗ trợ trực tiếp trên hệ thống Life Planner.
              </p>
            </div>
          )}

          {/* Rejected Alert Notice */}
          {rejectedApp && !pendingApp && !approvedApp && (
            <div
              style={{
                background: "var(--neu-bg)",
                boxShadow: "4px 4px 10px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "16px",
                padding: "1.3rem",
                marginBottom: "1.5rem"
              }}
            >
              <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>⚠️</span>
                <span>Lần nộp hồ sơ trước chưa được duyệt:</span>
              </div>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.88rem", color: "var(--text-main)", lineHeight: 1.5 }}>
                Lý do: <em>"{rejectedApp.ly_do_tu_choi || "Chưa đạt tiêu chuẩn chứng chỉ"}"</em>. Bạn có thể hoàn thiện thông tin và nộp lại hồ sơ bên dưới.
              </p>
            </div>
          )}

          {/* FORM NỘP ĐƠN THEO STYLE NEUMORPHISM (Chỉ hiển thị khi chưa có đơn pending hoặc chưa approved) */}
          {!pendingApp && !approvedApp && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {/* Họ tên & Số điện thoại */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={hoTen}
                    onChange={(e) => setHoTen(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="form-control"
                    style={{
                      background: "var(--neu-bg)",
                      boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "14px",
                      padding: "10px 14px",
                      color: "var(--text-main)",
                      fontSize: "0.9rem",
                      width: "100%",
                      minWidth: 0,
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                    Số điện thoại liên hệ *
                  </label>
                  <input
                    type="tel"
                    required
                    value={soDienThoai}
                    onChange={(e) => setSoDienThoai(e.target.value)}
                    placeholder="0912345678"
                    className="form-control"
                    style={{
                      background: "var(--neu-bg)",
                      boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "14px",
                      padding: "10px 14px",
                      color: "var(--text-main)",
                      fontSize: "0.9rem",
                      width: "100%",
                      minWidth: 0,
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              {/* Chuyên môn & Mức giá */}
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                    {loai === "gia_su" ? "Môn học chuyên môn giảng dạy *" : "Thế mạnh huấn luyện Gym *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={chuyenMon}
                    onChange={(e) => setChuyenMon(e.target.value)}
                    placeholder={
                      loai === "gia_su" ? "Ví dụ: Toán Cao Cấp, Lập trình Web..." : "Ví dụ: Tăng cơ, Giảm mỡ, Calisthenics..."
                    }
                    className="form-control"
                    style={{
                      background: "var(--neu-bg)",
                      boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "14px",
                      padding: "10px 14px",
                      color: "var(--text-main)",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                    Học phí dự kiến (đ/giờ)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={giaTheoGio}
                    onChange={(e) => setGiaTheoGio(e.target.value)}
                    className="form-control"
                    style={{
                      background: "var(--neu-bg)",
                      boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "14px",
                      padding: "10px 14px",
                      color: "var(--text-main)",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>
              </div>

              {/* Kinh nghiệm & Khu vực */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                    Kinh nghiệm làm việc
                  </label>
                  <select
                    value={kinhNghiem}
                    onChange={(e) => setKinhNghiem(e.target.value)}
                    className="form-control"
                    style={{
                      background: "var(--neu-bg)",
                      boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "14px",
                      padding: "10px 14px",
                      color: "var(--text-main)",
                      fontSize: "0.9rem",
                      cursor: "pointer"
                    }}
                  >
                    <option value="Dưới 1 năm kinh nghiệm">Dưới 1 năm kinh nghiệm</option>
                    <option value="1-2 năm kinh nghiệm">1-2 năm kinh nghiệm</option>
                    <option value="3-5 năm kinh nghiệm">3-5 năm kinh nghiệm</option>
                    <option value="Trên 5 năm chuyên nghiệp">Trên 5 năm chuyên nghiệp</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                    Khu vực giảng dạy / Kèm cặp
                  </label>
                  <input
                    type="text"
                    value={khuVuc}
                    onChange={(e) => setKhuVuc(e.target.value)}
                    placeholder="Ví dụ: Online toàn quốc / TP.HCM / Hà Nội..."
                    className="form-control"
                    style={{
                      background: "var(--neu-bg)",
                      boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "14px",
                      padding: "10px 14px",
                      color: "var(--text-main)",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>
              </div>

              {/* Bằng cấp & Trường tốt nghiệp */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                    {loai === "gia_su" ? "Học vị / Trình độ cao nhất" : "Chứng chỉ chuyên môn PT"}
                  </label>
                  <input
                    type="text"
                    value={hocVi}
                    onChange={(e) => setHocVi(e.target.value)}
                    placeholder={loai === "gia_su" ? "Cử nhân / Thạc sĩ..." : "HLV Cấp Quốc Gia / NASM / ACE..."}
                    className="form-control"
                    style={{
                      background: "var(--neu-bg)",
                      boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "14px",
                      padding: "10px 14px",
                      color: "var(--text-main)",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                    Trường Đào Tạo / Đơn Vị Công Tác
                  </label>
                  <input
                    type="text"
                    value={truongTotNghiep}
                    onChange={(e) => setTruongTotNghiep(e.target.value)}
                    placeholder="Ví dụ: Đại học Bách Khoa / ĐH Sư Phạm..."
                    className="form-control"
                    style={{
                      background: "var(--neu-bg)",
                      boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "14px",
                      padding: "10px 14px",
                      color: "var(--text-main)",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>
              </div>

              {/* Lời giới thiệu */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                  Giới thiệu phương pháp giảng dạy & định hướng học tập
                </label>
                <textarea
                  rows={3}
                  value={moTa}
                  onChange={(e) => setMoTa(e.target.value)}
                  placeholder="Chia sẻ về phong cách dạy, phương pháp hướng dẫn, sự tận tâm và cam kết kết quả học tập..."
                  className="form-control"
                  style={{
                    background: "var(--neu-bg)",
                    boxShadow: "inset 3px 3px 6px var(--neu-inset-dark), inset -3px -3px 6px var(--neu-inset-light)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "14px",
                    padding: "10px 14px",
                    color: "var(--text-main)",
                    fontSize: "0.9rem",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Mục Thêm Chứng Chỉ Minh Họa (Neumorphic Recessed Well) */}
              <div
                style={{
                  background: "var(--neu-bg)",
                  boxShadow: "inset 3px 3px 8px var(--neu-inset-dark), inset -3px -3px 8px var(--neu-inset-light)",
                  padding: "1.2rem 1.4rem",
                  borderRadius: "18px",
                  border: "1px dashed var(--border-color)",
                  width: "100%",
                  boxSizing: "border-box"
                }}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>📜</span>
                  <span>ĐÍNH KÈM CHỨNG CHỈ XÁC THỰC (ADMIN SẼ KIỂM DUYỆT)</span>
                </div>

                {/* Khung nhập 3 hàng thông minh, hỗ trợ đính kèm ảnh chụp chứng chỉ */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", boxSizing: "border-box" }}>
                  {/* Hàng 1: Tên chứng chỉ rộng rãi toàn chiều ngang */}
                  <div style={{ width: "100%", minWidth: 0 }}>
                    <input
                      type="text"
                      placeholder="Tên chứng chỉ / Bằng cấp (Ví dụ: IELTS 8.0, Bằng Sư Phạm, HLV Thể Hình...)"
                      value={tenChungChi}
                      onChange={(e) => setTenChungChi(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCert())}
                      style={{
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: "var(--neu-bg)",
                        boxShadow: "inset 2px 2px 5px var(--neu-inset-dark), inset -2px -2px 5px var(--neu-inset-light)",
                        color: "var(--text-main)",
                        border: "1px solid var(--border-color)",
                        fontSize: "0.88rem",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Hàng 2: Nơi cấp + Năm cấp */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 1fr",
                      gap: "0.75rem",
                      alignItems: "center",
                      width: "100%",
                      boxSizing: "border-box"
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Nơi cấp (ĐH Sư Phạm, IDP, NASM...)"
                      value={noiCap}
                      onChange={(e) => setNoiCap(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCert())}
                      style={{
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: "var(--neu-bg)",
                        boxShadow: "inset 2px 2px 5px var(--neu-inset-dark), inset -2px -2px 5px var(--neu-inset-light)",
                        color: "var(--text-main)",
                        border: "1px solid var(--border-color)",
                        fontSize: "0.88rem",
                        outline: "none"
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Năm cấp (Ví dụ: 2024)"
                      value={namCap}
                      onChange={(e) => setNamCap(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCert())}
                      style={{
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: "var(--neu-bg)",
                        boxShadow: "inset 2px 2px 5px var(--neu-inset-dark), inset -2px -2px 5px var(--neu-inset-light)",
                        color: "var(--text-main)",
                        border: "1px solid var(--border-color)",
                        fontSize: "0.88rem",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Hàng 3: Chọn file ảnh chụp chứng chỉ + Nút Thêm vào danh sách */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.8rem",
                      flexWrap: "wrap",
                      paddingTop: "0.2rem"
                    }}
                  >
                    {/* Hidden input file */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{ display: "none" }}
                    />

                    {/* Vùng ảnh chứng chỉ đang chọn */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      {!hinhAnhChungChi ? (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "10px",
                            background: "var(--neu-bg)",
                            color: "var(--primary)",
                            border: "1px solid var(--border-color)",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            boxShadow: "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)",
                            transition: "all 0.2s"
                          }}
                          title="Tải lên ảnh chụp bằng cấp, chứng chỉ hoặc giấy khen"
                        >
                          <span style={{ fontSize: "1rem" }}>📷</span>
                          <span>Đính kèm ảnh chụp chứng chỉ</span>
                        </button>
                      ) : (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            background: "var(--card-bg, #ffffff)",
                            padding: "5px 10px",
                            borderRadius: "12px",
                            border: "1px solid rgba(16, 185, 129, 0.4)",
                            boxShadow: "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)"
                          }}
                        >
                          <img
                            src={hinhAnhChungChi}
                            alt="Preview"
                            onClick={() => setPreviewModalImg({ url: hinhAnhChungChi, title: tenChungChi || "Ảnh chụp chứng chỉ" })}
                            style={{
                              width: "36px",
                              height: "36px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              cursor: "zoom-in",
                              border: "1px solid var(--border-color)"
                            }}
                            title="Click để phóng to ảnh xem thử"
                          />
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#10b981", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              ✓ Đã đính kèm ảnh
                            </span>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {tenFileAnh || "Ảnh chứng chỉ"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setHinhAnhChungChi("");
                              setTenFileAnh("");
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#ef4444",
                              fontWeight: 800,
                              cursor: "pointer",
                              padding: "2px 6px",
                              fontSize: "0.95rem"
                            }}
                            title="Hủy chọn ảnh này"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Nút Thêm Vào Hồ Sơ */}
                    <button
                      type="button"
                      onClick={handleAddCert}
                      style={{
                        padding: "9px 20px",
                        borderRadius: "12px",
                        background: "var(--primary)",
                        color: "#fff",
                        border: "none",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        boxShadow: "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <span>➕</span>
                      <span>Thêm Vào Danh Sách</span>
                    </button>
                  </div>
                </div>

                {/* Danh sách chứng chỉ đã thêm (Neumorphic Pills) */}
                {chungChiList.length > 0 && (
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "1.1rem" }}>
                    {chungChiList.map((cc, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "var(--card-bg, #ffffff)",
                          boxShadow: "3px 3px 7px var(--neu-shadow-dark), -3px -3px 7px var(--neu-shadow-light)",
                          color: "var(--text-main)",
                          border: "1px solid var(--border-color)",
                          padding: "0.4rem 0.8rem",
                          borderRadius: "12px",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.55rem"
                        }}
                      >
                        {cc.hinh_anh ? (
                          <img
                            src={cc.hinh_anh}
                            alt="Thumb"
                            onClick={() => setPreviewModalImg({ url: cc.hinh_anh, title: cc.ten_chung_chi })}
                            style={{
                              width: "26px",
                              height: "26px",
                              objectFit: "cover",
                              borderRadius: "6px",
                              cursor: "zoom-in",
                              border: "1px solid var(--border-color)"
                            }}
                            title="Click để phóng to xem ảnh chứng chỉ này"
                          />
                        ) : (
                          <span style={{ fontSize: "1rem", color: "var(--primary)" }}>📜</span>
                        )}
                        <span>
                          <strong style={{ color: "var(--primary)" }}>{cc.ten_chung_chi}</strong>
                          {cc.noi_cap && ` • ${cc.noi_cap}`} ({cc.nam_cap})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCert(idx)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            padding: "0 2px"
                          }}
                          title="Xóa chứng chỉ này"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer theo style Neumorphism */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.6rem" }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  style={{
                    padding: "0.65rem 1.6rem",
                    borderRadius: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "4px 4px 10px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)"
                  }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    padding: "0.65rem 1.8rem",
                    borderRadius: "14px",
                    border: "none",
                    background:
                      loai === "gia_su"
                        ? "linear-gradient(135deg, #10b981, #059669)"
                        : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow:
                      loai === "gia_su"
                        ? "6px 6px 16px rgba(16, 185, 129, 0.4), -3px -3px 8px var(--neu-shadow-light)"
                        : "6px 6px 16px rgba(139, 92, 246, 0.4), -3px -3px 8px var(--neu-shadow-light)"
                  }}
                >
                  {submitting ? "⏳ Đang gửi hồ sơ..." : "🚀 Nộp Hồ Sơ Đăng Ký"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* LIGHTBOX PHÓNG TO XEM ẢNH CHỨNG CHỈ */}
      {previewModalImg && (
        <div
          onClick={() => setPreviewModalImg(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100060,
            cursor: "zoom-out",
            padding: "20px",
            boxSizing: "border-box"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--modal-bg)",
              borderRadius: "20px",
              padding: "1.4rem",
              maxWidth: "680px",
              width: "92%",
              border: "1px solid var(--border-color)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
          >
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>📷</span>
                <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)" }}>
                  {previewModalImg.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="neu-circle-btn"
                style={{ width: "34px", height: "34px", fontSize: "0.9rem", cursor: "pointer" }}
                title="Đóng ảnh"
              >
                ✕
              </button>
            </div>
            <div style={{ width: "100%", maxHeight: "65vh", overflow: "auto", borderRadius: "12px", border: "1px solid var(--border-color)", background: "rgba(0,0,0,0.05)" }}>
              <img
                src={previewModalImg.url}
                alt={previewModalImg.title}
                style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
