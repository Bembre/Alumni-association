import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaBriefcase, FaMapMarkerAlt, FaMoneyBillWave, FaLink, FaBuilding, FaClock, FaTrash, FaSpinner } from 'react-icons/fa';
import Header from './Header';
import './Job.css';

const Job = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
      navigate('/auth');
      return;
    }

    setUserRole(user.role);
    setUserId(user._id);
    setUserEmail(user.email);
    fetchJobs();
  }, [navigate]);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/job', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setJobs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to fetch jobs');
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      let url = '';
      if (user.role === 'admin') {
        url = `http://localhost:3001/api/job/admin/${jobId}`;
      } else {
        url = `http://localhost:3001/api/job/${jobId}`;
      }
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(jobs.filter(job => job._id !== jobId));
      setDeleteError('');
    } catch (error) {
      console.error('Error deleting job:', error);
      setDeleteError('Failed to delete job posting');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="loading">
          <FaSpinner className="spinner-icon" />
          <span>Loading jobs...</span>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="error-message">{error}</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="jobs-container">
        <div className="jobs-header">
          <h2><FaBriefcase className="me-2" />Available Jobs</h2>
        </div>

        {deleteError && (
          <div className="error-message">
            <FaTrash className="me-2" />
            {deleteError}
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="no-jobs">
            <FaBriefcase style={{ fontSize: '3rem', color: 'var(--primary-color)', marginBottom: 'var(--spacing-md)' }} />
            <p>No jobs available at the moment.</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <div key={job._id} className="job-card" style={{ borderRadius: '16px', boxShadow: '0 5px 20px rgba(26,42,108,0.08)', padding: '2rem', background: 'var(--background-white)', marginBottom: '2rem', transition: 'box-shadow 0.3s, transform 0.3s' }}>
                <div className="job-header d-flex justify-between align-center mb-3" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                  <h3 style={{ fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}><FaBriefcase className="me-2" />{job.title}</h3>
                  <div className="job-header-actions d-flex align-center gap-2">
                    <span className="job-type" style={{ fontWeight: 600 }}>{job.type}</span>
                    {(userRole === 'admin' || (userRole === 'alumni' && job.postedBy === userEmail)) && (
                      <button 
                        className="btn btn-danger btn-lg"
                        style={{ minWidth: 48, borderRadius: '2em', boxShadow: '0 2px 8px rgba(178,31,31,0.10)', fontWeight: 600, transition: 'all 0.2s' }}
                        onClick={() => handleDeleteJob(job._id)}
                        title="Delete job posting"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
                <div className="d-flex flex-column gap-2 mb-2">
                  <div className="job-company d-flex align-center mb-1"><FaBuilding className="icon" /><span className="ms-2"><strong>Company Name:</strong> {job.name}</span></div>
                  <div className="job-location d-flex align-center mb-1"><FaMapMarkerAlt className="icon" /><span className="ms-2"><strong>Location:</strong> {job.location}</span></div>
                  <div className="job-salary d-flex align-center mb-1"><FaMoneyBillWave className="icon" /><span className="ms-2"><strong>Salary:</strong> {job.salary}</span></div>
                </div>
                <div className="job-description mb-3" style={{ background: 'var(--background-light)', borderRadius: '8px', padding: '1rem' }}>
                  <strong>Description:</strong> {job.description}
                </div>
                <div className="job-footer d-flex justify-between align-center mt-3" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                  <div className="job-posted d-flex align-center"><FaClock className="icon" /><span className="ms-2">Posted on {formatDate(job.createdAt)}</span></div>
                  <div className="job-expiry d-flex align-center"><FaClock className="icon" /><span className="ms-2">Expires on {formatDate(job.expireDate)}</span></div>
                  <div className="job-poster d-flex align-center" style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
                    <span>Posted by: <strong>{job.postedByName}</strong> <span style={{ fontStyle: 'italic', color: 'var(--secondary-color)' }}>({job.postedByRole})</span></span>
                  </div>
                  {job.link && (
                    <a 
                      href={job.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-lg"
                      style={{ minWidth: 160, borderRadius: '2em', boxShadow: '0 4px 15px rgba(26,42,108,0.15)', fontWeight: 600, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.5em' }}
                    >
                      <FaLink className="me-2" />
                      Apply Now
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Job;
