const Chat = require("../models/Chat");
const FriendRequest = require("../models/FriendRequest");

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
    if (chat.deletedFor?.some((id) => id.toString() === req.user.toString())) {
      await Chat.findByIdAndUpdate(chat._id, {
        $pull: { deletedFor: req.user },
      });
    }
    return res.json(chat);
  }

  // ── Friendship guard: only accepted friends can start a new 1-on-1 chat ──
  const friendship = await FriendRequest.findOne({
    $or: [
      { sender: req.user, receiver: userId, status: "accepted" },
      { sender: userId, receiver: req.user, status: "accepted" },
    ],
  });

  if (!friendship) {
    return res.status(403).json({
      message: "You must be connected with this user before messaging them.",
    });
  }

  let newChat = await Chat.create({
    chatName: "direct",
    isGroupChat: false,
    users: [req.user, userId],
  });

  newChat = await newChat.populate("users", "-password");
  res.status(201).json(newChat);
};

// GET all chats for logged-in user (excluding chats deleted by current user)
exports.fetchChats = async (req, res) => {
  try {
    let chats = await Chat.find({
      users: { $in: [req.user] },
      deletedFor: { $ne: req.user },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name email" },
      })
      .sort({ updatedAt: -1 });

    // Hide latestMessage preview if it was created before user's clearedAt timestamp
    chats = chats.map((chat) => {
      const chatObj = chat.toObject();
      const userClearInfo = chat.clearedBy?.find(
        (c) => c.user && c.user.toString() === req.user.toString()
      );
      if (userClearInfo && chatObj.latestMessage) {
        const msgTime = new Date(chatObj.latestMessage.createdAt).getTime();
        const clearedTime = new Date(userClearInfo.clearedAt).getTime();
        if (msgTime <= clearedTime) {
          chatObj.latestMessage = null;
        }
      }
      return chatObj;
    });

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

// CLEAR CHAT - User-specific clear chat (WhatsApp style)
// Updates clearedAt timestamp for req.user without deleting messages for other participants or from database
exports.clearChat = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isMember = chat.users.some(
      (u) => u.toString() === req.user.toString()
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "Not authorized to clear this chat" });
    }

    // Update or push clearedBy timestamp for requesting user
    const existingIndex = chat.clearedBy.findIndex(
      (item) => item.user && item.user.toString() === req.user.toString()
    );

    if (existingIndex > -1) {
      chat.clearedBy[existingIndex].clearedAt = new Date();
    } else {
      chat.clearedBy.push({
        user: req.user,
        clearedAt: new Date(),
      });
    }

    await chat.save();

    res.json({ message: "Chat cleared successfully", chatId });
  } catch (error) {
    console.error("Clear Chat Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE CHAT - User-specific delete chat (WhatsApp style)
// Adds req.user to deletedFor and records clear timestamp without deleting database records or affecting other participants
exports.deleteChat = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isMember = chat.users.some(
      (u) => u.toString() === req.user.toString()
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this chat" });
    }

    // Update or push clearedBy timestamp for requesting user
    const existingIndex = chat.clearedBy.findIndex(
      (item) => item.user && item.user.toString() === req.user.toString()
    );

    if (existingIndex > -1) {
      chat.clearedBy[existingIndex].clearedAt = new Date();
    } else {
      chat.clearedBy.push({
        user: req.user,
        clearedAt: new Date(),
      });
    }

    // Add user to deletedFor list
    if (!chat.deletedFor.some((id) => id.toString() === req.user.toString())) {
      chat.deletedFor.push(req.user);
    }

    await chat.save();

    res.json({ message: "Chat deleted successfully", chatId });
  } catch (error) {
    console.error("Delete Chat Error:", error);
    res.status(500).json({ message: error.message });
  }
};