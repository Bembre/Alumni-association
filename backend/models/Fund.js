const mongoose = require('mongoose');

const fundSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  url: String,
  raised: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Fund', fundSchema); 