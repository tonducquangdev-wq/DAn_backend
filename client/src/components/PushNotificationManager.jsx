import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  isPushNotificationSupported,
  getExistingPushSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
} from "../services/pushNotificationClient";

export const PushNotificationManager = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [permissionState, setPermissionState] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );

  const isIOS =
    typeof window !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent);

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true);

  const checkStatus = async () => {
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(Notification.permission);
    }

    if (supported) {
      try {
        const sub = await getExistingPushSubscription();
        setIsSubscribed(!!sub);
      } catch (err) {
        console.warn("Lỗi kiểm tra subscription:", err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleToggleSubscribe = async () => {
    setMessage({ type: "", text: "" });
    setOperating(true);

    try {
      if (isSubscribed) {
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setIsSubscribed(false);
          setMessage({
            type: "success",
            text: "Đã hủy đăng ký nhận thông báo đẩy trên thiết bị này."
          });
        } else {
          setMessage({
            type: "error",
            text: "Không thể hủy đăng ký thông báo. Vui lòng thử lại."
          });
        }
      } else {
        const res = await subscribeToPushNotifications();
        if (res.success) {
          setIsSubscribed(true);
          setPermissionState(
            typeof window !== "undefined" && "Notification" in window
              ? Notification.permission
              : "granted"
          );
          setMessage({
            type: "success",
            text: "🎉 Tuyệt vời! Thiết bị này đã sẵn sàng nhận thông báo đẩy ra màn hình khóa như ứng dụng Native."
          });
        } else {
          setMessage({
            type: "error",
            text: res.message || "Không thể đăng ký thông báo."
          });
        }
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Lỗi khi kích hoạt thông báo đẩy."
      });
      if (typeof window !== "undefined" && "Notification" in window) {
        setPermissionState(Notification.permission);
      }
    } finally {
      setOperating(false);
    }
  };

  const handleTestPush = async () => {
    setMessage({ type: "", text: "" });
    setTesting(true);
    try {
      const res = await api.sendTestPush();
      if (res.success) {
        setMessage({
          type: "success",
          text: "🚀 Đã phát tín hiệu thông báo! Hãy khóa màn hình điện thoại hoặc kiểm tra thanh thông báo ngay bây giờ."
        });
      } else {
        setMessage({
          type: "error",
          text: res.message || "Chưa thể gửi thông báo thử."
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "Lỗi gửi thông báo: " + err.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(139, 92, 246, 0.08))",
        border: "1px solid rgba(37, 99, 235, 0.25)",
        borderRadius: "18px",
        padding: "18px 20px",
        marginBottom: "20px"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.45rem",
              boxShadow: "0 4px 10px rgba(37, 99, 235, 0.3)",
              flexShrink: 0
            }}
          >
            📲
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: "0.96rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis" }}>
              Thông Báo Đẩy Điện Thoại (Native Web Push)
            </div>
            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
              Rung chuông và hiện ngoài màn hình khóa ngay cả khi tắt app
            </div>
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          {isSubscribed ? (
            <span
              style={{
                fontSize: "0.74rem",
                fontWeight: 800,
                color: "#10b981",
                background: "rgba(16, 185, 129, 0.15)",
                padding: "5px 12px",
                borderRadius: "12px",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                flexShrink: 0
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
              Đã Kích Hoạt
            </span>
          ) : (
            <span
              style={{
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                background: "rgba(0,0,0,0.06)",
                padding: "5px 12px",
                borderRadius: "12px",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0
              }}
            >
              Chưa Kích Hoạt
            </span>
          )}
        </div>
      </div>

      {/* Thông báo kết quả / lỗi */}
      {message.text && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "12px",
            fontSize: "0.8rem",
            fontWeight: "600",
            marginBottom: "14px",
            background:
              message.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            color: message.type === "success" ? "#10b981" : "#ef4444",
            border:
              message.type === "success"
                ? "1px solid rgba(16, 185, 129, 0.3)"
                : "1px solid rgba(239, 68, 68, 0.3)",
            lineHeight: "1.45"
          }}
        >
          {message.text}
        </div>
      )}

      {/* Cảnh báo quyền bị từ chối */}
      {permissionState === "denied" && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            padding: "10px 14px",
            fontSize: "0.78rem",
            color: "#dc2626",
            lineHeight: "1.45",
            marginBottom: "14px"
          }}
        >
          🚫 <b>Quyền thông báo đang bị chặn</b>: Bạn đã từng nhấn "Từ chối" trên trình duyệt. Để nhận thông báo, hãy vào Cài đặt trình duyệt (hoặc Cài đặt iPhone ➔ Safari ➔ Nâng cao / Quyền trang web) và chọn <b>Cho phép</b> nhận thông báo từ trang web này.
        </div>
      )}

      {/* Hướng dẫn riêng cho iPhone Safari khi mở ở tab thường */}
      {isIOS && !isStandalone && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "14px",
            padding: "12px 14px",
            fontSize: "0.78rem",
            color: "#b45309",
            lineHeight: "1.5",
            marginBottom: "14px"
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🍎</span>
            <span>Hướng dẫn kích hoạt thông báo trên iPhone (Bắt buộc theo chuẩn Apple)</span>
          </div>
          <div>
            1. Bấm nút <b>Chia sẻ</b> (biểu tượng ô vuông mũi tên lên 📤 ở đáy Safari).
            <br />
            2. Cuộn xuống và chọn <b>"Thêm vào Màn hình chính"</b> (Add to Home Screen).
            <br />
            3. Ra màn hình chính mở biểu tượng <b>Life Planner</b>, sau đó vào lại đây và bấm nút kích hoạt thông báo!
          </div>
        </div>
      )}

      {/* Hàng nút hành động */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          disabled={operating}
          onClick={handleToggleSubscribe}
          style={{
            background: isSubscribed
              ? "var(--neu-bg)"
              : "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: isSubscribed ? "#ef4444" : "#ffffff",
            border: isSubscribed ? "1px solid rgba(239, 68, 68, 0.4)" : "none",
            padding: "10px 18px",
            borderRadius: "12px",
            fontSize: "0.84rem",
            fontWeight: "700",
            cursor: operating ? "wait" : "pointer",
            boxShadow: isSubscribed ? "none" : "0 4px 12px rgba(37, 99, 235, 0.35)",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            transition: "all 0.2s ease"
          }}
        >
          <span>{operating ? "⏳" : isSubscribed ? "🔕" : "🔔"}</span>
          <span>
            {operating
              ? "Đang xử lý..."
              : isSubscribed
              ? "Tắt Thông Báo Trên Thiết Bị Này"
              : "Kích Hoạt Thông Báo Đẩy"}
          </span>
        </button>

        {isSubscribed && (
          <button
            type="button"
            disabled={testing}
            onClick={handleTestPush}
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#ffffff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "12px",
              fontSize: "0.84rem",
              fontWeight: "700",
              cursor: testing ? "wait" : "pointer",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              transition: "all 0.2s ease"
            }}
          >
            <span>{testing ? "⏳" : "🧪"}</span>
            <span>{testing ? "Đang gửi tín hiệu..." : "Bắn Thử Thông Báo Ra Màn Hình Khóa"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={checkStatus}
          title="Kiểm tra lại trạng thái kết nối"
          style={{
            background: "transparent",
            border: "1px solid var(--border-color)",
            color: "var(--text-muted)",
            padding: "9px 12px",
            borderRadius: "12px",
            fontSize: "0.8rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <span>🔄</span>
          <span>Kiểm tra lại</span>
        </button>
      </div>
    </div>
  );
};
