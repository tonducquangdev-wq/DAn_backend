import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export const DailyBriefingSettings = () => {
  const [enabled, setEnabled] = useState(false);
  const [briefingTime, setBriefingTime] = useState("07:00");
  const [todayEvents, setTodayEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const quickTimes = [
    { label: "06:30 Sáng", value: "06:30" },
    { label: "07:00 Sáng", value: "07:00" },
    { label: "07:30 Sáng", value: "07:30" },
    { label: "08:00 Sáng", value: "08:00" },
    { label: "20:00 Tối", value: "20:00" },
    { label: "21:30 Tối", value: "21:30" }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getDailyBriefingSettings();
      if (res.success && res.data) {
        setEnabled(!!res.data.enabled);
        setBriefingTime(res.data.time || "07:00");
        setTodayEvents(res.data.today_events || []);
      }
    } catch (err) {
      console.warn("Lỗi tải cài đặt daily briefing:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setMessage({ type: "", text: "" });
    setSaving(true);
    try {
      const res = await api.updateDailyBriefingSettings({
        enabled,
        time: briefingTime
      });
      if (res.success) {
        setMessage({
          type: "success",
          text: `✅ Đã lưu cài đặt! Hệ thống sẽ ${
            enabled ? `tự động gửi tóm tắt lịch trình lúc ${briefingTime} hàng ngày.` : "tắt thông báo tóm tắt lịch trình."
          }`
        });
      } else {
        setMessage({
          type: "error",
          text: res.message || "Không thể lưu cài đặt."
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "Lỗi lưu cấu hình: " + err.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestDailyPush = async () => {
    setMessage({ type: "", text: "" });
    setTesting(true);
    try {
      const res = await api.testDailyBriefing();
      if (res.success) {
        setMessage({
          type: "success",
          text: `🚀 ${res.message || "Đã gửi thử thông báo lịch trình hôm nay đến điện thoại!"}`
        });
      } else {
        setMessage({
          type: "error",
          text: res.message || "Chưa thể gửi thử thông báo."
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "Lỗi gửi thử thông báo lịch trình: " + err.message
      });
    } finally {
      setTesting(false);
    }
  };

  const getEventIcon = (category) => {
    switch (category) {
      case "hoc-tap":
        return "📚";
      case "tap-luyen":
        return "🏋️";
      case "deadline":
        return "⏰";
      case "cong-viec":
        return "💼";
      default:
        return "☕";
    }
  };

  const formatEventTime = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh"
    });
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.08))",
        border: "1px solid rgba(16, 185, 129, 0.25)",
        borderRadius: "18px",
        padding: "18px 20px",
        marginBottom: "20px"
      }}
    >
      {/* Header Card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "14px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.45rem",
              boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)",
              flexShrink: 0
            }}
          >
            🌅
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: "0.96rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis" }}>
              Thông Báo Tổng Hợp Sự Kiện Trong Ngày (Daily Digest)
            </div>
          </div>
        </div>

        {/* Trạng thái Bật/Tắt */}
        <label
          style={{
            cursor: "pointer",
            position: "relative",
            display: "inline-block",
            width: "48px",
            minWidth: "48px",
            height: "26px",
            margin: 0,
            flexShrink: 0
          }}
          title={enabled ? "Đang bật thông báo hàng ngày" : "Đang tắt thông báo hàng ngày"}
        >
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: "absolute",
              cursor: "pointer",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: enabled ? "#10b981" : "#cbd5e1",
              transition: "0.3s",
              borderRadius: "26px"
            }}
          >
            <span
              style={{
                position: "absolute",
                content: '""',
                height: "20px",
                width: "20px",
                left: enabled ? "25px" : "3px",
                bottom: "3px",
                backgroundColor: "white",
                transition: "0.3s",
                borderRadius: "50%",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
              }}
            />
          </span>
        </label>
      </div>

      {/* Thông báo kết quả / lỗi */}
      {message.text && (
        <div
          style={{
            padding: "9px 13px",
            borderRadius: "10px",
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
            lineHeight: "1.4"
          }}
        >
          {message.text}
        </div>
      )}

      {/* Khu vực cài đặt giờ giấc nếu tính năng được bật */}
      <div
        style={{
          background: "var(--neu-bg)",
          borderRadius: "14px",
          padding: "14px",
          border: "1px solid var(--border-color)",
          marginBottom: "14px",
          opacity: enabled ? 1 : 0.65,
          transition: "opacity 0.2s ease"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "12px"
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--text-main)" }}>
              ⏰ Chọn Khung Giờ Gửi Thông Báo Hàng Ngày
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="time"
              disabled={!enabled}
              value={briefingTime}
              onChange={(e) => setBriefingTime(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                background: "var(--card-bg)",
                color: "var(--text-main)",
                fontSize: "1rem",
                fontWeight: "700",
                letterSpacing: "1px",
                outline: "none",
                cursor: enabled ? "pointer" : "not-allowed"
              }}
            />
          </div>
        </div>

        {/* Các nút chọn nhanh khung giờ */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginRight: "4px" }}>
            Gợi ý nhanh:
          </span>
          {quickTimes.map((qt) => {
            const isSelected = briefingTime === qt.value;
            return (
              <button
                key={qt.value}
                type="button"
                disabled={!enabled}
                onClick={() => setBriefingTime(qt.value)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "0.74rem",
                  fontWeight: isSelected ? 800 : 600,
                  border: isSelected ? "1px solid #10b981" : "1px solid var(--border-color)",
                  background: isSelected ? "rgba(16, 185, 129, 0.2)" : "rgba(0,0,0,0.03)",
                  color: isSelected ? "#10b981" : "var(--text-main)",
                  cursor: enabled ? "pointer" : "not-allowed",
                  transition: "all 0.15s ease"
                }}
              >
                {qt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Xem trước sự kiện hôm nay (Live Preview) */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.02)",
          borderRadius: "12px",
          padding: "12px 14px",
          border: "1px dashed var(--border-color)",
          marginBottom: "14px"
        }}
      >
        <div
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "var(--text-main)",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            📋 Xem Trước Lịch Trình Hôm Nay ({todayEvents.length} sự kiện)
          </span>
          <button
            type="button"
            onClick={fetchSettings}
            style={{
              background: "none",
              border: "none",
              fontSize: "0.75rem",
              color: "var(--primary)",
              cursor: "pointer",
              fontWeight: 600,
              whiteSpace: "nowrap",
              flexShrink: 0,
              padding: "2px 6px"
            }}
          >
            🔄 Cập nhật
          </button>
        </div>

        {loading ? (
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "8px" }}>
            ⏳ Đang nạp sự kiện hôm nay...
          </div>
        ) : todayEvents.length === 0 ? (
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
            ✨ Hôm nay chưa có sự kiện nào. Thông báo sẽ gửi lời chúc ngày mới thảnh thơi và nhiều năng lượng!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {todayEvents.map((ev) => (
              <div
                key={ev._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "5px 10px",
                  borderRadius: "8px",
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                  fontSize: "0.76rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{getEventIcon(ev.loai_su_kien)}</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{ev.tieu_de}</span>
                </div>
                <div style={{ color: "#10b981", fontWeight: 700 }}>
                  {formatEventTime(ev.thoi_gian_bat_dau)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hàng nút hành động */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
        <button
          type="button"
          disabled={testing}
          onClick={handleTestDailyPush}
          style={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "#ffffff",
            border: "none",
            padding: "9px 16px",
            borderRadius: "12px",
            fontSize: "0.82rem",
            fontWeight: "700",
            cursor: testing ? "wait" : "pointer",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>{testing ? "⏳" : "🧪"}</span>
          <span>{testing ? "Đang gửi..." : "Bắn Thử Thông Báo Lịch Hôm Nay"}</span>
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#ffffff",
            border: "none",
            padding: "9px 18px",
            borderRadius: "12px",
            fontSize: "0.82rem",
            fontWeight: "700",
            cursor: saving ? "wait" : "pointer",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>{saving ? "⏳" : "💾"}</span>
          <span>{saving ? "Đang lưu..." : "Lưu Cài Đặt Lịch Trình"}</span>
        </button>
      </div>
    </div>
  );
};
