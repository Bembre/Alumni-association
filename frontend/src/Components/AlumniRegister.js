import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaPhone, FaBuilding, FaBriefcase } from 'react-icons/fa';

const AlumniRegister = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    dob: '',
    gender: '',
    phone: '',
    current_address: '',
    permanent_address: '',
    department: '',
    course: '',
    graduation_year: '',
    current_company: '',
    designation: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Validate required fields
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name || !formData.dob || !formData.gender || !formData.phone || !formData.graduation_year || !formData.current_company || !formData.designation) {
      setError('Please fill all required fields.');
      setLoading(false);
      return;
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    // Password validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }
    // Graduation year validation
    if (isNaN(formData.graduation_year) || formData.graduation_year < 2000 || formData.graduation_year > new Date().getFullYear()) {
      setError('Graduation year must be a valid year.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/api/alumni/register', formData);
      
      if (response.data) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.alumni));
        
        // Redirect to dashboard
        navigate('/home1');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data?.details) {
        setError(error.response.data.details.map(err => `${err.field}: ${err.message}`).join('\n'));
      } else {
        setError(error.response?.data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-lg">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">Alumni Registration</h3>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  {error.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Personal Information */}
                  <div className="col-md-4">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Middle Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email *</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaEnvelope />
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Password *</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaLock />
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength="6"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Gender *</label>
                    <select
                      className="form-select"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Phone *</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaPhone />
                      </span>
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-select"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="IT">Information Technology</option>
                      <option value="CSE">Computer Science</option>
                      <option value="ECE">Electronics</option>
                      <option value="ME">Mechanical</option>
                      <option value="CE">Civil</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Course *</label>
                    <select
                      className="form-select"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Course</option>
                      <option value="B.Tech">B.Tech</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="MCA">MCA</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Graduation Year *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="graduation_year"
                      value={formData.graduation_year}
                      onChange={handleChange}
                      required
                      min="2000"
                      max={new Date().getFullYear()}
                      onKeyDown={e => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Current Company *</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaBuilding />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        name="current_company"
                        value={formData.current_company}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Designation *</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaBriefcase />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Current Address *</label>
                    <textarea
                      className="form-control"
                      name="current_address"
                      value={formData.current_address}
                      onChange={handleChange}
                      required
                      rows="3"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Permanent Address *</label>
                    <textarea
                      className="form-control"
                      name="permanent_address"
                      value={formData.permanent_address}
                      onChange={handleChange}
                      required
                      rows="3"
                    />
                  </div>
                </div>

                <div className="text-center mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    style={{ minWidth: 160, borderRadius: '2em', boxShadow: '0 4px 15px rgba(26,42,108,0.15)', fontWeight: 600, transition: 'all 0.2s' }}
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniRegister; 