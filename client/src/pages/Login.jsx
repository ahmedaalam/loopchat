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

  // Steps: 'login' | 'forgot-email' | 'forgot-otp' | 'reset-new-password' | 'verify'
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

  const validateForgotOTP = () => {
    const errors = {};
    const trimmedOtp = resetOtp.trim();

    if (!trimmedOtp || trimmedOtp.length !== 6) {
      errors.resetOtp = "Please enter a valid 6-digit OTP code";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateNewPassword = () => {
    const errors = {};

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

  // 1. Submit Login
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

  // 2. Step 1: Request Forgot Password OTP
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

      setSuccessMessage("Verification OTP code sent to your email!");
      setStep("forgot-otp");
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.errors) {
        setFieldErrors(resData.errors);
      } else {
        setGeneralError(resData?.message || "Failed to send reset code. Please check your email.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Step 2: Verify OTP Code ONLY
  const submitVerifyOTPHandler = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForgotOTP()) return;

    setLoading(true);

    try {
      await axios.post("http://localhost:5000/api/auth/verify-reset-otp", {
        email: resetEmail.trim().toLowerCase(),
        otp: resetOtp.trim(),
      });

      setSuccessMessage("OTP verified! Please set your new password below.");
      setStep("reset-new-password");
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.errors) {
        setFieldErrors(resData.errors);
      } else {
        setGeneralError(resData?.message || "Invalid or expired OTP code.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Step 3: Update New Password
  const submitNewPasswordHandler = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateNewPassword()) return;

    setLoading(true);

    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/reset-password", {
        email: resetEmail.trim().toLowerCase(),
        otp: resetOtp.trim(),
        newPassword,
      });

      setEmail(resetEmail);
      setSuccessMessage(data.message || "Password updated successfully! Please sign in with your new password.");
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
        setGeneralError(resData?.message || "Failed to update password.");
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
      setSuccessMessage("A fresh OTP verification code has been sent to your email!");
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
            
            {successMessage && (
              <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#4ade80", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {successMessage}
              </div>
            )}
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

        {/* ─── 2. FORGOT PASSWORD STEP 1: ENTER REGISTERED EMAIL ─── */}
        {step === "forgot-email" && (
          <>
            <h2 className="auth-title">Forgot Password</h2>
            <p className="auth-subtitle">Enter your registered email address to receive a 6-digit OTP verification code.</p>

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
                {loading ? "Sending Code..." : "Send Reset Code"}
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

        {/* ─── 3. FORGOT PASSWORD STEP 2: FILL OTP CODE ONLY ─── */}
        {step === "forgot-otp" && (
          <>
            <h2 className="auth-title">Enter Verification Code</h2>
            <p className="auth-subtitle">Enter the 6-digit OTP code sent to <strong style={{ color: "var(--accent-text)" }}>{resetEmail}</strong>.</p>

            {successMessage && (
              <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#4ade80", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {successMessage}
              </div>
            )}
            {generalError && <div className="auth-alert-error">{generalError}</div>}

            <form onSubmit={submitVerifyOTPHandler} className="auth-form" noValidate>
              <div className="input-group">
                <label className="input-label">6-Digit OTP Code</label>
                <input
                  className={`auth-input ${fieldErrors.resetOtp ? "invalid" : ""}`}
                  placeholder="123456"
                  type="text"
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => handleInputChange("resetOtp", e.target.value.replace(/[^0-9]/g, ""))}
                  style={{ letterSpacing: "6px", fontWeight: "700", textAlign: "center", fontSize: "1.2rem" }}
                  autoFocus
                />
                {fieldErrors.resetOtp && (
                  <span className="field-error">{fieldErrors.resetOtp}</span>
                )}
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "Verifying Code..." : "Verify OTP Code"}
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

        {/* ─── 4. FORGOT PASSWORD STEP 3: SET NEW PASSWORD UI ─── */}
        {step === "reset-new-password" && (
          <>
            <h2 className="auth-title">Set New Password</h2>
            <p className="auth-subtitle">Create a new strong password for your account.</p>

            {successMessage && (
              <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#4ade80", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {successMessage}
              </div>
            )}
            {generalError && <div className="auth-alert-error">{generalError}</div>}

            <form onSubmit={submitNewPasswordHandler} className="auth-form" noValidate>
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
                {loading ? "Updating Password..." : "Update Password"}
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
                ← Cancel
              </button>
            </p>
          </>
        )}

        {/* ─── 5. VERIFY REGISTRATION OTP STEP ─── */}
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