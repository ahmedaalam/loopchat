import { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";

const ENDPOINT = "http://localhost:5000";

function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  
  // Socket.io & UX state
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [localTyping, setLocalTyping] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const messagesEndRef = useRef(null);
  const selectedChatRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Sync ref with selectedChat to avoid socket closure issues
  useEffect(() => {
    selectedChatRef.current = selectedChat;
    if (selectedChat) {
      // Clear notifications for selected chat
      setNotifications((prev) => prev.filter((n) => n.chat !== selectedChat._id));
    }
  }, [selectedChat]);

  // 1. Initial Auth Setup & Load Chats
  useEffect(() => {
    const storedUserObj = JSON.parse(localStorage.getItem("user"));
    if (!storedUserObj) {
      window.location.href = "/";
    } else {
      setCurrentUser(storedUserObj);
      fetchChats(storedUserObj.token);
    }
  }, []);

  // 2. Initialize Socket.io Connection
  useEffect(() => {
    if (!currentUser) return;

    const socketInstance = io(ENDPOINT);
    setSocket(socketInstance);

    // Register user details
    socketInstance.emit("setup", currentUser.user._id);

    // Read list of online users
    socketInstance.on("online users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [currentUser]);

  // 3. Socket Message & Status Handlers
  useEffect(() => {
    if (!socket) return;

    const handleReceivedMessage = (receivedMsg) => {
      const activeChat = selectedChatRef.current;
      if (activeChat && activeChat._id === receivedMsg.chat) {
        setMessages((prev) => [...prev, receivedMsg]);
      } else {
        // Record as notification
        setNotifications((prev) => {
          if (prev.some((n) => n._id === receivedMsg._id)) return prev;
          return [...prev, receivedMsg];
        });
      }
    };

    const handleTyping = (room) => {
      const activeChat = selectedChatRef.current;
      if (activeChat && activeChat._id === room) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (room) => {
      const activeChat = selectedChatRef.current;
      if (activeChat && activeChat._id === room) {
        setIsTyping(false);
      }
    };

    socket.on("receive message", handleReceivedMessage);
    socket.on("typing", handleTyping);
    socket.on("stop typing", handleStopTyping);

    return () => {
      socket.off("receive message", handleReceivedMessage);
      socket.off("typing", handleTyping);
      socket.off("stop typing", handleStopTyping);
    };
  }, [socket]);

  // 4. Auto Scroll to Bottom on New Messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 5. API calls: Fetch all chats
  const fetchChats = async (token) => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/chat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  // 6. API calls: Fetch messages for a chat
  const fetchMessages = async (chatId) => {
    if (!currentUser) return;
    try {
      const { data } = await axios.get(`http://localhost:5000/api/message/${chatId}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      setMessages(data);
      if (socket) {
        socket.emit("join chat", chatId);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // 7. Search Users
  useEffect(() => {
    if (!currentUser) return;
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const { data } = await axios.get(`http://localhost:5000/api/users?search=${searchQuery}`, {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        setSearchResults(data);
      } catch (error) {
        console.error("Error searching users:", error);
      }
    };

    const delayDebounce = setTimeout(() => {
      searchUsers();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, currentUser]);

  // 8. Select / Start Chat with user
  const handleSelectUser = async (userId) => {
    if (!currentUser) return;
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/chat",
        { userId },
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      
      // Update local chats list if new
      if (!chats.some((c) => c._id === data._id)) {
        setChats((prev) => [data, ...prev]);
      }
      
      setSelectedChat(data);
      fetchMessages(data._id);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error accessing/creating chat:", error);
    }
  };

  // 9. Input change / Typing Detection
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

  // 10. Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    try {
      const messageContent = newMessage;
      setNewMessage(""); // optimistic clear

      // Stop typing status
      if (socket) {
        socket.emit("stop typing", selectedChat._id);
      }
      setLocalTyping(false);

      const { data } = await axios.post(
        "http://localhost:5000/api/message",
        { content: messageContent, chatId: selectedChat._id },
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );

      setMessages((prev) => [...prev, data]);

      // Emit socket event
      if (socket) {
        socket.emit("send message", data);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // 11. Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // 12. Helper to get recipient details
  const getRecipient = (chatUsers) => {
    if (!currentUser || !chatUsers) return {};
    return chatUsers[0]._id === currentUser.user._id ? chatUsers[1] : chatUsers[0];
  };

  // 13. Select an existing chat
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat._id);
  };

  return (
    <div className="chat-container">
      {/* 1. Sidebar Section */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="avatar avatar-online">
              {currentUser?.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="username">{currentUser?.user?.name || "Loading..."}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
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
              <button className="search-clear" onClick={() => setSearchQuery("")}>
                ✕
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
                  <li
                    key={user._id}
                    className="sidebar-item"
                    onClick={() => handleSelectUser(user._id)}
                  >
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
                  const recipient = getRecipient(chat.users);
                  const isRecipientOnline = onlineUsers.includes(recipient._id);
                  const isSelected = selectedChat?._id === chat._id;
                  const chatNotifications = notifications.filter((n) => n.chat === chat._id);
                  
                  return (
                    <li
                      key={chat._id}
                      className={`sidebar-item ${isSelected ? "active" : ""}`}
                      onClick={() => handleSelectChat(chat)}
                    >
                      <div className={`avatar ${isRecipientOnline ? "avatar-online" : ""}`}>
                        {recipient.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="item-details">
                        <div className="item-name-row">
                          <span className="item-name">{recipient.name}</span>
                          <span className="item-meta">
                            {new Date(chat.updatedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="item-subtext-row">
                          <span className="item-msg">
                            {chatNotifications.length > 0 ? (
                              <span style={{ color: "var(--accent)", fontWeight: "500" }}>
                                {chatNotifications[chatNotifications.length - 1].content}
                              </span>
                            ) : (
                              "Click to chat"
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
                  <div style={{ padding: "2rem", textalign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    No active chats. Search for a user above to start chatting!
                  </div>
                )}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* 2. Chat Window Section */}
      <div className="chat-window">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="chat-header">
              <div className="chat-user-info">
                <div className={`avatar ${onlineUsers.includes(getRecipient(selectedChat.users)._id) ? "avatar-online" : ""}`}>
                  {getRecipient(selectedChat.users).name?.charAt(0).toUpperCase()}
                </div>
                <div className="chat-user-details">
                  <span className="chat-user-name">{getRecipient(selectedChat.users).name}</span>
                  {isTyping ? (
                    <div className="typing-status-indicator">
                      <span>typing</span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  ) : (
                    <span className={`chat-user-status ${onlineUsers.includes(getRecipient(selectedChat.users)._id) ? "online" : ""}`}>
                      {onlineUsers.includes(getRecipient(selectedChat.users)._id) ? "online" : "offline"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages pane */}
            <div className="messages-pane">
              {messages.map((msg) => {
                const isSentByMe = msg.sender._id === currentUser.user._id || msg.sender === currentUser.user._id;
                return (
                  <div
                    key={msg._id}
                    className={`message-wrapper ${isSentByMe ? "sent" : "received"}`}
                  >
                    <div className="message-bubble">
                      <div className="message-text">{msg.content}</div>
                      <div className="message-info">
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
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
                  placeholder="Type a message..."
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
              Choose an existing chat from the left sidebar or use the search bar to find friends and start messaging in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;