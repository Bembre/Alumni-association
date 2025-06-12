import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaUser, FaGraduationCap, FaBriefcase, FaTools, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaEdit, FaProjectDiagram, FaTrophy, FaSave, FaUserGraduate, FaBook, FaTrash, FaPlus } from 'react-icons/fa';
import Header from './Header';
import './CommonStyles.css';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Collapse } from 'react-collapse';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [editSection, setEditSection] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    academic: false,
    contact: false,
    skills: false,
    projects: false,
    achievements: false,
    education: false
  });
  const [globalEdit, setGlobalEdit] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
      navigate('/auth');
      return;
    }
    
    setCurrentUser(user);
    fetchProfileData();
  }, [id, navigate]);

  useEffect(() => {
    if (profileData) setFormData(profileData);
  }, [profileData]);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:3001/api/student/profile';
      
      if (id) {
        url = `http://localhost:3001/api/student/profile/${id}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfileData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.response?.data?.error || 'Failed to fetch profile');
      setLoading(false);
    }
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => setIsEditing(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helper validation functions
  const isAlpha = str => !str || /^[A-Za-z]+$/.test(str);
  const isPhone = str => !str || /^\d{10}$/.test(str);
  const isStudentId = str => !str || /^S\d{10}$/.test(str);
  const validAchievementTypes = ['sports', 'awards', 'academic', 'events'];
  const validEducationTypes = ['10th', '12th', 'Graduation', 'Post Graduation'];
  const validCurrentYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const validGenders = ['Male', 'Female', 'Other'];

  function validateStudentProfile(formData) {
    if (!isAlpha(formData.first_name)) return 'First name must contain only letters.';
    if (!isAlpha(formData.middle_name)) return 'Middle name must contain only letters.';
    if (!isAlpha(formData.last_name)) return 'Last name must contain only letters.';
    if (!isPhone(formData.phone)) return 'Phone must be 10 digits.';
    if (!isPhone(formData.alt_phone)) return 'Alternate phone must be 10 digits.';
    if (!isStudentId(formData.student_id)) return 'Student ID must start with S and be followed by 10 digits.';
    if (formData.current_year && !validCurrentYears.includes(formData.current_year)) return 'Current year is invalid.';
    if (formData.gender && !validGenders.includes(formData.gender)) return 'Gender is invalid.';
    if (Array.isArray(formData.achievements)) {
      for (const ach of formData.achievements) {
        if (ach.type && !validAchievementTypes.includes(ach.type)) {
          return `Achievement type '${ach.type}' is not allowed.`;
        }
      }
    }
    if (Array.isArray(formData.education)) {
      for (const edu of formData.education) {
        if (edu.type && !validEducationTypes.includes(edu.type)) {
          return `Education type '${edu.type}' is not allowed.`;
        }
      }
    }
    return null;
  }

  const handleSave = async () => {
    const validationError = validateStudentProfile(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // Construct payload with correct backend field names
      const payload = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        dob: formData.dob,
        gender: formData.gender,
        department: formData.department,
        course: formData.course,
        current_year: formData.current_year,
        student_id: formData.student_id,
        phone: formData.phone,
        alt_phone: formData.alt_phone,
        current_address: formData.current_address,
        permanent_address: formData.permanent_address,
        profile: formData.profile,
        experience: formData.experience,
        skillset: formData.skillset,
        projects: formData.projects,
        achievements: formData.achievements,
        education: formData.education,
        profileCompleted: true
      };
      const response = await axios.put('http://localhost:3001/api/student/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSectionEdit = (section) => {
    setEditSection(section);
    toggleSection(section);
  };

  const handleSectionSave = (section) => {
    // Implementation of handleSectionSave
  };

  const handleSectionCancel = () => {
    setEditSection(null);
    toggleSection(editSection);
  };

  const handleArrayChange = (array, index, field, value) => {
    // Implementation of handleArrayChange
  };

  const handleArrayRemove = (array, index) => {
    // Implementation of handleArrayRemove
  };

  const handleArrayAdd = (array, item) => {
    // Implementation of handleArrayAdd
  };

  const handleGlobalEdit = () => {
    setGlobalEdit(true);
    setEditSection('all');
    setExpandedSections({
      personal: true,
      academic: true,
      contact: true,
      skills: true,
      projects: true,
      achievements: true,
      education: true
    });
  };

  const handleGlobalSave = async () => {
    const validationError = validateStudentProfile(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // Construct payload with correct backend field names
      const payload = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        dob: formData.dob,
        gender: formData.gender,
        department: formData.department,
        course: formData.course,
        current_year: formData.current_year,
        student_id: formData.student_id,
        phone: formData.phone,
        alt_phone: formData.alt_phone,
        current_address: formData.current_address,
        permanent_address: formData.permanent_address,
        profile: formData.profile,
        experience: formData.experience,
        skillset: formData.skillset,
        projects: formData.projects,
        achievements: formData.achievements,
        education: formData.education,
        profileCompleted: true
      };
      const response = await axios.put('http://localhost:3001/api/student/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(response.data);
      setGlobalEdit(false);
      setEditSection(null);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleGlobalCancel = () => {
    setGlobalEdit(false);
    setEditSection(null);
    setFormData(profileData);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="profile-loading">
          <div className="profile-loading-spinner"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="profile-container">
          <div className="profile-message profile-message-error">
            <h4>Error</h4>
            <p>{error}</p>
            <button className="profile-edit-button" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!profileData) {
    return (
      <>
        <Header />
        <div className="profile-container">
          <div className="profile-message profile-message-error">
            <h4>Profile Not Found</h4>
            <p>The requested profile could not be found.</p>
            <button className="profile-edit-button" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="profile-container student-profile-vibrant advanced-ui">
        <div className="profile-card-main card shadow rounded-4 p-4 mx-auto" style={{maxWidth: 800}}>
          <div className="d-flex flex-column align-items-center mb-4">
            <div
              className="mb-3"
              style={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid #198754',
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8f9fa',
                position: 'relative'
              }}
            >
              {globalEdit ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  {formData?.profile ? (
                    <img src={formData.profile} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaUserGraduate size={70} className="text-muted" />
                    </div>
                  )}
                  <label className="btn btn-success rounded-circle position-absolute bottom-0 end-0" style={{ width: '40px', height: '40px', cursor: 'pointer' }} title="Upload profile photo">
                    <input type="file" accept="image/*" onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new window.FileReader();
                        reader.onloadend = () => setFormData(prev => ({ ...prev, profile: reader.result }));
                        reader.readAsDataURL(file);
                      }
                    }} className="d-none" />
                    <FaUserGraduate />
                  </label>
                </div>
              ) : (
                profileData.profile ? (
                  <img src={profileData.profile} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaUserGraduate size={70} className="text-muted" />
                  </div>
                )
              )}
            </div>
            <h2 className="fw-bold text-success mb-0">{profileData.first_name} {profileData.last_name}</h2>
            <span className="text-muted">{profileData.email}</span>
          </div>
          <div className="d-flex justify-content-end mb-3">
            {!globalEdit && (
              <button className="btn btn-primary px-4 py-2 fw-semibold" onClick={handleGlobalEdit} title="Edit Profile">
                <FaEdit className="me-2" />Edit Profile
              </button>
            )}
          </div>
          {globalEdit && (
            <div className="d-flex justify-content-end mb-4 gap-2">
              <button className="btn btn-success px-4 py-2 fw-semibold" onClick={handleGlobalSave}><FaSave className="me-2" />Save All</button>
              <button className="btn btn-secondary px-4 py-2 fw-semibold" onClick={handleGlobalCancel}>Cancel</button>
            </div>
          )}
          {/* Personal Section */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaUserGraduate className="me-2 text-success" />
              <h5 className="mb-0 fw-bold flex-grow-1">Personal Information</h5>
            </div>
            {globalEdit ? (
              <form className="row g-3">
                <div className="col-md-4"><label>First Name</label><input name="first_name" value={formData?.first_name || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Middle Name</label><input name="middle_name" value={formData?.middle_name || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Last Name</label><input name="last_name" value={formData?.last_name || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Date of Birth</label><input name="dob" type="date" value={formData?.dob ? formData.dob.slice(0,10) : ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Gender</label><select name="gender" value={formData?.gender || ''} onChange={handleChange} className="form-control"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
              </form>
            ) : (
              <div className="row g-3">
                <div className="col-md-4"><span className="fw-semibold">First Name:</span> {profileData.first_name}</div>
                <div className="col-md-4"><span className="fw-semibold">Middle Name:</span> {profileData.middle_name || '-'}</div>
                <div className="col-md-4"><span className="fw-semibold">Last Name:</span> {profileData.last_name}</div>
                <div className="col-md-4"><span className="fw-semibold">Date of Birth:</span> {profileData.dob ? new Date(profileData.dob).toLocaleDateString() : '-'}</div>
                <div className="col-md-4"><span className="fw-semibold">Gender:</span> {profileData.gender}</div>
              </div>
            )}
          </div>
          {/* Academic Section */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaBook className="me-2 text-success" />
              <h5 className="mb-0 fw-bold flex-grow-1">Academic Information</h5>
            </div>
            {globalEdit ? (
              <form className="row g-3">
                <div className="col-md-4"><label>Department</label><input name="department" value={formData?.department || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Course</label><input name="course" value={formData?.course || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Year</label><input name="current_year" value={formData?.current_year || ''} onChange={handleChange} className="form-control" /></div>
              </form>
            ) : (
              <div className="row g-3">
                <div className="col-md-4"><span className="fw-semibold">Department:</span> {profileData.department}</div>
                <div className="col-md-4"><span className="fw-semibold">Course:</span> {profileData.course}</div>
                <div className="col-md-4"><span className="fw-semibold">Year:</span> {profileData.current_year}</div>
              </div>
            )}
          </div>
          {/* Contact Section */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaEnvelope className="me-2 text-success" />
              <h5 className="mb-0 fw-bold flex-grow-1">Contact Information</h5>
            </div>
            {globalEdit ? (
              <form className="row g-3">
                <div className="col-md-4"><label>Phone</label><input name="phone" value={formData?.phone || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Alternate Phone</label><input name="alt_phone" value={formData?.alt_phone || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Address</label><input name="current_address" value={formData?.current_address || ''} onChange={handleChange} className="form-control" /></div>
              </form>
            ) : (
              <div className="row g-3">
                <div className="col-md-4"><span className="fw-semibold">Phone:</span> {profileData.phone}</div>
                <div className="col-md-4"><span className="fw-semibold">Alternate Phone:</span> {profileData.alt_phone}</div>
                <div className="col-md-4"><span className="fw-semibold">Address:</span> {profileData.current_address}</div>
              </div>
            )}
          </div>
          {/* Skills Section */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaTools className="me-2 text-success" />
              <h5 className="mb-0 fw-bold flex-grow-1">Skills</h5>
            </div>
            {globalEdit ? (
              <div className="d-flex flex-wrap gap-3">
                {(formData?.skillset || []).map((skill, idx) => (
                  <input key={idx} className="form-control mb-2 me-2" style={{width:180}} value={skill} onChange={e => handleArrayChange('skillset', idx, null, e.target.value)} />
                ))}
                <button className="btn btn-outline-success" onClick={() => handleArrayAdd('skillset', '')}><FaPlus /> Add Skill</button>
              </div>
            ) : (
              <div className="d-flex flex-wrap gap-3">
                {(profileData.skillset || []).map((skill, idx) => (
                  <span key={idx} className="badge bg-success fs-6 px-3 py-2 mx-1 my-1">{skill}</span>
                ))}
              </div>
            )}
          </div>
          {/* Projects Section */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaProjectDiagram className="me-2 text-success" />
              <h5 className="mb-0 fw-bold flex-grow-1">Projects</h5>
            </div>
            <div className="mb-2 fw-bold text-primary">Project Details</div>
            {globalEdit ? (
              <div>
                {(formData?.projects || []).map((proj, idx) => (
                  <div className="profile-card mb-3 p-3 bg-light rounded-3" key={idx}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">Project {idx + 1}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => handleArrayRemove('projects', idx)}><FaTrash /></button>
                    </div>
                    <div className="row g-2">
                      <div className="col-md-4"><input className="form-control" placeholder="Title" value={proj.title} onChange={e => handleArrayChange('projects', idx, 'title', e.target.value)} /></div>
                      <div className="col-md-4"><input className="form-control" placeholder="Technologies" value={proj.technologies} onChange={e => handleArrayChange('projects', idx, 'technologies', e.target.value)} /></div>
                      <div className="col-md-4"><input className="form-control" placeholder="Link" value={proj.link} onChange={e => handleArrayChange('projects', idx, 'link', e.target.value)} /></div>
                    </div>
                    <div className="row g-2 mt-2">
                      <div className="col-md-12"><textarea className="form-control" placeholder="Description" value={proj.description} onChange={e => handleArrayChange('projects', idx, 'description', e.target.value)} /></div>
                    </div>
                  </div>
                ))}
                <button className="btn btn-outline-success mb-2" onClick={() => handleArrayAdd('projects', { title: '', description: '', technologies: '', link: '' })}><FaPlus /> Add Project</button>
              </div>
            ) : (
              <div>
                {(profileData.projects || []).map((proj, idx) => (
                  <div key={idx} className="profile-card mb-3 p-3 bg-light rounded-3">
                    <div className="fw-bold">{proj.title} <span className="text-muted">({proj.technologies})</span></div>
                    <div className="small text-muted">{proj.link}</div>
                    <div>{proj.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Achievements Section */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaTrophy className="me-2 text-success" />
              <h5 className="mb-0 fw-bold flex-grow-1">Achievements</h5>
            </div>
            <div className="mb-2 fw-bold text-primary">Achievements List</div>
            {globalEdit ? (
              <div>
                {(formData?.achievements || []).map((ach, idx) => (
                  <div className="profile-card mb-3 p-3 bg-light rounded-3" key={idx}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">Achievement {idx + 1}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => handleArrayRemove('achievements', idx)}><FaTrash /></button>
                    </div>
                    <div className="row g-2">
                      <div className="col-md-4"><input className="form-control" placeholder="Title" value={ach.title} onChange={e => handleArrayChange('achievements', idx, 'title', e.target.value)} /></div>
                      <div className="col-md-4"><input className="form-control" placeholder="Type" value={ach.type} onChange={e => handleArrayChange('achievements', idx, 'type', e.target.value)} /></div>
                      <div className="col-md-4"><input className="form-control" placeholder="Organization" value={ach.organization} onChange={e => handleArrayChange('achievements', idx, 'organization', e.target.value)} /></div>
                    </div>
                    <div className="row g-2 mt-2">
                      <div className="col-md-12"><textarea className="form-control" placeholder="Description" value={ach.description} onChange={e => handleArrayChange('achievements', idx, 'description', e.target.value)} /></div>
                    </div>
                  </div>
                ))}
                <button className="btn btn-outline-success mb-2" onClick={() => handleArrayAdd('achievements', { title: '', type: '', organization: '', description: '' })}><FaPlus /> Add Achievement</button>
              </div>
            ) : (
              <div>
                {(profileData.achievements || []).map((ach, idx) => (
                  <div key={idx} className="profile-card mb-3 p-3 bg-light rounded-3">
                    <div className="fw-bold">{ach.title} <span className="text-muted">({ach.type})</span></div>
                    <div className="small text-muted">{ach.date} | {ach.organization}</div>
                    <div>{ach.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Education Section (Array) */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaGraduationCap className="me-2 text-success" />
              <h5 className="mb-0 fw-bold flex-grow-1">Education Details</h5>
            </div>
            {globalEdit ? (
              <div>
                {(formData?.education || []).map((edu, idx) => (
                  <div className="profile-card mb-3 p-3 bg-light rounded-3" key={idx}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">Education {idx + 1}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => handleArrayRemove('education', idx)}><FaTrash /></button>
                    </div>
                    <div className="row g-2">
                      <div className="col-md-3"><input className="form-control" placeholder="Type" value={edu.type} onChange={e => handleArrayChange('education', idx, 'type', e.target.value)} /></div>
                      <div className="col-md-3"><input className="form-control" placeholder="Institution" value={edu.institution} onChange={e => handleArrayChange('education', idx, 'institution', e.target.value)} /></div>
                      <div className="col-md-3"><input className="form-control" placeholder="Board/University" value={edu.board} onChange={e => handleArrayChange('education', idx, 'board', e.target.value)} /></div>
                      <div className="col-md-3"><input className="form-control" placeholder="Year" value={edu.year} onChange={e => handleArrayChange('education', idx, 'year', e.target.value)} /></div>
                      <div className="col-md-3"><input className="form-control" placeholder="Grade" value={edu.grade} onChange={e => handleArrayChange('education', idx, 'grade', e.target.value)} /></div>
                      <div className="col-md-3"><input className="form-control" placeholder="Percentage" value={edu.percentage} onChange={e => handleArrayChange('education', idx, 'percentage', e.target.value)} /></div>
                    </div>
                  </div>
                ))}
                <button className="btn btn-outline-success mb-2" onClick={() => handleArrayAdd('education', { type: '', institution: '', board: '', year: '', grade: '', percentage: '' })}><FaPlus /> Add Education</button>
              </div>
            ) : (
              <div>
                {(profileData.education || []).map((edu, idx) => (
                  <div key={idx} className="profile-card mb-3 p-3 bg-light rounded-3">
                    <div className="fw-bold">{edu.institution} <span className="text-muted">({edu.type})</span></div>
                    <div className="small text-muted">{edu.board} | {edu.year} | Grade: {edu.grade} | {edu.percentage}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {globalEdit && (
            <div className="d-flex justify-content-end mt-4 gap-2">
              <button className="btn btn-success px-4 py-2 fw-semibold" onClick={handleGlobalSave}><FaSave className="me-2" />Save All</button>
              <button className="btn btn-secondary px-4 py-2 fw-semibold" onClick={handleGlobalCancel}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentProfile; 