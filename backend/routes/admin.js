const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Alumni = require('../models/Alumni');
const Event = require('../models/Event');
const nodemailer = require('nodemailer');

// Get admin profile
router.get('/profile', auth, checkRole(['admin']), async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: req.user.email })
      .select('-password');
    
    if (!admin) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }
    res.json(admin);
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get all students
router.get('/students', auth, checkRole(['admin']), async (req, res) => {
  try {
    const students = await Student.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get all alumni
router.get('/alumni', auth, checkRole(['admin']), async (req, res) => {
  try {
    const alumni = await Alumni.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(alumni);
  } catch (error) {
    console.error('Error fetching alumni:', error);
    res.status(500).json({ error: 'Failed to fetch alumni' });
  }
});

// Get dashboard statistics
router.get('/dashboard', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [
      totalStudents,
      totalAlumni,
      totalEvents,
      recentStudents,
      recentAlumni,
      upcomingEvents
    ] = await Promise.all([
      Student.countDocuments(),
      Alumni.countDocuments(),
      Event.countDocuments(),
      Student.find().sort({ createdAt: -1 }).limit(5).select('-password'),
      Alumni.find().sort({ createdAt: -1 }).limit(5).select('-password'),
      Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5)
    ]);

    res.json({
      counts: {
        students: totalStudents,
        alumni: totalAlumni,
        events: totalEvents
      },
      recent: {
        students: recentStudents,
        alumni: recentAlumni,
        events: upcomingEvents
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Update admin profile
router.put('/profile', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { username } = req.body;

    const admin = await Admin.findOne({ email: req.user.email });
    if (!admin) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }

    // Update fields
    if (username) admin.username = username;

    await admin.save();

    // Return updated profile without password
    const updatedAdmin = admin.toObject();
    delete updatedAdmin.password;
    
    res.json(updatedAdmin);
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get mentorship statistics
router.get('/mentorship-stats', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [
      totalMentorships,
      activeMentorships,
      completedMentorships,
      availableStudents,
      activeAlumniMentors
    ] = await Promise.all([
      Student.countDocuments({ mentorship_status: { $ne: 'Available' } }),
      Student.countDocuments({ mentorship_status: 'Mentored' }),
      Student.countDocuments({ mentorship_status: 'Completed' }),
      Student.countDocuments({ mentorship_status: 'Available' }),
      Alumni.countDocuments({ current_students: { $gt: 0 } })
    ]);

    res.json({
      total_mentorships: totalMentorships,
      active_mentorships: activeMentorships,
      completed_mentorships: completedMentorships,
      available_students: availableStudents,
      active_alumni_mentors: activeAlumniMentors
    });
  } catch (error) {
    console.error('Error fetching mentorship statistics:', error);
    res.status(500).json({ error: 'Failed to fetch mentorship statistics' });
  }
});

// Create admin (for initial setup)
router.post('/create', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const admin = new Admin({
      username,
      email,
      password
    });

    await admin.save();
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve alumni
router.post('/alumni/:id/approve', auth, checkRole(['admin']), async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id);
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    if (alumni.isApproved) return res.status(400).json({ error: 'Alumni already approved' });
    if (!alumni.email) {
      return res.status(400).json({ error: 'Alumni must have an email before approval.' });
    }
    alumni.isApproved = true;
    alumni.approvalDate = new Date();
    await alumni.save();

    // Try to send approval email, but do not fail approval if email fails
    let emailError = null;
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('EMAIL_USER or EMAIL_PASS is missing in environment variables.');
      }
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: alumni.email,
        subject: 'Alumni Registration Approved',
        text: `Dear Alumni,\n\nYour registration has been approved! You can now log in to the MGM Alumni Portal and complete your profile.\n\nBest regards,\nMGM Alumni Association`
      });
    } catch (err) {
      emailError = err.message || String(err);
      console.error('Error sending approval email:', err);
    }
    if (emailError) {
      return res.json({ message: 'Alumni approved, but failed to send approval email.', emailError });
    } else {
      return res.json({ message: 'Alumni approved and notified by email.' });
    }
  } catch (error) {
    console.error('Error approving alumni:', error);
    res.status(500).json({ error: 'Failed to approve alumni', details: error.message });
  }
});

// Test email credentials endpoint
router.get('/test-email', async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(400).json({ error: 'EMAIL_USER or EMAIL_PASS is missing in environment variables.' });
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Test Email from Alumni Portal',
      text: 'This is a test email to verify your email credentials.'
    });
    res.json({ message: 'Test email sent successfully. Check your inbox.' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email', details: error.message });
  }
});

// Reject alumni
router.post('/alumni/:id/reject', auth, checkRole(['admin']), async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id);
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    await Alumni.deleteOne({ _id: alumni._id });

    // Send rejection email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: alumni.email,
      subject: 'Alumni Registration Rejected',
      text: `Dear ${alumni.first_name || 'Alumni'},\n\nWe regret to inform you that your registration was not approved. For more information, contact the alumni office.\n\nBest regards,\nMGM Alumni Association`
    });
    res.json({ message: 'Alumni rejected and notified by email.' });
  } catch (error) {
    console.error('Error rejecting alumni:', error);
    res.status(500).json({ error: 'Failed to reject alumni' });
  }
});

// Delete alumni by ID
router.delete('/alumni/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const alumni = await Alumni.findByIdAndDelete(req.params.id);
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    res.json({ message: 'Alumni deleted successfully.' });
  } catch (error) {
    console.error('Error deleting alumni:', error);
    res.status(500).json({ error: 'Failed to delete alumni' });
  }
});

// Delete student by ID
router.delete('/students/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted successfully.' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

module.exports = router; 