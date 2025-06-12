import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FaUser, FaGraduationCap, FaBriefcase, FaTools, FaSave, FaIdCard, FaTrash, FaPlus } from 'react-icons/fa';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);
  const [experience, setExperience] = useState([{
    type: 'Internship',
    company: '',
    position: '',
    duration: '',
    description: ''
  }]);
  const [skills, setSkills] = useState([""]);
  const [education, setEducation] = useState([
    {
      type: '10th',
      institution: '',
      board: '',
      year: '',
      grade: '',
      percentage: ''
    },
    {
      type: '12th',
      institution: '',
      board: '',
      year: '',
      grade: '',
      percentage: ''
    }
  ]);
  const [email, setEmail] = useState("");
  const [userData, setUserData] = useState(null);
  const [profileCompleted, setProfileCompleted] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'student') {
      navigate('/auth');
      return;
    }

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: '',
    department: 'Information Technology',
    course: 'B. Tech. Information Technology',
    currentYear: '',
    studentId: '',
    phone: '',
    altPhone: '',
    currentAddress: '',
    permanentAddress: '',
    profilePic: null
  });

  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  const maxPassingYear = `${currentYear}-${currentMonth}`;
  const minPassingYear = "2003-01";
  const maxDob = new Date(currentYear - 20, 0, 1).toISOString().split("T")[0];
  const minDob = "1997-01-01";

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result);  // Set the image as base64
      reader.readAsDataURL(file);  // Read the file as data URL (base64 encoded)
    }
  };

  const handleChange = (setter, list, index, field, value) => {
    const updated = [...list];
    if (field === 'skill') {
      updated[index] = value; // For skills, just store the string value directly
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setter(updated);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddField = (setter, list, template) => setter([...list, template]);

  const handleRemoveField = (setter, list, index) => {
    const updatedList = [...list];
    updatedList.splice(index, 1);
    setter(updatedList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const profileData = {
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        dob: formData.dob,
        gender: formData.gender,
        department: 'Information Technology',
        course: 'B. Tech. Information Technology',
        current_year: formData.currentYear,
        student_id: formData.studentId,
        phone: formData.phone,
        alt_phone: formData.altPhone,
        current_address: formData.currentAddress,
        permanent_address: formData.permanentAddress,
        profile: profilePic,
        experience: experience
          .filter(exp => exp.company && exp.position && exp.duration)
          .map(exp => ({
            type: exp.type,
            company: exp.company,
            position: exp.position,
            duration: exp.duration,
            description: exp.description || ''
          })),
        skills: skills.filter(skill => typeof skill === 'string' && skill.trim() !== ''),
        education: education
          .filter(edu => edu.institution && edu.board && edu.year && edu.grade && edu.percentage)
          .map(edu => ({
            type: edu.type,
            institution: edu.institution,
            board: edu.board,
            year: parseInt(edu.year),
            grade: edu.grade,
            percentage: parseFloat(edu.percentage)
          }))
      };

      const response = await axios.put(
        "http://localhost:3001/api/student/profile",
        profileData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        alert("Profile saved successfully!");
        setProfileCompleted(true);
        const updatedUser = { ...userData, profileCompleted: true };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        navigate('/home1');
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      if (error.response) {
        if (error.response.status === 401) {
          alert("Session expired. Please login again.");
          navigate("/");
        } else if (error.response.status === 404) {
          alert("Profile not found. Please try again.");
        } else {
          alert(`Error saving profile: ${error.response.data.error || 'Unknown error'}`);
        }
      } else {
        alert("Error saving profile. Please try again.");
      }
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/student/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;
      
      // Check if this is a new user
      const isNewUser = !data.profileCompleted && (!data.experience || data.experience.length === 0);
      
      if (isNewUser) {
        // Initialize with empty data for new users
        setFormData({
          firstName: '',
          middleName: '',
          lastName: '',
          dob: '',
          gender: '',
          department: 'Information Technology',
          course: 'B. Tech. Information Technology',
          currentYear: '',
          studentId: '',
          phone: '',
          altPhone: '',
          currentAddress: '',
          permanentAddress: '',
          profilePic: null
        });
        setExperience([{
          type: 'Internship',
          company: '',
          position: '',
          duration: '',
          description: ''
        }]);
        setSkills(['']);
        setEducation([
          {
            type: '10th',
            institution: '',
            board: '',
            year: '',
            grade: '',
            percentage: ''
          },
          {
            type: '12th',
            institution: '',
            board: '',
            year: '',
            grade: '',
            percentage: ''
          }
        ]);
      } else {
        // Use existing data for returning users
        setFormData({
          firstName: data.first_name || '',
          middleName: data.middle_name || '',
          lastName: data.last_name || '',
          dob: data.dob || '',
          gender: data.gender || '',
          department: 'Information Technology',
          course: 'B. Tech. Information Technology',
          currentYear: data.current_year || '',
          studentId: data.student_id || '',
          phone: data.phone || '',
          altPhone: data.alt_phone || '',
          currentAddress: data.current_address || '',
          permanentAddress: data.permanent_address || '',
          profilePic: data.profile || null
        });
        setProfilePic(data.profile || null);
        setExperience(data.experience || [{
          type: 'Internship',
          company: '',
          position: '',
          duration: '',
          description: ''
        }]);
        setSkills(data.skills || ['']);
        setEducation(data.education || [
          {
            type: '10th',
            institution: '',
            board: '',
            year: '',
            grade: '',
            percentage: ''
          },
          {
            type: '12th',
            institution: '',
            board: '',
            year: '',
            grade: '',
            percentage: ''
          }
        ]);
      }
      
      setProfileCompleted(data.profileCompleted || false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error.response?.status === 404) {
        // Handle new user case
        setFormData({
          firstName: '',
          middleName: '',
          lastName: '',
          dob: '',
          gender: '',
          department: 'Information Technology',
          course: 'B. Tech. Information Technology',
          currentYear: '',
          studentId: '',
          phone: '',
          altPhone: '',
          currentAddress: '',
          permanentAddress: '',
          profilePic: null
        });
        setExperience([{
          type: 'Internship',
          company: '',
          position: '',
          duration: '',
          description: ''
        }]);
        setSkills(['']);
        setEducation([
          {
            type: '10th',
            institution: '',
            board: '',
            year: '',
            grade: '',
            percentage: ''
          },
          {
            type: '12th',
            institution: '',
            board: '',
            year: '',
            grade: '',
            percentage: ''
          }
        ]);
        setProfileCompleted(false);
      } else {
        alert(error.response?.data?.error || "Failed to fetch profile");
      }
    }
  };

  return (
    <div className="container py-5">
      <div className="card shadow-lg p-4 rounded-4">
        <div className="text-center mb-4">
          <h2 className="text-primary fw-bold">
            <FaUser className="me-2" />
            Student Dashboard
          </h2>
          <p className="text-muted">Complete your profile to get started</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Profile Photo Section */}
          <div className="mb-4 text-center">
            <div className="position-relative d-inline-block">
              <div
                className="rounded-circle overflow-hidden"
                style={{
                  width: "150px",
                  height: "150px",
                  border: "3px solid #0d6efd",
                  margin: "auto",
                }}
              >
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="w-100 h-100 object-fit-cover"
                  />
                ) : (
                  <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                    <FaUser size={50} className="text-muted" />
                  </div>
                )}
              </div>
              <label
                className="btn btn-primary rounded-circle position-absolute bottom-0 end-0"
                style={{ width: "40px", height: "40px" }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="d-none"
                />
                <FaUser className="m-0" />
              </label>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Personal Information</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFieldChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Middle Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleFieldChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFieldChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Date of Birth *</label>
                  <input
                    type="date"
                    className="form-control"
                    name="dob"
                    value={formData.dob}
                    onChange={handleFieldChange}
                    min={minDob}
                    max={maxDob}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Gender *</label>
                  <select
                    name="gender"
                    className="form-select"
                    value={formData.gender}
                    onChange={handleFieldChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information Section */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaGraduationCap className="me-2" />
                Academic Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Department *</label>
                  <input
                    type="text"
                    className="form-control"
                    value="Information Technology"
                    readOnly
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Course *</label>
                  <input
                    type="text"
                    className="form-control"
                    value="B. Tech. Information Technology"
                    readOnly
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Current Year *</label>
                  <select
                    name="currentYear"
                    className="form-select"
                    value={formData.currentYear}
                    onChange={handleFieldChange}
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Student ID *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleFieldChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaIdCard className="me-2" />
                Contact Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Phone *</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFieldChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Alternate Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="altPhone"
                    value={formData.altPhone}
                    onChange={handleFieldChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Current Address *</label>
                  <textarea
                    className="form-control"
                    name="currentAddress"
                    value={formData.currentAddress}
                    onChange={handleFieldChange}
                    rows="3"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Permanent Address *</label>
                  <textarea
                    className="form-control"
                    name="permanentAddress"
                    value={formData.permanentAddress}
                    onChange={handleFieldChange}
                    rows="3"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Experience Section */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaBriefcase className="me-2" />
                Experience
              </h5>
            </div>
            <div className="card-body">
              {experience.map((exp, index) => (
                <div key={index} className="mb-4 p-3 border rounded">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Experience {index + 1}</h6>
                    {index > 0 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveField(setExperience, experience, index)}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Type</label>
                      <select
                        className="form-select"
                        value={exp.type}
                        onChange={(e) => handleChange(setExperience, experience, index, 'type', e.target.value)}
                      >
                        <option value="">Select Type</option>
                        <option value="Internship">Internship</option>
                        <option value="Work Experience">Work Experience</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Company</label>
                      <input
                        type="text"
                        className="form-control"
                        value={exp.company}
                        onChange={(e) => handleChange(setExperience, experience, index, 'company', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Position</label>
                      <input
                        type="text"
                        className="form-control"
                        value={exp.position}
                        onChange={(e) => handleChange(setExperience, experience, index, 'position', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Duration</label>
                      <input
                        type="text"
                        className="form-control"
                        value={exp.duration}
                        onChange={(e) => handleChange(setExperience, experience, index, 'duration', e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={exp.description}
                        onChange={(e) => handleChange(setExperience, experience, index, 'description', e.target.value)}
                        rows="3"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => handleAddField(setExperience, experience, {
                  type: '',
                  company: '',
                  position: '',
                  duration: '',
                  description: ''
                })}
              >
                <FaPlus className="me-2" />
                Add Experience
              </button>
            </div>
          </div>

          {/* Skills Section */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaTools className="me-2" />
                Skills
              </h5>
            </div>
            <div className="card-body">
              {skills.map((skill, index) => (
                <div key={index} className="mb-3">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={skill}
                      onChange={(e) => handleChange(setSkills, skills, index, 'skill', e.target.value)}
                      placeholder="Enter a skill"
                    />
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        const newSkills = skills.filter((_, i) => i !== index);
                        setSkills(newSkills);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => handleAddField(setSkills, skills, '')}
              >
                <FaTools className="me-2" />
                Add Skill
              </button>
            </div>
          </div>

          {/* Education Section */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaGraduationCap className="me-2" />
                Education Details
              </h5>
            </div>
            <div className="card-body">
              {education.map((edu, index) => (
                <div key={index} className="mb-4 p-3 border rounded">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Education {index + 1}</h6>
                    {index >= 2 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveField(setEducation, education, index)}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Type *</label>
                      <select
                        className="form-select"
                        value={edu.type}
                        onChange={(e) => handleChange(setEducation, education, index, 'type', e.target.value)}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="10th">10th</option>
                        <option value="12th">12th</option>
                        <option value="Graduation">Graduation</option>
                        <option value="Post Graduation">Post Graduation</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Institution *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={edu.institution}
                        onChange={(e) => handleChange(setEducation, education, index, 'institution', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Board/University *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={edu.board}
                        onChange={(e) => handleChange(setEducation, education, index, 'board', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Passing Year *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={edu.year}
                        onChange={(e) => handleChange(setEducation, education, index, 'year', e.target.value)}
                        required
                        min="2000"
                        max={new Date().getFullYear()}
                        placeholder="YYYY"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Grade *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={edu.grade}
                        onChange={(e) => handleChange(setEducation, education, index, 'grade', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Percentage *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={edu.percentage}
                        onChange={(e) => handleChange(setEducation, education, index, 'percentage', e.target.value)}
                        required
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => handleAddField(setEducation, education, {
                  type: '',
                  institution: '',
                  board: '',
                  year: '',
                  grade: '',
                  percentage: ''
                })}
              >
                <FaPlus className="me-2" />
                Add Education
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button type="submit" className="btn btn-primary btn-lg">
              <FaSave className="me-2" />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentDashboard;
