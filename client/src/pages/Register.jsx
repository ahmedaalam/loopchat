import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LoopChatLogo from "../components/LoopChatLogo";
import OTPVerification from "../components/OTPVerification";

const USERNAME_REGEX = /^[a-z0-9_.]{3,20}$/;

function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null | true | false

  // Steps: "register" | "verify"
  const [step, setStep] = useState("register");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Live-check username availability as user types (debounced by input event)
  const handleUsernameChange = async (val) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_.]/g, "");
    setUsername(cleaned);
    setUsernameAvailable(null);

    if (fieldErrors.username) {
      setFieldErrors((prev) => ({ ...prev, username: "" }));
    }

    if (!cleaned || !USERNAME_REGEX.test(cleaned)) return;

    setUsernameChecking(true);
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/users/check-username?username=${cleaned}`
      );
      setUsernameAvailable(data.available);
      if (!data.available) {
        setFieldErrors((prev) => ({ ...prev, username: "This username is already taken" }));
      }
    } catch {
      // silently ignore availability check errors
    } finally {
      setUsernameChecking(false);
    }
  };

  const validate = () => {
    const errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      errors.name = "Full name must be at least 2 characters long";
    }

    if (!username) {
      errors.username = "Username is required";
    } else if (!USERNAME_REGEX.test(username)) {
      errors.username = "Username must be 3-20 characters: letters, numbers, _ or .";
    } else if (usernameAvailable === false) {
      errors.username = "This username is already taken";
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
      await axios.post("http://localhost:5000/api/auth/register", {
        name: trimmedName,
        username,
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

              {/* Username */}
              <div className="input-group">
                <label className="input-label">Username</label>
                <div className="username-input-wrapper">
                  <span className="username-at-prefix">@</span>
                  <input
                    className={`auth-input username-input ${
                      fieldErrors.username
                        ? "invalid"
                        : usernameAvailable === true
                        ? "valid"
                        : ""
                    }`}
                    placeholder="john_doe"
                    type="text"
                    value={username}
                    maxLength={20}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                  />
                  {usernameChecking && (
                    <span className="username-status checking">Checking...</span>
                  )}
                  {!usernameChecking && usernameAvailable === true && (
                    <span className="username-status available">✓ Available</span>
                  )}
                  {!usernameChecking && usernameAvailable === false && (
                    <span className="username-status taken">✗ Taken</span>
                  )}
                </div>
                <span className="username-hint">
                  3–20 characters · letters, numbers, _ and . only
                </span>
                {fieldErrors.username && (
                  <span className="field-error">{fieldErrors.username}</span>
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

              <button
                type="submit"
                className="auth-button"
                disabled={loading || usernameChecking}
              >
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