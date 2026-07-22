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

const app = express();

// ✅ connect database
connectDB();

// middlewares
app.use(cors());
app.use(express.json());

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// test route
app.get("/", (req, res) => {
  res.send("LoopChat API is running...");
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/upload", uploadRoutes);

// ================= SOCKET.IO SETUP =================

// create HTTP server
const server = http.createServer(app);

// attach socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

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

  // send message to others in room
  socket.on("send message", (data) => {
    // data should contain { chat, sender, content, ... }
    const chatId = data.chat;
    if (chatId) {
      socket.to(chatId).emit("receive message", data);
    }
  });

  // read receipts
  socket.on("read messages", ({ chatId, readerId }) => {
    if (chatId) {
      socket.to(chatId).emit("messages read", { chatId, readerId });
    }
  });

  // delete message broadcast
  socket.on("delete message", ({ messageId, chatId }) => {
    if (chatId) {
      socket.to(chatId).emit("message deleted", { messageId, chatId });
    }
  });

  // message reaction broadcast
  socket.on("message reaction", ({ messageId, reactions, chatId }) => {
    if (chatId) {
      socket.to(chatId).emit("message reaction updated", { messageId, reactions, chatId });
    }
  });

  // clear chat broadcast
  socket.on("clear chat", ({ chatId }) => {
    if (chatId) {
      socket.to(chatId).emit("chat cleared", { chatId });
    }
  });

  // delete chat broadcast
  socket.on("delete chat", ({ chatId }) => {
    if (chatId) {
      socket.to(chatId).emit("chat deleted", { chatId });
    }
  });

  // ================= WEBRTC VOICE & VIDEO CALL SIGNALING =================
  const activeCalls = {};

  const saveMissedCallRecord = async (call) => {
    if (!call || !call.chatId || call.hasSavedMissedMsg) return;
    call.hasSavedMissedMsg = true;

    try {
      const Message = require("./models/Message");
      const Chat = require("./models/Chat");

      let msg = await Message.create({
        sender: call.from,
        content: call.isVideoCall ? "Missed video call" : "Missed voice call",
        chat: call.chatId,
        readBy: [call.from],
        callInfo: {
          isCall: true,
          isVideoCall: !!call.isVideoCall,
          isMissed: true,
          duration: 0,
        },
      });

      msg = await msg.populate("sender", "name avatar email");
      msg = await msg.populate("chat");

      await Chat.findByIdAndUpdate(call.chatId, { latestMessage: msg });
      io.to(call.chatId).emit("receive message", msg);
      console.log(`📞 Saved missed ${call.isVideoCall ? "video" : "voice"} call for chat ${call.chatId}`);
    } catch (err) {
      console.error("Error creating missed call message:", err);
    }
  };

  socket.on("call user", ({ userToCall, offer, from, callerName, isVideoCall, chatId }) => {
    console.log(`📞 Call user event received: from ${callerName} (${from}) to userToCall=${userToCall}, chatId=${chatId}, isVideoCall=${isVideoCall}`);

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
  });

  socket.on("answer call", ({ to, answer }) => {
    const targetId = to ? to.toString() : null;
    if (targetId) {
      io.to(targetId).emit("call accepted", { answer });
      console.log(`✅ Call accepted by ${to}`);
    }

    for (const key of Object.keys(activeCalls)) {
      if (key === to || activeCalls[key].userToCall === to) {
        activeCalls[key].status = "connected";
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
      (k) => k === to || activeCalls[k].userToCall === to
    );

    if (callKey) {
      const call = activeCalls[callKey];
      delete activeCalls[callKey];
      if (call && call.status === "ringing") {
        await saveMissedCallRecord(call);
      }
    }
  });

  socket.on("end call", async ({ to }) => {
    const targetId = to ? to.toString() : null;
    if (targetId) {
      io.to(targetId).emit("call ended");
      console.log(`⏹ Call ended for ${to}`);
    }

    const callKey = Object.keys(activeCalls).find(
      (k) => k === to || activeCalls[k].userToCall === to
    );

    if (callKey) {
      const call = activeCalls[callKey];
      delete activeCalls[callKey];
      if (call && call.status === "ringing") {
        await saveMissedCallRecord(call);
      }
    }
  });

  socket.on("disconnect", () => {
    let disconnectedUserId = null;
    for (const [userId, socketId] of Object.entries(onlineUsers)) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        delete onlineUsers[userId];
        break;
      }
    }
    if (disconnectedUserId) {
      io.emit("online users", Object.keys(onlineUsers));
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