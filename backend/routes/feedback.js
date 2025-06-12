const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Feedback = require('../models/Feedback');

// Submit feedback (any authenticated user)
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, feedback } = req.body;
    const newFeedback = new Feedback({
      name,
      email,
      feedback
    });
    await newFeedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all feedback (admin only)
router.get('/', auth, checkRole(['admin']), async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete feedback (admin only)
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 