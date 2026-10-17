import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";

export const NotificationCenterDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getThongBao();
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.error("Lỗi lấy danh sách thông báo:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.da_doc).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.markThongBaoRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, da_doc: true } : n))
      );
    } catch (e) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllThongBaoRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, da_doc: true })));
    } catch (e) {}
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.deleteThongBao(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (e) {}
  };

  const getLoaiBadge = (loai) => {
    switch (loai) {
      case "success":
        return { icon: "🎉", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
      case "warning":
        return { icon: "⚠️", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
      case "danger":
        return { icon: "🚨", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
      default:
        return { icon: "📢", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" };
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Chuông Thông Báo Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        style={{
          position: "relative",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "var(--neu-bg)",
          border: "1px solid var(--border-color)",
          color: "var(--text-main)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.1rem",
          cursor: "pointer",
          boxShadow: "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)",
          transition: "all 0.2s"
        }}
        title="Trung tâm thông báo"
      >
        <span>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "0.68rem",
              fontWeight: 800,
              borderRadius: "10px",
              minWidth: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)",
              padding: "0 4px"
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "46px",
            right: 0,
            width: "360px",
            maxWidth: "90vw",
            background: "var(--card-bg, #ffffff)",
            borderRadius: "20px",
            boxShadow: "0 14px 40px rgba(0, 0, 0, 0.2), 0 2px 10px rgba(0, 0, 0, 0.1)",
            border: "1px solid var(--border-color)",
            zIndex: 10000,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation: "fadeIn 0.2s ease",
            backdropFilter: "blur(12px)"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "1rem" }}>🔔</span>
              <strong style={{ fontSize: "0.92rem", color: "var(--text-main)" }}>Thông Báo</strong>
              {unreadCount > 0 && (
                <span style={{ fontSize: "0.72rem", background: "rgba(59, 130, 246, 0.15)", color: "#2563eb", padding: "2px 6px", borderRadius: "8px", fontWeight: 700 }}>
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3b82f6",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "2px 6px"
                }}
              >
                Đọc tất cả ✓
              </button>
            )}
          </div>

          {/* List items */}
          <div style={{ maxHeight: "360px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                ⏳ Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "6px" }}>📭</span>
                Bạn chưa có thông báo nào.
              </div>
            ) : (
              notifications.map((item) => {
                const badge = getLoaiBadge(item.loai);
                return (
                  <div
                    key={item._id}
                    onClick={() => !item.da_doc && handleMarkAsRead(item._id)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border-color)",
                      background: item.da_doc ? "transparent" : "rgba(59, 130, 246, 0.05)",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      position: "relative"
                    }}
                  >
                    <span
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: badge.bg,
                        color: badge.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                        flexShrink: 0
                      }}
                    >
                      {badge.icon}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                        <h5
                          style={{
                            margin: 0,
                            fontSize: "0.88rem",
                            fontWeight: item.da_doc ? 600 : 800,
                            color: "var(--text-main)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {item.tieu_de}
                        </h5>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, item._id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            padding: "0 2px",
                            opacity: 0.6
                          }}
                          title="Xóa thông báo này"
                        >
                          ✕
                        </button>
                      </div>

                      <p
                        style={{
                          margin: "4px 0 6px 0",
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}
                      >
                        {item.noi_dung}
                      </p>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        <span>{new Date(item.createdAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</span>
                        {!item.da_doc && (
                          <span style={{ color: "#3b82f6", fontWeight: 700 }}>Chưa đọc •</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
