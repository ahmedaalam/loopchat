const Chat = require("../models/Chat");

// create or access chat
exports.accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send("UserId not sent");
  }

  let chat = await Chat.findOne({
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