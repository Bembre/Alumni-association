import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Logout.css';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Clear any cookies if they exist
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  };

  useEffect(() => {
    // Handle normal logout
    handleLogout();

    // Handle tab/window close
    const handleBeforeUnload = (e) => {
      handleLogout();
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleLogout);

    // Redirect to login page after a short delay
    const timer = setTimeout(() => {
      navigate('/auth');
    }, 2000);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleLogout);
    };
  }, [navigate]);

  return (
    <div className="logout-container">
      <div className="logout-content">
        <div className="logout-icon">
          <i className="fas fa-sign-out-alt"></i>
        </div>
        <h2>Logging Out</h2>
        <p>Thank you for using Alumni Association</p>
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
};

export default Logout; 