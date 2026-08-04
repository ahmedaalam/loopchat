const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");

// ─── Send a friend / contact request ─────────────────────────────────────────
exports.sendRequest = async (req, res) => {
  const senderId = req.user;
  const { userId: receiverId } = req.params;

  try {
    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({ message: "You cannot send a request to yourself." });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "User not found." });

    // Check if any request already exists in either direction
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ message: "You are already connected." });
      }
      if (existing.status === "pending") {
        return res.status(400).json({ message: "A request already exists between you two." });
      }
      // Declined — allow re-sending by updating the existing doc
      existing.sender = senderId;
      existing.receiver = receiverId;
      existing.status = "pending";
      await existing.save();
      const populated = await existing.populate("sender receiver", "name email avatar");
      return res.status(200).json(populated);
    }

    const request = await FriendRequest.create({ sender: senderId, receiver: receiverId });
    const populated = await request.populate("sender receiver", "name email avatar");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Accept a friend request ──────────────────────────────────────────────────
exports.acceptRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await FriendRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found." });
    if (request.receiver.toString() !== req.user.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request is no longer pending." });
    }

    request.status = "accepted";
    await request.save();
    const populated = await request.populate("sender receiver", "name email avatar");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Decline a friend request ─────────────────────────────────────────────────
exports.declineRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await FriendRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found." });
    if (request.receiver.toString() !== req.user.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    request.status = "declined";
    await request.save();
    res.json({ message: "Request declined.", requestId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Cancel a sent request (by sender) ───────────────────────────────────────
exports.cancelRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await FriendRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found." });
    if (request.sender.toString() !== req.user.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    await FriendRequest.findByIdAndDelete(requestId);
    res.json({ message: "Request cancelled.", requestId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get incoming & outgoing requests for current user ───────────────────────
exports.getMyRequests = async (req, res) => {
  try {
    const incoming = await FriendRequest.find({
      receiver: req.user,
      status: "pending",
    }).populate("sender", "name email avatar");

    const outgoing = await FriendRequest.find({
      sender: req.user,
      status: "pending",
    }).populate("receiver", "name email avatar");

    res.json({ incoming, outgoing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get accepted friends list ────────────────────────────────────────────────
exports.getFriends = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      $or: [{ sender: req.user }, { receiver: req.user }],
      status: "accepted",
    })
      .populate("sender", "name email avatar")
      .populate("receiver", "name email avatar");

    const friends = requests.map((r) =>
      r.sender._id.toString() === req.user.toString() ? r.receiver : r.sender
    );

    res.json(friends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Remove a friend (delete accepted request) ────────────────────────────────
exports.removeFriend = async (req, res) => {
  const { userId } = req.params;

  try {
    const deleted = await FriendRequest.findOneAndDelete({
      $or: [
        { sender: req.user, receiver: userId, status: "accepted" },
        { sender: userId, receiver: req.user, status: "accepted" },
      ],
    });

    if (!deleted) return res.status(404).json({ message: "Friendship not found." });
    res.json({ message: "Friend removed.", userId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get friendship status between current user and a target user ─────────────
exports.getFriendshipStatus = async (req, res) => {
  const { userId } = req.params;

  try {
    const request = await FriendRequest.findOne({
      $or: [
        { sender: req.user, receiver: userId },
        { sender: userId, receiver: req.user },
      ],
    });

    if (!request) return res.json({ status: "none" });

    res.json({
      status: request.status,
      requestId: request._id,
      isSender: request.sender.toString() === req.user.toString(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
