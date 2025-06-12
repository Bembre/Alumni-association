import React, { useEffect, useState } from 'react';
import { profileService } from '../services/api';
import Header from './Header';
import { FaUser, FaSave, FaEdit, FaCamera } from 'react-icons/fa';

const AdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', phone: '', profile: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await profileService.getAdminProfile();
        setProfile(res.data);
        setForm({
          username: res.data.username || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          profile: res.data.profile || ''
        });
      } catch (err) {
        setError('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle file upload and convert to base64
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, profile: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await profileService.updateAdminProfile(form);
      setProfile(res.data);
      setEditMode(false);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Header />
      <div className="container py-5">
        <div className="card shadow-lg p-4 rounded-4 mx-auto" style={{ maxWidth: 600 }}>
          <div className="text-center mb-4">
            <h2 className="text-primary fw-bold">
              <FaUser className="me-2" />
              Admin Profile
            </h2>
            <p className="text-muted">Manage your admin profile information</p>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          {/* Profile Photo Section */}
          <div className="mb-4 text-center">
            <div className="position-relative d-inline-block">
              <div
                className="rounded-circle overflow-hidden"
                style={{ width: "120px", height: "120px", border: "3px solid #0d6efd", margin: "auto" }}
              >
                {form.profile ? (
                  <img
                    src={form.profile}
                    alt="Profile"
                    className="w-100 h-100 object-fit-cover"
                  />
                ) : (
                  <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                    <FaUser size={50} className="text-muted" />
                  </div>
                )}
              </div>
              {editMode && (
                <label
                  className="btn btn-primary rounded-circle position-absolute bottom-0 end-0"
                  style={{ width: "40px", height: "40px" }}
                  title="Upload profile photo"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="d-none"
                  />
                  <FaCamera />
                </label>
              )}
            </div>
          </div>
          {!editMode ? (
            <div className="px-2">
              <div className="mb-3"><strong>Username:</strong> {profile?.username}</div>
              <div className="mb-3"><strong>Email:</strong> {profile?.email}</div>
              <button className="btn btn-primary mt-3 w-100" onClick={() => setEditMode(true)}>
                <FaEdit className="me-2" />Edit Profile
              </button>
            </div>
          ) : (
            <form className="px-2" onSubmit={handleSave}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input type="text" className="form-control" name="username" value={form.username} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} required disabled />
              </div>
              <button className="btn btn-success me-2 w-100" type="submit">
                <FaSave className="me-2" />Save
              </button>
              <button className="btn btn-secondary w-100 mt-2" type="button" onClick={() => setEditMode(false)}>Cancel</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminProfile; 