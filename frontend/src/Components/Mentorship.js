import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaGraduationCap, FaCode, FaSearch, FaComment, FaPaperPlane, FaPaperclip, FaTrash, FaFile, FaSmile } from 'react-icons/fa';
import axios from 'axios';
import Header from './Header';
import './CommonStyles.css';
import './Mentorship.css';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

const MentorConnect = () => {
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [showReactions, setShowReactions] = useState(null);
  const [availableMentors, setAvailableMentors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestPending, setRequestPending] = useState(false);
  const [mentorshipEnded, setMentorshipEnded] = useState(false);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user || user.role !== 'student') {
          navigate('/auth');
          return;
        }

        setLoading(true);
        setError(null);

        // Fetch mentor and available mentors in parallel
        const [mentorResponse, availableMentorsResponse] = await Promise.allSettled([
          axios.get('http://localhost:3001/api/mentorship/student/mentor', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3001/api/mentorship/available-mentors', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        // Handle mentor response
        if (mentorResponse.status === 'fulfilled') {
          setMentor(mentorResponse.value.data);
        } else if (mentorResponse.reason?.response?.status === 404) {
          // No mentor assigned is not an error
          setMentor(null);
        } else {
          console.error('Error fetching mentor:', mentorResponse.reason);
          setError('Failed to load mentor data. Please try again.');
        }

        // Handle available mentors response
        if (availableMentorsResponse.status === 'fulfilled') {
          setAvailableMentors(availableMentorsResponse.value.data);
        } else {
          console.error('Error fetching available mentors:', availableMentorsResponse.reason);
          setError('Failed to load available mentors. Please try again.');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error in initial data fetch:', error);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/mentorship/messages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        const sortedMessages = response.data.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status !== 404) {
        throw error;
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !mentor) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3001/api/mentorship/messages',
        { message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewMessage('');
      if (response.data.newMessage) {
        setMessages(prevMessages => [...prevMessages, response.data.newMessage]);
      }
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.message || 'Failed to send message. Please try again.');
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3001/api/mentorship/messages/${messageId}/reactions`,
        { emoji },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      await fetchMessages();
    } catch (error) {
      console.error('Error adding reaction:', error);
      setError('Failed to add reaction. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/mentorship/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message. Please try again.');
    }
  };

  const filteredMentors = availableMentors.filter(mentor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      mentor.first_name?.toLowerCase().includes(searchLower) ||
      mentor.last_name?.toLowerCase().includes(searchLower) ||
      mentor.department?.toLowerCase().includes(searchLower) ||
      mentor.skillset?.some(skill => skill.toLowerCase().includes(searchLower)) ||
      mentor.skills?.some(skill => skill.toLowerCase().includes(searchLower))
    );
  });

  const renderMessage = (msg) => (
    <div
      key={msg._id}
      className={`mb-3 ${
        msg.senderRole === 'student' ? 'text-end' : ''
      }`}
    >
      <div
        className={`d-inline-block p-2 rounded-3 ${
          msg.senderRole === 'student'
            ? 'bg-primary text-white'
            : 'bg-light'
        }`}
      >
        <div className="d-flex justify-content-between align-items-start">
          <small className="d-block text-muted">
            {msg.senderName} ({msg.senderRole})
          </small>
          <div className="d-flex align-items-center">
            <button
              className="btn btn-sm btn-link text-white p-0 me-2"
              onClick={() => setShowReactions(showReactions === msg._id ? null : msg._id)}
            >
              <FaSmile />
            </button>
            {msg.senderRole === 'student' && (
              <button
                className="btn btn-sm btn-link text-white p-0"
                onClick={() => handleDeleteMessage(msg._id)}
              >
                <FaTrash size={12} />
              </button>
            )}
          </div>
        </div>
        {msg.message && <p className="mb-0">{msg.message}</p>}
        {msg.reactions && msg.reactions.length > 0 && (
          <div className="mt-1">
            {msg.reactions.map((reaction, index) => (
              <span key={index} className="me-1">
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}
        {showReactions === msg._id && (
          <div className="reaction-picker mt-1">
            {REACTIONS.map((emoji, index) => (
              <button
                key={index}
                className="btn btn-sm btn-light me-1"
                onClick={() => {
                  handleReaction(msg._id, emoji);
                  setShowReactions(null);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <small className="d-block text-muted">
          {new Date(msg.timestamp).toLocaleString()}
        </small>
      </div>
    </div>
  );

  // Dummy handler for requesting mentorship
  const handleRequestMentorship = (mentorId) => {
    setRequestPending(true);
    // In real app, send request to backend here
  };

  // Debug log for mentor object
  if (mentor) {
    console.log('Mentor object:', mentor);
  }

  // Debug log for mentor.experience
  if (mentor) {
    console.log('Mentor experience:', Array.isArray(mentor.experience) ? mentor.experience.map(e => JSON.stringify(e)) : JSON.stringify(mentor.experience));
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="container py-5">
          <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container py-5">
          <div className="alert alert-danger" role="alert">
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
        <h2 className="mb-4 text-center">Mentor Connect</h2>
        {/* Mentorship ended state */}
        {mentorshipEnded && (
          <div className="alert alert-warning text-center">
            Your mentorship has ended. You can select a new mentor from the list below.
          </div>
        )}
        {/* Mentor assigned and active */}
        {mentor && !requestPending && !mentorshipEnded ? (
          <div className="row">
            <div className="col-md-4">
              <div className="card shadow-lg mb-4">
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0">
                    <FaUser className="me-2" />
                    Your Mentor
                  </h4>
                </div>
                <div className="card-body">
                  <div className="text-center">
                    <div className="rounded-circle overflow-hidden bg-light mx-auto mb-3" style={{ width: "100px", height: "100px" }}>
                      {mentor.profile ? (
                        <img
                          src={mentor.profile}
                          alt={mentor.first_name}
                          className="w-100 h-100 object-fit-cover"
                        />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                          <FaUser className="text-muted" size={40} />
                        </div>
                      )}
                    </div>
                    <h5>{`${mentor.first_name} ${mentor.last_name}`}</h5>
                    <p className="text-muted mb-2">{mentor.department}</p>
                    <div className="d-flex justify-content-center gap-2">
                      {mentor.skillset?.map((skill, index) => (
                        <span key={index} className="badge bg-info me-1">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-8">
              <div className="card shadow-lg">
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0">
                    <FaComment className="me-2" />
                    Chat with Mentor
                  </h4>
                </div>
                <div className="card-body p-0">
                  {/* Mentor details panel */}
                  <div className="p-3 border-bottom mb-2">
                    <div className="d-flex align-items-center mb-2">
                      <div className="rounded-circle overflow-hidden bg-light me-3" style={{ width: "60px", height: "60px" }}>
                        {mentor.profile ? (
                          <img src={mentor.profile} alt={mentor.first_name} className="w-100 h-100 object-fit-cover" />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                            <FaUser className="text-muted" size={30} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h5 className="mb-1">{mentor.first_name} {mentor.last_name}</h5>
                        <div className="text-muted small">{mentor.department}</div>
                        <div className="text-muted small">{mentor.email}</div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <strong>Skills:</strong> N/A
                    </div>
                    <div className="mb-2">
                      <strong>Experience:</strong> N/A
                    </div>
                  </div>
                  {/* Chat area */}
                  <div className="chat-messages p-3" style={{ height: '400px', overflowY: 'auto' }}>
                    {messages.length > 0 ? (
                      messages.map(renderMessage)
                    ) : (
                      <div className="text-center text-muted py-4">
                        No messages yet. Start the conversation!
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="chat-input border-top p-3">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage();
                          }
                        }}
                        disabled={!mentor}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleSendMessage}
                        disabled={!mentor}
                      >
                        <FaPaperPlane />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : requestPending ? (
          // Pending request state
          <div className="alert alert-info text-center">
            <h5>Mentorship Request Pending</h5>
            <p>Your request to connect with an alumni mentor is pending approval. Please wait for the alumni to accept your request.</p>
          </div>
        ) : (
          // No mentor assigned state
          <>
            <div className="alert alert-warning text-center mb-4">
              You have not been assigned a mentor yet. 
            </div>
            <div className="row mb-4">
              <div className="col-md-6 mx-auto">
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="form-control search-input"
                    placeholder="Search mentors by name, department, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="row g-4">
              {(searchTerm.trim() === '' ? availableMentors : filteredMentors).length > 0 ? (
                (searchTerm.trim() === '' ? availableMentors : filteredMentors).map((mentor) => (
                  <div key={mentor._id} className="col-md-4">
                    <div className="card shadow-lg student-card" style={{ borderRadius: '16px', boxShadow: '0 5px 20px rgba(26,42,108,0.08)', background: 'var(--background-white)', marginBottom: '2rem', transition: 'box-shadow 0.3s, transform 0.3s' }}>
                      <div className="card-body">
                        <div className="profile-photo-container" style={{ marginBottom: '1rem' }}>
                          {mentor.profile ? (
                            <img src={mentor.profile} alt={mentor.first_name} className="profile-photo" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px rgba(26,42,108,0.10)' }} />
                          ) : (
                            <div className="profile-photo-placeholder" style={{ width: 70, height: 70, borderRadius: '50%', background: 'var(--background-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(26,42,108,0.10)' }}><FaUser size={40} /></div>
                          )}
                        </div>
                        <div className="student-info">
                          <h5 className="student-name" style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{`${mentor.first_name} ${mentor.last_name}`}</h5>
                          <div className="student-details mb-2">
                            <div className="detail-item d-flex align-items-center mb-1"><FaGraduationCap className="icon me-2" /><span>{mentor.department}</span></div>
                            <div className="detail-item d-flex align-items-center mb-1"><FaCode className="icon me-2" />
                              <span>{Array.isArray(mentor.experience)
                                ? mentor.experience.length > 0
                                  ? mentor.experience.map((exp, idx) =>
                                      typeof exp === 'object' && exp !== null
                                        ? `${exp.position || ''}${exp.company ? ' at ' + exp.company : ''}${exp.duration ? ' (' + exp.duration + ')' : ''}`
                                        : exp
                                    ).join(', ')
                                  : 'No experience listed'
                                : (typeof mentor.experience === 'object' && mentor.experience !== null)
                                  ? `${mentor.experience.position || ''}${mentor.experience.company ? ' at ' + mentor.experience.company : ''}${mentor.experience.duration ? ' (' + mentor.experience.duration + ')' : ''}`
                                  : mentor.experience || 'No experience listed'
                              }</span>
                            </div>
                          </div>
                          <div className="skills-section mb-2">
                            <h6 style={{ fontWeight: 600, color: 'var(--secondary-color)' }}>Skills</h6>
                            <div className="skills-container d-flex flex-wrap gap-2">
                              {mentor.skillset?.map((skill, index) => (
                                <span key={index} className="badge bg-info" style={{ borderRadius: '1em', fontWeight: 500, fontSize: '0.95rem', background: 'var(--accent-color)', color: 'var(--background-white)', padding: '0.4em 1em' }}>{skill}</span>
                              ))}
                            </div>
                          </div>
                          {/* <button className="btn btn-primary btn-lg w-100 mt-3" style={{ minWidth: 160, borderRadius: '2em', boxShadow: '0 4px 15px rgba(26,42,108,0.15)', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => handleRequestMentorship(mentor._id)}>
                            Request Mentorship
                          </button> */}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center">
                  <p className="text-muted">No mentors found matching your search criteria.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default MentorConnect;
