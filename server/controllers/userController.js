const User = require("../models/User");

// Get or search all users except current logged-in user
exports.getAllUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
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

// Update user profile (name, bio, avatar)
exports.updateProfile = async (req, res) => {
  const { name, bio, avatar } = req.body;
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    const updatedUser = await User.findById(req.user).select("-password");
    res.json(updatedUser);
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
