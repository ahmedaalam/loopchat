const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { accessChat } = require("../controllers/chatController");

router.post("/", protect, accessChat);

module.exports = router;