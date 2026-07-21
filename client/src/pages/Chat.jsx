import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import io from "socket.io-client";

const ENDPOINT = "http://localhost:5000";

// ─── Web Audio notification beep (no audio file needed) ───────────────────────
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Main tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);          // A5
    osc1.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.1); // C6
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Subtle harmony
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(660, ctx.currentTime);         // E5
    osc2.frequency.setValueAtTime(784, ctx.currentTime + 0.1);   // G5
    gain2.gain.setValueAtTime(0.12, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // AudioContext not supported — silent fallback
  }
}

// ─── Show browser (OS-level) notification ─────────────────────────────────────
function showBrowserNotification(senderName, messageContent, chatName) {
  if (Notification.permission !== "granted") return;
  const title = chatName ? `${chatName} • ${senderName}` : senderName;
  const notification = new Notification(title, {
    body: messageContent,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: "loopchat-msg",      // replaces any existing notification (no spam)
    renotify: true,
  });
  // Auto-close after 5 s
  setTimeout(() => notification.close(), 5000);
}

// ─── Reusable tick icon ───────────────────────────────────────────────────────
// tickState: 'sent' | 'delivered' | 'read'
function TickIcon({ tickState, size = 9 }) {
  // Colors chosen to harmonize with the blue bubble (#2563eb):
  //  sent      → single faint-white tick  (barely there, just confirms sent)
  //  delivered → double brighter-white    (clearly visible double tick)
  //  read      → double soft-cyan         (same color family as blue, clearly distinct)
  const SENT      = "rgba(255,255,255,0.38)";
  const DELIVERED = "rgba(255,255,255,0.82)";
  const READ      = "#67e8f9"; // cyan-300 — harmonious with blue, clearly stands out

  const isDouble = tickState !== "sent";
  const color    = tickState === "read" ? READ : tickState === "delivered" ? DELIVERED : SENT;
  const sw       = 2.5;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0, marginLeft: 2 }}>
      {isDouble ? (
        <svg viewBox="0 0 22 11" fill="none" width={size * 2} height={size}
             style={{ overflow: "visible" }}>
          <path d="M1 5.5L5.5 10L15 1" stroke={color} strokeWidth={sw}
                strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 5.5L11.5 10L21 1" stroke={color} strokeWidth={sw}
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 11" fill="none" width={size * 1.3} height={size}
             style={{ overflow: "visible" }}>
          <path d="M1 5.5L5.5 10L15 1" stroke={color} strokeWidth={sw}
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Sidebar search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Socket.io & UX state
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [localTyping, setLocalTyping] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Group chat modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groupCreating, setGroupCreating] = useState(false);

  const messagesEndRef = useRef(null);
  const selectedChatRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ─── Mark messages in chat as read ──────────────────────────────────────────
  const markChatAsRead = useCallback(async (chatId) => {
    if (!currentUser) return;
    try {
      await axios.put(
        `http://localhost:5000/api/message/${chatId}/read`,
        {},
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      socket?.emit("read messages", { chatId, readerId: currentUser.user._id });
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  }, [currentUser, socket]);

  // Sync ref with selectedChat for socket closures
  useEffect(() => {
    selectedChatRef.current = selectedChat;
    if (selectedChat) {
      setNotifications((prev) => prev.filter((n) => n.chat !== selectedChat._id));
      markChatAsRead(selectedChat._id);
    }
  }, [selectedChat, markChatAsRead]);

  // 1. Auth setup, load chats, and request notification permission
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      window.location.href = "/";
    } else {
      setCurrentUser(storedUser);
      fetchChats(storedUser.token);
    }

    // Ask for browser notification permission once on load
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // 2. Socket.io init
  useEffect(() => {
    if (!currentUser) return;
    const socketInstance = io(ENDPOINT);
    setSocket(socketInstance);
    socketInstance.emit("setup", currentUser.user._id);
    socketInstance.on("online users", (users) => setOnlineUsers(users));
    return () => socketInstance.disconnect();
  }, [currentUser]);

  // 3. Socket message & status handlers
  useEffect(() => {
    if (!socket) return;

    const handleReceivedMessage = (receivedMsg) => {
      const activeChat = selectedChatRef.current;
      const isTabVisible = document.visibilityState === "visible";
      const isActiveChat = activeChat && activeChat._id === receivedMsg.chat;

      if (isActiveChat) {
        setMessages((prev) => [...prev, receivedMsg]);
        markChatAsRead(receivedMsg.chat);
      } else {
        setNotifications((prev) => {
          if (prev.some((n) => n._id === receivedMsg._id)) return prev;
          return [...prev, receivedMsg];
        });
      }

      // Always update sidebar latest message & order
      setChats((prev) => {
        const updated = prev.map((c) =>
          c._id === receivedMsg.chat ? { ...c, latestMessage: receivedMsg } : c
        );
        return updated.sort((a, b) => (a._id === receivedMsg.chat ? -1 : b._id === receivedMsg.chat ? 1 : 0));
      });

      // 🔔 Trigger notification + sound when:
      //    - tab is not focused, OR
      //    - message is from a different chat
      if (!isTabVisible || !isActiveChat) {
        // Play sound
        playNotificationSound();

        // Show OS notification
        const sender = receivedMsg.sender;
        const senderName = typeof sender === "object" ? sender.name : "Someone";
        const chatName = activeChat?.isGroupChat ? activeChat.chatName : null;
        showBrowserNotification(senderName, receivedMsg.content, chatName);
      }
    };

    const handleMessagesRead = ({ chatId, readerId }) => {
      const activeChat = selectedChatRef.current;
      if (activeChat && activeChat._id === chatId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (!msg.readBy.includes(readerId)) {
              return { ...msg, readBy: [...msg.readBy, readerId] };
            }
            return msg;
          })
        );
      }

      // Update sidebar tick
      setChats((prev) =>
        prev.map((c) => {
          if (c._id === chatId && c.latestMessage) {
            const sender = c.latestMessage.sender;
            const senderId = typeof sender === "object" ? sender._id : sender;
            if (senderId !== readerId && !c.latestMessage.readBy.includes(readerId)) {
              return {
                ...c,
                latestMessage: {
                  ...c.latestMessage,
                  readBy: [...c.latestMessage.readBy, readerId],
                },
              };
            }
          }
          return c;
        })
      );
    };

    const handleTyping = (room) => {
      if (selectedChatRef.current?._id === room) setIsTyping(true);
    };
    const handleStopTyping = (room) => {
      if (selectedChatRef.current?._id === room) setIsTyping(false);
    };

    socket.on("receive message", handleReceivedMessage);
    socket.on("messages read", handleMessagesRead);
    socket.on("typing", handleTyping);
    socket.on("stop typing", handleStopTyping);

    return () => {
      socket.off("receive message", handleReceivedMessage);
      socket.off("messages read", handleMessagesRead);
      socket.off("typing", handleTyping);
      socket.off("stop typing", handleStopTyping);
    };
  }, [socket, markChatAsRead]);

  // 4. Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 5. Fetch chats
  const fetchChats = async (token) => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/chat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(data);
    } catch (err) {
      console.error("Error fetching chats:", err);
    }
  };

  // 6. Fetch messages
  const fetchMessages = async (chatId) => {
    if (!currentUser) return;
    try {
      const { data } = await axios.get(`http://localhost:5000/api/message/${chatId}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      setMessages(data);
      socket?.emit("join chat", chatId);
      markChatAsRead(chatId);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // 7. Sidebar user search (debounced)
  useEffect(() => {
    if (!currentUser) return;
    const searchUsers = async () => {
      if (!searchQuery.trim()) { setSearchResults([]); return; }
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/users?search=${searchQuery}`,
          { headers: { Authorization: `Bearer ${currentUser.token}` } }
        );
        setSearchResults(data);
      } catch (err) {
        console.error("Error searching users:", err);
      }
    };
    const t = setTimeout(searchUsers, 400);
    return () => clearTimeout(t);
  }, [searchQuery, currentUser]);

  // 8. Group modal user search (debounced)
  useEffect(() => {
    if (!currentUser || !groupSearch.trim()) { setGroupSearchResults([]); return; }
    const searchUsers = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/users?search=${groupSearch}`,
          { headers: { Authorization: `Bearer ${currentUser.token}` } }
        );
        setGroupSearchResults(data);
      } catch (err) {
        console.error("Error searching group users:", err);
      }
    };
    const t = setTimeout(searchUsers, 400);
    return () => clearTimeout(t);
  }, [groupSearch, currentUser]);

  // 9. Open 1-to-1 chat
  const handleSelectUser = async (userId) => {
    if (!currentUser) return;
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/chat",
        { userId },
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      if (!chats.some((c) => c._id === data._id)) {
        setChats((prev) => [data, ...prev]);
      }
      setSelectedChat(data);
      fetchMessages(data._id);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Error accessing chat:", err);
    }
  };

  // 10. Select existing chat
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat._id);
  };

  // 11. Typing handler
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !selectedChat) return;
    if (!localTyping) {
      setLocalTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop typing", selectedChat._id);
      setLocalTyping(false);
    }, 2000);
  };

  // 12. Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !currentUser) return;
    try {
      const content = newMessage;
      setNewMessage("");
      socket?.emit("stop typing", selectedChat._id);
      setLocalTyping(false);

      const { data } = await axios.post(
        "http://localhost:5000/api/message",
        { content, chatId: selectedChat._id },
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );

      setMessages((prev) => [...prev, data]);
      setChats((prev) => {
        const updated = prev.map((c) =>
          c._id === selectedChat._id ? { ...c, latestMessage: data } : c
        );
        return updated.sort((a, b) => (a._id === selectedChat._id ? -1 : b._id === selectedChat._id ? 1 : 0));
      });
      socket?.emit("send message", data);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // 13. Create group chat
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupMembers.length < 2) return;
    setGroupCreating(true);
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/chat/group",
        {
          name: groupName,
          users: selectedGroupMembers.map((u) => u._id),
        },
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      setChats((prev) => [data, ...prev]);
      setSelectedChat(data);
      fetchMessages(data._id);
      // Reset modal
      setShowGroupModal(false);
      setGroupName("");
      setGroupSearch("");
      setGroupSearchResults([]);
      setSelectedGroupMembers([]);
    } catch (err) {
      console.error("Error creating group:", err);
    } finally {
      setGroupCreating(false);
    }
  };

  // 14. Toggle member in group creation
  const toggleGroupMember = (user) => {
    if (selectedGroupMembers.some((m) => m._id === user._id)) {
      setSelectedGroupMembers((prev) => prev.filter((m) => m._id !== user._id));
    } else {
      setSelectedGroupMembers((prev) => [...prev, user]);
    }
  };

  // 15. Leave group
  const handleLeaveGroup = async () => {
    if (!selectedChat || !currentUser) return;
    if (!window.confirm(`Leave "${selectedChat.chatName}"?`)) return;
    try {
      await axios.put(
        "http://localhost:5000/api/chat/group/remove",
        { chatId: selectedChat._id, userId: currentUser.user._id },
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      setChats((prev) => prev.filter((c) => c._id !== selectedChat._id));
      setSelectedChat(null);
      setMessages([]);
    } catch (err) {
      console.error("Error leaving group:", err);
    }
  };

  // 16. Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // 17. Helpers
  const getRecipient = (chatUsers) => {
    if (!currentUser || !chatUsers) return {};
    return chatUsers[0]._id === currentUser.user._id ? chatUsers[1] : chatUsers[0];
  };

  const getChatName = (chat) => {
    if (!chat) return "";
    if (chat.isGroupChat) return chat.chatName;
    return getRecipient(chat.users)?.name || "Unknown";
  };

  const getChatAvatar = (chat) => {
    if (!chat) return "?";
    if (chat.isGroupChat) return "👥";
    return getRecipient(chat.users)?.name?.charAt(0).toUpperCase() || "?";
  };

  const isRecipientOnline = (chat) => {
    if (!chat || chat.isGroupChat) return false;
    return onlineUsers.includes(getRecipient(chat.users)?._id);
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ─── WhatsApp-style date label ───────────────────────────────────────────────
  const getDateLabel = (dateStr) => {
    const msgDate = new Date(dateStr);
    const today   = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth()    === b.getMonth()    &&
      a.getDate()     === b.getDate();

    if (sameDay(msgDate, today))     return "Today";
    if (sameDay(msgDate, yesterday)) return "Yesterday";

    const daysAgo = Math.floor((today - msgDate) / 86_400_000);
    if (daysAgo < 7) {
      return msgDate.toLocaleDateString([], { weekday: "long" }); // e.g. "Monday"
    }
    return msgDate.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
  };

  const isSameDay = (a, b) => {
    const da = new Date(a), db = new Date(b);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth()    === db.getMonth()    &&
      da.getDate()     === db.getDate()
    );
  };

  return (
    <>
      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowGroupModal(false); }}>
          <div className="modal-card">
            <h3 className="modal-title">✨ Create New Group</h3>

            <input
              className="modal-input"
              placeholder="Group name (e.g. Study Squad)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            {/* Member chips */}
            {selectedGroupMembers.length > 0 && (
              <div className="chips-container">
                {selectedGroupMembers.map((u) => (
                  <span key={u._id} className="member-chip">
                    {u.name}
                    <button className="chip-remove" onClick={() => toggleGroupMember(u)}>✕</button>
                  </span>
                ))}
              </div>
            )}

            <input
              className="modal-input"
              placeholder="Search users to add..."
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
            />

            {groupSearchResults.length > 0 && (
              <ul className="modal-user-list">
                {groupSearchResults.map((user) => {
                  const isSelected = selectedGroupMembers.some((m) => m._id === user._id);
                  return (
                    <li
                      key={user._id}
                      className={`modal-user-item ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleGroupMember(user)}
                    >
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>{user.name}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{user.email}</div>
                      </div>
                      {isSelected && (
                        <span style={{ marginLeft: "auto", color: "var(--accent)", fontSize: "0.9rem" }}>✓</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              {selectedGroupMembers.length} member{selectedGroupMembers.length !== 1 ? "s" : ""} selected
              {selectedGroupMembers.length < 2 && " — need at least 2"}
            </p>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowGroupModal(false)}>Cancel</button>
              <button
                className="btn-create"
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedGroupMembers.length < 2 || groupCreating}
              >
                {groupCreating ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Layout */}
      <div className="chat-container">
        {/* ===== SIDEBAR ===== */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <div className="user-profile">
              <div className="avatar avatar-online">
                {currentUser?.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="username">{currentUser?.user?.name || "..."}</div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="new-group-btn" onClick={() => setShowGroupModal(true)}>
                + Group
              </button>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>

          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Search or start new chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery("")}>✕</button>
              )}
            </div>
          </div>

          <div className="sidebar-list-container">
            {searchQuery ? (
              <>
                <div className="list-section-title">Search Results</div>
                <ul className="sidebar-list">
                  {searchResults.map((user) => (
                    <li key={user._id} className="sidebar-item" onClick={() => handleSelectUser(user._id)}>
                      <div className={`avatar ${onlineUsers.includes(user._id) ? "avatar-online" : ""}`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="item-details">
                        <div className="item-name">{user.name}</div>
                        <div className="item-msg" style={{ fontSize: "0.8rem" }}>{user.email}</div>
                      </div>
                    </li>
                  ))}
                  {searchResults.length === 0 && (
                    <div style={{ padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      No users found
                    </div>
                  )}
                </ul>
              </>
            ) : (
              <>
                <div className="list-section-title">Recent Chats</div>
                <ul className="sidebar-list">
                  {chats.map((chat) => {
                    const isSelected = selectedChat?._id === chat._id;
                    const chatNotifications = notifications.filter((n) => n.chat === chat._id);
                    const online = isRecipientOnline(chat);

                    return (
                      <li
                        key={chat._id}
                        className={`sidebar-item ${isSelected ? "active" : ""}`}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <div className={`avatar ${chat.isGroupChat ? "avatar-group" : online ? "avatar-online" : ""}`}>
                          {getChatAvatar(chat)}
                        </div>
                        <div className="item-details">
                          <div className="item-name-row">
                            <span className="item-name">
                              {getChatName(chat)}
                              {chat.isGroupChat && (
                                <span className="group-badge" style={{ marginLeft: "0.4rem" }}>Group</span>
                              )}
                            </span>
                            <span className="item-meta">{formatTime(chat.updatedAt)}</span>
                          </div>
                          <div className="item-subtext-row">
                            <span className="item-msg">
                              {chatNotifications.length > 0 ? (
                                <span style={{ color: "var(--accent)", fontWeight: "500" }}>
                                  {chatNotifications[chatNotifications.length - 1].content}
                                </span>
                              ) : chat.latestMessage ? (
                                (() => {
                                  const sender = chat.latestMessage.sender;
                                  const senderId = typeof sender === "object" ? sender._id : sender;
                                  const senderName = typeof sender === "object" ? sender.name : "User";
                                  const isMe = senderId === currentUser?.user?._id;
                                  const latestReadBy = chat.latestMessage.readBy || [];
                                  const sidebarIsRead = latestReadBy.some(
                                    (id) => (typeof id === "object" ? id._id : id) !== currentUser?.user?._id
                                  );
                                  const sidebarIsDelivered = !chat.isGroupChat && isRecipientOnline(chat);
                                  const sidebarTickState = sidebarIsRead ? "read" : sidebarIsDelivered ? "delivered" : "sent";
                                  return (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                      {isMe && !chat.isGroupChat && (
                                        <TickIcon tickState={sidebarTickState} size={8} />
                                      )}
                                      <span>{isMe ? "You" : senderName}: {chat.latestMessage.content}</span>
                                    </span>
                                  );
                                })()
                              ) : (
                                "No messages yet"
                              )}
                            </span>
                            {chatNotifications.length > 0 && (
                              <span className="notification-badge">{chatNotifications.length}</span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {chats.length === 0 && (
                    <div style={{ padding: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      No active chats. Search for a user to start chatting or create a group!
                    </div>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* ===== CHAT WINDOW ===== */}
        <div className="chat-window">
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="chat-header">
                <div className="chat-user-info">
                  <div className={`avatar ${selectedChat.isGroupChat ? "avatar-group" : isRecipientOnline(selectedChat) ? "avatar-online" : ""}`}>
                    {getChatAvatar(selectedChat)}
                  </div>
                  <div className="chat-user-details">
                    <span className="chat-user-name">{getChatName(selectedChat)}</span>
                    {selectedChat.isGroupChat ? (
                      <div className="group-members-list">
                        {selectedChat.users?.map((u) => {
                          const isAdmin = u._id === (
                            typeof selectedChat.groupAdmin === "object"
                              ? selectedChat.groupAdmin?._id
                              : selectedChat.groupAdmin
                          );
                          return (
                            <span key={u._id} className={`group-member-tag ${isAdmin ? "admin-tag" : ""}`}>
                              {isAdmin ? "👑 " : ""}{u.name}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      isTyping ? (
                        <div className="typing-status-indicator">
                          <span>typing</span>
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                        </div>
                      ) : (
                        <span className={`chat-user-status ${isRecipientOnline(selectedChat) ? "online" : ""}`}>
                          {isRecipientOnline(selectedChat) ? "online" : "offline"}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Leave group button (only shown for groups) */}
                {selectedChat.isGroupChat && (
                  <button className="leave-group-btn" onClick={handleLeaveGroup}>
                    Leave Group
                  </button>
                )}
              </div>

              {/* Messages pane */}
              <div className="messages-pane">
                {messages.map((msg, idx) => {
                  const senderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
                  const senderName = typeof msg.sender === "object" ? msg.sender.name : "User";
                  const isSentByMe = senderId === currentUser.user._id;

                  // ─── Tick logic (only for sent messages, 1-to-1 chats) ─────
                  const readBy = msg.readBy || [];
                  const isRead = readBy.some(
                    (id) => (typeof id === "object" ? id._id : id) !== currentUser.user._id
                  );
                  const recipient = !selectedChat.isGroupChat
                    ? getRecipient(selectedChat.users)
                    : null;
                  const isDelivered = recipient && onlineUsers.includes(recipient._id);

                  let tickState = "sent";      // single gray ✓
                  if (isRead) tickState = "read";           // double blue ✓✓
                  else if (isDelivered) tickState = "delivered"; // double gray ✓✓

                  // ─── Date separator ─────────────────────────────────────────
                  const showDateSep =
                    idx === 0 || !isSameDay(messages[idx - 1].createdAt, msg.createdAt);

                  return (
                    <>
                      {showDateSep && (
                        <div key={`date-${msg._id}`} className="date-separator">
                          <span className="date-separator-label">{getDateLabel(msg.createdAt)}</span>
                        </div>
                      )}
                      <div key={msg._id} className={`message-wrapper ${isSentByMe ? "sent" : "received"}`}>
                        <div className="message-bubble">
                          {/* Sender name in group chats */}
                          {selectedChat.isGroupChat && !isSentByMe && (
                            <div style={{ fontSize: "0.72rem", color: "#818cf8", fontWeight: 600, marginBottom: "0.25rem" }}>
                              {senderName}
                            </div>
                          )}
                          <div>{msg.content}</div>
                          <div className="message-info">
                            <span>{formatTime(msg.createdAt)}</span>
                            {/* WhatsApp-style ticks — sent messages in 1-to-1 chats only */}
                            {isSentByMe && !selectedChat.isGroupChat && (
                              <TickIcon tickState={tickState} size={9} />
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })}

                {/* Typing indicator bubble */}
                {isTyping && !selectedChat.isGroupChat && (
                  <div className="message-wrapper received">
                    <div className="message-bubble" style={{ display: "flex", gap: "4px", padding: "0.8rem 1rem", alignItems: "center" }}>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input pane */}
              <div className="input-pane">
                <form onSubmit={handleSendMessage} className="input-form">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder={selectedChat.isGroupChat ? `Message ${selectedChat.chatName}...` : "Type a message..."}
                    value={newMessage}
                    onChange={handleInputChange}
                  />
                  <button type="submit" className="send-button">
                    <svg viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="chat-placeholder">
              <div className="placeholder-icon">💬</div>
              <h3 className="placeholder-title">Select a chat to start looping</h3>
              <p style={{ maxWidth: "340px", fontSize: "0.95rem" }}>
                Choose a chat from the sidebar, search for someone to message, or click <strong style={{ color: "var(--accent-purple)" }}>+ Group</strong> to start a group conversation.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Chat;