const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  toggleReaction,
  clearCallLogs,
} = require("../controllers/messageController");

router.post("/", protect, sendMessage);
router.delete("/calls/clear", protect, clearCallLogs);
router.get("/:chatId", protect, getMessages);
router.put("/:chatId/read", protect, markAsRead);
router.put("/:messageId/react", protect, toggleReaction);
router.delete("/:messageId", protect, deleteMessage);

module.exports = router;