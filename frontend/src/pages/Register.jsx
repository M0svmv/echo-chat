import { useState } from "react";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { setCredentials } from "../features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiLock, FiMail } from "react-icons/fi";
import "./Login.css"; // هنستخدم نفس CSS بتاع اللوجين

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await api.post("/auth/register", {
        firstName,
        lastName,
        username,
        email,
        password,
      });

      dispatch(
        setCredentials({
          user: res.data.user,
          accessToken: res.data.accessToken,
        })
      );

      navigate("/");
    } catch (error) {
      console.log(error);
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="logo-wrapper">
          <div className="logo-glow"></div>

          <img
            src="../../public/assets/echoLogo.png"
            alt="Echo Logo"
            className="logo-img"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />

          <div className="logo-fallback">...</div>
        </div>

        {/* Title */}
        <h1 className="login-title">ECHO</h1>

        <p className="login-tagline">
          SAY IT. <span className="share-text">SHARE IT.</span>{" "}
          <span className="echo-text">ECHO IT.</span>
        </p>

        {/* Form */}
        <form onSubmit={handleRegister} className="login-form">
          {error && <div className="error-box">{error}</div>}
          <div className="full-name-wrapper">
          {/* First Name */}
          <div className="input-wrapper">
            <span className="input-icon">
              <FiUser />
            </span>

            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="input-field input-field-username"
            />
          </div>

          {/* Last Name */}
          <div className="input-wrapper">
            <span className="input-icon">
              <FiUser />
            </span>

            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="input-field input-field-username"
            />
          </div>
          </div>

          {/* Username */}
          <div className="input-wrapper">
            <span className="input-icon">
              <FiUser />
            </span>

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input-field input-field-username"
            />
          </div>

          {/* Email */}
          <div className="input-wrapper">
            <span className="input-icon">
              <FiMail />
            </span>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field input-field-username"
            />
          </div>

          {/* Password */}
          <div className="input-wrapper">
            <span className="input-icon">
              <FiLock />
            </span>

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field input-field-password"
            />
          </div>

          {/* Confirm Password */}
          <div className="input-wrapper">
            <span className="input-icon">
              <FiLock />
            </span>

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input-field input-field-password"
            />
          </div>

          {/* Divider */}
        <div className="divider-wrapper">
          
          
        </div>

          {/* Button */}
          <button type="submit" className="login-btn">
            <span className="btn-glow-bg"></span>
            <span className="btn-text">REGISTER</span>
          </button>
        </form>

        {/* Divider */}
        <div className="divider-wrapper">
          <div className="divider-line"></div>
          <span className="divider-text">or</span>
          <div className="divider-line"></div>
        </div>

        {/* Footer */}
        <p className="footer-text">
          Already have an account?{" "}
          <Link to="/login" className="register-link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}