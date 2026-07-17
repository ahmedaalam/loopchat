const Chat = require("../models/Chat");

// create or access chat
exports.accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send("UserId not sent");
  }

  let chat = await Chat.findOne({
    users: { $all: [req.user, userId] },
  });

  if (chat) {
    return res.json(chat);
  }

  const newChat = await Chat.create({
    users: [req.user, userId],
  });

  res.status(201).json(newChat);
};

// GET all chats for logged-in user
exports.fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      users: { $in: [req.user] },
    })
      .populate("users", "-password")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};