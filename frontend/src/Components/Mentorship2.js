import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';

const Mentorship2 = () => {
  const [adminAssignments, setAdminAssignments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentAlumniSelections, setStudentAlumniSelections] = useState({});

  useEffect(() => {
    fetchAdminAssignments();
    // eslint-disable-next-line
  }, []);

  const fetchAdminAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/mentorship/admin/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminAssignments(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch mentorship assignments');
      setLoading(false);
    }
  };

  const handleSelectAlumniForStudent = (studentId, alumniId) => {
    setStudentAlumniSelections(prev => ({ ...prev, [studentId]: alumniId }));
  };

  const handleAssignStudent = async (studentId, alumniId) => {
    if (!alumniId) return;
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3001/api/mentorship/admin/assign', { studentId, alumniId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminAssignments(response.data);
      setStudentAlumniSelections(prev => ({ ...prev, [studentId]: '' }));
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign student');
      setLoading(false);
    }
  };

  const handleUnassignStudent = async (alumniId, studentId) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3001/api/mentorship/admin/unassign', { studentId, alumniId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminAssignments(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unassign student');
      setLoading(false);
    }
  };

  // Helper: Check if student is unassigned
  const isStudentUnassigned = (stuId) => adminAssignments.unassignedStudents.some(s => s._id === stuId);

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

  if (!adminAssignments) return null;

  // Gather available alumni for assignment dropdown (deduplicate by _id)
  const alumniMap = new Map();
  adminAssignments.unassignedAlumni.forEach(alum => alumniMap.set(alum._id, alum));
  adminAssignments.alumniWithAssignments.forEach(alum => alumniMap.set(alum._id, alum));
  const availableAlumni = Array.from(alumniMap.values());

  // Helper: Get assigned student count for an alumni
  const getAssignedCount = (alumniId) => {
    const alum = adminAssignments.alumniWithAssignments.find(a => a._id === alumniId);
    return alum ? (alum.assigned_students?.length || 0) : 0;
  };
  // Helper: Check if alumni is full (3 students)
  const isAlumniFull = (alumniId) => getAssignedCount(alumniId) >= 3;

  return (
    <>
      <Header />
      <div className="container py-5">
        <h2 className="mb-4 text-primary">Mentorship Assignments (Admin View)</h2>
        {/* Alumni with assigned students */}
        <div className="mb-5">
          <h4>Alumni with Assigned Students</h4>
          {adminAssignments.alumniWithAssignments.length > 0 ? (
            adminAssignments.alumniWithAssignments.map(alum => (
              <div key={`alumni-${alum._id}`} className="card mb-4 mentorship-card-admin" style={{ borderRadius: '20px', boxShadow: '0 8px 32px rgba(26,42,108,0.12)', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', transition: 'box-shadow 0.4s, transform 0.3s', position: 'relative', overflow: 'visible' }}>
                <div style={{ background: 'var(--primary-gradient)', borderRadius: '20px 20px 0 0', height: 70, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '50%', top: 35, transform: 'translate(-50%, 0)', zIndex: 2 }}>
                    <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'var(--background-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(26,42,108,0.18)', border: '4px solid #fff' }}><span style={{ fontSize: 44, color: '#b21f1f', fontWeight: 700 }}>{alum.first_name[0]}</span></div>
                  </div>
                </div>
                <div className="card-body text-center pt-5" style={{ paddingTop: 60 }}>
                  <h5 className="mb-1" style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '1.3rem', letterSpacing: 0.5 }}>{alum.first_name} {alum.last_name} <span className="text-muted" style={{ fontWeight: 400, fontSize: '1rem' }}>({alum.email})</span></h5>
                  <div className="d-flex flex-column align-items-center mb-3">
                    <span className="badge bg-info animate__animated animate__pulse animate__infinite" style={{ borderRadius: '1em', fontWeight: 600, fontSize: '1rem', background: 'linear-gradient(90deg, #fdbb2d, #b21f1f)', color: '#fff', padding: '0.5em 1.2em', boxShadow: '0 2px 8px #b21f1f22' }}>Alumni</span>
                    <span className="badge bg-secondary ms-2" style={{ borderRadius: '1em', fontWeight: 600, fontSize: '1rem', background: isAlumniFull(alum._id) ? '#b21f1f' : '#6c757d', color: '#fff', padding: '0.5em 1.2em', marginTop: 8 }}>
                      {getAssignedCount(alum._id)}/3 students assigned {isAlumniFull(alum._id) && '(Full)'}
                    </span>
                  </div>
                  {alum.assigned_students.filter(stu => stu && stu._id && stu.first_name && stu.last_name).length > 0 ? (
                    <ul className="mb-0 list-unstyled">
                      {alum.assigned_students.filter(stu => stu && stu._id && stu.first_name && stu.last_name).map(stu => (
                        <li key={`stu-${alum._id}-${stu._id}`} className="d-flex align-items-center justify-content-between mb-2 p-2" style={{ background: 'rgba(245,247,250,0.7)', borderRadius: 12 }}>
                          <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{stu.first_name} {stu.last_name} <span className="text-muted">({stu.email})</span> - {stu.department}, Year {stu.current_year}</span>
                          <button className="btn btn-danger btn-lg ms-2" style={{ minWidth: 120, borderRadius: '2em', boxShadow: '0 2px 8px rgba(231,76,60,0.10)', fontWeight: 700, transition: 'all 0.2s' }} onClick={() => handleUnassignStudent(alum._id, stu._id)}>
                            Unassign
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted">No students assigned</span>
                  )}
                </div>
              </div>
            ))
          ) : <div className="text-muted">No alumni with assigned students.</div>}
        </div>
        {/* Unassigned Alumni */}
        <div className="mb-5">
          <h4>Unassigned Alumni</h4>
          {adminAssignments.unassignedAlumni.length > 0 ? (
            <ul>
              {adminAssignments.unassignedAlumni.map(alum => (
                <li key={`unassigned-alum-${alum._id}`}>{alum.first_name} {alum.last_name} ({alum.email})</li>
              ))}
            </ul>
          ) : <div className="text-muted">All alumni have assignments.</div>}
        </div>
        {/* Unassigned Students */}
        <div className="mb-5">
          <h4>Unassigned Students</h4>
          {adminAssignments.unassignedStudents.length > 0 ? (
            <ul>
              {adminAssignments.unassignedStudents.map(stu => (
                <li key={`unassigned-stu-${stu._id}`} className="d-flex align-items-center mb-3 p-2" style={{ background: 'rgba(245,247,250,0.7)', borderRadius: 12 }}>
                  <span style={{ fontWeight: 600, color: 'var(--secondary-color)' }}>{stu.first_name} {stu.last_name} <span className="text-muted">({stu.email})</span> - {stu.department}, Year {stu.current_year}</span>
                  <select className="form-select form-select-sm w-auto ms-2" value={studentAlumniSelections[stu._id] || ''} onChange={e => handleSelectAlumniForStudent(stu._id, e.target.value)} style={{ borderRadius: 20, fontWeight: 600, minWidth: 140 }}>
                    <option value="">Assign to Alumni</option>
                    {availableAlumni.map(alum => (
                      <option key={alum._id} value={alum._id} disabled={isAlumniFull(alum._id)}>
                        {alum.first_name} {alum.last_name} {isAlumniFull(alum._id) ? '(Full)' : ''}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-success btn-lg ms-2" style={{ minWidth: 120, borderRadius: '2em', boxShadow: '0 2px 8px rgba(46,204,113,0.10)', fontWeight: 700, transition: 'all 0.2s' }} onClick={() => handleAssignStudent(stu._id, studentAlumniSelections[stu._id])} disabled={!studentAlumniSelections[stu._id] || !isStudentUnassigned(stu._id)}>
                    Assign
                  </button>
                </li>
              ))}
            </ul>
          ) : <div className="text-muted">All students are assigned.</div>}
        </div>
        {error && (
          <div className="alert alert-danger mt-3" role="alert">
            {typeof error === 'string' ? error : (error.message || 'Failed to assign student')}
          </div>
        )}
      </div>
      {/*
      If you still do not see assigned students after this fix, run the cleanup script provided earlier to remove orphaned or invalid assignments from your database.
      */}
    </>
  );
};

export default Mentorship2; 