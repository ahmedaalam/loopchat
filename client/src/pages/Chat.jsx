import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import io from "socket.io-client";
import LoopChatLogo from "../components/LoopChatLogo";

const ENDPOINT = "http://localhost:5000";

// ─── SVG Helper Icons ────────────────────────────────────────────────────────
function UsersIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CrownIcon({ size = 12, color = "#f59e0b" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ verticalAlign: "middle", marginRight: "4px" }}>
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 14h14v2H5v-2z" />
    </svg>
  );
}

function VideoIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function AudioIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function FileTextIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function CrossIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon({ size = 16, color = "var(--accent)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ZoomIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function DownloadIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function TrashIcon({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function ChevronDownIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ForwardIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 14 20 9 15 4" />
      <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
    </svg>
  );
}

// ─── Format Bytes Helper ──────────────────────────────────────────────────────
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// ─── Web Audio notification beep (no audio file needed) ───────────────────────
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.1);
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(660, ctx.currentTime);
    osc2.frequency.setValueAtTime(784, ctx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0.12, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // AudioContext not supported
  }
}

// ─── Show browser (OS-level) notification ─────────────────────────────────────
function showBrowserNotification(senderName, messageContent, chatName) {
  if (Notification.permission !== "granted") return;
  const title = chatName ? `${chatName} • ${senderName}` : senderName;
  const notification = new Notification(title, {
    body: messageContent || "Sent an attachment",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: "loopchat-msg",
    renotify: true,
  });
  setTimeout(() => notification.close(), 5000);
}

