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

        // CRITICAL: Clear existing session before attempting a new login
        // This prevents old tokens from being sent in the headers
        localStorage.removeItem("user_session");

        try {
            const response = await api.post('/auth/login', credentials);
            const userData = response.data;

            localStorage.setItem("user_session", JSON.stringify(userData));
            setUser(userData);

            const role = userData.role;
            if (role === 'ROLE_ADMIN') {
                navigate('/admin/dashboard');
            } else if (role === 'ROLE_ACCOUNTANT') {
                navigate('/accountant/dashboard');
            } else if (role === 'ROLE_EMPLOYEE') {
                navigate('/employee/dashboard');
            } else {
                setError("Access Denied: Role not recognized.");
            }

        } catch (err) {
            if (err.response) {
                // If the server returns 401, it's either bad credentials 
                // or the login route itself is protected.
                if (err.response.status === 401) {
                    setError("Invalid username or password.");
                } else {
                    const backendError = typeof err.response.data === 'string' 
                        ? err.response.data 
                        : err.response.data.message;
                    setError(backendError || "An error occurred during login.");
                }
            } else {
                setError("Server connection error. Check if backend is running on 8080.");
            }
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