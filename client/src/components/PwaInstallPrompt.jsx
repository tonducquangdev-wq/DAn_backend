import React, { useState, useEffect } from "react";

export const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra xem app đã được cài đặt (đang chạy ở chế độ standalone) chưa
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      return; // Đã cài đặt rồi thì không hiện prompt
    }

    // Kiểm tra xem người dùng đã bấm ẩn gần đây chưa (trong vòng 2 ngày)
    const dismissedAt = localStorage.getItem("pwa_prompt_dismissed");
    if (dismissedAt) {
      const diffHours = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (diffHours < 48) {
        return;
      }
    }

    // 2. Nhận diện thiết bị iOS (iPhone/iPad Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Đợi 4 giây sau khi vào trang mới hiển thị cho người dùng iOS
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    // 3. Sự kiện beforeinstallprompt cho Android (Chrome / Edge / Samsung Internet)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* BANNER GỢI Ý CÀI ĐẶT ỨNG DỤNG */}
      <div className="pwa-install-banner">
        <div className="pwa-banner-content">
          <div className="pwa-app-icon">
            <img src="/pwa-192x192.png" alt="Life Planner App Icon" width="46" height="46" />
          </div>
          <div className="pwa-app-text">
            <div className="pwa-app-title">Cài đặt Life Planner</div>
            <div className="pwa-app-desc">
              Trải nghiệm mượt mà, mở toàn màn hình và dùng nhanh như app native!
            </div>
          </div>
        </div>

        <div className="pwa-banner-actions">
          <button
            type="button"
            className="pwa-btn-dismiss"
            onClick={handleDismiss}
          >
            Để sau
          </button>
          <button
            type="button"
            className="pwa-btn-install"
            onClick={handleInstallClick}
          >
            <span>📲 Cài Đặt</span>
          </button>
        </div>
      </div>

      {/* MODAL HƯỚNG DẪN CÀI ĐẶT CHO IPHONE (IOS SAFARI) */}
      {showIOSGuide && (
        <div className="modal-overlay" onClick={() => setShowIOSGuide(false)} style={{ zIndex: 100000 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "380px",
              textAlign: "center",
              padding: "24px 20px",
              borderRadius: "22px"
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>🍎</div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "10px" }}>
              Cài đặt trên iPhone / iPad
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: "1.5", marginBottom: "18px" }}>
              Để thêm <b>Life Planner</b> ra Màn hình chính của iPhone:
            </p>

            <div style={{ textAlign: "left", fontSize: "0.85rem", background: "var(--neu-bg)", padding: "14px", borderRadius: "14px", marginBottom: "20px" }}>
              <div style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.2rem" }}>1️⃣</span>
                <span>Bấm vào nút <b>Chia sẻ</b> 📤 ở thanh dưới Safari</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.2rem" }}>2️⃣</span>
                <span>Cuộn xuống chọn <b>"Thêm vào MH chính"</b> (Add to Home Screen)</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ width: "100%", padding: "10px" }}
              onClick={() => {
                setShowIOSGuide(false);
                handleDismiss();
              }}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
