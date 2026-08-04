const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const {
  sendRequest,
  acceptRequest,
  declineRequest,
  cancelRequest,
  getMyRequests,
  getFriends,
  removeFriend,
  getFriendshipStatus,
} = require("../controllers/friendController");

// Send a contact request to a user
router.post("/request/:userId", protect, sendRequest);

// Accept / decline an incoming request
router.post("/accept/:requestId", protect, acceptRequest);
router.post("/decline/:requestId", protect, declineRequest);

// Cancel a sent (pending) request
router.delete("/cancel/:requestId", protect, cancelRequest);

// Get all pending incoming + outgoing requests
router.get("/requests", protect, getMyRequests);

// Get accepted friends list
router.get("/", protect, getFriends);

// Remove an accepted friend
router.delete("/:userId", protect, removeFriend);

// Get friendship status with a specific user
router.get("/status/:userId", protect, getFriendshipStatus);

module.exports = router;
