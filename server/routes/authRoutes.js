const router = require("express").Router();
const { register, login, verifyOTP, resendOTP, forgotPassword, verifyResetOTP, resetPassword } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);

module.exports = router;