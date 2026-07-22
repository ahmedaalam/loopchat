import { useState, useRef, useEffect } from "react";
import axios from "axios";

function OTPVerification({ email, onSuccess, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  // Auto-focus first box on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Timer countdown for resend
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    setError("");
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Handle single digit
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance focus
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Please enter the complete 6-digit OTP code");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp: otpCode,
      });

      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccessMsg("");
    setResending(true);
    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/resend-otp", {
        email,
      });
      setSuccessMsg(data.message || "A new OTP code has been sent to your email.");
      setResendTimer(30);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP code. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <h2 className="auth-title" style={{ textAlign: "center" }}>Verify Your Email</h2>
      <p className="auth-subtitle" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        Enter the 6-digit verification code sent to<br />
        <strong style={{ color: "var(--accent-text)" }}>{email}</strong>
      </p>

      {error && <div className="auth-alert-error">{error}</div>}
      {successMsg && <div className="auth-alert-success">{successMsg}</div>}

      <form onSubmit={handleVerify}>
        <div className="otp-container">
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="otp-box"
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
              />
            ))}
          </div>

          <button
            type="submit"
            className="auth-button"
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={loading || otp.join("").length < 6}
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
        </div>
      </form>

      <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
        <button
          type="button"
          className="otp-resend-btn"
          onClick={handleResend}
          disabled={resendTimer > 0 || resending}
        >
          {resending
            ? "Sending new code..."
            : resendTimer > 0
            ? `Resend OTP code in ${resendTimer}s`
            : "Resend OTP code"}
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-3)",
            fontSize: "0.82rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Registration
        </button>
      </div>
    </div>
  );
}

export default OTPVerification;
