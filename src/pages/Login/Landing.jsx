import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import api from "../../api/axios"; 
import './login.css';

const Landing = ({ setUser }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("expired")) {
            setError("Your session has expired. Please log in again.");
            localStorage.removeItem("user_session");
        }
    }, [location]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(''); 

        try {
            // Ensure the endpoint matches your AuthController @PostMapping("/login")
            const response = await api.post("/auth/login", credentials);

            if (response.data) {
                // Destructure all fields including the NEW empId from our backend update
                const { token, userId, empId, username, role, email } = response.data;

                const userData = {
                    token,
                    userId,    // Database User ID (e.g., 16)
                    empId,     // Database Employee ID (The one needed for Leave actions)
                    username,
                    role,
                    email: email || username 
                };

                // Store the complete session including empId
                localStorage.setItem("user_session", JSON.stringify(userData));
                
                // Update global state if applicable
                if (setUser) setUser(userData);

                const userRole = role.toUpperCase().trim();

                // Navigation logic based on role
                if (userRole === 'ROLE_EMPLOYEE' || userRole === 'EMPLOYEE') {
                    navigate('/employee/dashboard'); 
                } else if (userRole === 'ROLE_ACCOUNTANT' || userRole === 'ACCOUNTANT') {
                    navigate('/accountant/dashboard');
                } else if (userRole === 'ROLE_ADMIN' || userRole === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else {
                    setError("Unknown account role. Please contact support.");
                }
            }
        } catch (err) {
            // Capture specific error messages from your AuthServiceImpl
            setError(err.response?.data?.message || "Server connection error.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="login-header">
                    <h1>NAST</h1>
                    <p>Payroll Management System</p>
                    <span className="badge">SECURE GATEWAY</span>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label>USERNAME</label>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            required
                            autoComplete="username"
                            value={credentials.username}
                            onChange={(e) =>
                                setCredentials({ ...credentials, username: e.target.value })
                            }
                        />
                    </div>

                    <div className="input-group">
                        <label>PASSWORD</label>
                        <div className="input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                value={credentials.password}
                                onChange={(e) =>
                                    setCredentials({ ...credentials, password: e.target.value })
                                }
                            />
                            <span
                                className="password-toggle-icon"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="error-box animate-shake">
                            {error}
                        </div>
                    )}

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? (
                            <span className="spinner">VERIFYING...</span>
                        ) : (
                            'SIGN IN'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <button
                        type="button"
                        className="trouble-link"
                        onClick={() => navigate('/forgot-password')}
                    >
                        Trouble signing in?
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Landing;