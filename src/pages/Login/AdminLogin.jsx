import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";   // Make sure path matches your project

export default function AdminLogin({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Trim inputs to avoid trailing/leading space issues
      const payload = {
        usernameOrEmail: email.trim(),
        password: password.trim(),
      };

      console.log("Login payload:", payload);

      const response = await api.post("/auth/login", payload);

      console.log("Login response:", response.data);

      // Save admin session
      localStorage.setItem("user_session", JSON.stringify(response.data));
      setUser(response.data);

      // Redirect to admin dashboard
      navigate("/admin/dashboard");

    } catch (err) {
      console.error("Login error:", err);

      // Show backend error message if available
      if (err.response && err.response.data) {
        const message = err.response.data.message || "Something went wrong";
        alert(message);
      } else {
        alert("Something went wrong. Please check the backend or network.");
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">NAST</div>
          <h2>Welcome Back</h2>
          <p>Please enter your admin credentials</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username or Email */}
          <div className="form-group">
            <label>Admin Email or Username</label>
            <input
              type="text"  // Accepts both username and email
              placeholder="Enter username or email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password with show/hide */}
          <div className="form-group" style={{ position: "relative" }}>
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: "30px" }} // space for eye icon
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "35px",
                cursor: "pointer",
                userSelect: "none"
              }}
            >
              {showPassword ? "👁️‍🗨️" : "👁️"}
            </span>
          </div>

          <button type="submit" className="btn-primary">
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          <button onClick={() => navigate("/")} className="btn-text">
            ← Back to Portal
          </button>
          <a href="/admin/forgot-password">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
}
