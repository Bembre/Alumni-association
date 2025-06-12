import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Profile services
export const profileService = {
  // Alumni profile
  getAlumniProfile: () => api.get('/alumni/profile'),
  updateAlumniProfile: (data) => api.put('/alumni/profile', data),
  
  // Student profile
  getStudentProfile: () => api.get('/student/profile'),
  updateStudentProfile: (data) => api.put('/student/profile', data),
  
  // Admin profile
  getAdminProfile: () => api.get('/admin/profile'),
  updateAdminProfile: (data) => api.put('/admin/profile', data)
};

// Mentorship services
export const mentorshipService = {
  getAvailableStudents: () => api.get('/students/available'),
  startMentorship: (studentIds) => api.post('/mentorship/start', { studentIds }),
  getMentorshipStatus: () => api.get('/mentorship/status'),
  updateMentorshipStatus: (data) => api.put('/mentorship/status', data)
};

// Event services
export const eventService = {
  getEvents: () => api.get('/events'),
  createEvent: (data) => api.post('/events', data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`)
};

// Job services
export const jobService = {
  getJobs: () => api.get('/jobs'),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`)
};

// Fund services
export const fundService = {
  getFunds: () => api.get('/funds'),
  createFund: (data) => api.post('/funds', data),
  updateFund: (id, data) => api.put(`/funds/${id}`, data),
  deleteFund: (id) => api.delete(`/funds/${id}`),
  updateRaised: (id, raised) => api.patch(`/funds/${id}/raised`, { raised })
};

// Donation services
export const donationService = {
  submitDonation: (data) => api.post('/donation/submit', data),
  getTransactions: () => api.get('/donation/transactions'),
  getMyDonations: () => api.get('/donation/my'),
  emailAdmin: (data) => api.post('/donation/email-admin', data),
  notifyAdmin: (data) => api.post('/donation/notify-admin', data)
};

export default api; 