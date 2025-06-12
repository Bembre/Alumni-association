const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Alumni = require('../models/Alumni');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register route
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', {
      body: req.body,
      headers: req.headers
    });

    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      console.log('Missing required fields:', { 
        hasEmail: !!email, 
        hasPassword: !!password, 
        hasRole: !!role 
      });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          role: !role ? 'Role is required' : null
        }
      });
    }

    // Validate email format based on role
    if (role === 'student' && !email.endsWith('@mgmcen.ac.in')) {
      console.log('Invalid student email format:', email);
      return res.status(400).json({ 
        error: 'Invalid email format',
        details: 'Student email must end with @mgmcen.ac.in'
      });
    }

    // Check if user already exists
    let user;
    try {
      if (role === 'alumni') {
        user = await Alumni.findOne({ email });
        console.log('Checking for existing alumni:', { email, exists: !!user });
      } else if (role === 'student') {
        user = await Student.findOne({ email });
        console.log('Checking for existing student:', { email, exists: !!user });
      } else {
        console.log('Invalid role specified:', role);
        return res.status(400).json({ 
          error: 'Invalid role',
          details: 'Role must be either "student" or "alumni"'
        });
      }
    } catch (findError) {
      console.error('Database error while checking existing user:', findError);
      return res.status(500).json({ 
        error: 'Database error',
        details: 'Error checking for existing user'
      });
    }

    if (user) {
      console.log('User already exists:', email);
      return res.status(400).json({ 
        error: 'User exists',
        details: 'A user with this email already exists'
      });
    }

    // Validate password
    if (!password || password.length < 6) {
      console.log('Invalid password:', { length: password?.length });
      return res.status(400).json({ 
        error: 'Invalid password',
        details: 'Password must be at least 6 characters long'
      });
    }

    // Create new user based on role
    try {
      console.log('Creating new user:', { email, role });
      
      if (role === 'alumni') {
        user = new Alumni({
          email,
          password,
          profileCompleted: false,
          gender: 'Other'
        });
      } else {
        user = new Student({ 
          email, 
          password,
          profileCompleted: false,
          department: 'Information Technology',
          course: 'B. Tech. Information Technology',
          gender: 'Other',
          current_year: '1st Year',
          mentorship_status: 'Available'
        });
      }

      console.log('Attempting to save user...');
      await user.save();
      console.log('User saved successfully');

      // Create JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email, role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Registration successful for:', email);
      return res.status(201).json({ 
        message: 'Registration successful',
        token,
        user: {
          _id: user._id,
          email: user.email,
          role,
          profileCompleted: user.profileCompleted
        }
      });
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      
      if (saveError.name === 'ValidationError') {
        console.error('Validation error details:', saveError.errors);
        return res.status(400).json({ 
          error: 'Validation failed',
          details: Object.keys(saveError.errors).reduce((acc, key) => {
            acc[key] = saveError.errors[key].message;
            return acc;
          }, {})
        });
      }
      
      if (saveError.code === 11000) {
        console.error('Duplicate key error:', saveError);
        return res.status(400).json({ 
          error: 'Duplicate email',
          details: 'This email is already registered'
        });
      }

      console.error('Unexpected error while saving:', saveError);
      return res.status(500).json({ 
        error: 'Registration failed',
        details: 'An unexpected error occurred while creating your account'
      });
    }
  } catch (error) {
    console.error('Unexpected registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: 'An unexpected error occurred'
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Try to find user in each collection
    let user = await Alumni.findOne({ email });
    let role = 'alumni';

    if (!user) {
      user = await Student.findOne({ email });
      role = 'student';
    }

    if (!user) {
      user = await Admin.findOne({ email });
      role = 'admin';
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If alumni, check approval
    if (role === 'alumni' && user.isApproved === false) {
      return res.status(403).json({ error: 'Your account is pending admin approval. You will be notified by email once approved.' });
    }

    // Create JWT token
    const jwtPayload = { userId: user._id, email: user.email, role };
    console.log('JWT payload for login:', jwtPayload);
    const token = jwt.sign(
      jwtPayload,
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store email in session
    req.session.email = user.email;

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        role,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  let user = await Alumni.findOne({ email }) || await Student.findOne({ email }) || await Admin.findOne({ email });
  if (!user) return res.status(404).json({ error: 'No user found with this email' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await user.save();
  // Send OTP email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Your Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`
  });
  res.json({ message: 'OTP sent to your email' });
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
  let user = await Alumni.findOne({ email }) || await Student.findOne({ email }) || await Admin.findOne({ email });
  if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpires) return res.status(400).json({ error: 'OTP not requested' });
  if (user.resetPasswordOTP !== otp) return res.status(400).json({ error: 'Invalid OTP' });
  if (user.resetPasswordOTPExpires < new Date()) return res.status(400).json({ error: 'OTP expired' });
  res.json({ message: 'OTP verified' });
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields required' });
  let user = await Alumni.findOne({ email }) || await Student.findOne({ email }) || await Admin.findOne({ email });
  if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpires) return res.status(400).json({ error: 'OTP not requested' });
  if (user.resetPasswordOTP !== otp) return res.status(400).json({ error: 'Invalid OTP' });
  if (user.resetPasswordOTPExpires < new Date()) return res.status(400).json({ error: 'OTP expired' });
  user.password = newPassword;
  user.resetPasswordOTP = null;
  user.resetPasswordOTPExpires = null;
  await user.save();
  res.json({ message: 'Password reset successful' });
});

module.exports = router; 