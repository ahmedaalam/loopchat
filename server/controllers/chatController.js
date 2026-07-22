const Chat = require("../models/Chat");

const populateOptions = [
  { path: "users", select: "-password" },
  { path: "groupAdmin", select: "-password" },
  {
    path: "latestMessage",
    populate: { path: "sender", select: "name email" },
  },
];

// create or access 1-to-1 chat
exports.accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send("UserId not sent");
  }

  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [req.user, userId] },
  })
    .populate("users", "-password")
    .populate({
      path: "latestMessage",
      populate: { path: "sender", select: "name email" },
    });

  if (chat) {
    return res.json(chat);
  }

  let newChat = await Chat.create({
    chatName: "direct",
    isGroupChat: false,
    users: [req.user, userId],
  });

  newChat = await newChat.populate("users", "-password");
  res.status(201).json(newChat);
};

// GET all chats for logged-in user
exports.fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      users: { $in: [req.user] },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email" },
      })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE group chat
exports.createGroupChat = async (req, res) => {
  const { name, users } = req.body;

  if (!name || !users) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  let parsedUsers = typeof users === "string" ? JSON.parse(users) : users;

  if (parsedUsers.length < 2) {
    return res.status(400).json({ message: "A group needs at least 2 other members" });
  }

  // Add current user to the group
  parsedUsers.push(req.user);

  try {
    let groupChat = await Chat.create({
      chatName: name,
      isGroupChat: true,
      users: parsedUsers,
      groupAdmin: req.user,
    });

    groupChat = await Chat.findById(groupChat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(groupChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RENAME group chat (admin only)
exports.renameGroup = async (req, res) => {
  const { chatId, chatName } = req.body;

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD user to group (admin only)
exports.addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const added = await Chat.findByIdAndUpdate(
      chatId,
      { $addToSet: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!added) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json(added);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REMOVE user from group (admin removes someone, or user leaves)
exports.removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const removed = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!removed) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json(removed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const fs = require("fs");
const path = require("path");
const Message = require("../models/Message");

// CLEAR CHAT - deletes all messages in a chat and unlinks physical files
exports.clearChat = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const messages = await Message.find({ chat: chatId });
    for (const msg of messages) {
      if (msg.file && msg.file.url) {
        const filename = path.basename(msg.file.url);
        const filePath = path.join(__dirname, "../uploads", filename);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete attachment file from disk:", err);
          });
        }
      }
    }

    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndUpdate(chatId, { latestMessage: null });

    res.json({ message: "Chat cleared successfully", chatId });
  } catch (error) {
    console.error("Clear Chat Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE CHAT - deletes chat room entirely and all associated messages & files
exports.deleteChat = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const messages = await Message.find({ chat: chatId });
    for (const msg of messages) {
      if (msg.file && msg.file.url) {
        const filename = path.basename(msg.file.url);
        const filePath = path.join(__dirname, "../uploads", filename);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete attachment file from disk:", err);
          });
        }
      }
    }

    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);

    res.json({ message: "Chat deleted successfully", chatId });
  } catch (error) {
    console.error("Delete Chat Error:", error);
    res.status(500).json({ message: error.message });
  }
};