import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PostJobForm = () => {
  const [formData, setFormData] = useState({
    jobTitle: '',
    companyName: '',
    location: '',
    jobType: '',
    salary: '',
    jobDescription: '',
    applyLink: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/jobs', { state: { job: formData } });
  };

  return (
    <div className="container mt-5 mb-5">
      <h2 className="mb-4 text-center">Post a Job</h2>
      <form onSubmit={handleSubmit}>

        <div className="mb-3">
          <label htmlFor="jobTitle" className="form-label">Job Title</label>
          <input type="text" className="form-control" id="jobTitle" onChange={handleChange} required />
        </div>

        <div className="mb-3">
          <label htmlFor="companyName" className="form-label">Company Name</label>
          <input type="text" className="form-control" id="companyName" onChange={handleChange} required />
        </div>

        <div className="mb-3">
          <label htmlFor="location" className="form-label">Location</label>
          <input type="text" className="form-control" id="location" onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label htmlFor="jobType" className="form-label">Job Type</label>
          <select className="form-select" id="jobType" onChange={handleChange} required>
            <option value="">Select Job Type</option>
            <option>Full-Time</option>
            <option>Part-Time</option>
            <option>Internship</option>
            <option>Contract</option>
            <option>Freelance</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="salary" className="form-label">Salary (Optional)</label>
          <input type="text" className="form-control" id="salary" onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label htmlFor="jobDescription" className="form-label">Job Description</label>
          <textarea className="form-control" id="jobDescription" rows="4" onChange={handleChange} required></textarea>
        </div>

        <div className="mb-3">
          <label htmlFor="applyLink" className="form-label">Application Link or Email</label>
          <input type="text" className="form-control" id="applyLink" onChange={handleChange} required />
        </div>

        <button type="submit" className="btn btn-primary w-100">Submit Job</button>
      </form>
    </div>
  );
};

export default PostJobForm;
