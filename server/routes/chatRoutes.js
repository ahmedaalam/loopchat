const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { accessChat, fetchChats } = require("../controllers/chatController");

router.post("/", protect, accessChat);
router.get("/", protect, fetchChats);

module.exports = router;