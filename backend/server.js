require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://alumni-association.netlify.app', 'https://alumni-association-frontend.netlify.app']
    : 'http://localhost:3000',
  credentials: true
}));

// Increase payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
    httpOnly: true, // Prevents JS access to cookies
    sameSite: 'lax', // CSRF protection
    maxAge: 60 * 60 * 1000 // 1 hour session timeout
  }
})); // Session config: 1 hour expiry, secure in production

// Request logging middleware
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body
  });
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request entity too large' });
  }
  res.status(500).json({ error: err.message });
});

// MongoDB Connection with retry logic
const connectWithRetry = () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://prathameshbembre01:bhgUJnAPJReRo12t@cluster0.psbowbw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  
  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s
  })
  .then(() => {
    console.log('Connected to MongoDB');
    // Create indexes
    return Promise.all([
      mongoose.connection.db.collection('students').createIndex({ email: 1 }, { unique: true }),
      mongoose.connection.db.collection('alumnis').createIndex({ email: 1 }, { unique: true })
    ]);
  })
  .then(() => console.log('Indexes created'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });
};

// Initial connection attempt
connectWithRetry();

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectWithRetry();
});

process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Routes
console.log('Loading routes...');
const authRoutes = require('./routes/auth');
const alumniRoutes = require('./routes/alumni');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const feedbackRoutes = require('./routes/feedback');
const eventRoutes = require('./routes/event');
const fundRoutes = require('./routes/fund');
const jobRoutes = require('./routes/job');
const mentorshipRoutes = require('./routes/mentorship');
const donationRoutes = require('./routes/donation');
console.log('Routes loaded successfully');

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

console.log('Registering routes...');
app.use('/api/auth', authRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/donation', donationRoutes);
console.log('Routes registered successfully');

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***set***' : '***missing***');

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 