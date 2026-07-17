const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { sendMessage } = require("../controllers/messageController");

router.post("/", protect, sendMessage);

module.exports = router;