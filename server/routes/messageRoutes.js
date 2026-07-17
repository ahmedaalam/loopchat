const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { sendMessage, getMessages, markAsRead } = require("../controllers/messageController");

router.post("/", protect, sendMessage);
router.get("/:chatId", protect, getMessages);
router.put("/:chatId/read", protect, markAsRead);

module.exports = router;