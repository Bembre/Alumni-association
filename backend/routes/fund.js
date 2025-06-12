const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Fund = require('../models/Fund');

// Create fund (admin only)
router.post('/', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { title, description, amount, url } = req.body;
    const fund = new Fund({
      title,
      description,
      amount,
      url
    });
    await fund.save();
    res.status(201).json({ message: 'Fund created successfully', fund });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all funds
router.get('/', auth, async (req, res) => {
  try {
    const funds = await Fund.find().sort({ createdAt: -1 });
    res.json(funds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update fund (admin only)
router.put('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const fund = await Fund.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!fund) {
      return res.status(404).json({ error: 'Fund not found' });
    }
    res.json({ message: 'Fund updated successfully', fund });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete fund (admin only)
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const fund = await Fund.findByIdAndDelete(req.params.id);
    if (!fund) {
      return res.status(404).json({ error: 'Fund not found' });
    }
    res.json({ message: 'Fund deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update the 'raised' amount for a fund (admin only)
router.patch('/:id/raised', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { raised } = req.body;
    if (typeof raised !== 'number' || raised < 0) {
      return res.status(400).json({ error: 'Raised amount must be a non-negative number.' });
    }
    const fund = await Fund.findByIdAndUpdate(
      req.params.id,
      { raised },
      { new: true }
    );
    if (!fund) {
      return res.status(404).json({ error: 'Fund not found' });
    }
    res.json({ message: 'Raised amount updated successfully', fund });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 