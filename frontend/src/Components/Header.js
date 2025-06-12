import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaBriefcase, FaCalendarAlt, FaHandshake, FaHome, FaUserFriends, FaBars, FaTimes, FaPlus, FaUserCircle } from 'react-icons/fa';
import './Header.css';
import logo from '../img/logo.png';

const Header = () => {
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserData(user);
    } else {
      navigate('/auth');
    }
    // Poll for changes in localStorage user profile
    const interval = setInterval(() => {
      const latestUser = JSON.parse(localStorage.getItem('user'));
      if (latestUser && JSON.stringify(latestUser) !== JSON.stringify(userData)) {
        setUserRole(latestUser.role);
        setUserData(latestUser);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [navigate, location, userData]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Add click outside listener for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    // Add the event listener when dropdown is open
    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getProfileLink = () => {
    if (userRole === 'student') {
      return '/student-profile';
    } else if (userRole === 'alumni') {
      return '/profile';
    } else if (userRole === 'admin') {
      return '/admin-profile';
    }
    return '/';
  };

  // Function to render the profile avatar
  const renderAvatar = () => {
    let initial = '';
    if (userData?.first_name) {
      initial = userData.first_name.charAt(0).toUpperCase();
    } else if (userData?.email) {
      initial = userData.email.charAt(0).toUpperCase();
    }
    return (
      <div className="avatar user-photo" onClick={toggleProfileMenu} style={{ background: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)', color: 'white', fontWeight: 700, fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {initial}
      </div>
    );
  };

  // Render navigation links based on user role
  const renderNavLinks = () => {
    if (!userRole) {
      return (
        <Link to="/auth" className={`nav-link ${location.pathname === '/auth' ? 'active' : ''}`}>
          <FaUser className="nav-icon" />
          <span>Login</span>
        </Link>
      );
    }

    if (userRole === 'admin' || userRole === 'alumni') {
      return (
        <>
          {/* Home */}
          <Link to={userRole === 'admin' ? '/home' : '/'} className={`nav-link ${location.pathname === (userRole === 'admin' ? '/home' : '/') ? 'active' : ''}`}>
            <FaHome className="nav-icon" />
            <span>Home</span>
          </Link>
          {/* Directory */}
          <Link to={userRole === 'admin' ? '/directory' : '/directory1'} className={`nav-link ${(location.pathname === '/directory' && userRole === 'admin') || (location.pathname === '/directory1' && userRole !== 'admin') ? 'active' : ''}`}>
            <FaUserFriends className="nav-icon" />
            <span>Directory</span>
          </Link>
          {/* Events Group */}
          <Link to="/events" className={`nav-link ${location.pathname === '/events' ? 'active' : ''}`}>
            <FaCalendarAlt className="nav-icon" />
            <span>Events</span>
          </Link>
          <Link to="/add-event" className={`nav-link ${location.pathname === '/add-event' ? 'active' : ''}`}>
            <FaPlus className="nav-icon" />
            <span>Add Event</span>
          </Link>
          {/* Jobs Group */}
          <Link to="/jobs" className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}>
            <FaBriefcase className="nav-icon" />
            <span>Jobs</span>
          </Link>
          <Link to="/post-job" className={`nav-link ${location.pathname === '/post-job' ? 'active' : ''}`}>
            <FaPlus className="nav-icon" />
            <span>Post Job</span>
          </Link>
          {/* Mentorship */}
          {userRole === 'alumni' && (
            <Link to="/mentorship1" className={`nav-link ${location.pathname === '/mentorship1' ? 'active' : ''}`}>
              <FaHandshake className="nav-icon" />
              <span>Mentorship</span>
            </Link>
          )}
          {/* Raise Donation (admin) or Donation (alumni) */}
          {userRole === 'admin' ? (
            <div className="nav-link dropdown">
              <span className="dropdown-toggle d-flex align-items-center" data-bs-toggle="dropdown" aria-expanded="false" style={{ cursor: 'pointer' }}>
                <FaPlus className="nav-icon" />
                <span>Donation</span>
              </span>
              <ul className="dropdown-menu show-on-hover">
                <li>
                  <Link to="/add-donation" className={`dropdown-item${location.pathname === '/add-donation' ? ' active' : ''}`}>Raise Donation</Link>
                </li>
                <li>
                  <Link to="/donation" className={`dropdown-item${location.pathname === '/donation' ? ' active' : ''}`}>Donation</Link>
                </li>
              </ul>
            </div>
          ) : (
            <Link to="/donation" className={`nav-link ${location.pathname === '/donation' ? 'active' : ''}`}>
              <FaPlus className="nav-icon" />
              <span>Donation</span>
            </Link>
          )}
        </>
      );
    }

    if (userRole === 'student') {
      return (
        <>
          {/* Home */}
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <FaHome className="nav-icon" />
            <span>Home</span>
          </Link>
          
          {/* Directory */}
          <Link to="/directory1" className={`nav-link ${location.pathname === '/directory1' ? 'active' : ''}`}>
            <FaUserFriends className="nav-icon" />
            <span>Directory</span>
          </Link>
          
          {/* Events */}
          <Link to="/events" className={`nav-link ${location.pathname === '/events' ? 'active' : ''}`}>
            <FaCalendarAlt className="nav-icon" />
            <span>Events</span>
          </Link>
          
          {/* Jobs */}
          <Link to="/jobs" className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}>
            <FaBriefcase className="nav-icon" />
            <span>Jobs</span>
          </Link>

          {/* Mentorship */}
          <Link to="/mentorship" className={`nav-link ${location.pathname === '/mentorship' ? 'active' : ''}`}>
            <FaHandshake className="nav-icon" />
            <span>Mentorship</span>
          </Link>
        </>
      );
    }

    return null;
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <img src={logo} alt="Logo" className="logo-img" />
            <span className="logo-text">Alumni Association</span>
          </Link>
        </div>

        <div className="header-right">
          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <nav className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
            {renderNavLinks()}
          </nav>

          {userRole && (
            <div className="user-profile" ref={profileMenuRef}>
              {renderAvatar()}
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="profile-header" style={{ background: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)' }}>
                    <div className="profile-info">
                      <p className="profile-email" style={{ color: 'white' }}>{userData?.email}</p>
                      <p className="profile-role" style={{ color: 'white' }}>{userRole}</p>
                    </div>
                  </div>
                  <div className="profile-actions">
                    <Link to={getProfileLink()} className="profile-link" onClick={() => setShowProfileMenu(false)}>
                      <FaUserCircle className="me-2" />
                      <span>My Profile</span>
                    </Link>
                    <button onClick={handleLogout} className="logout-button">
                      <FaSignOutAlt className="me-2" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
