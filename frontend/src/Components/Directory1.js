import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaGraduationCap, FaBriefcase, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import Header from './Header';
import '../App.css';

const Directory1 = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/alumni/all');
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

  // Get unique departments and batches for dropdowns
  const departments = Array.from(new Set(alumni.map(a => a.department).filter(Boolean)));
  const batches = Array.from(new Set(alumni.map(a => a.passing_year).filter(Boolean)));

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
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h2 className="text-primary mb-4">Alumni Directory</h2>
            <div className="mb-4 row g-2 align-items-end">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by name, company, location, or designation..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <select className="form-select" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select className="form-select" value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
                  <option value="">All Batches</option>
                  {batches.map(batch => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row">
              {alumni
                .filter(alum => {
                  const search = filter.toLowerCase();
                  const matchesText =
                    alum.fullName.toLowerCase().includes(search) ||
                    (alum.currentCompany && alum.currentCompany.toLowerCase().includes(search)) ||
                    (alum.currentRole && alum.currentRole.toLowerCase().includes(search)) ||
                    (alum.location && alum.location.toLowerCase().includes(search)) ||
                    (alum.designation && alum.designation.toLowerCase().includes(search));
                  const matchesDepartment = departmentFilter ? alum.department === departmentFilter : true;
                  const matchesBatch = batchFilter ? String(alum.passing_year) === String(batchFilter) : true;
                  return matchesText && matchesDepartment && matchesBatch;
                })
                .map(alum => (
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
                        <h5 className="card-title">Name: {alum.fullName}</h5>
                        <p className="card-text mb-1"><FaEnvelope className="me-2" /><strong>Email:</strong> {alum.email}</p>
                        <p className="card-text mb-1"><FaGraduationCap className="me-2" /><strong>Batch:</strong> {alum.passing_year}</p>
                        <p className="card-text mb-1"><FaBriefcase className="me-2" /><strong>Company:</strong> {alum.current_company || 'Not specified'}</p>
                        <p className="card-text mb-1"><FaBriefcase className="me-2" /><strong>Designation:</strong> {alum.designation || 'Not specified'}</p>
                        <p className="card-text mb-1"><FaMapMarkerAlt className="me-2" /><strong>Location:</strong> {alum.current_location || 'Not specified'}</p>
                        <p className="card-text mb-1"><FaMapMarkerAlt className="me-2" /><strong>Address:</strong> {alum.current_address || 'Not specified'}</p>
                        <div className="d-flex align-items-center gap-3 mt-3" style={{ flexWrap: 'wrap' }}>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Directory1; 