import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export const WorkoutCommunityChat = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const QUICK_CHIPS = [
    "💪 Cố lên anh em!",
    "🏋️ Hôm nay tập nhóm cơ nào thế?",
    "🔥 Buổi tập hôm nay cháy quá!",
    "🥗 Xin tips dinh dưỡng tăng cơ giảm mỡ",
    "🏆 Quyết tâm đạt mục tiêu tuần này!"
  ];

  const EMOJIS = ["💪", "🏋️", "🔥", "🏆", "🥗", "👏", "❤️", "💯", "🥇", "💥"];

  // Nạp danh sách tin nhắn
  const fetchMessages = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await api.getTinNhanTapLuyen("?limit=60");
      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data);
        if (isInitial) {
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (e) {
      console.error("Lỗi nạp tin nhắn tập luyện:", e);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const scrollToBottom = (behavior = "smooth") => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: behavior
      });
    }
  };

  // Khởi động vòng lặp polling khi mở cửa sổ chat
  useEffect(() => {
    if (isOpen) {
      fetchMessages(true);
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(false);
      }, 3500);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen]);

  // Gửi tin nhắn
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const res = await api.guiTinNhanTapLuyen({ noi_dung: text });
      if (res.success) {
        setInputText("");
        setShowEmojiPicker(false);
        setMessages((prev) => [...prev, res.data]);
        setTimeout(scrollToBottom, 50);
      }
    } catch (e) {
      console.error("Lỗi gửi tin nhắn:", e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Thả reaction
  const handleReaction = async (messageId, icon) => {
    try {
      const res = await api.reactTinNhanTapLuyen(messageId, icon);
      if (res.success && res.data) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? res.data : msg))
        );
      }
    } catch (e) {
      console.error("Lỗi thả cảm xúc:", e);
    }
  };

  // Xóa tin nhắn
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Bạn có chắc muốn xóa tin nhắn này không?")) return;
    try {
      const res = await api.xoaTinNhanTapLuyen(messageId);
      if (res.success) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
    } catch (e) {
      console.error("Lỗi xóa tin nhắn:", e);
    }
  };

  // Huy hiệu vai trò
  const renderRoleBadge = (msgUser) => {
    if (!msgUser) return null;
    if (msgUser.role === "admin") {
      return (
        <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#f59e0b", background: "rgba(245, 158, 11, 0.15)", padding: "1px 6px", borderRadius: "10px", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
          👑 Admin
        </span>
      );
    }
    if (msgUser.role === "pt" || msgUser.is_expert_verified) {
      return (
        <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#a78bfa", background: "rgba(139, 92, 246, 0.15)", padding: "1px 6px", borderRadius: "10px", border: "1px solid rgba(139, 92, 246, 0.3)" }}>
          🏋️ PT Pro
        </span>
      );
    }
    if (msgUser.role === "tutor") {
      return (
        <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#10b981", background: "rgba(16, 185, 129, 0.15)", padding: "1px 6px", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          🎓 Gia Sư
        </span>
      );
    }
    return (
      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", background: "rgba(0,0,0,0.06)", padding: "1px 6px", borderRadius: "10px" }}>
        Gymer
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="workout-chat-window"
      style={{
        position: "fixed",
        bottom: "104px",
        right: "32px",
        width: "380px",
        maxWidth: "calc(100vw - 32px)",
        height: "540px",
        maxHeight: "calc(100vh - 130px)",
        background: "var(--card-bg, #ffffff)",
        borderRadius: "26px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25), 0 4px 14px rgba(0, 0, 0, 0.1)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        zIndex: 10001,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        backdropFilter: "blur(14px)"
      }}
    >
      {/* 1. CHAT HEADER */}
      <div
        style={{
          padding: "14px 18px",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25))",
          borderBottom: "1px solid rgba(16, 185, 129, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
              boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)"
            }}
          >
            🏋️
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <h4 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)" }}>
                Kênh Chat Tổng Tập Luyện
              </h4>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px #10b981"
                }}
                title="Đang hoạt động"
              />
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Cộng đồng Gymer, HLV PT & Người tập
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: "var(--neu-bg)",
            border: "1px solid var(--border-color)",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          title="Thu nhỏ cửa sổ chat"
        >
          ✖
        </button>
      </div>

      {/* 2. CHAT BODY (DANH SÁCH TIN NHẮN) */}
      <div
        ref={chatBodyRef}
        style={{
          flex: 1,
          padding: "16px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          background: "var(--neu-bg)"
        }}
      >
        {loading && messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            ⏳ Đang nạp kênh trò chuyện cộng đồng...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "8px" }}>💬</span>
            Chưa có tin nhắn nào trong kênh tổng. Hãy là người mở lời đầu tiên để khuấy động phòng tập!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id?._id === user?._id || msg.user_id === user?._id;
            const senderName = msg.user_id?.name || "Người dùng";
            const firstLetter = senderName.charAt(0).toUpperCase();

            // Nhóm các reaction theo icon
            const reactionCounts = {};
            (msg.reactions || []).forEach((r) => {
              reactionCounts[r.icon] = (reactionCounts[r.icon] || 0) + 1;
            });

            return (
              <div
                key={msg._id}
                style={{
                  display: "flex",
                  flexDirection: isMe ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: "8px",
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: "88%"
                }}
              >
                {/* Avatar người gửi */}
                {!isMe && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #10b981, #3b82f6)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      flexShrink: 0,
                      marginBottom: "4px"
                    }}
                  >
                    {firstLetter}
                  </div>
                )}

                {/* Bong bóng tin nhắn */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  {/* Tên & Role người gửi (nếu không phải tin nhắn của tôi) */}
                  {!isMe && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", paddingLeft: "4px" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-main)" }}>
                        {senderName}
                      </span>
                      {renderRoleBadge(msg.user_id)}
                    </div>
                  )}

                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: isMe
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : "var(--card-bg, #ffffff)",
                      color: isMe ? "#ffffff" : "var(--text-main)",
                      fontSize: "0.88rem",
                      lineHeight: 1.45,
                      boxShadow: isMe
                        ? "0 4px 12px rgba(16, 185, 129, 0.35)"
                        : "3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)",
                      border: isMe ? "none" : "1px solid var(--border-color)",
                      wordBreak: "break-word",
                      position: "relative"
                    }}
                  >
                    {msg.noi_dung}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "6px",
                        marginTop: "4px",
                        fontSize: "0.68rem",
                        opacity: isMe ? 0.85 : 0.6
                      }}
                    >
                      <span>
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : ""}
                      </span>

                      {(isMe || user?.role === "admin") && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg._id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: isMe ? "#ffffff" : "#ef4444",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "0.7rem",
                            opacity: 0.7
                          }}
                          title="Xóa tin nhắn này"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reaction chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px", alignItems: "center" }}>
                    {Object.entries(reactionCounts).map(([icon, count]) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => handleReaction(msg._id, icon)}
                        style={{
                          background: "var(--card-bg)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "10px",
                          padding: "2px 6px",
                          fontSize: "0.7rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                        }}
                      >
                        <span>{icon}</span>
                        <strong style={{ color: "var(--text-main)" }}>{count}</strong>
                      </button>
                    ))}

                    {/* Nút thả reaction nhanh */}
                    <button
                      type="button"
                      onClick={() => handleReaction(msg._id, "💪")}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        opacity: 0.6,
                        padding: "2px"
                      }}
                      title="Thả cơ bắp 💪"
                    >
                      +💪
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReaction(msg._id, "🔥")}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        opacity: 0.6,
                        padding: "2px"
                      }}
                      title="Thả ngọn lửa 🔥"
                    >
                      +🔥
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. QUICK MOTIVATION CHIPS */}
      <div
        style={{
          padding: "6px 12px",
          background: "var(--card-bg)",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          whiteSpace: "nowrap"
        }}
      >
        {QUICK_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(chip)}
            style={{
              padding: "4px 10px",
              borderRadius: "14px",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              background: "rgba(16, 185, 129, 0.08)",
              color: "#10b981",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* 4. CHAT INPUT BAR */}
      <div
        style={{
          padding: "12px 14px",
          background: "var(--card-bg, #ffffff)",
          borderTop: "1px solid var(--border-color)",
          position: "relative"
        }}
      >
        {/* Emoji picker popup */}
        {showEmojiPicker && (
          <div
            style={{
              position: "absolute",
              bottom: "60px",
              left: "14px",
              background: "var(--card-bg)",
              borderRadius: "16px",
              padding: "8px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
              border: "1px solid var(--border-color)",
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              maxWidth: "240px",
              zIndex: 10
            }}
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setInputText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "8px"
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px"
            }}
            title="Thêm emoji thể hình"
          >
            💪
          </button>

          <input
            type="text"
            placeholder="Nhắn tin vào kênh tổng..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "16px",
              background: "var(--neu-bg)",
              border: "1px solid var(--border-color)",
              color: "var(--text-main)",
              fontSize: "0.88rem",
              outline: "none",
              boxShadow: "inset 2px 2px 5px var(--neu-inset-dark), inset -2px -2px 5px var(--neu-inset-light)"
            }}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "none",
              background: inputText.trim()
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "rgba(148, 163, 184, 0.3)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              cursor: inputText.trim() && !sending ? "pointer" : "not-allowed",
              boxShadow: inputText.trim() ? "0 4px 10px rgba(16, 185, 129, 0.4)" : "none",
              transition: "all 0.2s"
            }}
            title="Gửi tin nhắn (Enter)"
          >
            {sending ? "⏳" : "✈️"}
          </button>
        </form>
      </div>
    </div>
  );
};
