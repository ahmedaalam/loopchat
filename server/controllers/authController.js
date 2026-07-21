const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendOTPEmail = require("../utils/sendEmail");

// Standard email regex format (e.g. example@gmail.com)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper: Generate 6-digit numeric OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    // 1. Validation checks
    const errors = {};

    if (!name || String(name).trim().length < 2) {
      errors.name = "Full name must be at least 2 characters long";
    }

    const trimmedEmail = email ? String(email).trim().toLowerCase() : "";
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address (e.g. example@gmail.com)";
    }

    if (!password || String(password).length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors, message: "Validation failed" });
    }

    // 2. Check existing user
    let user = await User.findOne({ email: trimmedEmail });

    if (user && user.isVerified) {
      return res.status(400).json({
        errors: { email: "An account with this email already exists" },
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    if (user && !user.isVerified) {
      // Update existing unverified user
      user.name = String(name).trim();
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name: String(name).trim(),
        email: trimmedEmail,
        password: hashedPassword,
        isVerified: false,
        otp,
        otpExpiresAt,
      });
    }

    // 3. Send OTP email
    await sendOTPEmail(trimmedEmail, otp);

    res.status(200).json({
      message: "Verification OTP code sent to your email",
      email: trimmedEmail,
      requiresOtp: true,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: error.message || "Server error during registration" });
  }
};

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP code are required" });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedOtp = String(otp).trim();

    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified. You can log in." });
    }

    if (!user.otp || user.otp !== trimmedOtp) {
      return res.status(400).json({ message: "Invalid OTP verification code" });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP code has expired. Please request a new one." });
    }

    // Mark user verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Email verified successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: error.message || "Server error during OTP verification" });
  }
};

// ─── RESEND OTP ───────────────────────────────────────────────────────────────
exports.resendOTP = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified. You can log in." });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendOTPEmail(trimmedEmail, otp);

    res.status(200).json({
      message: "A new OTP code has been sent to your email",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: error.message || "Server error during OTP resend" });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    const errors = {};

    const trimmedEmail = email ? String(email).trim().toLowerCase() : "";
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password || String(password).length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors, message: "Validation failed" });
    }

    // Find user
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(400).json({
        errors: { email: "Invalid email or password" },
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        errors: { password: "Invalid email or password" },
        message: "Invalid email or password",
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      // Send fresh OTP so user can verify
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      await sendOTPEmail(trimmedEmail, otp);

      return res.status(403).json({
        isUnverified: true,
        email: trimmedEmail,
        message: "Email address is not verified. A new verification OTP code has been sent to your email.",
      });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: error.message || "Server error during login" });
  }
};