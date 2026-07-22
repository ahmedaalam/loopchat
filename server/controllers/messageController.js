const Message = require("../models/Message");
const Chat = require("../models/Chat");

exports.sendMessage = async (req, res) => {
  const { content, chatId, file } = req.body;

  if ((!content && !file) || !chatId) {
    return res.status(400).json({ message: "Invalid data: content or file attachment required" });
  }

  let message = await Message.create({
    sender: req.user,
    content: content || "",
    file: file || null,
    chat: chatId,
    readBy: [req.user],
  });

  message = await message.populate("sender", "name email");

  // Update latest message in Chat
  await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

  res.status(201).json(message);
};

// GET all messages of a chat
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const fs = require("fs");
const path = require("path");

// MARK all messages in a chat as read
exports.markAsRead = async (req, res) => {
  const { chatId } = req.params;
  try {
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user },
        readBy: { $ne: req.user }
      },
      {
        $addToSet: { readBy: req.user }
      }
    );
    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE a message and its file attachment if present
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const senderId = typeof message.sender === "object" ? message.sender._id : message.sender;
    if (senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this message" });
    }

    // Delete attachment file from disk if present
    if (message.file && message.file.url) {
      const filename = path.basename(message.file.url);
      const filePath = path.join(__dirname, "../uploads", filename);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error("Failed to delete attachment file from disk:", err);
        });
      }
    }

    const chatId = message.chat;
    await Message.findByIdAndDelete(messageId);

    // Update latestMessage in Chat if deleted message was the latest one
    const chat = await Chat.findById(chatId);
    if (chat && chat.latestMessage && chat.latestMessage.toString() === messageId.toString()) {
      const lastRemainingMsg = await Message.findOne({ chat: chatId }).sort({ createdAt: -1 });
      await Chat.findByIdAndUpdate(chatId, { latestMessage: lastRemainingMsg ? lastRemainingMsg._id : null });
    }

    res.json({ message: "Message deleted successfully", messageId, chatId });
  } catch (error) {
    console.error("Delete Message Error:", error);
    res.status(500).json({ message: error.message });
  }
};