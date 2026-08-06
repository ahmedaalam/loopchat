require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const path = require("path");

const connectDB = require("./config/db");

// routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const friendRoutes = require("./routes/friendRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();

// ✅ connect database
connectDB();

// Dynamic CORS configuration
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, "http://localhost:5173", "http://localhost:3000"]
  : "*";

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// test route
app.get("/", (req, res) => {
  res.json({ message: "LoopChat API is running smoothly..." });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/friends", friendRoutes);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

// ================= SOCKET.IO SETUP =================

// create HTTP server
const server = http.createServer(app);

// attach socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

// track online users (userId -> socketId)
const onlineUsers = {};

// socket events
io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);

  // Setup user and track online status
  socket.on("setup", (userId) => {
    socket.join(userId);
    onlineUsers[userId] = socket.id;
    console.log(`👤 User online: ${userId}`);
    io.emit("online users", Object.keys(onlineUsers));
  });

  // join specific chat room
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("📌 Joined room:", room);
  });

  // typing status
  socket.on("typing", (room) => {
    socket.to(room).emit("typing", room);
  });

  socket.on("stop typing", (room) => {
    socket.to(room).emit("stop typing", room);
  });

  // recording audio status
  socket.on("recording audio", (room) => {
    socket.to(room).emit("recording audio", room);
  });

  socket.on("stop recording audio", (room) => {
    socket.to(room).emit("stop recording audio", room);
  });

  // send message to others in room & direct to participants
  socket.on("send message", (data) => {
    // data should contain { chat, sender, content, ... }
    const chatId =
      data && typeof data.chat === "object" ? data.chat?._id : data?.chat;
    const senderId =
      data && typeof data.sender === "object"
        ? data.sender?._id?.toString()
        : data?.sender?.toString();

    if (chatId) {
      socket.to(chatId).emit("receive message", data);
    }
    if (
      data &&
      data.chat &&
      typeof data.chat === "object" &&
      Array.isArray(data.chat.users)
    ) {
      data.chat.users.forEach((u) => {
        const uId = typeof u === "object" ? u._id?.toString() : u?.toString();
        if (uId && uId !== senderId) {
          io.to(uId).emit("receive message", data);
        }
      });
    }
  });

  // read receipts
  socket.on("read messages", ({ chatId, readerId }) => {
    if (chatId) {
      io.to(chatId).emit("messages read", { chatId, readerId });
    }
  });

  // delete message broadcast
  socket.on("delete message", ({ messageId, chatId }) => {
    if (chatId) {
      io.to(chatId).emit("message deleted", { messageId, chatId });
    }
  });

  // message reaction broadcast
  socket.on("message reaction", ({ messageId, reactions, chatId }) => {
    if (chatId) {
      io.to(chatId).emit("message reaction updated", {
        messageId,
        reactions,
        chatId,
      });
    }
  });

  // clear chat broadcast
  socket.on("clear chat", ({ chatId }) => {
    if (chatId) {
      io.to(chatId).emit("chat cleared", { chatId });
    }
  });

  // delete chat broadcast
  socket.on("delete chat", ({ chatId }) => {
    if (chatId) {
      io.to(chatId).emit("chat deleted", { chatId });
    }
  });

  // ── Friend Request real-time events ────────────────────────────────────────

  // Sender notifies receiver of a new incoming request
  socket.on("friend_request_sent", ({ receiverId, request }) => {
    io.to(receiverId).emit("friend_request_received", request);
    console.log(`👥 Friend request sent to ${receiverId}`);
  });

  // Receiver notifies sender that their request was accepted
  socket.on("friend_request_accepted", ({ senderId, request }) => {
    io.to(senderId).emit("friend_request_accepted", request);
    console.log(`✅ Friend request accepted, notifying ${senderId}`);
  });

  // Receiver notifies sender that their request was declined
  socket.on("friend_request_declined", ({ senderId, requestId }) => {
    io.to(senderId).emit("friend_request_declined", { requestId });
  });

  socket.on("friend_removed", ({ userId, removedUserId, chatId }) => {
    if (!userId || !removedUserId) return;
    io.to(userId).emit("friend_removed", { removedUserId, chatId });
    console.log(`👥 Friend removed: ${removedUserId} removed from ${userId}`);
  });

  // ================= WEBRTC VOICE & VIDEO CALL SIGNALING =================
  const activeCalls = {};

  const saveCallRecord = async (call, isMissed = false, duration = 0) => {
    if (!call || !call.chatId || call.hasSavedCallMsg) return;
    call.hasSavedCallMsg = true;

    try {
      const Message = require("./models/Message");
      const Chat = require("./models/Chat");

      let content = "";
      if (isMissed) {
        content = call.isVideoCall ? "Missed video call" : "Missed voice call";
      } else {
        content = call.isVideoCall ? "Video call" : "Voice call";
      }

      let msg = await Message.create({
        sender: call.from,
        content,
        chat: call.chatId,
        readBy: [call.from],
        callInfo: {
          isCall: true,
          isVideoCall: !!call.isVideoCall,
          isMissed: !!isMissed,
          duration: duration || 0,
        },
      });

      msg = await msg.populate("sender", "name avatar email");
      msg = await msg.populate({
        path: "chat",
        populate: { path: "users", select: "name avatar email" },
      });

      await Chat.findByIdAndUpdate(call.chatId, { latestMessage: msg });
      io.to(call.chatId).emit("receive message", msg);

      if (msg.chat && Array.isArray(msg.chat.users)) {
        msg.chat.users.forEach((u) => {
          const uId = typeof u === "object" ? u._id?.toString() : u?.toString();
          if (uId) {
            io.to(uId).emit("receive message", msg);
          }
        });
      }

      console.log(
        `📞 Saved ${isMissed ? "missed" : "completed"} ${call.isVideoCall ? "video" : "voice"} call for chat ${call.chatId}`,
      );
    } catch (err) {
      console.error("Error creating call record message:", err);
    }
  };

  socket.on(
    "call user",
    ({ userToCall, offer, from, callerName, isVideoCall, chatId }) => {
      console.log(
        `📞 Call user event received: from ${callerName} (${from}) to userToCall=${userToCall}, chatId=${chatId}, isVideoCall=${isVideoCall}`,
      );

      if (from) {
        activeCalls[from.toString()] = {
          userToCall: userToCall ? userToCall.toString() : null,
          from: from.toString(),
          callerName,
          isVideoCall: !!isVideoCall,
          chatId: chatId ? chatId.toString() : null,
          status: "ringing",
        };
      }

      const payload = { offer, from, callerName, isVideoCall, chatId };

      if (userToCall) {
        const recipientStr = userToCall.toString();
        io.to(recipientStr).emit("incoming call", payload);

        const targetSocketId = onlineUsers[recipientStr];
        if (targetSocketId) {
          io.to(targetSocketId).emit("incoming call", payload);
        }
      }

      if (chatId) {
        socket.to(chatId).emit("incoming call", payload);
      }
    },
  );

  socket.on("answer call", ({ to, answer }) => {
    const targetId = to ? to.toString() : null;
    if (targetId) {
      io.to(targetId).emit("call accepted", { answer });
      console.log(`✅ Call accepted by ${to}`);
    }

    for (const key of Object.keys(activeCalls)) {
      if (key === to || activeCalls[key].userToCall === to) {
        activeCalls[key].status = "connected";
        activeCalls[key].connectedTime = Date.now();
      }
    }
  });

  socket.on("ice candidate", ({ to, candidate }) => {
    const targetId = to ? to.toString() : null;
    if (targetId) {
      io.to(targetId).emit("ice candidate", { candidate });
    }
  });

  socket.on("reject call", async ({ to }) => {
    const targetId = to ? to.toString() : null;
    if (targetId) {
      io.to(targetId).emit("call rejected");
      console.log(`❌ Call rejected for ${to}`);
    }

    const callKey = Object.keys(activeCalls).find(
      (k) => k === to || activeCalls[k].userToCall === to,
    );

    if (callKey) {
      const call = activeCalls[callKey];
      delete activeCalls[callKey];
      if (call) {
        await saveCallRecord(call, true, 0);
      }
    }
  });

  socket.on("end call", async ({ to, duration }) => {
    const targetId = to ? to.toString() : null;
    if (targetId) {
      io.to(targetId).emit("call ended");
      console.log(`⏹ Call ended for ${to}`);
    }

    const callKey = Object.keys(activeCalls).find(
      (k) => k === to || activeCalls[k].userToCall === to,
    );

    if (callKey) {
      const call = activeCalls[callKey];
      delete activeCalls[callKey];
      if (call) {
        const isMissed = call.status === "ringing";
        let callDuration = duration || 0;
        if (!isMissed && call.connectedTime) {
          callDuration = Math.round((Date.now() - call.connectedTime) / 1000);
        }
        await saveCallRecord(call, isMissed, callDuration);
      }
    }
  });

  socket.on("disconnect", async () => {
    let disconnectedUserId = null;
    for (const [userId, socketId] of Object.entries(onlineUsers)) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        delete onlineUsers[userId];
        break;
      }
    }
    if (disconnectedUserId) {
      for (const callKey of Object.keys(activeCalls)) {
        const call = activeCalls[callKey];
        if (
          call &&
          (call.from === disconnectedUserId ||
            call.userToCall === disconnectedUserId)
        ) {
          delete activeCalls[callKey];
          const isMissed = call.status === "ringing";
          let callDuration = 0;
          if (!isMissed && call.connectedTime) {
            callDuration = Math.round((Date.now() - call.connectedTime) / 1000);
          }
          await saveCallRecord(call, isMissed, callDuration);
          const peerId =
            call.from === disconnectedUserId ? call.userToCall : call.from;
          if (peerId) {
            io.to(peerId).emit("call ended");
          }
        }
      }

      try {
        const User = require("./models/User");
        const lastSeen = new Date();
        await User.findByIdAndUpdate(disconnectedUserId, { lastSeen });
        io.emit("online users", Object.keys(onlineUsers));
        io.emit("user status update", {
          userId: disconnectedUserId,
          isOnline: false,
          lastSeen,
        });
      } catch (err) {
        console.error("Error updating lastSeen on disconnect:", err);
      }
      console.log(`👤 User offline: ${disconnectedUserId}`);
    }
    console.log("❌ User disconnected:", socket.id);
  });
});

// ================= SERVER START =================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
