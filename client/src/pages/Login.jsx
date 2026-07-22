import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LoopChatLogo from "../components/LoopChatLogo";
import OTPVerification from "../components/OTPVerification";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Forgot / Reset password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Steps: 'login' | 'forgot-email' | 'reset-password' | 'verify'
  const [step, setStep] = useState("login");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateLogin = () => {
    const errors = {};
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      errors.email = "Email address is required";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address (e.g. example@gmail.com)";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForgotEmail = () => {
    const errors = {};
    const trimmedEmail = resetEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      errors.resetEmail = "Email address is required";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.resetEmail = "Please enter a valid email address (e.g. example@gmail.com)";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateResetPassword = () => {
    const errors = {};

    if (!resetOtp.trim() || resetOtp.trim().length !== 6) {
      errors.resetOtp = "Please enter a valid 6-digit OTP code";
    }

    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (generalError) setGeneralError("");
    if (successMessage) setSuccessMessage("");

    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "resetEmail") setResetEmail(value);
    if (field === "resetOtp") setResetOtp(value);
    if (field === "newPassword") setNewPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);
  };

  // Submit Login
  const submitLoginHandler = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateLogin()) return;

    const trimmedEmail = email.trim().toLowerCase();
    setLoading(true);

    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/login", {
        email: trimmedEmail,
        password,
      });

      localStorage.setItem("user", JSON.stringify(data));
      window.location.href = "/chat";
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.isUnverified) {
        setUnverifiedEmail(resData.email || trimmedEmail);
        setStep("verify");
      } else if (resData?.errors) {
        setFieldErrors(resData.errors);
      } else {
        setGeneralError(resData?.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  // Request Forgot Password OTP
  const submitForgotEmailHandler = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForgotEmail()) return;

    const trimmedEmail = resetEmail.trim().toLowerCase();
    setLoading(true);

    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email: trimmedEmail,
      });

      setSuccessMessage("Password reset OTP code has been sent to your email!");
      setStep("reset-password");
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.errors) {
        setFieldErrors(resData.errors);
      } else {
        setGeneralError(resData?.message || "Failed to send password reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit New Password with OTP
  const submitResetPasswordHandler = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateResetPassword()) return;

    setLoading(true);

    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/reset-password", {
        email: resetEmail.trim().toLowerCase(),
        otp: resetOtp.trim(),
        newPassword,
      });

      setEmail(resetEmail);
      setSuccessMessage(data.message || "Password reset successfully! You can now sign in.");
      setStep("login");
      setPassword("");
      setResetOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.errors) {
        setFieldErrors(resData.errors);
      } else {
        setGeneralError(resData?.message || "Failed to reset password. Please check your OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend Reset OTP
  const handleResendResetOTP = async () => {
    if (!resetEmail) return;
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email: resetEmail.trim().toLowerCase(),
      });
      setSuccessMessage("A fresh OTP reset code has been sent to your email!");
    } catch (err) {
      setGeneralError(err.response?.data?.message || "Failed to resend OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = (data) => {
    localStorage.setItem("user", JSON.stringify(data));
    window.location.href = "/chat";
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "center" }}>
          <LoopChatLogo size={40} textSize="1.5rem" />
        </div>

        {/* ─── 1. SIGN IN STEP ─── */}
        {step === "login" && (
          <>
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to continue to LoopChat</p>
            
            {successMessage && <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#4ade80", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>{successMessage}</div>}
            {generalError && <div className="auth-alert-error">{generalError}</div>}

            <form onSubmit={submitLoginHandler} className="auth-form" noValidate>
              {/* Email Address */}
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  className={`auth-input ${fieldErrors.email ? "invalid" : ""}`}
                  placeholder="example@gmail.com"
                  type="email"
                  value={email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
                {fieldErrors.email && (
                  <span className="field-error">{fieldErrors.email}</span>
                )}
              </div>

              {/* Password */}
              <div className="input-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="input-label">Password</label>
                  <button
                    type="button"
                    className="forgot-password-link"
                    onClick={() => {
                      setStep("forgot-email");
                      setResetEmail(email);
                      setFieldErrors({});
                      setGeneralError("");
                      setSuccessMessage("");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  className={`auth-input ${fieldErrors.password ? "invalid" : ""}`}
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                />
                {fieldErrors.password && (
                  <span className="field-error">{fieldErrors.password}</span>
                )}
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="auth-link">
              Don't have an account? <Link to="/register">Register here</Link>
            </p>
          </>
        )}

        {/* ─── 2. FORGOT PASSWORD: ENTER EMAIL ─── */}
        {step === "forgot-email" && (
          <>
            <h2 className="auth-title">Forgot Password</h2>
            <p className="auth-subtitle">Enter your registered email address to receive a 6-digit OTP code.</p>

            {generalError && <div className="auth-alert-error">{generalError}</div>}

            <form onSubmit={submitForgotEmailHandler} className="auth-form" noValidate>
              <div className="input-group">
                <label className="input-label">Registered Email Address</label>
                <input
                  className={`auth-input ${fieldErrors.resetEmail ? "invalid" : ""}`}
                  placeholder="example@gmail.com"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => handleInputChange("resetEmail", e.target.value)}
                />
                {fieldErrors.resetEmail && (
                  <span className="field-error">{fieldErrors.resetEmail}</span>
                )}
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "Sending OTP Code..." : "Send Reset Code"}
              </button>
            </form>

            <p className="auth-link">
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => {
                  setStep("login");
                  setFieldErrors({});
                  setGeneralError("");
                }}
              >
                ← Back to Sign In
              </button>
            </p>
          </>
        )}

        {/* ─── 3. RESET PASSWORD: ENTER OTP & NEW PASSWORD ─── */}
        {step === "reset-password" && (
          <>
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">Enter the 6-digit code sent to <strong style={{ color: "var(--accent-text)" }}>{resetEmail}</strong> and your new password.</p>

            {successMessage && <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#4ade80", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>{successMessage}</div>}
            {generalError && <div className="auth-alert-error">{generalError}</div>}

            <form onSubmit={submitResetPasswordHandler} className="auth-form" noValidate>
              {/* OTP Code */}
              <div className="input-group">
                <label className="input-label">6-Digit OTP Code</label>
                <input
                  className={`auth-input ${fieldErrors.resetOtp ? "invalid" : ""}`}
                  placeholder="123456"
                  type="text"
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => handleInputChange("resetOtp", e.target.value)}
                  style={{ letterSpacing: "4px", fontWeight: "600" }}
                />
                {fieldErrors.resetOtp && (
                  <span className="field-error">{fieldErrors.resetOtp}</span>
                )}
              </div>

              {/* New Password */}
              <div className="input-group">
                <label className="input-label">New Password</label>
                <input
                  className={`auth-input ${fieldErrors.newPassword ? "invalid" : ""}`}
                  placeholder="••••••••"
                  type="password"
                  value={newPassword}
                  onChange={(e) => handleInputChange("newPassword", e.target.value)}
                />
                {fieldErrors.newPassword && (
                  <span className="field-error">{fieldErrors.newPassword}</span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="input-group">
                <label className="input-label">Confirm New Password</label>
                <input
                  className={`auth-input ${fieldErrors.confirmPassword ? "invalid" : ""}`}
                  placeholder="••••••••"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                />
                {fieldErrors.confirmPassword && (
                  <span className="field-error">{fieldErrors.confirmPassword}</span>
                )}
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "Resetting Password..." : "Reset Password"}
              </button>
            </form>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem" }}>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => {
                  setStep("forgot-email");
                  setFieldErrors({});
                  setGeneralError("");
                }}
              >
                ← Back
              </button>

              <button
                type="button"
                className="forgot-password-link"
                onClick={handleResendResetOTP}
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </>
        )}

        {/* ─── 4. VERIFY REGISTRATION OTP STEP ─── */}
        {step === "verify" && (
          <OTPVerification
            email={unverifiedEmail}
            onSuccess={handleOTPSuccess}
            onBack={() => setStep("login")}
          />
        )}
      </div>
    </div>
  );
}

export default Login;