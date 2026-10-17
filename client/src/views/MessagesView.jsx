import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export const MessagesView = ({ initialPartnerId = null }) => {
  const { user } = useAuth();

  // Sub-tabs bên sidebar trái: 'chats' | 'friends' | 'tutors' | 'requests'
  const [activeSubTab, setActiveSubTab] = useState("chats");

  // Danh sách hội thoại gần đây
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Đối tác đang chat hiện tại
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Danh sách bạn bè & lời mời
  const [friendsList, setFriendsList] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ nhan: [], da_gui: [] });
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Danh sách gia sư / PT để chat trực tiếp
  const [expertList, setExpertList] = useState([]);
  const [loadingExperts, setLoadingExperts] = useState(false);

  // Modal tìm kiếm người dùng mới để kết bạn
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRole, setSearchRole] = useState("all");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Lọc tìm kiếm hội thoại nhanh
  const [chatSearch, setChatSearch] = useState("");

  // Refs cho polling & scroll
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const chatBodyRef = useRef(null);

  const EMOJIS = ["👍", "👋", "😊", "🔥", "🎓", "🏋️", "💪", "❤️", "👏", "💯", "🎉", "✨"];

  const QUICK_REPLIES_TUTOR = [
    "Chào Thầy/Cô, em muốn hỏi về lịch học ạ! 🎓",
    "Em muốn đăng ký học thử môn này có được không ạ?",
    "Thầy/Cô có nhận dạy vào buổi tối hoặc cuối tuần không?",
    "Học phí và tài liệu môn này như thế nào ạ?"
  ];

  const QUICK_REPLIES_FRIEND = [
    "Hôm nay có đi tập gym không ông ơi? 🏋️",
    "Tối nay rảnh học nhóm môn này không bạn?",
    "Làm xong bài tập chưa, chia sẻ mình xem với! 📝",
    "Cuối tuần này có kèo gì không anh em?"
  ];

  // 1. Nạp danh sách hội thoại
  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) setLoadingConversations(true);
      const res = await api.getHoiThoaiRieng();
      if (res.success && Array.isArray(res.data)) {
        setConversations(res.data);
      }
    } catch (err) {
      console.error("Lỗi nạp hội thoại:", err);
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  // 2. Nạp danh sách bạn bè & lời mời
  const fetchFriendsAndRequests = async () => {
    try {
      setLoadingFriends(true);
      const [resFriends, resReqs] = await Promise.all([
        api.getDanhSachBanBe(),
        api.getLoiMoiKetBan()
      ]);
      if (resFriends.success) {
        setFriendsList(resFriends.data || []);
      }
      if (resReqs.success && resReqs.data) {
        setFriendRequests(resReqs.data);
      }
    } catch (err) {
      console.error("Lỗi nạp bạn bè:", err);
    } finally {
      setLoadingFriends(false);
    }
  };

  // 3. Nạp danh sách Gia sư / PT
  const fetchExperts = async () => {
    try {
      setLoadingExperts(true);
      const res = await api.getGiaSu("");
      if (res.success && Array.isArray(res.data)) {
        setExpertList(res.data);
      }
    } catch (err) {
      console.error("Lỗi nạp danh sách chuyên gia:", err);
    } finally {
      setLoadingExperts(false);
    }
  };

  // 4. Nạp tin nhắn với đối tác đang chọn
  const fetchMessagesWithPartner = async (partnerId, isInitial = false) => {
    if (!partnerId) return;
    try {
      if (isInitial) setLoadingMessages(true);
      const res = await api.getTinNhanVoiNguoiDung(partnerId);
      if (res.success && res.data) {
        setMessages(res.data.messages || []);
        if (res.data.partner) {
          setSelectedPartner((prev) => ({
            ...(prev || {}),
            ...res.data.partner
          }));
        }
        if (isInitial || isNearBottomRef.current) {
          setTimeout(scrollToBottom, 60);
        }
      }
    } catch (err) {
      console.error("Lỗi nạp tin nhắn:", err);
    } finally {
      if (isInitial) setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChatScroll = () => {
    if (!chatBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 120;
  };

  // Load ban đầu
  useEffect(() => {
    fetchConversations();
    fetchFriendsAndRequests();
    fetchExperts();
  }, []);

  // Nếu có initialPartnerId truyền từ ngoài vào (ví dụ bấm nút "Nhắn tin cho Gia Sư")
  useEffect(() => {
    if (initialPartnerId) {
      handleSelectPartnerById(initialPartnerId);
    }
  }, [initialPartnerId]);

  // Vòng lặp polling tin nhắn khi đang mở chat với 1 người
  useEffect(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    if (selectedPartner?._id) {
      fetchMessagesWithPartner(selectedPartner._id, true);
      pollIntervalRef.current = setInterval(() => {
        fetchMessagesWithPartner(selectedPartner._id, false);
        fetchConversations(true);
      }, 3000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedPartner?._id]);

  // Chọn đối tác chat từ danh sách hội thoại
  const handleSelectConversation = (convo) => {
    setSelectedPartner({
      ...convo.partner,
      ...convo.partner_extra
    });
    setActiveSubTab("chats");
  };

  // Chọn đối tác chat từ User ID (từ danh sách bạn bè hoặc gia sư)
  const handleSelectPartnerById = async (partnerUserId, initialData = {}) => {
    if (!partnerUserId) return;
    setSelectedPartner({
      _id: partnerUserId,
      ...initialData
    });
    setActiveSubTab("chats");
  };

  // Gửi tin nhắn
  const handleSendMessage = async (customText) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || !selectedPartner?._id || sending) return;

    setSending(true);
    try {
      const res = await api.guiTinNhanRieng({
        recipient_id: selectedPartner._id,
        noi_dung: textToSend
      });
      if (res.success && res.data) {
        setInputText("");
        setShowEmojiPicker(false);
        setMessages((prev) => [...prev, res.data]);
        fetchConversations(true);
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
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

  // Xóa tin nhắn
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Bạn có chắc muốn xóa tin nhắn này không?")) return;
    try {
      const res = await api.xoaTinNhanRieng(msgId);
      if (res.success) {
        setMessages((prev) => prev.filter((m) => m._id !== msgId));
        fetchConversations(true);
      }
    } catch (err) {
      console.error("Lỗi xóa tin:", err);
    }
  };

  // Tìm kiếm người dùng mới để kết bạn
  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const params = `?q=${encodeURIComponent(searchQuery.trim())}&role=${searchRole}`;
      const res = await api.timKiemNguoiDung(params);
      if (res.success && Array.isArray(res.data)) {
        setSearchResults(res.data);
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm:", err);
    } finally {
      setSearching(false);
    }
  };

  // Gửi lời mời kết bạn
  const handleSendFriendRequest = async (targetUserId) => {
    try {
      const res = await api.guiLoiMoiKetBan(targetUserId);
      if (res.success) {
        alert(res.message || "Đã gửi lời mời kết bạn!");
        fetchFriendsAndRequests();
        handleSearchUsers();
      } else {
        alert(res.message || "Không thể gửi lời mời.");
      }
    } catch (err) {
      console.error("Lỗi gửi lời mời:", err);
    }
  };

  // Đồng ý kết bạn
  const handleAcceptFriendRequest = async (friendshipId) => {
    try {
      const res = await api.chapNhanLoiMoi(friendshipId);
      if (res.success) {
        fetchFriendsAndRequests();
        fetchConversations();
      }
    } catch (err) {
      console.error("Lỗi chấp nhận kết bạn:", err);
    }
  };

  // Từ chối / hủy lời mời
  const handleDeclineFriendRequest = async (friendshipId) => {
    try {
      const res = await api.tuChoiLoiMoi(friendshipId);
      if (res.success) {
        fetchFriendsAndRequests();
      }
    } catch (err) {
      console.error("Lỗi hủy lời mời:", err);
    }
  };

  // Hủy kết bạn
  const handleUnfriend = async (friendUserId, friendName) => {
    if (!window.confirm(`Bạn có chắc muốn hủy kết bạn với ${friendName || "người này"} không?`)) return;
    try {
      const res = await api.huyKetBan(friendUserId);
      if (res.success) {
        fetchFriendsAndRequests();
        fetchConversations();
      }
    } catch (err) {
      console.error("Lỗi hủy kết bạn:", err);
    }
  };

  // Render badge vai trò
  const renderRoleBadge = (u) => {
    if (!u) return null;
    if (u.role === "admin") {
      return (
        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#f59e0b", background: "rgba(245, 158, 11, 0.15)", padding: "2px 7px", borderRadius: "10px", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
          👑 Quản Trị Viên
        </span>
      );
    }
    if (u.role === "tutor") {
      return (
        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#10b981", background: "rgba(16, 185, 129, 0.15)", padding: "2px 7px", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          🎓 Gia Sư
        </span>
      );
    }
    if (u.role === "pt" || u.is_expert_verified) {
      return (
        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#8b5cf6", background: "rgba(139, 92, 246, 0.15)", padding: "2px 7px", borderRadius: "10px", border: "1px solid rgba(139, 92, 246, 0.3)" }}>
          🏋️ HLV PT
        </span>
      );
    }
    return (
      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", background: "rgba(0,0,0,0.06)", padding: "2px 7px", borderRadius: "10px" }}>
        👥 Bạn Bè
      </span>
    );
  };

  // Lọc danh sách hội thoại theo ô tìm kiếm
  const filteredConversations = conversations.filter((c) => {
    if (!chatSearch.trim()) return true;
    const name = c.partner?.name?.toLowerCase() || "";
    const email = c.partner?.email?.toLowerCase() || "";
    return name.includes(chatSearch.toLowerCase()) || email.includes(chatSearch.toLowerCase());
  });

  const totalIncomingRequests = friendRequests.nhan?.length || 0;

  return (
    <div
      className="messages-page-container"
      style={{
        display: "flex",
        height: "calc(100vh - 80px)",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "16px 20px 24px",
        gap: "20px",
        boxSizing: "border-box"
      }}
    >
      {/* ============================================================
          CỘT TRÁI: DANH SÁCH TRÒ CHUYỆN & BẠN BÈ (SIDEBAR)
          ============================================================ */}
      <div
        className="messages-sidebar"
        style={{
          width: "360px",
          minWidth: "320px",
          maxWidth: "380px",
          background: "var(--card-bg, #ffffff)",
          borderRadius: "24px",
          boxShadow: "var(--neu-shadow-outer)",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* Header Cột Trái */}
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid var(--border-color)",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.04), rgba(139, 92, 246, 0.04))"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.4rem" }}>💬</span>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                Tin Nhắn & Bạn Bè
              </h2>
            </div>
            <button
              onClick={() => {
                setSearchModalOpen(true);
                setSearchQuery("");
                setSearchResults([]);
              }}
              style={{
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                border: "none",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "14px",
                fontWeight: "700",
                fontSize: "0.78rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 4px 10px rgba(59, 130, 246, 0.3)"
              }}
              title="Tìm người dùng mới và gửi lời mời kết bạn"
            >
              <span>➕</span>
              <span>Kết Bạn</span>
            </button>
          </div>

          {/* Ô tìm kiếm nhanh */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Tìm bạn bè hoặc hội thoại..."
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                borderRadius: "14px",
                border: "1px solid var(--border-color)",
                background: "var(--neu-bg)",
                color: "var(--text-main)",
                fontSize: "0.82rem",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* 4 Sub-Tabs: Hội thoại | Bạn bè | Gia sư | Lời mời */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "4px",
              marginTop: "12px",
              background: "var(--neu-bg)",
              padding: "4px",
              borderRadius: "14px",
              boxShadow: "var(--neu-shadow-inset)"
            }}
          >
            <button
              onClick={() => setActiveSubTab("chats")}
              style={{
                padding: "6px 4px",
                borderRadius: "10px",
                border: "none",
                background: activeSubTab === "chats" ? "var(--card-bg, #ffffff)" : "transparent",
                color: activeSubTab === "chats" ? "var(--primary)" : "var(--text-muted)",
                fontWeight: activeSubTab === "chats" ? "800" : "600",
                fontSize: "0.74rem",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: activeSubTab === "chats" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
              }}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setActiveSubTab("friends")}
              style={{
                padding: "6px 4px",
                borderRadius: "10px",
                border: "none",
                background: activeSubTab === "friends" ? "var(--card-bg, #ffffff)" : "transparent",
                color: activeSubTab === "friends" ? "var(--primary)" : "var(--text-muted)",
                fontWeight: activeSubTab === "friends" ? "800" : "600",
                fontSize: "0.74rem",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: activeSubTab === "friends" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
              }}
            >
              👥 Bạn Bè ({friendsList.length})
            </button>
            <button
              onClick={() => setActiveSubTab("tutors")}
              style={{
                padding: "6px 4px",
                borderRadius: "10px",
                border: "none",
                background: activeSubTab === "tutors" ? "var(--card-bg, #ffffff)" : "transparent",
                color: activeSubTab === "tutors" ? "var(--primary)" : "var(--text-muted)",
                fontWeight: activeSubTab === "tutors" ? "800" : "600",
                fontSize: "0.74rem",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: activeSubTab === "tutors" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
              }}
            >
              🎓 Gia Sư
            </button>
            <button
              onClick={() => setActiveSubTab("requests")}
              style={{
                padding: "6px 4px",
                borderRadius: "10px",
                border: "none",
                background: activeSubTab === "requests" ? "var(--card-bg, #ffffff)" : "transparent",
                color: activeSubTab === "requests" ? "#ef4444" : "var(--text-muted)",
                fontWeight: activeSubTab === "requests" ? "800" : "600",
                fontSize: "0.74rem",
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative",
                boxShadow: activeSubTab === "requests" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
              }}
            >
              📬 Lời Mời
              {totalIncomingRequests > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: "2px",
                    background: "#ef4444",
                    color: "#ffffff",
                    borderRadius: "50%",
                    width: "14px",
                    height: "14px",
                    fontSize: "0.6rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800"
                  }}
                >
                  {totalIncomingRequests}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Nội dung danh sách theo Sub-Tab */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {/* TAB 1: DANH SÁCH HỘI THOẠI (CHATS) */}
          {activeSubTab === "chats" && (
            <div>
              {loadingConversations ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  ⏳ Đang tải danh sách tin nhắn...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "10px" }}>💬</span>
                  Chưa có cuộc trò chuyện nào gần đây. Hãy chọn bạn bè hoặc gia sư để bắt đầu nhắn tin!
                </div>
              ) : (
                filteredConversations.map((convo) => {
                  const isSelected = selectedPartner?._id === convo.partner?._id;
                  const firstChar = convo.partner?.name?.charAt(0)?.toUpperCase() || "U";
                  return (
                    <div
                      key={convo.partner?._id}
                      onClick={() => handleSelectConversation(convo)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "18px",
                        marginBottom: "8px",
                        cursor: "pointer",
                        background: isSelected
                          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(139, 92, 246, 0.12))"
                          : "transparent",
                        border: isSelected ? "1px solid rgba(59, 130, 246, 0.35)" : "1px solid transparent",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "var(--neu-bg)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Avatar */}
                      <div style={{ position: "relative" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "800",
                            fontSize: "1.1rem",
                            boxShadow: "0 4px 10px rgba(59, 130, 246, 0.25)"
                          }}
                        >
                          {firstChar}
                        </div>
                        {/* Chấm xanh online */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "1px",
                            right: "1px",
                            width: "11px",
                            height: "11px",
                            borderRadius: "50%",
                            background: "#10b981",
                            border: "2px solid #ffffff"
                          }}
                        />
                      </div>

                      {/* Chi tiết người chat & Tin cuối */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                          <span
                            style={{
                              fontWeight: "800",
                              fontSize: "0.9rem",
                              color: "var(--text-main)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "150px"
                            }}
                          >
                            {convo.partner?.name || "Người dùng"}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {convo.last_message?.createdAt
                              ? new Date(convo.last_message.createdAt).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })
                              : ""}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                          {renderRoleBadge(convo.partner)}
                          {convo.partner_extra?.mon_hoc && (
                            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              • {convo.partner_extra.mon_hoc}
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: convo.unread_count > 0 ? "var(--text-main)" : "var(--text-muted)",
                              fontWeight: convo.unread_count > 0 ? "700" : "400",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "180px"
                            }}
                          >
                            {convo.last_message?.noi_dung || "Chưa có tin nhắn"}
                          </span>

                          {convo.unread_count > 0 && (
                            <span
                              style={{
                                background: "#ef4444",
                                color: "#ffffff",
                                borderRadius: "10px",
                                padding: "1px 6px",
                                fontSize: "0.68rem",
                                fontWeight: "800"
                              }}
                            >
                              {convo.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: DANH SÁCH BẠN BÈ (FRIENDS) */}
          {activeSubTab === "friends" && (
            <div>
              {loadingFriends ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  ⏳ Đang tải danh sách bạn bè...
                </div>
              ) : friendsList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "10px" }}>👥</span>
                  Bạn chưa có người bạn nào. Hãy bấm nút <b>"➕ Kết Bạn"</b> ở trên để kết nối với mọi người nhé!
                </div>
              ) : (
                friendsList.map((item) => {
                  const friend = item.user;
                  const firstChar = friend?.name?.charAt(0)?.toUpperCase() || "F";
                  return (
                    <div
                      key={friend?._id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "18px",
                        background: "var(--neu-bg)",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        border: "1px solid var(--border-color)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "800",
                            fontSize: "1rem"
                          }}
                        >
                          {firstChar}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: "800", fontSize: "0.88rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {friend?.name}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {friend?.email}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => handleSelectPartnerById(friend._id, friend)}
                          style={{
                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                            border: "none",
                            color: "#ffffff",
                            padding: "6px 10px",
                            borderRadius: "10px",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                          title="Mở khung nhắn tin"
                        >
                          💬 Chat
                        </button>
                        <button
                          onClick={() => handleUnfriend(friend._id, friend.name)}
                          style={{
                            background: "transparent",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            color: "#ef4444",
                            padding: "6px 8px",
                            borderRadius: "10px",
                            fontSize: "0.75rem",
                            cursor: "pointer"
                          }}
                          title="Hủy kết bạn"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: DANH SÁCH GIA SƯ & PT (TUTORS) */}
          {activeSubTab === "tutors" && (
            <div>
              {loadingExperts ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  ⏳ Đang tải danh sách gia sư...
                </div>
              ) : expertList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Chưa có gia sư nào trong hệ thống.
                </div>
              ) : (
                expertList.map((gs) => {
                  const targetUserId = gs.user_id?._id || gs.user_id;
                  const firstChar = gs.ho_ten?.charAt(0)?.toUpperCase() || "T";
                  return (
                    <div
                      key={gs._id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "18px",
                        background: "var(--neu-bg)",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        border: "1px solid var(--border-color)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "800",
                            fontSize: "1rem"
                          }}
                        >
                          {firstChar}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: "800", fontSize: "0.88rem", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {gs.ho_ten}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: "700" }}>
                            🎓 {gs.mon_hoc_chuyen_mon}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleSelectPartnerById(targetUserId, {
                            name: gs.ho_ten,
                            role: "tutor",
                            mon_hoc: gs.mon_hoc_chuyen_mon,
                            gia_theo_gio: gs.gia_theo_gio
                          })
                        }
                        style={{
                          background: "linear-gradient(135deg, #10b981, #059669)",
                          border: "none",
                          color: "#ffffff",
                          padding: "6px 12px",
                          borderRadius: "10px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        💬 Nhắn Tin
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: LỜI MỜI KẾT BẠN (REQUESTS) */}
          {activeSubTab === "requests" && (
            <div>
              <div style={{ fontWeight: "800", fontSize: "0.82rem", color: "var(--text-main)", marginBottom: "8px" }}>
                📥 Lời Mời Đã Nhận ({friendRequests.nhan?.length || 0})
              </div>
              {friendRequests.nhan?.length === 0 ? (
                <div style={{ padding: "10px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Không có lời mời nào đang chờ bạn duyệt.
                </div>
              ) : (
                friendRequests.nhan.map((req) => (
                  <div
                    key={req._id}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "14px",
                      background: "var(--neu-bg)",
                      marginBottom: "8px",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "800", fontSize: "0.85rem", color: "var(--text-main)" }}>
                        {req.nguoi_gui?.name}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {req.nguoi_gui?.email}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => handleAcceptFriendRequest(req._id)}
                        style={{
                          background: "#10b981",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "5px 10px",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Đồng Ý
                      </button>
                      <button
                        onClick={() => handleDeclineFriendRequest(req._id)}
                        style={{
                          background: "transparent",
                          color: "#ef4444",
                          border: "1px solid rgba(239, 68, 68, 0.4)",
                          borderRadius: "8px",
                          padding: "5px 8px",
                          fontSize: "0.72rem",
                          cursor: "pointer"
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}

              <div style={{ fontWeight: "800", fontSize: "0.82rem", color: "var(--text-main)", marginTop: "18px", marginBottom: "8px" }}>
                📤 Lời Mời Đã Gửi Đi ({friendRequests.da_gui?.length || 0})
              </div>
              {friendRequests.da_gui?.length === 0 ? (
                <div style={{ padding: "10px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Bạn chưa gửi lời mời nào đang chờ.
                </div>
              ) : (
                friendRequests.da_gui.map((req) => (
                  <div
                    key={req._id}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "14px",
                      background: "var(--neu-bg)",
                      marginBottom: "8px",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "800", fontSize: "0.85rem", color: "var(--text-main)" }}>
                        {req.nguoi_nhan?.name}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Đang chờ phản hồi...
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeclineFriendRequest(req._id)}
                      style={{
                        background: "transparent",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        padding: "4px 8px",
                        fontSize: "0.72rem",
                        cursor: "pointer"
                      }}
                    >
                      Hủy Lời Mời
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          CỘT PHẢI: KHUNG TRÒ CHUYỆN 1-1 CHI TIẾT (MAIN CHAT AREA)
          ============================================================ */}
      <div
        className="messages-main-pane"
        style={{
          flex: 1,
          background: "var(--card-bg, #ffffff)",
          borderRadius: "24px",
          boxShadow: "var(--neu-shadow-outer)",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {!selectedPartner ? (
          /* Trạng thái chào mừng khi chưa chọn ai */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
              textAlign: "center"
            }}
          >
            <div
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "30px",
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
                marginBottom: "20px",
                boxShadow: "0 10px 25px rgba(59, 130, 246, 0.15)"
              }}
            >
              💬
            </div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px" }}>
              Chào mừng bạn đến với Kênh Trò Chuyện & Bạn Bè!
            </h3>
            <p style={{ maxWidth: "460px", color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: "1.6", marginBottom: "24px" }}>
              Hãy chọn một người bạn hoặc gia sư ở danh sách bên trái để bắt đầu trò chuyện riêng tư, trao đổi lịch học và kinh nghiệm rèn luyện.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={() => setActiveSubTab("tutors")}
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  color: "#ffffff",
                  padding: "10px 18px",
                  borderRadius: "14px",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>🎓</span> Nhắn Tin Với Gia Sư
              </button>
              <button
                onClick={() => {
                  setSearchModalOpen(true);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  border: "none",
                  color: "#ffffff",
                  padding: "10px 18px",
                  borderRadius: "14px",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>➕</span> Kết Bạn Mới
              </button>
            </div>
          </div>
        ) : (
          /* Khi đã chọn 1 đối tác chat */
          <>
            {/* Header Khung Chat */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid var(--border-color)",
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: "1.2rem",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
                  }}
                >
                  {selectedPartner.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "var(--text-main)" }}>
                      {selectedPartner.name}
                    </h3>
                    {renderRoleBadge(selectedPartner)}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{selectedPartner.email}</span>
                    {selectedPartner.mon_hoc && (
                      <span style={{ color: "#10b981", fontWeight: "700" }}>
                        • Môn: {selectedPartner.mon_hoc}
                      </span>
                    )}
                    {selectedPartner.gia_theo_gio && (
                      <span style={{ color: "#f59e0b", fontWeight: "700" }}>
                        • {selectedPartner.gia_theo_gio.toLocaleString()} đ/h
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action bên phải Header: Trạng thái & nút đóng */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "#10b981", fontWeight: "700" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                  Đang hoạt động
                </div>
                <button
                  onClick={() => setSelectedPartner(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: "4px 8px"
                  }}
                  title="Đóng hội thoại"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Khung Tin Nhắn (Body Stream) */}
            <div
              ref={chatBodyRef}
              onScroll={handleChatScroll}
              style={{
                flex: 1,
                padding: "20px 24px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                background: "var(--neu-bg)"
              }}
            >
              {loadingMessages && messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  ⏳ Đang tải tin nhắn...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "8px" }}>👋</span>
                  Hãy gửi lời chào đầu tiên đến <b>{selectedPartner.name}</b> để bắt đầu cuộc trò chuyện!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.nguoi_gui?._id === user?._id || msg.nguoi_gui === user?._id;
                  return (
                    <div
                      key={msg._id}
                      style={{
                        display: "flex",
                        flexDirection: isMe ? "row-reverse" : "row",
                        alignItems: "flex-end",
                        gap: "8px",
                        alignSelf: isMe ? "flex-end" : "flex-start",
                        maxWidth: "80%"
                      }}
                    >
                      {/* Bong bóng tin nhắn */}
                      <div
                        style={{
                          padding: "11px 16px",
                          borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                          background: isMe
                            ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                            : "var(--card-bg, #ffffff)",
                          color: isMe ? "#ffffff" : "var(--text-main)",
                          fontSize: "0.9rem",
                          lineHeight: 1.48,
                          boxShadow: isMe
                            ? "0 4px 14px rgba(37, 99, 235, 0.35)"
                            : "var(--neu-shadow-outer)",
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
                          {isMe && (
                            <span>{msg.da_doc ? "✓✓ Đã xem" : "✓ Đã gửi"}</span>
                          )}
                          {isMe && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg._id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#ffffff",
                                cursor: "pointer",
                                padding: 0,
                                fontSize: "0.68rem",
                                opacity: 0.7
                              }}
                              title="Xóa tin nhắn này"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Dải gợi ý tin nhắn nhanh (Quick Replies) */}
            <div
              style={{
                padding: "8px 20px",
                background: "var(--card-bg, #ffffff)",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                whiteSpace: "nowrap"
              }}
            >
              {(selectedPartner.role === "tutor" ? QUICK_REPLIES_TUTOR : QUICK_REPLIES_FRIEND).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "14px",
                    border: "1px solid var(--border-color)",
                    background: "var(--neu-bg)",
                    color: "var(--text-main)",
                    fontSize: "0.76rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.color = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.color = "var(--text-main)";
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Thanh Chọn Emoji Nhanh */}
            {showEmojiPicker && (
              <div
                style={{
                  padding: "8px 20px",
                  background: "var(--neu-bg)",
                  borderTop: "1px solid var(--border-color)",
                  display: "flex",
                  gap: "8px",
                  overflowX: "auto"
                }}
              >
                {EMOJIS.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + " " + emoji);
                      setShowEmojiPicker(false);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: "1.3rem",
                      cursor: "pointer",
                      padding: "4px 6px",
                      borderRadius: "8px"
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Khung Soạn Thảo Tin Nhắn */}
            <div
              style={{
                padding: "14px 20px",
                background: "var(--card-bg, #ffffff)",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}
            >
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={{
                  background: showEmojiPicker ? "rgba(59, 130, 246, 0.15)" : "var(--neu-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "9px 12px",
                  cursor: "pointer",
                  fontSize: "1.1rem"
                }}
                title="Chọn biểu tượng cảm xúc"
              >
                😊
              </button>

              <input
                type="text"
                placeholder={`Nhắn tin cho ${selectedPartner.name}... (Nhấn Enter để gửi)`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  padding: "12px 18px",
                  borderRadius: "20px",
                  border: "1px solid var(--border-color)",
                  background: "var(--neu-bg)",
                  color: "var(--text-main)",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxShadow: "var(--neu-shadow-inset)"
                }}
              />

              <button
                type="button"
                disabled={sending || !inputText.trim()}
                onClick={() => handleSendMessage()}
                style={{
                  padding: "12px 22px",
                  borderRadius: "20px",
                  background: !inputText.trim() || sending
                    ? "var(--neu-bg)"
                    : "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: !inputText.trim() || sending ? "var(--text-muted)" : "#ffffff",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "0.88rem",
                  cursor: !inputText.trim() || sending ? "not-allowed" : "pointer",
                  boxShadow: !inputText.trim() || sending ? "none" : "0 4px 14px rgba(37, 99, 235, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s"
                }}
              >
                <span>{sending ? "⏳" : "Gửi"}</span>
                <span>➔</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ============================================================
          MODAL TÌM KIẾM NGƯỜI DÙNG & GỬI LỜI MỜI KẾT BẠN
          ============================================================ */}
      {searchModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setSearchModalOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10002
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "560px",
              maxWidth: "94%",
              maxHeight: "85vh",
              background: "var(--card-bg, #ffffff)",
              borderRadius: "24px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(139, 92, 246, 0.06))"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.4rem" }}>👥</span>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "var(--text-main)" }}>
                  Tìm Bạn Bè & Chuyên Gia Mới
                </h3>
              </div>
              <button
                onClick={() => setSearchModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Search Inputs */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                <input
                  type="text"
                  placeholder="Nhập tên hoặc email người cần tìm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "14px",
                    border: "1px solid var(--border-color)",
                    background: "var(--neu-bg)",
                    color: "var(--text-main)",
                    fontSize: "0.88rem",
                    outline: "none"
                  }}
                />
                <button
                  onClick={handleSearchUsers}
                  disabled={searching}
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    border: "none",
                    color: "#ffffff",
                    padding: "10px 20px",
                    borderRadius: "14px",
                    fontWeight: "700",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  {searching ? "⏳ Tìm..." : "🔍 Tìm Kiếm"}
                </button>
              </div>

              {/* Lọc theo Role */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <span>Lọc vai trò:</span>
                {[
                  { value: "all", label: "Tất cả" },
                  { value: "user", label: "Sinh viên / Học viên" },
                  { value: "tutor", label: "Gia Sư" },
                  { value: "pt", label: "HLV Thể Hình PT" }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSearchRole(item.value)}
                    style={{
                      background: searchRole === item.value ? "rgba(59, 130, 246, 0.15)" : "transparent",
                      border: searchRole === item.value ? "1px solid #3b82f6" : "1px solid var(--border-color)",
                      color: searchRole === item.value ? "#3b82f6" : "var(--text-muted)",
                      padding: "3px 8px",
                      borderRadius: "10px",
                      fontSize: "0.75rem",
                      fontWeight: searchRole === item.value ? "700" : "500",
                      cursor: "pointer"
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", maxHeight: "380px" }}>
              {searching ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  ⏳ Đang tìm kiếm...
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Gõ từ khóa và bấm <b>"Tìm Kiếm"</b> để xem danh sách bạn bè và chuyên gia trong toàn bộ hệ thống.
                </div>
              ) : (
                searchResults.map((u) => {
                  const firstChar = u.name?.charAt(0)?.toUpperCase() || "U";
                  return (
                    <div
                      key={u._id}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "16px",
                        background: "var(--neu-bg)",
                        marginBottom: "10px",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "800",
                            fontSize: "1.1rem"
                          }}
                        >
                          {firstChar}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: "800", fontSize: "0.9rem", color: "var(--text-main)" }}>
                              {u.name}
                            </span>
                            {renderRoleBadge(u)}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {u.email}
                          </div>
                        </div>
                      </div>

                      {/* Các nút hành động dựa trên mối quan hệ */}
                      <div style={{ display: "flex", gap: "6px" }}>
                        {u.relation_status === "friend" ? (
                          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#10b981", padding: "6px 10px", background: "rgba(16, 185, 129, 0.15)", borderRadius: "10px" }}>
                            ✓ Bạn Bè
                          </span>
                        ) : u.relation_status === "pending_sent" ? (
                          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#f59e0b", padding: "6px 10px", background: "rgba(245, 158, 11, 0.15)", borderRadius: "10px" }}>
                            ⏳ Đã Gửi Lời Mời
                          </span>
                        ) : u.relation_status === "pending_received" ? (
                          <button
                            onClick={() => {
                              handleAcceptFriendRequest(u.friendship_id);
                              handleSearchUsers();
                            }}
                            style={{
                              background: "#10b981",
                              color: "#ffffff",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "10px",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            Đồng Ý Kết Bạn
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendFriendRequest(u._id)}
                            style={{
                              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                              color: "#ffffff",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "10px",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            ➕ Kết Bạn
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSearchModalOpen(false);
                            handleSelectPartnerById(u._id, u);
                          }}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-main)",
                            padding: "6px 10px",
                            borderRadius: "10px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          💬 Chat
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
