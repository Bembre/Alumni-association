import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaVideo, 
  FaUserPlus, 
  FaUserMinus,
  FaUsers,
  FaFilter,
  FaCheckCircle,
  FaInfoCircle,
  FaChevronDown
} from 'react-icons/fa';
import Header from './Header';
import './Adash.css'; // Reusing existing styles

const Event = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState(null);
  const [tabsVisible, setTabsVisible] = useState(false);
  const navigate = useNavigate();

  // Fetch events on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
          setUserRole(user.role);
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        let response;
        if (selectedTab === 'upcoming') {
          response = await axios.get('http://localhost:3001/api/event', {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (selectedTab === 'past') {
          response = await axios.get('http://localhost:3001/api/event/past', {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (selectedTab === 'registered') {
          response = await axios.get('http://localhost:3001/api/event/my/registered', {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (selectedTab === 'organized' && user.role === 'alumni') {
          response = await axios.get('http://localhost:3001/api/event/my/organized', {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        if (response && response.data) {
          setEvents(response.data);
          applyFilter(response.data, filter);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTab, filter]);

  // Apply filter to events
  const applyFilter = (eventList, filterValue) => {
    if (filterValue === 'all') {
      setFilteredEvents(eventList);
    } else {
      setFilteredEvents(eventList.filter(event => event.type === filterValue));
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    applyFilter(events, newFilter);
  };

  // Handle event registration
  const handleEventRegistration = async (eventId, isRegistering) => {
    try {
      setMessage(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const endpoint = isRegistering 
        ? `http://localhost:3001/api/event/${eventId}/register`
        : `http://localhost:3001/api/event/${eventId}/cancel`;

      const response = await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Update the events list to reflect the registration change
        setEvents(prevEvents => {
          return prevEvents.map(event => {
            if (event._id === eventId) {
              return {
                ...event,
                isRegistered: isRegistering,
                participantCount: response.data.participantCount
              };
            }
            return event;
          });
        });

        // Also update filtered events
        setFilteredEvents(prevEvents => {
          return prevEvents.map(event => {
            if (event._id === eventId) {
              return {
                ...event,
                isRegistered: isRegistering,
                participantCount: response.data.participantCount
              };
            }
            return event;
          });
        });

        setMessage({
          type: 'success',
          text: isRegistering 
            ? 'Successfully registered for the event!' 
            : 'Successfully cancelled your registration'
        });
      }
    } catch (err) {
      console.error('Error with event registration:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'An error occurred'
      });
    }
  };

  // Get event type display name
  const getEventTypeDisplay = (type) => {
    switch (type) {
      case 'reunion': return 'Reunion';
      case 'knowledge_sharing': return 'Knowledge Sharing Session';
      case 'webinar': return 'Webinar';
      case 'expert_lecture': return 'Expert Lecture';
      default: return type;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleTabs = () => {
    setTabsVisible(!tabsVisible);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      let url = '';
      if (user.role === 'admin') {
        url = `http://localhost:3001/api/event/admin/${eventId}`;
      } else {
        url = `http://localhost:3001/api/event/${eventId}`;
      }
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(events => events.filter(e => e._id !== eventId));
      setFilteredEvents(events => events.filter(e => e._id !== eventId));
      setMessage({ type: 'success', text: 'Event deleted successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to delete event.' });
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading events...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container py-5">
          <div className="alert alert-danger">
            <FaInfoCircle className="me-2" />
            {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">
            <FaCalendarAlt className="me-2" />
            Events
          </h2>
        </div>

        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mb-4`}>
            {message.type === 'success' ? <FaCheckCircle className="me-2" /> : <FaInfoCircle className="me-2" />}
            {message.text}
          </div>
        )}

        {/* Event tabs toggle button */}
        <div className="tabs-toggle mb-2">
          <button 
            className="btn btn-outline-primary d-flex align-items-center" 
            onClick={toggleTabs}
          >
            <span>Event Categories</span>
            <FaChevronDown className={`ms-2 ${tabsVisible ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Event tabs */}
        {tabsVisible && (
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${selectedTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setSelectedTab('upcoming')}
              >
                Upcoming Events
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${selectedTab === 'registered' ? 'active' : ''}`}
                onClick={() => setSelectedTab('registered')}
              >
                My Registered Events
              </button>
            </li>
            {userRole === 'alumni' && (
              <li className="nav-item">
                <button 
                  className={`nav-link ${selectedTab === 'organized' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('organized')}
                >
                  Events I Organized
                </button>
              </li>
            )}
            <li className="nav-item">
              <button 
                className={`nav-link ${selectedTab === 'past' ? 'active' : ''}`}
                onClick={() => setSelectedTab('past')}
              >
                Past Events
              </button>
            </li>
          </ul>
        )}

        {/* Filter options */}
        <div className="mb-4">
          <div className="d-flex align-items-center">
            <FaFilter className="me-2 text-primary" />
            <label htmlFor="eventFilter" className="form-label mb-0 me-2">Filter by type:</label>
            <select 
              id="eventFilter"
              className="form-select w-auto" 
              value={filter} 
              onChange={handleFilterChange}
            >
              <option value="all">All Types</option>
              <option value="reunion">Reunions</option>
              <option value="knowledge_sharing">Knowledge Sharing Sessions</option>
              <option value="webinar">Webinars</option>
              <option value="expert_lecture">Expert Lectures</option>
            </select>
          </div>
        </div>

        {/* Display events */}
        {filteredEvents.length === 0 ? (
          <div className="card p-4 text-center">
            <p className="mb-0">No events found for the selected filter.</p>
          </div>
        ) : (
          <div className="row">
            {filteredEvents.map(event => (
              <div key={event._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm hover-shadow" style={{ borderRadius: '16px', boxShadow: '0 5px 20px rgba(26,42,108,0.08)', padding: '1.5rem 0 0 0', background: 'var(--background-white)', marginBottom: '2rem', transition: 'box-shadow 0.3s, transform 0.3s' }}>
                  <div className="card-header text-white" style={{ background: 'var(--primary-gradient)', borderRadius: '16px 16px 0 0', fontWeight: 700, fontSize: '1.2rem', boxShadow: '0 2px 8px rgba(26,42,108,0.10)' }}>
                    {event.title}
                  </div>
                  <div className="card-body">
                    <span className="badge bg-secondary mb-2" style={{ borderRadius: '1em', fontWeight: 600, fontSize: '1rem', background: 'var(--secondary-color)', color: 'var(--background-white)', padding: '0.5em 1.2em' }}>{getEventTypeDisplay(event.type)}</span>
                    <p className="card-text" style={{ color: 'var(--text-light)', fontSize: '1rem', marginBottom: '1.2em' }}><strong>Description:</strong> {event.description}</p>
                    <div className="event-details mb-3">
                      <div className="d-flex align-items-center mb-2"><FaCalendarAlt className="me-2 text-primary" /><span><strong>Date:</strong> {formatDate(event.date)}</span></div>
                      <div className="d-flex align-items-center mb-2"><FaClock className="me-2 text-primary" /><span><strong>Time:</strong> {event.time}</span></div>
                      {event.venue ? (
                        <div className="d-flex align-items-center mb-2"><FaMapMarkerAlt className="me-2 text-primary" /><span><strong>Venue:</strong> {event.venue}</span></div>
                      ) : event.link ? (
                        <div className="d-flex align-items-center mb-2"><FaVideo className="me-2 text-primary" /><span><strong>Meeting Link:</strong> <a href={event.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Join Meeting</a></span></div>
                      ) : null}
                      <div className="d-flex align-items-center"><FaUsers className="me-2 text-primary" /><span><strong>Participants:</strong> {event.participantCount || 0}{event.maxParticipants ? ` / ${event.maxParticipants}` : ''} Registered</span></div>
                    </div>
                    {selectedTab === 'upcoming' && (
                      <div className="d-flex justify-content-center">
                        {event.isRegistered ? (
                          <button className="btn btn-danger btn-lg" style={{ minWidth: 160, borderRadius: '2em', boxShadow: '0 2px 8px rgba(231,76,60,0.10)', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => handleEventRegistration(event._id, false)}>
                            <FaUserMinus className="me-2" /> Cancel Registration
                          </button>
                        ) : (
                          <button className="btn btn-primary btn-lg" style={{ minWidth: 160, borderRadius: '2em', boxShadow: '0 4px 15px rgba(26,42,108,0.15)', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => handleEventRegistration(event._id, true)} disabled={event.isFull}>
                            <FaUserPlus className="me-2" /> Register Now{event.isFull && ' (Full)'}
                          </button>
                        )}
                      </div>
                    )}
                    {selectedTab === 'organized' && (
                      <div className="d-grid gap-2">
                        <Link to={`/event/${event._id}/participants`} className="btn btn-secondary btn-lg" style={{ minWidth: 160, borderRadius: '2em', boxShadow: '0 2px 8px rgba(26,42,108,0.10)', fontWeight: 600, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.5em' }}>
                          <FaUsers className="me-2" /> View Participants ({event.participantCount || 0})
                        </Link>
                      </div>
                    )}
                    {userRole === 'alumni' && event.organizer?.userId === JSON.parse(localStorage.getItem('user'))._id && (
                      <div className="d-flex gap-2 mt-2">
                        <button 
                          className="btn btn-danger btn-sm ms-2"
                          style={{ borderRadius: '2em', background: '#dc3545', color: '#fff', fontWeight: 600, minWidth: 90, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          onClick={() => handleDeleteEvent(event._id)}
                        >
                          <span className="me-1"><i className="fa fa-trash" /></span> Delete
                        </button>
                      </div>
                    )}
                    {userRole === 'admin' && (
                      <div className="d-flex gap-2 mt-2">
                        <button 
                          className="btn btn-danger btn-sm ms-2"
                          style={{ borderRadius: '2em', background: '#dc3545', color: '#fff', fontWeight: 600, minWidth: 90, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          onClick={() => handleDeleteEvent(event._id)}
                        >
                          <span className="me-1"><i className="fa fa-trash" /></span> Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="card-footer text-muted" style={{ borderRadius: '0 0 16px 16px', background: 'var(--background-light)', fontSize: '0.95rem' }}>
                    <small>Organized by: {event.organizer?.name || 'Unknown'}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Event;
