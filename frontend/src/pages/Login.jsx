import { useState } from "react";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { setCredentials } from "../features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiLock } from "react-icons/fi";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", {
        username,
        password,
      });

      dispatch(
        setCredentials({
          user: res.data.user,
          accessToken: res.data.accessToken,
        })
      );

      navigate("/");
      
    } catch (err) {
      console.log(err);
      setError("Invalid username or password. Please try again.");
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
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-box">{error}</div>}

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

          <div>
            <a href="#forgot" className="forgot-password">
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}
          <button type="submit" className="login-btn">
            <span className="btn-glow-bg"></span>
            <span className="btn-text">LOG IN</span>
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
          New to Echo?{" "}
          <Link to="/register" className="register-link">
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
}