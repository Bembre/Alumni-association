import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUsers, 
  FaArrowLeft, 
  FaDownload, 
  FaEnvelope, 
  FaUserGraduate, 
  FaUser
} from 'react-icons/fa';

const EventParticipants = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventAndParticipants = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        // Fetch event details
        const eventResponse = await axios.get(`http://localhost:3001/api/event/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (eventResponse.data) {
          setEvent(eventResponse.data);
        }

        // Fetch participants
        const participantsResponse = await axios.get(`http://localhost:3001/api/event/${eventId}/participants`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (participantsResponse.data.success) {
          setParticipants(participantsResponse.data.participants);
        }
      } catch (err) {
        console.error('Error fetching event participants:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load participants');
        
        // If unauthorized, navigate back to events page
        if (err.response?.status === 403) {
          setTimeout(() => {
            navigate('/events');
          }, 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndParticipants();
  }, [eventId, navigate]);

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to export participants to CSV
  const exportToCSV = () => {
    if (!participants.length || !event) return;

    // Prepare CSV content
    const headers = ['Name', 'Email', 'Type', 'Registration Date'];
    
    const csvRows = [
      // Title row with event information
      [`Participants for: ${event.title}`],
      [`Event Date: ${formatDate(event.date)}`],
      [''], // Empty row for spacing
      headers, // Header row
      
      // Data rows
      ...participants.map(p => [
        p.name,
        p.email,
        p.participantModel === 'Alumni' ? 'Alumni' : 'Student',
        formatDate(p.registrationDate)
      ])
    ];
    
    // Convert to CSV format
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `participants_${event.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading participants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          {error}
          {error.includes('authorized') && (
            <p className="mt-2 mb-0">Redirecting back to events page...</p>
          )}
        </div>
        <div className="mt-3">
          <Link to="/events" className="btn btn-primary">
            <FaArrowLeft className="me-2" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          Event not found
        </div>
        <div className="mt-3">
          <Link to="/events" className="btn btn-primary">
            <FaArrowLeft className="me-2" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">
          <FaUsers className="me-2" />
          Event Participants
        </h2>
        
        <Link to="/events" className="btn btn-outline-primary">
          <FaArrowLeft className="me-2" />
          Back to Events
        </Link>
      </div>
      
      <div className="card mb-4">
        <div className="card-body">
          <h4>{event.title}</h4>
          <p className="text-muted">
            {formatDate(event.date)} at {event.time}
          </p>
          <p>{event.description}</p>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            Registered Participants ({participants.length})
          </h5>
          
          {participants.length > 0 && (
            <button 
              className="btn btn-sm btn-success" 
              onClick={exportToCSV}
            >
              <FaDownload className="me-2" />
              Export to CSV
            </button>
          )}
        </div>
        
        <div className="card-body">
          {participants.length === 0 ? (
            <p className="text-center my-3">No participants have registered yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant, index) => (
                    <tr key={participant._id || index}>
                      <td>{index + 1}</td>
                      <td>
                        {participant.participantModel === 'Alumni' ? (
                          <FaUser className="me-2 text-primary" />
                        ) : (
                          <FaUserGraduate className="me-2 text-success" />
                        )}
                        {participant.name}
                      </td>
                      <td>
                        <a href={`mailto:${participant.email}`}>
                          <FaEnvelope className="me-2" />
                          {participant.email}
                        </a>
                      </td>
                      <td>{participant.participantModel}</td>
                      <td>{formatDate(participant.registrationDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventParticipants; 