// ─── Reusable tick icon ───────────────────────────────────────────────────────
function TickIcon({ tickState, size = 9 }) {
  const SENT      = "rgba(255,255,255,0.38)";
  const DELIVERED = "rgba(255,255,255,0.82)";
  const READ      = "#67e8f9";

  const isDouble = tickState !== "sent";
  const color    = tickState === "read" ? READ : tickState === "delivered" ? DELIVERED : SENT;
  const sw       = 2.5;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0, marginLeft: 2 }}>
      {isDouble ? (
        <svg viewBox="0 0 22 11" fill="none" width={size * 2} height={size} style={{ overflow: "visible" }}>
          <path d="M1 5.5L5.5 10L15 1" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 5.5L11.5 10L21 1" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 11" fill="none" width={size * 1.3} height={size} style={{ overflow: "visible" }}>
          <path d="M1 5.5L5.5 10L15 1" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

// ─── Render File Attachment inside Chat Bubble ──────────────────────────────
function AttachmentView({ file, isSentByMe, onOpenLightbox, onToggleMenu, timeText, tickState, showTimeOverlay, isGroupChat }) {
  if (!file || !file.url) return null;
  const fullUrl = `http://localhost:5000${file.url}`;

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (onToggleMenu) onToggleMenu();
  };

  if (file.fileType === "image") {
    return (
      <div className="chat-media-image-wrapper" onClick={() => onOpenLightbox(file)} onDoubleClick={handleDoubleClick}>
        <img src={fullUrl} alt={file.fileName || "Image"} className="chat-media-image" />
        <div className="chat-media-hover-overlay">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            <ZoomIcon size={14} /> View Full
          </span>
        </div>
        {showTimeOverlay && (
          <div className="media-time-badge">
            <span>{timeText}</span>
            {isSentByMe && !isGroupChat && <TickIcon tickState={tickState} size={9} />}
          </div>
        )}
      </div>
    );
  }

  if (file.fileType === "video") {
    return (
      <div className="chat-media-video-wrapper" onDoubleClick={handleDoubleClick}>
        <video src={fullUrl} controls className="chat-media-video" />
        {showTimeOverlay && (
          <div className="media-time-badge">
            <span>{timeText}</span>
            {isSentByMe && !isGroupChat && <TickIcon tickState={tickState} size={9} />}
          </div>
        )}
      </div>
    );
  }

  if (file.fileType === "audio") {
    return (
      <div className="chat-media-audio-wrapper" onDoubleClick={handleDoubleClick}>
        <audio src={fullUrl} controls className="chat-media-audio" />
        {showTimeOverlay && (
          <div className="media-time-badge inline-badge">
            <span>{timeText}</span>
            {isSentByMe && !isGroupChat && <TickIcon tickState={tickState} size={9} />}
          </div>
        )}
      </div>
    );
  }

  // Fallback / Document Card (PDF, ZIP, DOCX, TXT)
  return (
    <div className={`chat-doc-card ${isSentByMe ? "sent-doc" : "received-doc"}`} onDoubleClick={handleDoubleClick}>
      <div className="doc-icon-container">
        <FileTextIcon size={24} />
      </div>
      <div className="doc-details">
        <div className="doc-name" title={file.fileName}>{file.fileName}</div>
        <div className="doc-meta-row">
          <span className="doc-size">{formatBytes(file.fileSize)}</span>
          {showTimeOverlay && (
            <span className="doc-time-inline">
              • {timeText}
              {isSentByMe && !isGroupChat && <TickIcon tickState={tickState} size={8} />}
            </span>
          )}
        </div>
      </div>
      <a href={fullUrl} download={file.fileName} target="_blank" rel="noopener noreferrer" className="doc-download-btn" title="Download file" onClick={(e) => e.stopPropagation()}>
        <DownloadIcon size={16} />
      </a>
    </div>
  );
}

function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Attachment & Media state
  const [pendingFile, setPendingFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mediaLightbox, setMediaLightbox] = useState(null);
  const fileInputRef = useRef(null);

  // WhatsApp-style Action Context Menu State
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);
  const [forwardingMsg, setForwardingMsg] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardSearch, setForwardSearch] = useState("");

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

  // Close context menu on window click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuMsgId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Mark messages in chat as read
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

  useEffect(() => {
    selectedChatRef.current = selectedChat;
    if (selectedChat) {
      setNotifications((prev) => prev.filter((n) => n.chat !== selectedChat._id));
      markChatAsRead(selectedChat._id);
    }
  }, [selectedChat, markChatAsRead]);

  // Auth setup & load chats
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      window.location.href = "/";
    } else {
      setCurrentUser(storedUser);
      fetchChats(storedUser.token);
    }

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Socket.io init
  useEffect(() => {
    if (!currentUser) return;
    const socketInstance = io(ENDPOINT);
    setSocket(socketInstance);
    socketInstance.emit("setup", currentUser.user._id);
    socketInstance.on("online users", (users) => setOnlineUsers(users));
    return () => socketInstance.disconnect();
  }, [currentUser]);

  // Socket handlers
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

      setChats((prev) => {
        const updated = prev.map((c) =>
          c._id === receivedMsg.chat ? { ...c, latestMessage: receivedMsg } : c
        );
        return updated.sort((a, b) => (a._id === receivedMsg.chat ? -1 : b._id === receivedMsg.chat ? 1 : 0));
      });

      if (!isTabVisible || !isActiveChat) {
        playNotificationSound();
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

    const handleMessageDeleted = ({ messageId, chatId }) => {
      const activeChat = selectedChatRef.current;
      if (activeChat && activeChat._id === chatId) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }

      setChats((prev) =>
        prev.map((c) => {
          if (c._id === chatId && c.latestMessage?._id === messageId) {
            return { ...c, latestMessage: null };
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
    socket.on("message deleted", handleMessageDeleted);
    socket.on("typing", handleTyping);
    socket.on("stop typing", handleStopTyping);

    return () => {
      socket.off("receive message", handleReceivedMessage);
      socket.off("messages read", handleMessagesRead);
      socket.off("message deleted", handleMessageDeleted);
      socket.off("typing", handleTyping);
      socket.off("stop typing", handleStopTyping);
    };
  }, [socket, markChatAsRead]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, pendingFile]);

  // Fetch chats
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

  // Fetch messages
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

  // Sidebar user search (debounced)
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

  // Group modal user search (debounced)
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

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Process Selected File
  const processSelectedFile = (file) => {
    if (file.size > 25 * 1024 * 1024) {
      alert("File size exceeds maximum limit of 25MB.");
      return;
    }

    let fileType = "document";
    if (file.type.startsWith("image/")) fileType = "image";
    else if (file.type.startsWith("video/")) fileType = "video";
    else if (file.type.startsWith("audio/")) fileType = "audio";

    const previewUrl = fileType === "image" ? URL.createObjectURL(file) : null;
    setPendingFile({ file, previewUrl, fileType });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const clearPendingFile = () => {
    if (pendingFile?.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Open 1-to-1 chat
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

  // Select existing chat
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat._id);
  };

  // Typing handler
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

  // Send message (clean & instant for both text and file attachments)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !pendingFile) || !selectedChat || !currentUser) return;

    try {
      let uploadedFilePayload = null;

      if (pendingFile) {
        const formData = new FormData();
        formData.append("file", pendingFile.file);

        const uploadRes = await axios.post("http://localhost:5000/api/upload", formData, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        uploadedFilePayload = uploadRes.data;
      }

      const content = newMessage.trim();
      setNewMessage("");
      clearPendingFile();

      socket?.emit("stop typing", selectedChat._id);
      setLocalTyping(false);

      const { data } = await axios.post(
        "http://localhost:5000/api/message",
        {
          content,
          chatId: selectedChat._id,
          file: uploadedFilePayload,
        },
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
      alert("Failed to send message/file. Please try again.");
    }
  };

  // Delete message / media
  const handleDeleteMessage = async (messageId) => {
    if (!currentUser || !selectedChat) return;
    if (!window.confirm("Delete this message/attachment for everyone?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/message/${messageId}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });

      setMessages((prev) => prev.filter((m) => m._id !== messageId));

      socket?.emit("delete message", { messageId, chatId: selectedChat._id });

      setChats((prev) =>
        prev.map((c) => {
          if (c._id === selectedChat._id && c.latestMessage?._id === messageId) {
            const remaining = messages.filter((m) => m._id !== messageId);
            return {
              ...c,
              latestMessage: remaining.length > 0 ? remaining[remaining.length - 1] : null,
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error("Error deleting message:", err);
      alert("Failed to delete message.");
    }
  };

  // Forward message to another chat
  const handleForwardMessage = async (targetChat) => {
    if (!forwardingMsg || !currentUser) return;
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/message",
        {
          content: forwardingMsg.content || "",
          chatId: targetChat._id,
          file: forwardingMsg.file || null,
        },
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );

      if (selectedChat?._id === targetChat._id) {
        setMessages((prev) => [...prev, data]);
      }

      setChats((prev) => {
        const updated = prev.map((c) =>
          c._id === targetChat._id ? { ...c, latestMessage: data } : c
        );
        return updated.sort((a, b) => (a._id === targetChat._id ? -1 : b._id === targetChat._id ? 1 : 0));
      });

      socket?.emit("send message", data);

      setShowForwardModal(false);
      setForwardingMsg(null);
      setForwardSearch("");
    } catch (err) {
      console.error("Error forwarding message:", err);
      alert("Failed to forward message.");
    }
  };

  // Create group chat
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

  // Toggle member in group creation
  const toggleGroupMember = (user) => {
    if (selectedGroupMembers.some((m) => m._id === user._id)) {
      setSelectedGroupMembers((prev) => prev.filter((m) => m._id !== user._id));
    } else {
      setSelectedGroupMembers((prev) => [...prev, user]);
    }
  };

  // Leave group
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

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Helpers
  const getRecipient = (chatUsers) => {
    if (!currentUser || !chatUsers) return {};
    return chatUsers[0]._id === currentUser.user._id ? chatUsers[1] : chatUsers[0];
  };

  const getChatName = (chat) => {
    if (!chat) return "";
    if (chat.isGroupChat) return chat.chatName;
    return getRecipient(chat.users)?.name || "Unknown";
  };

  const getChatAvatarText = (chat) => {
    if (!chat) return "?";
    return getRecipient(chat.users)?.name?.charAt(0).toUpperCase() || "?";
  };

  const isRecipientOnline = (chat) => {
    if (!chat || chat.isGroupChat) return false;
    return onlineUsers.includes(getRecipient(chat.users)?._id);
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
      return msgDate.toLocaleDateString([], { weekday: "long" });
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

  function CameraIcon({ size = 16, color = "currentColor" }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{ flexShrink: 0 }}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    );
  }

  const getSidebarMessageContent = (msg) => {
    if (!msg) return "No messages yet";
    if (msg.content) return msg.content;
    if (msg.file) {
      const type = msg.file.fileType;
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          {type === "image" ? (
            <CameraIcon size={12} color="var(--accent-text)" />
          ) : type === "video" ? (
            <VideoIcon size={12} color="var(--accent-text)" />
          ) : type === "audio" ? (
            <AudioIcon size={12} color="var(--accent-text)" />
          ) : (
            <FileTextIcon size={12} color="var(--accent-text)" />
          )}
          <span>
            {type === "image"
              ? "Photo"
              : type === "video"
              ? "Video"
              : type === "audio"
              ? "Audio note"
              : msg.file.fileName || "Document"}
          </span>
        </span>
      );
    }
    return "Attachment";
  };

  const filteredForwardChats = chats.filter((chat) =>
    getChatName(chat).toLowerCase().includes(forwardSearch.toLowerCase())
  );

  return (
    <>
      {/* Forward Message Modal */}
      {showForwardModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForwardModal(false); }}>
          <div className="modal-card">
            <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ForwardIcon size={18} color="var(--accent-text)" /> Forward Message
            </h3>

            <p style={{ fontSize: "0.85rem", color: "var(--text-2)", marginBottom: "1rem" }}>
              Select a chat to forward {forwardingMsg?.file ? (forwardingMsg.file.fileName || "attachment") : "message"}:
            </p>

            <input
              className="modal-input"
              placeholder="Search chat or group..."
              value={forwardSearch}
              onChange={(e) => setForwardSearch(e.target.value)}
            />

            <ul className="modal-user-list" style={{ maxHeight: "240px" }}>
              {filteredForwardChats.map((chat) => (
                <li
                  key={chat._id}
                  className="modal-user-item"
                  onClick={() => handleForwardMessage(chat)}
                >
                  <div className={`avatar ${chat.isGroupChat ? "avatar-group" : isRecipientOnline(chat) ? "avatar-online" : ""}`} style={{ width: 34, height: 34 }}>
                    {chat.isGroupChat ? <UsersIcon size={16} /> : getChatAvatarText(chat)}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 500 }}>{getChatName(chat)}</div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                      {chat.isGroupChat ? "Group Chat" : "Direct Message"}
                    </div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--accent-text)", fontWeight: 500 }}>
                    Forward ↪
                  </span>
                </li>
              ))}
              {filteredForwardChats.length === 0 && (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  No matching chats found
                </div>
              )}
            </ul>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowForwardModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Media Lightbox Modal */}
      {mediaLightbox && (
        <div className="lightbox-overlay" onClick={() => setMediaLightbox(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close-btn" onClick={() => setMediaLightbox(null)}>
              <CrossIcon size={16} />
            </button>
            <img src={mediaLightbox.url} alt={mediaLightbox.fileName} className="lightbox-image" />
            <div className="lightbox-footer">
              <span className="lightbox-filename">{mediaLightbox.fileName}</span>
              <a href={mediaLightbox.url} download={mediaLightbox.fileName} target="_blank" rel="noopener noreferrer" className="lightbox-download-link">
                <DownloadIcon size={14} /> Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowGroupModal(false); }}>
          <div className="modal-card">
            <h3 className="modal-title">Create New Group</h3>

            <input
              className="modal-input"
              placeholder="Group name (e.g. Study Squad)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            {selectedGroupMembers.length > 0 && (
              <div className="chips-container">
                {selectedGroupMembers.map((u) => (
                  <span key={u._id} className="member-chip">
                    {u.name}
                    <button className="chip-remove" onClick={() => toggleGroupMember(u)}>
                      <CrossIcon size={10} />
                    </button>
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
                        <span style={{ marginLeft: "auto" }}>
                          <CheckIcon size={16} />
                        </span>
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
          {/* TOP: Brand + New Group */}
          <div className="sidebar-top">
            <LoopChatLogo size={24} textSize="1rem" />
            <button className="new-group-btn" onClick={() => setShowGroupModal(true)}>+ Group</button>
          </div>

          {/* MIDDLE: Search + Chat list */}
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
                <button className="search-clear" onClick={() => setSearchQuery("")}>
                  <CrossIcon size={12} />
                </button>
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
                          {chat.isGroupChat ? <UsersIcon size={16} /> : getChatAvatarText(chat)}
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
                                  {getSidebarMessageContent(chatNotifications[chatNotifications.length - 1])}
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
                                      <span>{isMe ? "You:" : `${senderName}:`}</span>
                                      {getSidebarMessageContent(chat.latestMessage)}
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

          {/* BOTTOM: User profile footer */}
          <div className="sidebar-profile-footer">
            <div className="avatar avatar-online">
              {currentUser?.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">{currentUser?.user?.name || "..."}</div>
              <div className="sidebar-profile-status">
                <span className="sidebar-status-dot" />
                Online
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* ===== CHAT WINDOW ===== */}
        <div
          className={`chat-window ${isDragging ? "dragging-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag & Drop Visual Overlay */}
          {isDragging && (
            <div className="drag-drop-overlay">
              <div className="drag-drop-card">
                <FileTextIcon size={44} color="var(--accent-text)" />
                <h3>Drop file to send</h3>
                <p>Images, videos, audio, or documents up to 25MB</p>
              </div>
            </div>
          )}

          {selectedChat ? (
            <>
              {/* Header */}
              <div className="chat-header">
                <div className="chat-user-info">
                  <div className={`avatar ${selectedChat.isGroupChat ? "avatar-group" : isRecipientOnline(selectedChat) ? "avatar-online" : ""}`}>
                    {selectedChat.isGroupChat ? <UsersIcon size={18} /> : getChatAvatarText(selectedChat)}
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
                              {isAdmin && <CrownIcon size={11} />}
                              {u.name}
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

                  const readBy = msg.readBy || [];
                  const isRead = readBy.some(
                    (id) => (typeof id === "object" ? id._id : id) !== currentUser.user._id
                  );
                  const recipient = !selectedChat.isGroupChat
                    ? getRecipient(selectedChat.users)
                    : null;
                  const isDelivered = recipient && onlineUsers.includes(recipient._id);

                  let tickState = "sent";
                  if (isRead) tickState = "read";
                  else if (isDelivered) tickState = "delivered";

                  const showDateSep =
                    idx === 0 || !isSameDay(messages[idx - 1].createdAt, msg.createdAt);

                  const hasMedia = Boolean(msg.file);
                  const isMediaOnly = hasMedia && (!msg.content || !msg.content.trim());
                  const isMenuOpen = activeMenuMsgId === msg._id;

                  return (
                    <div key={msg._id || idx}>
                      {showDateSep && (
                        <div className="date-separator">
                          <span className="date-separator-label">{getDateLabel(msg.createdAt)}</span>
                        </div>
                      )}
                      <div className={`message-wrapper ${isSentByMe ? "sent" : "received"}`}>
                        <div
                          className={`message-bubble ${hasMedia ? "has-media" : ""} ${isMediaOnly ? "media-only-bubble" : ""}`}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuMsgId(isMenuOpen ? null : msg._id);
                          }}
                        >
                          {/* WhatsApp-Style Chevron Action Menu Trigger */}
                          <button
                            type="button"
                            className="message-menu-trigger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuMsgId(isMenuOpen ? null : msg._id);
                            }}
                            title="Message options"
                          >
                            <ChevronDownIcon size={13} />
                          </button>

                          {/* WhatsApp-Style Floating Action Context Menu */}
                          {isMenuOpen && (
                            <div className="message-context-menu" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="context-menu-item"
                                onClick={() => {
                                  setActiveMenuMsgId(null);
                                  setForwardingMsg(msg);
                                  setShowForwardModal(true);
                                }}
                              >
                                <ForwardIcon size={14} />
                                <span>Forward</span>
                              </button>

                              {msg.file && (
                                <a
                                  href={`http://localhost:5000${msg.file.url}`}
                                  download={msg.file.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="context-menu-item"
                                  onClick={() => setActiveMenuMsgId(null)}
                                >
                                  <DownloadIcon size={14} />
                                  <span>Download</span>
                                </a>
                              )}

                              {isSentByMe && (
                                <button
                                  type="button"
                                  className="context-menu-item danger"
                                  onClick={() => {
                                    setActiveMenuMsgId(null);
                                    handleDeleteMessage(msg._id);
                                  }}
                                >
                                  <TrashIcon size={14} />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          )}

                          {selectedChat.isGroupChat && !isSentByMe && (
                            <div style={{ fontSize: "0.72rem", color: "#818cf8", fontWeight: 600, marginBottom: "0.25rem" }}>
                              {senderName}
                            </div>
                          )}

                          {/* Render File Attachment if present */}
                          {msg.file && (
                            <AttachmentView
                              file={msg.file}
                              isSentByMe={isSentByMe}
                              onOpenLightbox={(f) => setMediaLightbox({ url: `http://localhost:5000${f.url}`, fileType: f.fileType, fileName: f.fileName })}
                              onToggleMenu={() => setActiveMenuMsgId(isMenuOpen ? null : msg._id)}
                              timeText={formatTime(msg.createdAt)}
                              tickState={tickState}
                              showTimeOverlay={isMediaOnly}
                              isGroupChat={selectedChat.isGroupChat}
                            />
                          )}

                          {/* Render Text Content if present */}
                          {msg.content && (
                            <div className="message-text-content">{msg.content}</div>
                          )}

                          {!isMediaOnly && (
                            <div className="message-info">
                              <span>{formatTime(msg.createdAt)}</span>
                              {isSentByMe && !selectedChat.isGroupChat && (
                                <TickIcon tickState={tickState} size={9} />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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

              {/* Input pane with File Attachment Drawer */}
              <div className="input-pane">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                />

                {/* Pending File Attachment Bar */}
                {pendingFile && (
                  <div className="pending-file-bar">
                    <div className="pending-file-info">
                      {pendingFile.fileType === "image" ? (
                        <img src={pendingFile.previewUrl} alt="Preview" className="pending-thumb" />
                      ) : (
                        <div className="pending-doc-icon">
                          {pendingFile.fileType === "video" ? (
                            <VideoIcon size={20} color="var(--accent-text)" />
                          ) : pendingFile.fileType === "audio" ? (
                            <AudioIcon size={20} color="var(--accent-text)" />
                          ) : (
                            <FileTextIcon size={20} color="var(--accent-text)" />
                          )}
                        </div>
                      )}
                      <div className="pending-details">
                        <span className="pending-name">{pendingFile.file.name}</span>
                        <span className="pending-size">{formatBytes(pendingFile.file.size)}</span>
                      </div>
                    </div>
                    <button type="button" className="pending-remove-btn" onClick={clearPendingFile} title="Remove attachment">
                      <CrossIcon size={12} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="input-form">
                  <button
                    type="button"
                    className="attach-button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file or media"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>

                  <input
                    type="text"
                    className="chat-input"
                    placeholder={
                      pendingFile
                        ? "Add a caption (optional)..."
                        : selectedChat.isGroupChat
                        ? `Message ${selectedChat.chatName}...`
                        : "Type a message..."
                    }
                    value={newMessage}
                    onChange={handleInputChange}
                  />

                  <button type="submit" className="send-button" disabled={!newMessage.trim() && !pendingFile}>
                    <svg viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="chat-placeholder">
              <div className="placeholder-icon">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
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