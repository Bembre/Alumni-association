import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FaUser, FaGraduationCap, FaBriefcase, FaSave, FaIdCard, FaTrash, FaPlus, FaTrophy, FaProjectDiagram, FaCode, FaEdit } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { profileService } from '../services/api';

const API_URL = 'http://localhost:3001';

// Function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

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
  const [isEditing, setIsEditing] = useState(true);
  const [projects, setProjects] = useState([{
    title: '',
    description: '',
    technologies: '',
    duration: '',
    link: ''
  }]);
  const [achievements, setAchievements] = useState([{
    type: 'sports',
    title: '',
    description: '',
    date: '',
    organization: ''
  }]);

  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'student') {
      navigate('/auth');
      return;
    }

    // Check if we have profile data from navigation state
    if (location.state?.profileData) {
      const data = location.state.profileData;
      setFormData({
        firstName: data.first_name || '',
        middleName: data.middle_name || '',
        lastName: data.last_name || '',
        dob: data.dob || '',
        gender: data.gender || '',
        department: data.department || 'Information Technology',
        course: data.course || 'B. Tech. Information Technology',
        currentYear: data.current_year || '',
        studentId: data.student_id || '',
        phone: data.phone || '',
        altPhone: data.alt_phone || '',
        currentAddress: data.current_address || '',
        permanentAddress: data.permanent_address || '',
        profilePic: data.profile || null
      });
      setProfilePic(data.profile);
      setExperience(data.experience || []);
      setSkills(data.skillset || data.skills || []);
      setEducation(data.education || []);
      setEmail(data.email);
      setIsEditing(true);
    } else {
      fetchUserData();
    }
  }, [navigate, location]);

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
  const maxDob = new Date(currentYear - 20, 0, 1).toISOString().split("T")[0];
  const minDob = "1997-01-01";

  // Validation helpers
  const isAlpha = str => /^[A-Za-z]+$/.test(str);
  const isPhone = str => /^\d{10}$/.test(str);
  const isStudentId = str => /^S\d{10}$/.test(str);
  const isPercentage = str => /^\d{1,2}(\.\d+)?$|^100(\.0+)?$/.test(str);
  const isMonth = n => Number.isInteger(+n) && +n >= 1 && +n <= 12;
  const isYear = y => /^\d{4}$/.test(String(y));
  const isNotFuture = date => new Date(date) <= new Date();

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
    // Name validation
    if (["firstName", "middleName", "lastName"].includes(name)) {
      if (value && !/^[A-Za-z]*$/.test(value)) return;
    }
    // Student ID validation
    if (name === "studentId") {
      if (!/^S\d{0,10}$/.test(value)) return;
    }
    // Phone validation
    if (["phone", "altPhone"].includes(name)) {
      if (!/^\d{0,10}$/.test(value)) return;
    }
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
    let user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      toast.error('User not found. Please log in again.');
      return;
    }
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.dob || !formData.phone || !formData.currentAddress) {
      toast.error('Please fill all required fields.');
      return;
    }
    if (!isAlpha(formData.firstName) || !isAlpha(formData.lastName)) {
      toast.error('First and Last Name must contain only letters.');
      return;
    }
    if (formData.middleName && !isAlpha(formData.middleName)) {
      toast.error('Middle Name must contain only letters.');
      return;
    }
    if (!isStudentId(formData.studentId)) {
      toast.error('Student ID must start with S and be followed by 10 digits.');
      return;
    }
    if (!isPhone(formData.phone)) {
      toast.error('Phone must be 10 digits.');
      return;
    }
    if (formData.altPhone && !isPhone(formData.altPhone)) {
      toast.error('Alternate Phone must be 10 digits.');
      return;
    }
    if (!Array.isArray(education) || education.length === 0 || education.some(edu => !edu.institution || !edu.board || !edu.year || !edu.grade || !edu.percentage)) {
      toast.error('Please complete all education fields.');
      return;
    }
    try {
      // Ensure skills is an array of strings
      const skillset = Array.isArray(skills) ? skills.filter(s => typeof s === 'string' && s.trim() !== '') : [];
      // Ensure projects is an array of objects with at least a title or description
      const validProjects = Array.isArray(projects) ? projects.filter(p => p.title || p.description) : [];
      // Ensure achievements is an array of objects with at least a title or description
      const validAchievements = Array.isArray(achievements) ? achievements.filter(a => a.title || a.description) : [];
      // Ensure experience is an array of objects
      const validExperience = Array.isArray(experience) ? experience.filter(exp => exp.company && exp.position && exp.duration) : [];
      // Ensure education is an array of objects
      const validEducation = Array.isArray(education) ? education.filter(edu => edu.institution && edu.board && edu.year && edu.grade && edu.percentage) : [];

      const payload = {
        email: email,
        department: formData.department,
        course: formData.course,
        first_name: formData.firstName,
        middle_name: formData.middleName || '',
        last_name: formData.lastName,
        dob: formData.dob,
        gender: formData.gender,
        current_year: formData.currentYear,
        phone: formData.phone,
        alt_phone: formData.altPhone || '',
        student_id: formData.studentId || '',
        current_address: formData.currentAddress,
        permanent_address: formData.permanentAddress,
        profile: profilePic || null,
        experience: validExperience,
        skillset: skillset,
        education: validEducation,
        projects: validProjects.map(proj => ({
          title: proj.title,
          description: proj.description,
          technologies: proj.technologies || '',
          duration: proj.duration || '',
          link: proj.link || ''
        })),
        achievements: validAchievements.map(ach => ({
          type: ach.type || 'sports',
          title: ach.title,
          description: ach.description,
          date: ach.date || '',
          organization: ach.organization || ''
        })),
        profileCompleted: true
      };
      console.log('Submitting student profile payload:', payload);
      const response = await profileService.updateStudentProfile(payload);
      // Update local state/UI
      toast.success('Profile updated successfully!');
      // Update localStorage with new profile photo and completion status
      const updatedUser = { ...user, profileCompleted: true, profile: response.data.profile };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditing(false);
      // Redirect to home page after successful profile completion
      navigate('/home');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleAddSkill = () => {
    setSkills([...skills, '']);
  };

  const handleAddProject = () => {
    setProjects([...projects, { title: '', description: '', technologies: '', duration: '', link: '' }]);
  };

  const handleAddAchievement = () => {
    setAchievements([...achievements, { type: 'sports', title: '', description: '', date: '', organization: '' }]);
  };

  const handleRemoveSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleRemoveProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleRemoveAchievement = (index) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleSkillChange = (index, value) => {
    if (!isEditing) return;
    setSkills(skills.map((skill, i) => (i === index ? value : skill)));
  };

  const handleProjectChange = (index, field, value) => {
    if (!isEditing) return;
    setProjects(projects.map((project, i) =>
      i === index ? { ...project, [field]: value } : project
    ));
  };

  const handleAchievementChange = (index, field, value) => {
    if (!isEditing) return;
    setAchievements(achievements.map((achievement, i) =>
      i === index ? { ...achievement, [field]: value } : achievement
    ));
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please try logging in again.');
        return;
      }

      const decodedToken = decodeToken(token);
      if (!decodedToken || !decodedToken.userId) {
        toast.error('Invalid authentication token. Please try logging in again.');
        return;
      }

      const user = JSON.parse(localStorage.getItem('user'));
      const userEmail = user?.email;
      
      const response = await axios.get(`${API_URL}/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;
      
      // Ensure email is available
      if (userEmail) {
        setEmail(userEmail);
      }
      
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
        setProjects([{
          title: '',
          description: '',
          technologies: '',
          duration: '',
          link: ''
        }]);
        setAchievements([{
          type: 'sports',
          title: '',
          description: '',
          date: '',
          organization: ''
        }]);
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
        setSkills(Array.isArray(data.skillset) ? data.skillset : (Array.isArray(data.skills) ? data.skills : ['']));
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
        setProjects(data.projects || [{
          title: '',
          description: '',
          technologies: '',
          duration: '',
          link: ''
        }]);
        setAchievements(data.achievements || [{
          type: 'sports',
          title: '',
          description: '',
          date: '',
          organization: ''
        }]);
      }
      
      setIsEditing(false);
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
        setProjects([{
          title: '',
          description: '',
          technologies: '',
          duration: '',
          link: ''
        }]);
        setAchievements([{
          type: 'sports',
          title: '',
          description: '',
          date: '',
          organization: ''
        }]);
        setIsEditing(false);
      } else {
        alert(error.response?.data?.error || "Failed to fetch profile");
      }
    }
  };

  console.log('Skills state:', skills);

  function validateProfile(data) {
    // DOB
    const dob = new Date(data.dob);
    // Education
    const edu10 = data.education?.find(e => e.type === '10th');
    const edu12 = data.education?.find(e => e.type === '12th');
    const grad = data.education?.find(e => e.type === 'Graduation');
    if (edu10 && isYear(edu10.year)) {
      if (dob.getFullYear() + 15 > +edu10.year) return '10th passing year must be at least 15 years after DOB';
    }
    if (edu12 && edu10 && isYear(edu12.year) && isYear(edu10.year)) {
      if (+edu10.year + 2 > +edu12.year) return '12th passing year must be at least 2 years after 10th';
    }
    if (grad && edu12 && isYear(grad.year) && isYear(edu12.year)) {
      if (+edu12.year + 4 > +grad.year) return 'Graduation passing year must be at least 4 years after 12th';
    }
    // Achievements
    if (Array.isArray(data.achievements)) {
      for (const ach of data.achievements) {
        if (ach.date && (!isNotFuture(ach.date) || new Date(ach.date) < dob)) return 'Achievement date must not be in the future and after DOB';
      }
    }
    // Experience/Projects
    if (Array.isArray(data.experience)) {
      for (const exp of data.experience) {
        if (exp.months && !isMonth(exp.months)) return 'Experience months must be between 1 and 12';
      }
    }
    if (Array.isArray(data.projects)) {
      for (const proj of data.projects) {
        if (proj.months && !isMonth(proj.months)) return 'Project months must be between 1 and 12';
      }
    }
    // Percentage
    if (Array.isArray(data.education)) {
      for (const edu of data.education) {
        if (edu.percentage && (!isPercentage(edu.percentage) || +edu.percentage > 100 || +edu.percentage < 0)) return 'Percentage must be between 0 and 100';
      }
    }
    // Phone
    if (data.phone && !isPhone(data.phone)) return 'Phone must be 10 digits';
    if (data.alt_phone && !isPhone(data.alt_phone)) return 'Alternate phone must be 10 digits';
    return null;
  }

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
                    value={formData.studentId || 'S'}
                    onChange={handleFieldChange}
                    maxLength={11}
                    required
                    pattern="^S\d{10}$"
                    title="Student ID must start with S and be followed by 10 digits."
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
                    type="text"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFieldChange}
                    maxLength={10}
                    required
                    pattern="\d{10}"
                    title="Phone must be 10 digits."
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Alternate Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    name="altPhone"
                    value={formData.altPhone}
                    onChange={handleFieldChange}
                    maxLength={10}
                    pattern="\d{10}"
                    title="Alternate Phone must be 10 digits."
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
                        type="number"
                        className="form-control"
                        name="years"
                        value={exp.years || ''}
                        onChange={e => handleChange(setExperience, experience, index, 'years', e.target.value.replace(/[^\d]/g, ''))}
                        min={0}
                        max={50}
                        placeholder="Years"
                      />
                      <span>Year(s)</span>
                      <input
                        type="number"
                        className="form-control"
                        name="months"
                        value={exp.months || ''}
                        onChange={e => handleChange(setExperience, experience, index, 'months', e.target.value.replace(/[^\d]/g, ''))}
                        min={0}
                        max={11}
                        placeholder="Months"
                      />
                      <span>Month(s)</span>
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
                <FaCode className="me-2" />
                Skill Set
              </h5>
            </div>
            <div className="card-body">
              {(Array.isArray(skills) && skills.length > 0 ? skills : ['']).map((skill, index) => (
                <div key={index} className="mb-3">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={typeof skill === 'string' ? skill : ''}
                      onChange={e => {
                        const newSkills = [...skills];
                        newSkills[index] = e.target.value;
                        setSkills(newSkills);
                      }}
                      placeholder="Enter a skill"
                    />
                    {skills.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => {
                          const newSkills = skills.filter((_, i) => i !== index);
                          setSkills(newSkills.length > 0 ? newSkills : ['']);
                        }}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setSkills([...skills, ''])}
              >
                <FaPlus className="me-2" />
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
                        onKeyDown={e => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
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

          {/* Projects Section */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaProjectDiagram className="me-2" />
                Projects
              </h5>
            </div>
            <div className="card-body">
              {(Array.isArray(projects) && projects.length > 0 ? projects : [{ title: '', description: '', technologies: '', duration: '', link: '' }]).map((project, index) => (
                <div key={index} className="mb-4 p-3 border rounded">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Project {index + 1}</h6>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          const newProjects = projects.filter((_, i) => i !== index);
                          setProjects(newProjects.length > 0 ? newProjects : [{ title: '', description: '', technologies: '', duration: '', link: '' }]);
                        }}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={project.title || ''}
                        onChange={e => {
                          const newProjects = [...projects];
                          newProjects[index] = { ...newProjects[index], title: e.target.value };
                          setProjects(newProjects);
                        }}
                        placeholder="Project Title"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Technologies</label>
                      <input
                        type="text"
                        className="form-control"
                        value={project.technologies || ''}
                        onChange={e => {
                          const newProjects = [...projects];
                          newProjects[index] = { ...newProjects[index], technologies: e.target.value };
                          setProjects(newProjects);
                        }}
                        placeholder="Technologies Used"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={project.description || ''}
                        onChange={e => {
                          const newProjects = [...projects];
                          newProjects[index] = { ...newProjects[index], description: e.target.value };
                          setProjects(newProjects);
                        }}
                        placeholder="Project Description"
                        rows="3"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Duration</label>
                      <input
                        type="number"
                        className="form-control"
                        name="years"
                        value={project.years || ''}
                        onChange={e => {
                          const newProjects = [...projects];
                          newProjects[index] = { ...newProjects[index], years: e.target.value.replace(/[^\d]/g, '') };
                          setProjects(newProjects);
                        }}
                        min={0}
                        max={50}
                        placeholder="Years"
                      />
                      <span>Year(s)</span>
                      <input
                        type="number"
                        className="form-control"
                        name="months"
                        value={project.months || ''}
                        onChange={e => {
                          const newProjects = [...projects];
                          newProjects[index] = { ...newProjects[index], months: e.target.value.replace(/[^\d]/g, '') };
                          setProjects(newProjects);
                        }}
                        min={0}
                        max={11}
                        placeholder="Months"
                      />
                      <span>Month(s)</span>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Project Link</label>
                      <input
                        type="text"
                        className="form-control"
                        value={project.link || ''}
                        onChange={e => {
                          const newProjects = [...projects];
                          newProjects[index] = { ...newProjects[index], link: e.target.value };
                          setProjects(newProjects);
                        }}
                        placeholder="Project Link"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setProjects([...projects, { title: '', description: '', technologies: '', duration: '', link: '' }])}
              >
                <FaPlus className="me-2" />
                Add Project
              </button>
            </div>
          </div>

          {/* Achievements Section */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaTrophy className="me-2" />
                Achievements
              </h5>
            </div>
            <div className="card-body">
              {(Array.isArray(achievements) && achievements.length > 0 ? achievements : [{ type: 'sports', title: '', description: '', date: '', organization: '' }]).map((achievement, index) => (
                <div key={index} className="mb-4 p-3 border rounded">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Achievement {index + 1}</h6>
                    {achievements.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          const newAchievements = achievements.filter((_, i) => i !== index);
                          setAchievements(newAchievements.length > 0 ? newAchievements : [{ type: 'sports', title: '', description: '', date: '', organization: '' }]);
                        }}
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
                        value={achievement.type || ''}
                        onChange={e => {
                          const newAchievements = [...achievements];
                          newAchievements[index] = { ...newAchievements[index], type: e.target.value };
                          setAchievements(newAchievements);
                        }}
                      >
                        <option value="">Select Type</option>
                        <option value="sports">Sports</option>
                        <option value="awards">Awards</option>
                        <option value="academic">Academic</option>
                        <option value="events">Events</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={achievement.title || ''}
                        onChange={e => {
                          const newAchievements = [...achievements];
                          newAchievements[index] = { ...newAchievements[index], title: e.target.value };
                          setAchievements(newAchievements);
                        }}
                        placeholder="Achievement Title"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={achievement.description || ''}
                        onChange={e => {
                          const newAchievements = [...achievements];
                          newAchievements[index] = { ...newAchievements[index], description: e.target.value };
                          setAchievements(newAchievements);
                        }}
                        placeholder="Description"
                        rows="3"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="date"
                        value={achievement.date || ''}
                        onChange={e => {
                          const newAchievements = [...achievements];
                          newAchievements[index] = { ...newAchievements[index], date: e.target.value };
                          setAchievements(newAchievements);
                        }}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Organization</label>
                      <input
                        type="text"
                        className="form-control"
                        value={achievement.organization || ''}
                        onChange={e => {
                          const newAchievements = [...achievements];
                          newAchievements[index] = { ...newAchievements[index], organization: e.target.value };
                          setAchievements(newAchievements);
                        }}
                        placeholder="Organization"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setAchievements([...achievements, { type: 'sports', title: '', description: '', date: '', organization: '' }])}
              >
                <FaPlus className="me-2" />
                Add Achievement
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            {isEditing ? (
              <button type="submit" className="btn btn-primary btn-lg w-100" style={{ minWidth: 160, borderRadius: '2em', boxShadow: '0 4px 15px rgba(26,42,108,0.15)', fontWeight: 600, transition: 'all 0.2s' }}>
                <FaSave className="me-2" />
                Save Profile
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary btn-lg"
                onClick={() => setIsEditing(true)}
              >
                <FaEdit className="me-2" />
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentDashboard;
