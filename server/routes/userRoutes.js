const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const {
  getAllUsers,
  updateProfile,
  getUserProfile,
  blockUser,
  unblockUser,
} = require("../controllers/userController");

router.get("/", protect, getAllUsers);
router.put("/profile", protect, updateProfile);
router.get("/profile/:userId", protect, getUserProfile);
router.post("/block/:targetUserId", protect, blockUser);
router.post("/unblock/:targetUserId", protect, unblockUser);

module.exports = router;