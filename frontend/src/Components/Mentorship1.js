import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaComment, FaPaperPlane, FaTrash, FaFile, FaSmile } from 'react-icons/fa';
import axios from 'axios';
import Header from './Header';
import './CommonStyles.css';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

const Mentorship1 = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [mentoredStudents, setMentoredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const maxStudents = 3;
  const [showReactions, setShowReactions] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

    const checkAuthAndFetchData = async () => {
      try {
        // Add a small delay to ensure localStorage is set
        await new Promise(resolve => setTimeout(resolve, 100));
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        if (!token || !user || user.role !== 'alumni') {
          console.error('Authentication required');
          navigate('/auth');
          return;
        }
        setLoading(true);
        await Promise.all([fetchStudents(), fetchMentoredStudents()]);
        setLoading(false);
      } catch (error) {
        console.error('Error in initial data fetch:', error);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

  useEffect(() => {
    if (mentoredStudents.length > 0) {
      fetchMessages();
    }
  }, [mentoredStudents]);

  useEffect(() => {
    if (showChat) {
      fetchMessages();
    }
  }, [showChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchStudents = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'alumni') {
      throw new Error('Authentication required');
    }

    try {
      const response = await axios.get('http://localhost:3001/api/mentorship/available-students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  };

  const fetchMentoredStudents = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'alumni') {
      throw new Error('Authentication required');
    }

    try {
      const response = await axios.get('http://localhost:3001/api/mentorship/mentees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMentoredStudents(response.data);
      if (response.data.length > 0) {
        setSelectedStudents(response.data.map(student => student._id));
      }
    } catch (error) {
      console.error('Error fetching mentored students:', error);
      if (error.response?.status === 404) {
        setMentoredStudents([]);
        setSelectedStudents([]);
      }
      throw error;
    }
  };

  const fetchMessages = async (studentId = selectedMentee?._id) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      if (!token || !user || user.role !== 'alumni') {
        throw new Error('Authentication required');
      }
      if (!studentId) return;
      const response = await axios.get('http://localhost:3001/api/mentorship/messages', {
        headers: { Authorization: `Bearer ${token}` },
        params: { studentId }
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

  const handleSelectStudent = async (studentId) => {
    try {
      if (mentoredStudents.some(student => student._id === studentId)) {
        setError('You are already mentoring this student');
        return;
      }

      if (selectedStudents.length >= maxStudents && !selectedStudents.includes(studentId)) {
        setError(`You can only mentor up to ${maxStudents} students`);
        return;
      }

      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      // If student is already selected but not yet mentored, remove them
      if (selectedStudents.includes(studentId)) {
        setSelectedStudents(selectedStudents.filter(id => id !== studentId));
      } else {
        // Add new student
        setSelectedStudents([...selectedStudents, studentId]);
      }

      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error('Error selecting student:', error);
      setError(error.response?.data?.message || 'Failed to select student. Please try again.');
    }
  };

  const handleStartMentorship = async () => {
    try {
      if (selectedStudents.length === 0) {
        setError('Please select at least one student');
        return;
      }

      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!token || !user || user.role !== 'alumni') {
        console.error('User not properly authenticated:', { token: !!token, user });
        navigate('/auth');
        return;
      }

      console.log('Starting mentorship with students:', selectedStudents);

      const response = await axios.post(
        'http://localhost:3001/api/mentorship/start',
        { 
          studentIds: selectedStudents
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Mentorship start response:', response.data);

      // Update the mentored students list with the response data
      setMentoredStudents(response.data);
      setShowChat(true);
      setError(null);
      
      // Fetch messages after successful mentorship start
      await fetchMessages();
    } catch (error) {
      console.error('Detailed error starting mentorship:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      if (error.response?.status === 404) {
        setError('Mentorship service is currently unavailable. Please try again later.');
      } else if (error.response?.data?.error) {
        setError(`${error.response.data.error}${error.response.data.details ? `: ${error.response.data.details}` : ''}`);
      } else {
        setError('Failed to start mentorship. Please try again.');
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !selectedMentee) return;
    try {
      setIsSending(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('message', newMessage || '');
      formData.append('studentId', selectedMentee._id);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      await axios.post(
        'http://localhost:3001/api/mentorship/messages',
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setNewMessage('');
      setSelectedFile(null);
      await fetchMessages(selectedMentee._id);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
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

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3001/api/mentorship/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file. Please try again.');
    }
  };

  const handleSelectMentee = (student) => {
    setSelectedMentee(student);
    setMessages([]); // Clear previous messages
    fetchMessages(student._id);
    setShowChat(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const renderMessage = (msg) => (
    <div
      key={msg._id}
      className={`mb-3 ${
        msg.senderRole === 'alumni' ? 'text-end' : ''
      }`}
    >
      <div
        className={`d-inline-block p-2 rounded-3 ${
          msg.senderRole === 'alumni'
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
            {msg.senderRole === 'alumni' && (
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
        {msg.file && (
          <div className="mt-2">
            <button
              className="btn btn-sm btn-light"
              onClick={() => handleDownloadFile(msg.file.id, msg.file.name)}
            >
              <FaFile className="me-1" />
              {msg.file.name}
            </button>
          </div>
        )}
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

  if (loading) {
    return (
      <>
        <Header />
        <div className="container text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container py-5">
        <div className="row">
          {/* Available Students for Mentoring */}
          {mentoredStudents.length === 0 && (
          <div className="col-md-12">
            <div className="card shadow-lg mb-4">
              <div className="card-header bg-success text-white">
                <h4 className="mb-0">
                  <FaUser className="me-2" />
                  Available Students for Mentoring
                </h4>
              </div>
              <div className="card-body">
                {students.length > 0 ? (
                  <div className="list-group">
                    {students.map(student => (
                      <div
                        key={student._id}
                        className={`list-group-item list-group-item-action ${
                          selectedStudents.includes(student._id) ? 'active' : ''
                        }`}
                        onClick={() => selectedStudents.length < maxStudents || selectedStudents.includes(student._id) ? handleSelectStudent(student._id) : null}
                        style={{ cursor: selectedStudents.length < maxStudents || selectedStudents.includes(student._id) ? 'pointer' : 'not-allowed', opacity: selectedStudents.length >= maxStudents && !selectedStudents.includes(student._id) ? 0.5 : 1 }}
                      >
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle overflow-hidden bg-light me-3" style={{ width: "40px", height: "40px" }}>
                            {student.profile ? (
                              <img
                                src={student.profile}
                                alt={student.first_name}
                                className="w-100 h-100 object-fit-cover"
                              />
                            ) : (
                              <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                                <FaUser className="text-muted" size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h6 className="mb-1">{`${student.first_name} ${student.last_name}`}</h6>
                            <small className="text-muted">
                              {student.department} - Year {student.current_year}
                            </small>
                            <div className="mt-1">
                              {(student.skillset || student.skills || []).map((skill, idx) => (
                                <span key={idx} className="badge bg-info me-1">{skill}</span>
                              ))}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            className="ms-auto"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => handleSelectStudent(student._id)}
                            onClick={e => e.stopPropagation()}
                            disabled={selectedStudents.length >= maxStudents && !selectedStudents.includes(student._id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">No students available for mentorship</p>
                  </div>
                )}
                <button
                  className="btn btn-success mt-3 w-100"
                  onClick={handleStartMentorship}
                  disabled={selectedStudents.length === 0}
                >
                  Start Mentorship with Selected Students
                </button>
                <div className="mt-2 text-muted small">
                  Note: The current system does not support a mentorship request/acceptance workflow. Mentorship is started immediately when you select students and click the button.
                </div>
              </div>
            </div>
          </div>
          )}
          <div className="col-md-4">
            <div className="card shadow-lg mb-4">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">
                  <FaUser className="me-2" />
                  Your Mentees
                </h4>
              </div>
              <div className="card-body">
                {mentoredStudents.length > 0 ? (
                  <div className="list-group">
                    {mentoredStudents.map(student => {
                      const studentSkills = student.skillset || student.skills || [];
                      return (
                        <div
                          key={student._id}
                          className={`list-group-item list-group-item-action ${
                            selectedStudents.includes(student._id) ? 'active' : ''
                          }`}
                          onClick={() => {
                            handleSelectStudent(student._id);
                            setSelectedMentee(student);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle overflow-hidden bg-light me-3" style={{ width: "40px", height: "40px" }}>
                              {student.profile ? (
                                <img
                                  src={student.profile}
                                  alt={student.first_name}
                                  className="w-100 h-100 object-fit-cover"
                                />
                              ) : (
                                <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                                  <FaUser className="text-muted" size={20} />
                                </div>
                              )}
                            </div>
                            <div>
                              <h6 className="mb-1">{`${student.first_name} ${student.last_name}`}</h6>
                              <small className="text-muted">
                                {student.department} - Year {student.current_year}
                              </small>
                              <div className="mt-1">
                                {studentSkills.map((skill, index) => (
                                  <span key={index} className="badge bg-info me-1">{skill}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">No mentees assigned yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-8">
            <div className="card shadow-lg">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">
                  <FaComment className="me-2" />
                  {selectedMentee ? `Chat with ${selectedMentee.first_name} ${selectedMentee.last_name}` : 'Chat with Mentees'}
                </h4>
              </div>
              <div className="card-body p-0">
                {/* Mentee details panel */}
                {selectedMentee ? (
                  <div className="p-3 border-bottom mb-2">
                    <div className="d-flex align-items-center mb-2">
                      <div className="rounded-circle overflow-hidden bg-light me-3" style={{ width: "60px", height: "60px" }}>
                        {selectedMentee.profile ? (
                          <img src={selectedMentee.profile} alt={selectedMentee.first_name} className="w-100 h-100 object-fit-cover" />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                            <FaUser className="text-muted" size={30} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h5 className="mb-1">{selectedMentee.first_name} {selectedMentee.last_name}</h5>
                        <div className="text-muted small">{selectedMentee.department} - Year {selectedMentee.current_year}</div>
                        <div className="text-muted small">{selectedMentee.email}</div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <strong>Skills:</strong> {selectedMentee.skillset?.join(', ') || selectedMentee.skills?.join(', ') || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <strong>Student ID:</strong> {selectedMentee.student_id || 'N/A'}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border-bottom mb-2 text-center text-muted">
                    Select a mentee to view their details and start chatting.
                  </div>
                )}
                {/* Chat area only if mentee is selected */}
                {selectedMentee && (
                  <>
                    <div className="chat-messages p-3" style={{ height: '300px', overflowY: 'auto' }}>
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
                              handleSendMessage(e);
                            }
                          }}
                          disabled={isSending}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={(e) => handleSendMessage(e)}
                          disabled={isSending}
                        >
                          <FaPaperPlane />
                        </button>
                      </div>
                      </div>
                    </>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Mentorship1;
