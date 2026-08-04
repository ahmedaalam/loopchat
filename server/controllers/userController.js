const User = require("../models/User");

const USERNAME_REGEX = /^[a-z0-9_.]{3,20}$/;

// Get or search all users except current logged-in user
exports.getAllUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { username: { $regex: req.query.search.replace(/^@/, ""), $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(keyword)
      .find({ _id: { $ne: req.user } })
      .select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile (name, username, bio, avatar)
exports.updateProfile = async (req, res) => {
  const { name, username, bio, avatar } = req.body;
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    if (username !== undefined) {
      const trimmed = String(username).trim().toLowerCase();
      if (!USERNAME_REGEX.test(trimmed)) {
        return res.status(400).json({
          errors: { username: "Username must be 3-20 characters: letters, numbers, _ or ." },
          message: "Invalid username format",
        });
      }
      // Check uniqueness (exclude self)
      const existing = await User.findOne({ username: trimmed, _id: { $ne: req.user } });
      if (existing) {
        return res.status(400).json({
          errors: { username: "This username is already taken" },
          message: "Username is already taken",
        });
      }
      user.username = trimmed;
    }

    await user.save();
    const updatedUser = await User.findById(req.user).select("-password");
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public: Check username availability (used during registration live-check)
exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ available: false, message: "Username is required" });
    }
    const trimmed = String(username).trim().toLowerCase();
    if (!USERNAME_REGEX.test(trimmed)) {
      return res.json({ available: false, message: "Invalid username format" });
    }
    const existing = await User.findOne({ username: trimmed });
    res.json({ available: !existing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUser = await User.findById(req.user);
    const isBlocked = currentUser?.blockedUsers?.some(
      (id) => id.toString() === req.params.userId.toString()
    );
    const isBlockedBy = user?.blockedUsers?.some(
      (id) => id.toString() === req.user.toString()
    );

    res.json({
      ...user.toObject(),
      isBlocked: !!isBlocked,
      isBlockedBy: !!isBlockedBy,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  const { targetUserId } = req.params;
  try {
    if (targetUserId.toString() === req.user.toString()) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    await User.findByIdAndUpdate(req.user, {
      $addToSet: { blockedUsers: targetUserId },
    });

    const updatedUser = await User.findById(req.user).select("-password");
    res.json({ message: "User blocked successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  const { targetUserId } = req.params;
  try {
    await User.findByIdAndUpdate(req.user, {
      $pull: { blockedUsers: targetUserId },
    });

    const updatedUser = await User.findById(req.user).select("-password");
    res.json({ message: "User unblocked successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
