const Message = require("../models/Message");
const Chat = require("../models/Chat");

exports.sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).send("Invalid data");
  }

  let message = await Message.create({
    sender: req.user,
    content,
    chat: chatId,
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