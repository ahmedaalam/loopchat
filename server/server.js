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