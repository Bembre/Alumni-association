const mongoose = require('mongoose');

const donationTransactionSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fund',
    required: true
  },
  alumni: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alumni',
    required: false // allow guest donations
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  upiRef: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('DonationTransaction', donationTransactionSchema); 