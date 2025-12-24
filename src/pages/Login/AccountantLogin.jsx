import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios"; // Make sure path matches your project
import "./login.css";

export default function AccountantLogin({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!email.trim() || !password.trim()) {
        alert("Please enter email/username and password");
        return;
      }

     const payload = {
  usernameOrEmail: email.trim(),
  password: password.trim(),
  role: "Accountant" // or "ADMIN", "EMPLOYEE"
};


      const response = await api.post("/auth/login", payload);

      // Validate role on frontend (backend already checks role)
      if (response.data.role.toUpperCase() !== "ACCOUNTANT") {
        alert("Unauthorized role for accountant portal");
        return;
      }

      // Save session
      localStorage.setItem("user_session", JSON.stringify(response.data));
      setUser(response.data);

      // Redirect to accountant dashboard
      navigate("/accountant/dashboard");

    } catch (err) {
      console.error("Accountant login error:", err);

      if (err.response && err.response.data) {
        alert(err.response.data.message || "Something went wrong");
      } else {
        alert("Something went wrong. Please check backend or network");
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">NAST</div>
          <h2>Accountant Portal</h2>
          <p>Manage financial records and payroll</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email or Username</label>
            <input
              type="text"
              placeholder="Enter username or email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ position: "relative" }}>
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: "30px" }}
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
            ← Back to Landing Page
          </button>
          <a href="/accountant/forgot-password">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
}
