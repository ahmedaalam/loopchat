import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LoopChatLogo from "../components/LoopChatLogo";
import OTPVerification from "../components/OTPVerification";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP step state if user email is unverified
  const [step, setStep] = useState("login");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
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

  const handleInputChange = (field, value) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (generalError) setGeneralError("");

    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) return;

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

        {step === "login" ? (
          <>
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to continue to LoopChat</p>
            
            {generalError && <div className="auth-alert-error">{generalError}</div>}

            <form onSubmit={submitHandler} className="auth-form" noValidate>
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
                <label className="input-label">Password</label>
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
        ) : (
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