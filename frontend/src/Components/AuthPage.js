import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUserGraduate, FaUserTie, FaSignInAlt, FaUserPlus, FaExclamationTriangle } from 'react-icons/fa';
import mgmImg from "../img/mgm1.jpg";
import './CommonStyles.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOTP, setForgotOTP] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (type) => {
    setError("");
    setSuccess("");
    
    if (type === "Register") {
      if (registerForm.password !== registerForm.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      // Validate password length
      if (registerForm.password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }

      // Validate required fields
      if (!registerForm.email || !registerForm.password || !registerForm.role) {
        setError("All fields are required");
        return;
      }

      // Email validation based on role
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerForm.email)) {
        setError("Please enter a valid email address");
        return;
      }

      if (registerForm.role === "student") {
        if (!registerForm.email.endsWith("@mgmcen.ac.in")) {
          setError("Student email must end with @mgmcen.ac.in");
          return;
        }
      } else if (registerForm.role === "alumni") {
        const alumniEmailRegex = /^[^\s@]+@(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|[a-zA-Z0-9-]+\.com)$/;
        if (!alumniEmailRegex.test(registerForm.email)) {
          setError("Alumni email must be a valid personal or professional email address");
          return;
        }
      }

      try {
        console.log('Sending registration request with:', {
          email: registerForm.email,
          password: registerForm.password,
          role: registerForm.role
        });

        const response = await axios.post("http://localhost:3001/api/auth/register", {
          email: registerForm.email,
          password: registerForm.password,
          role: registerForm.role
        });

        if (response.data.message === "Registration successful") {
          setSuccess("Registration successful! Please login with your credentials.");
          setActiveTab("login");
          // Clear the registration form
          setRegisterForm({
            email: "",
            password: "",
            confirmPassword: "",
            role: "student"
          });
        }
      } catch (error) {
        console.error('Registration error:', error.response?.data || error);
        setError(error.response?.data?.error || "Registration failed. Please try again.");
      }
    } else {
      try {
        const response = await axios.post("http://localhost:3001/api/auth/login", {
          email: loginForm.email,
          password: loginForm.password,
        });

        console.log('Server response data:', response.data);
        console.log('User profile completed status:', response.data.user.profileCompleted);
        
        handleLoginSuccess(response.data);
      } catch (error) {
        console.error('Login error:', error.response?.data || error);
        setError(error.response?.data?.error || "Login failed");
      }
    }
  };

  const handleLoginSuccess = (data) => {
    console.log('Login successful:', data);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Redirect based on role and profile completion
    if (data.user.role === 'alumni') {
      if (!data.user.profileCompleted) {
        console.log('Redirecting to alumni dashboard for profile completion');
        navigate('/adash');
      } else {
        console.log('Redirecting to home for alumni with complete profile');
        navigate('/');
      }
    } else if (data.user.role === 'student') {
      if (!data.user.profileCompleted) {
        console.log('Redirecting to student dashboard for profile completion');
        navigate('/sdash');
      } else {
        console.log('Redirecting to home for student with complete profile');
        navigate('/');
      }
    } else if (data.user.role === 'admin') {
      console.log('Redirecting to admin home');
      navigate('/home');
    } else {
      console.error('Unknown role:', data.user.role);
      setError('Invalid user role');
    }
  };

  // Forgot Password Handlers
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (forgotStep === 1) {
      // Send OTP
      try {
        await axios.post("http://localhost:3001/api/auth/forgot-password", { email: forgotEmail });
        setSuccess("OTP sent to your email");
        setForgotStep(2);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to send OTP");
      }
    } else if (forgotStep === 2) {
      // Verify OTP
      try {
        await axios.post("http://localhost:3001/api/auth/verify-otp", { email: forgotEmail, otp: forgotOTP });
        setSuccess("OTP verified. Please enter your new password.");
        setForgotStep(3);
      } catch (err) {
        setError(err.response?.data?.error || "Invalid OTP");
      }
    } else if (forgotStep === 3) {
      // Reset Password
      if (forgotNewPassword.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }
      try {
        await axios.post("http://localhost:3001/api/auth/reset-password", { email: forgotEmail, otp: forgotOTP, newPassword: forgotNewPassword });
        setSuccess("Password reset successful! Please login.");
        setShowForgot(false);
        setForgotStep(1);
        setForgotEmail(""); setForgotOTP(""); setForgotNewPassword("");
        setActiveTab("login");
      } catch (err) {
        setError(err.response?.data?.error || "Failed to reset password");
      }
    }
  };

  return (
    <div className="page-container">
      <div className="card" style={{ 
        maxWidth: '1000px', 
        margin: '2rem auto',
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        minHeight: '600px'
      }}>
        <div style={{ flex: 1, position: 'relative', display: 'none' }} className="d-none d-md-block">
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img 
              src={mgmImg} 
              alt="MGM Campus" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }} 
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'var(--primary-gradient)',
              opacity: 0.9,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 'var(--spacing-xl)',
              textAlign: 'center',
              color: 'var(--background-white)'
            }}>
              <h1 className="section-title" style={{ color: 'var(--background-white)', marginBottom: 'var(--spacing-lg)' }}>
                MGM Alumni Association
              </h1>
              <div className="section-divider"></div>
              <p style={{ fontSize: 'var(--font-size-lg)', opacity: 0.9 }}>
                Building Bridges Between Past and Future
              </p>
            </div>
          </div>
        </div>

        <div style={{ 
          flex: 1, 
          padding: 'var(--spacing-xxl)', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
            <div className="section-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 className="section-title">
                {activeTab === "login" ? "Welcome Back!" : "Join Our Network"}
              </h2>
              <div className="section-divider"></div>
              <p className="section-subtitle">
                {activeTab === "login" 
                  ? "Sign in to connect with the MGM community" 
                  : "Create your account to get started"
                }
              </p>
            </div>

            {error && (
              <div className="alert alert-danger">
                <FaExclamationTriangle />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <span>{success}</span>
              </div>
            )}

            <div className="d-flex gap-2" style={{ marginBottom: 'var(--spacing-xl)' }}>
              <button
                className={`btn ${activeTab === "login" ? 'btn-primary' : 'btn-secondary'} btn-lg`}
                onClick={() => setActiveTab("login")}
                style={{ flex: 1, minWidth: 120, borderRadius: '2em', boxShadow: '0 2px 8px rgba(26,42,108,0.10)', fontWeight: 600, transition: 'all 0.2s' }}
              >
                <FaSignInAlt />
                <span>Login</span>
              </button>
              <button
                className={`btn ${activeTab === "register" ? 'btn-primary' : 'btn-secondary'} btn-lg`}
                onClick={() => setActiveTab("register")}
                style={{ flex: 1, minWidth: 120, borderRadius: '2em', boxShadow: '0 2px 8px rgba(26,42,108,0.10)', fontWeight: 600, transition: 'all 0.2s' }}
              >
                <FaUserPlus />
                <span>Register</span>
              </button>
            </div>

            {/* Forgot Password Flow */}
            {showForgot ? (
              <form onSubmit={handleForgotSubmit} className="mb-4 animate-section">
                {forgotStep === 1 && (
                  <>
                    <label className="form-label">Enter your registered email</label>
                    <input type="email" className="form-control mb-3" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                    <button className="btn btn-primary w-100 mb-2" type="submit">Send OTP</button>
                  </>
                )}
                {forgotStep === 2 && (
                  <>
                    <label className="form-label">Enter the OTP sent to your email</label>
                    <input type="text" className="form-control mb-3" value={forgotOTP} onChange={e => setForgotOTP(e.target.value)} required />
                    <button className="btn btn-primary w-100 mb-2" type="submit">Verify OTP</button>
                  </>
                )}
                {forgotStep === 3 && (
                  <>
                    <label className="form-label">Enter your new password</label>
                    <input type="password" className="form-control mb-3" value={forgotNewPassword} onChange={e => setForgotNewPassword(e.target.value)} required />
                    <button className="btn btn-success w-100 mb-2" type="submit">Reset Password</button>
                  </>
                )}
                <button type="button" className="btn btn-link w-100 mt-2" onClick={() => { setShowForgot(false); setForgotStep(1); setError(""); setSuccess(""); }}>Back to Login</button>
              </form>
            ) : (
              <>
                {activeTab === "login" && (
                  <form onSubmit={e => { e.preventDefault(); handleSubmit("Login"); }} className="mb-4 animate-section">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control mb-3" name="email" value={loginForm.email} onChange={handleLoginChange} required />
                    <label className="form-label">Password</label>
                    <input type="password" className="form-control mb-3" name="password" value={loginForm.password} onChange={handleLoginChange} required />
                    <button className="btn btn-primary w-100 mb-2" type="submit">
                      <FaSignInAlt className="me-2" />Login
                    </button>
                    <button type="button" className="btn btn-link w-100" onClick={() => { setShowForgot(true); setError(""); setSuccess(""); }}>Forgot Password?</button>
                  </form>
                )}
                {activeTab === "register" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmit("Register");
                    }}
                  >
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <div className="d-flex align-center">
                        <span className="input-group-text bg-primary" style={{ color: 'var(--background-white)' }}>
                          <FaEnvelope />
                        </span>
                        <input
                          type="email"
                          name="email"
                          value={registerForm.email}
                          onChange={handleRegisterChange}
                          className="form-control"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <div className="d-flex align-center">
                        <span className="input-group-text bg-primary" style={{ color: 'var(--background-white)' }}>
                          <FaLock />
                        </span>
                        <input
                          type="password"
                          name="password"
                          value={registerForm.password}
                          onChange={handleRegisterChange}
                          className="form-control"
                          placeholder="Create a password"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <div className="d-flex align-center">
                        <span className="input-group-text bg-primary" style={{ color: 'var(--background-white)' }}>
                          <FaLock />
                        </span>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={registerForm.confirmPassword}
                          onChange={handleRegisterChange}
                          className="form-control"
                          placeholder="Confirm your password"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <div className="d-flex gap-2">
                        <label className={`card ${registerForm.role === "student" ? 'btn-primary' : 'btn-secondary'}`} style={{
                          flex: 1,
                          cursor: 'pointer',
                          textAlign: 'center',
                          padding: 'var(--spacing-md)'
                        }}>
                          <input
                            type="radio"
                            name="role"
                            value="student"
                            checked={registerForm.role === "student"}
                            onChange={handleRegisterChange}
                            style={{ display: 'none' }}
                          />
                          <FaUserGraduate size={24} style={{ 
                            color: registerForm.role === "student" ? 'var(--background-white)' : 'inherit'
                          }} />
                          <div style={{ 
                            marginTop: 'var(--spacing-sm)',
                            color: registerForm.role === "student" ? 'var(--background-white)' : 'inherit'
                          }}>Student</div>
                        </label>
                        <label className={`card ${registerForm.role === "alumni" ? 'btn-primary' : 'btn-secondary'}`} style={{
                          flex: 1,
                          cursor: 'pointer',
                          textAlign: 'center',
                          padding: 'var(--spacing-md)'
                        }}>
                          <input
                            type="radio"
                            name="role"
                            value="alumni"
                            checked={registerForm.role === "alumni"}
                            onChange={handleRegisterChange}
                            style={{ display: 'none' }}
                          />
                          <FaUserTie size={24} style={{ 
                            color: registerForm.role === "alumni" ? 'var(--background-white)' : 'inherit'
                          }} />
                          <div style={{ 
                            marginTop: 'var(--spacing-sm)',
                            color: registerForm.role === "alumni" ? 'var(--background-white)' : 'inherit'
                          }}>Alumni</div>
                        </label>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-100" style={{ minWidth: 160, borderRadius: '2em', boxShadow: '0 4px 15px rgba(26,42,108,0.15)', fontWeight: 600, transition: 'all 0.2s' }}>
                      <FaUserPlus />
                      <span>Create Account</span>
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
