import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LoopChatLogo from "../components/LoopChatLogo";
import OTPVerification from "../components/OTPVerification";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  // Steps: "register" | "verify"
  const [step, setStep] = useState("register");
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Strict email regex pattern
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      errors.name = "Full name must be at least 2 characters long";
    }

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
    // Clear field error on typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (generalError) setGeneralError("");

    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/register", {
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      setRegisteredEmail(trimmedEmail);
      setStep("verify");
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.errors) {
        setFieldErrors(resData.errors);
      } else {
        setGeneralError(resData?.message || "Registration failed. Please try again.");
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

        {step === "register" ? (
          <>
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Join LoopChat today and connect in real-time</p>

            {generalError && <div className="auth-alert-error">{generalError}</div>}

            <form onSubmit={submitHandler} className="auth-form" noValidate>
              {/* Full Name */}
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  className={`auth-input ${fieldErrors.name ? "invalid" : ""}`}
                  placeholder="John Doe"
                  type="text"
                  value={name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
                {fieldErrors.name && (
                  <span className="field-error">{fieldErrors.name}</span>
                )}
              </div>

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
                  placeholder="At least 8 characters"
                  type="password"
                  value={password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                />
                {fieldErrors.password && (
                  <span className="field-error">{fieldErrors.password}</span>
                )}
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "Sending Verification Code..." : "Create Account"}
              </button>
            </form>

            <p className="auth-link">
              Already have an account? <Link to="/">Sign in here</Link>
            </p>
          </>
        ) : (
          <OTPVerification
            email={registeredEmail}
            onSuccess={handleOTPSuccess}
            onBack={() => setStep("register")}
          />
        )}
      </div>
    </div>
  );
}

export default Register;