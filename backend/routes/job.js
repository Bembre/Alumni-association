const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Job = require('../models/Job');

// Post a new job (alumni and admin)
router.post('/', auth, checkRole(['alumni', 'admin']), async (req, res) => {
  try {
    const {
      title,
      name,
      location,
      type,
      salary,
      description,
      link,
      expireDate
    } = req.body;

    let postedByRole = req.user.role;
    let postedByName = '';
    if (req.user.role === 'alumni') {
      const Alumni = require('../models/Alumni');
      const alumni = await Alumni.findOne({ email: req.user.email });
      postedByName = alumni ? `${alumni.first_name} ${alumni.last_name}`.trim() : req.user.email;
    } else if (req.user.role === 'admin') {
      const Admin = require('../models/Admin');
      const admin = await Admin.findOne({ email: req.user.email });
      postedByName = admin && admin.username ? admin.username : 'Admin';
    }

    const job = new Job({
      title,
      name,
      location,
      type,
      salary,
      description,
      link,
      postedBy: req.user.email,
      postedByRole,
      postedByName,
      expireDate: new Date(expireDate)
    });

    await job.save();
    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all jobs
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const jobs = await Job.find({ expireDate: { $gte: now } }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a job (only by the alumni who posted it)
router.delete('/:id', auth, checkRole(['alumni']), async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      postedBy: req.user.email
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    await Job.deleteOne({ _id: job._id });
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get jobs posted by specific alumni
router.get('/my-jobs', auth, checkRole(['alumni']), async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.email })
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a job (only by the alumni who posted it)
router.put('/:id', auth, checkRole(['alumni']), async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      postedBy: req.user.email
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    const {
      title,
      name,
      location,
      type,
      salary,
      description,
      link
    } = req.body;

    if (title) job.title = title;
    if (name) job.name = name;
    if (location) job.location = location;
    if (type) job.type = type;
    if (salary) job.salary = salary;
    if (description) job.description = description;
    if (link) job.link = link;

    await job.save();
    res.json({ message: 'Job updated successfully', job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add admin delete job route
router.delete('/admin/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    await Job.deleteOne({ _id: job._id });
    res.json({ message: 'Job deleted successfully (admin)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add admin update job route
router.put('/admin/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const {
      title,
      name,
      location,
      type,
      salary,
      description,
      link
    } = req.body;
    if (title) job.title = title;
    if (name) job.name = name;
    if (location) job.location = location;
    if (type) job.type = type;
    if (salary) job.salary = salary;
    if (description) job.description = description;
    if (link) job.link = link;
    await job.save();
    res.json({ message: 'Job updated successfully (admin)', job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scheduled job to delete expired jobs every hour
setInterval(async () => {
  try {
    const now = new Date();
    await Job.deleteMany({ expireDate: { $lt: now } });
  } catch (err) {
    console.error('Error deleting expired jobs:', err);
  }
}, 1000 * 60 * 60); // every hour

module.exports = router; 