require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

// routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

// ✅ connect database
connectDB();

// middlewares
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("LoopChat API is running...");
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ================= SOCKET.IO SETUP =================

// create HTTP server
const server = http.createServer(app);

// attach socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// socket events
io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);

  // join specific chat room
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("📌 Joined room:", room);
  });

  // send message to others in room
  socket.on("send message", (data) => {
    socket.to(data.chatId).emit("receive message", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ================= SERVER START =================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});