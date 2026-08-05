const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

exports.sendMessage = async (req, res) => {
  const { content, chatId, file, replyTo } = req.body;

  if ((!content && !file) || !chatId) {
    return res
      .status(400)
      .json({ message: "Invalid data: content or file attachment required" });
  }

  // Check if chat is a 1-on-1 chat and if either user has blocked the other
  const targetChat = await Chat.findById(chatId).populate("users");
  if (targetChat && !targetChat.isGroupChat) {
    const recipient = targetChat.users.find(
      (u) => u._id.toString() !== req.user.toString(),
    );
    const currentUser = await User.findById(req.user);
    if (recipient && currentUser) {
      const isBlocked = currentUser.blockedUsers?.some(
        (id) => id.toString() === recipient._id.toString(),
      );
      const isBlockedBy = recipient.blockedUsers?.some(
        (id) => id.toString() === req.user.toString(),
      );
      if (isBlocked || isBlockedBy) {
        return res
          .status(403)
          .json({ message: "Cannot send message to a blocked contact" });
      }

      const friendship = await FriendRequest.findOne({
        $or: [
          { sender: req.user, receiver: recipient._id, status: "accepted" },
          { sender: recipient._id, receiver: req.user, status: "accepted" },
        ],
      });

      if (!friendship) {
        return res.status(403).json({
          message: `You are no longer friend with ${recipient.name || "this user"}.`,
        });
      }
    }
  }

  let message = await Message.create({
    sender: req.user,
    content: content || "",
    file: file || null,
    chat: chatId,
    readBy: [req.user],
    replyTo: replyTo || null,
  });

  message = await message.populate("sender", "name email avatar bio");
  message = await message.populate({
    path: "chat",
    populate: { path: "users", select: "name email avatar" },
  });
  if (message.replyTo) {
    message = await message.populate({
      path: "replyTo",
      populate: { path: "sender", select: "name email avatar" },
    });
  }

  // Update latest message in Chat
  await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

  res.status(201).json(message);
};

// GET all messages of a chat
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name email avatar bio")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "name email avatar" },
      })
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
        readBy: { $ne: req.user },
      },
      {
        $addToSet: { readBy: req.user },
      },
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

    const senderId =
      typeof message.sender === "object"
        ? message.sender._id || message.sender.id
        : message.sender;
    const currentUserId =
      typeof req.user === "object" ? req.user._id || req.user.id : req.user;

    if (
      !senderId ||
      !currentUserId ||
      senderId.toString() !== currentUserId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this message" });
    }

    // Delete attachment file from disk if present
    if (message.file && message.file.url) {
      const filename = path.basename(message.file.url);
      const filePath = path.join(__dirname, "../uploads", filename);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err)
            console.error("Failed to delete attachment file from disk:", err);
        });
      }
    }

    const chatId = message.chat;
    await Message.findByIdAndDelete(messageId);

    // Update latestMessage in Chat if deleted message was the latest one
    const chat = await Chat.findById(chatId);
    if (
      chat &&
      chat.latestMessage &&
      chat.latestMessage.toString() === messageId.toString()
    ) {
      const lastRemainingMsg = await Message.findOne({ chat: chatId }).sort({
        createdAt: -1,
      });
      await Chat.findByIdAndUpdate(chatId, {
        latestMessage: lastRemainingMsg ? lastRemainingMsg._id : null,
      });
    }

    return res
      .status(200)
      .json({ message: "Message deleted successfully", messageId, chatId });
  } catch (error) {
    console.error("Delete Message Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// TOGGLE reaction on a message
exports.toggleReaction = async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  if (!emoji) {
    return res.status(400).json({ message: "Emoji reaction is required" });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const userId =
      typeof req.user === "object" ? req.user._id || req.user.id : req.user;

    const existingIndex = message.reactions.findIndex(
      (r) => r.user.toString() === userId.toString(),
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        // Remove reaction if same emoji is clicked
        message.reactions.splice(existingIndex, 1);
      } else {
        // Change reaction emoji
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      // Add new reaction
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();
    const updatedMessage = await Message.findById(messageId).populate(
      "sender",
      "name email",
    );

    return res.status(200).json(updatedMessage);
  } catch (error) {
    console.error("Toggle Reaction Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
