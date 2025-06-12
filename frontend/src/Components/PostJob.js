import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaBriefcase, FaMapMarkerAlt, FaMoneyBillWave, FaLink, FaSave, FaBuilding, FaExclamationTriangle, FaCheckCircle, FaArrowLeft, FaRegCalendarCheck } from 'react-icons/fa';
import Header from './Header';
import './PostJob.css';

const PostJob = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    name: '',
    location: '',
    type: '',
    salary: '',
    description: '',
    link: '',
    expireDate: ''
  });

  useEffect(() => {
    if (jobId) {
      // Editing: fetch job data
      const fetchJob = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`http://localhost:3001/api/job/${jobId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setFormData({
            title: res.data.title,
            name: res.data.name,
            location: res.data.location,
            type: res.data.type,
            salary: res.data.salary,
            description: res.data.description,
            link: res.data.link,
            expireDate: res.data.expireDate?.slice(0, 10) || ''
          });
        } catch (err) {
          setError('Failed to load job for editing.');
        }
      };
      fetchJob();
    }
  }, [jobId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    // Validation
    if (!formData.title || !formData.name || !formData.location || !formData.type || !formData.salary || !formData.description || !formData.link || !formData.expireDate) {
      setError('Please fill all required fields.');
      setIsSubmitting(false);
      return;
    }
    // Expire date validation
    const today = new Date().toISOString().split('T')[0];
    if (formData.expireDate < today) {
      setError('Expire date cannot be in the past.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!token || !user) {
        navigate('/auth');
        return;
      }

      if (jobId) {
        // Editing
        let url = '';
        if (user.role === 'admin') {
          url = `http://localhost:3001/api/job/admin/${jobId}`;
        } else {
          url = `http://localhost:3001/api/job/${jobId}`;
        }
        await axios.put(url, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Job updated successfully! Redirecting to jobs page...');
      } else {
        // Posting new job
        await axios.post(
          'http://localhost:3001/api/job',
          {
            ...formData,
            postedBy: user.email
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setSuccess('Job posted successfully! Redirecting to jobs page...');
      }

      setFormData({
        title: '',
        name: '',
        location: '',
        type: '',
        salary: '',
        description: '',
        link: '',
        expireDate: ''
      });

      // Redirect to jobs list after 2 seconds
      setTimeout(() => {
        navigate('/jobs');
      }, 2000);

    } catch (error) {
      console.error('Error posting job:', error);
      setError(error.response?.data?.error || (jobId ? 'Failed to update job.' : 'Failed to post job. Please check your inputs and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="post-job-container">
        <div className="post-job-card">
          <div className="post-job-header">
            <h2><FaBriefcase /> Post a New Job</h2>
            <p className="section-subtitle">Share job opportunities with the alumni community</p>
          </div>

          {error && (
            <div className="alert alert-danger">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              <FaCheckCircle />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="post-job-form">
            <div className="form-group">
              <label htmlFor="title" className="form-label">Job Title *</label>
              <div className="form-input-group">
                <FaBriefcase className="form-icon" />
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="name" className="form-label">Company Name *</label>
              <div className="form-input-group">
                <FaBuilding className="form-icon" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g., Tech Solutions Inc."
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location" className="form-label">Location *</label>
              <div className="form-input-group">
                <FaMapMarkerAlt className="form-icon" />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g., Mumbai, Maharashtra"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="type" className="form-label">Job Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Job Type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="salary" className="form-label">Salary Range *</label>
              <div className="form-input-group">
                <FaMoneyBillWave className="form-icon" />
                <input
                  type="text"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g., ₹8L - ₹12L per annum"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">Job Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-control"
                rows="6"
                placeholder="Enter detailed job description, requirements, and responsibilities..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="link" className="form-label">Application Link</label>
              <div className="form-input-group">
                <FaLink className="form-icon" />
                <input
                  type="url"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="https://company.com/careers/job-id"
                />
              </div>
              <small className="form-hint">Provide a direct link to your application form or careers page</small>
            </div>

            <div className="form-group">
              <label htmlFor="expireDate" className="form-label">Expire Date *</label>
              <div className="form-input-group">
                <FaRegCalendarCheck className="form-icon" />
                <input
                  type="date"
                  id="expireDate"
                  name="expireDate"
                  value={formData.expireDate}
                  onChange={handleChange}
                  className="form-control"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <small className="form-hint">The job will be automatically removed after this date.</small>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => navigate('/jobs')} 
                className="btn btn-secondary"
              >
                <FaArrowLeft />
                Back to Jobs
              </button>
              <button 
                type="submit" 
                className="btn btn-primary btn-lg w-100"
                style={{ minWidth: 160, borderRadius: '2em', boxShadow: '0 4px 15px rgba(26,42,108,0.15)', fontWeight: 600, transition: 'all 0.2s' }}
                disabled={isSubmitting}
              >
                <FaSave />
                {isSubmitting ? (jobId ? 'Updating...' : 'Posting...') : (jobId ? 'Edit Job' : 'Post Job')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default PostJob; 