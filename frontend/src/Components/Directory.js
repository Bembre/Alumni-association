import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFilter, FaUser, FaGraduationCap, FaBriefcase, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCode, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';
import Header from './Header';
import '../App.css'
// import img4 from "../img/mgmalumini4.jpg"

const Directory = () => {
  const [alumni, setAlumni] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('alumni');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setIsAdmin(user && user.role === 'admin');
    fetchAlumni();
    if (user && user.role === 'admin') fetchStudents();
  }, []);

  const fetchAlumni = async () => {
    try {
      const url = isAdmin ? 'http://localhost:3001/api/admin/alumni' : 'http://localhost:3001/api/alumni/all';
      const token = localStorage.getItem('token');
      const response = await axios.get(url, isAdmin ? { headers: { Authorization: `Bearer ${token}` } } : {});
      const alumniData = response.data.map(alum => ({
        ...alum,
        fullName: `${alum.first_name} ${alum.last_name}`.trim(),
        currentCompany: alum.experience && alum.experience.length > 0 ? alum.experience[0].company : 'Not specified',
        currentRole: alum.experience && alum.experience.length > 0 ? alum.experience[0].position : 'Not specified',
        location: alum.current_address || 'Not specified'
      }));
      
      setAlumni(alumniData);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch alumni data');
      setLoading(false);
      console.error('Error fetching alumni:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/admin/students', { headers: { Authorization: `Bearer ${token}` } });
      setStudents(response.data);
    } catch (err) {
      setError('Failed to fetch students');
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3001/api/admin/alumni/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchAlumni();
    } catch (err) {
      alert('Failed to approve alumni');
    }
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3001/api/admin/alumni/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchAlumni();
    } catch (err) {
      alert('Failed to reject alumni');
    }
  };

  const handleDeleteAlumni = async (id) => {
    if (!window.confirm('Are you sure you want to delete this alumni?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/admin/alumni/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAlumni();
    } catch (err) {
      alert('Failed to delete alumni');
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/admin/students/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchStudents();
    } catch (err) {
      alert('Failed to delete student');
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
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container py-5 text-center">
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
        <div className="d-flex gap-2 mb-4">
          <button className={`btn ${activeTab === 'alumni' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveTab('alumni')}>Alumni</button>
          <button className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveTab('students')}>Students</button>
        </div>
        {/* Alumni Section */}
        <div style={{ display: activeTab === 'alumni' ? 'block' : 'none' }}>
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h2 className="text-primary mb-4">Alumni Directory</h2>
              <div className="row">
                {alumni.map(alum => (
                  <div className="col-md-6 col-lg-4 mb-4" key={alum._id}>
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="text-center mb-3">
                          {alum.profile ? (
                            <img src={alum.profile} alt={alum.fullName} className="rounded-circle mb-3" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                          ) : (
                            <div className="rounded-circle bg-light mb-3 mx-auto d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                              <FaUser size={40} className="text-muted" />
                            </div>
                          )}
                        </div>
                        <h5 className="card-title">{alum.fullName}</h5>
                        <p className="card-text mb-1"><FaEnvelope className="me-2" />{alum.email}</p>
                        <p className="card-text mb-1"><FaBriefcase className="me-2" />{alum.currentCompany}</p>
                        <p className="card-text mb-1"><FaGraduationCap className="me-2" />Batch: {alum.passing_year}</p>
                        <p className="card-text mb-1"><FaMapMarkerAlt className="me-2" />{alum.location}</p>
                        <p className="card-text mb-1">Phone: {alum.phone}</p>
                        <p className="card-text mb-1">DOB: {alum.dob ? new Date(alum.dob).toLocaleDateString() : '-'}</p>
                        <p className="card-text mb-1">Gender: {alum.gender}</p>
                        <p className="card-text mb-1">Department: {alum.department}</p>
                        <p className="card-text mb-1">Course: {alum.course}</p>
                        <p className="card-text mb-1">Current Company: {alum.current_company}</p>
                        <p className="card-text mb-1">Designation: {alum.designation}</p>
                        <p className="card-text mb-1">Current Location: {alum.current_location}</p>
                        <div className="mb-2">Skills: {(alum.skillset || []).join(', ')}</div>
                        <div className="mb-2">Projects: {(alum.projects || []).map(p => p.title).join(', ')}</div>
                        <div className="mb-2">Achievements: {(alum.achievements || []).map(a => a.title).join(', ')}</div>
                        <div className="mb-2">Education: {(alum.education || []).map(e => e.institution).join(', ')}</div>
                        {isAdmin && (
                          <div className="d-flex align-items-center gap-3 mt-3" style={{ flexWrap: 'wrap' }}>
                            <span className={`badge rounded-pill ${alum.isApproved ? 'bg-success' : 'bg-warning text-dark'}`} style={{ minWidth: 100, fontSize: '1rem', padding: '0.6em 1.2em', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>{alum.isApproved ? 'Approved' : 'Pending'}</span>
                            {!alum.isApproved && (
                              <button className="btn btn-primary btn-lg" style={{ minWidth: 120, background: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 100%)', border: 'none', borderRadius: '2em', boxShadow: '0 2px 8px rgba(26,42,108,0.10)', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => handleApprove(alum._id)}>
                                <FaCheck className="me-2" /> Approve
                              </button>
                            )}
                            {!alum.isApproved && (
                              <button className="btn btn-danger btn-lg" style={{ minWidth: 120, borderRadius: '2em', boxShadow: '0 2px 8px rgba(178,31,31,0.10)', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => handleReject(alum._id)}>
                                <FaTimes className="me-2" /> Reject
                              </button>
                            )}
                            <button className="btn btn-outline-danger btn-lg" style={{ minWidth: 120, borderRadius: '2em', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => handleDeleteAlumni(alum._id)}>
                              <FaTrash className="me-2" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Student Section */}
        <div style={{ display: activeTab === 'students' ? 'block' : 'none' }}>
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h2 className="text-primary mb-4">Student Directory</h2>
              <div className="row">
                {students.map(student => (
                  <div className="col-md-6 col-lg-4 mb-4" key={student._id}>
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="text-center mb-3">
                          {student.profile ? (
                            <img src={student.profile} alt={student.first_name + ' ' + student.last_name} className="rounded-circle mb-3" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                          ) : (
                            <div className="rounded-circle bg-light mb-3 mx-auto d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                              <FaUser size={40} className="text-muted" />
                            </div>
                          )}
                        </div>
                        <h5 className="card-title">{student.first_name} {student.last_name}</h5>
                        <p className="card-text mb-1"><FaEnvelope className="me-2" />{student.email}</p>
                        <p className="card-text mb-1"><FaGraduationCap className="me-2" />Year: {student.current_year}</p>
                        <p className="card-text mb-1"><FaBriefcase className="me-2" />Department: {student.department}</p>
                        <p className="card-text mb-1"><FaBriefcase className="me-2" />Course: {student.course}</p>
                        <p className="card-text mb-1"><FaMapMarkerAlt className="me-2" />{student.current_address}</p>
                        <p className="card-text mb-1"><FaPhone className="me-2" />{student.phone}</p>
                        <p className="card-text mb-1">DOB: {student.dob ? new Date(student.dob).toLocaleDateString() : '-'}</p>
                        <p className="card-text mb-1">Gender: {student.gender}</p>
                        <p className="card-text mb-1">Student ID: {student.student_id}</p>
                        <p className="card-text mb-1">Permanent Address: {student.permanent_address}</p>
                        <div className="mb-2">Skills: {(student.skillset || []).join(', ')}</div>
                        <div className="mb-2">Projects: {(student.projects || []).map(p => p.title).join(', ')}</div>
                        <div className="mb-2">Achievements: {(student.achievements || []).map(a => a.title).join(', ')}</div>
                        <div className="mb-2">Education: {(student.education || []).map(e => e.institution).join(', ')}</div>
                        <div className="d-flex align-items-center gap-3 mt-3" style={{ flexWrap: 'wrap' }}>
                          <button className="btn btn-outline-danger btn-lg" style={{ minWidth: 120, borderRadius: '2em', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => handleDeleteStudent(student._id)}>
                            <FaTrash className="me-2" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Directory;
