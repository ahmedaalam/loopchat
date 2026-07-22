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