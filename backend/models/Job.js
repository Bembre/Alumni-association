const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  salary: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  link: String,
  postedBy: {
    type: String,
    required: true
  },
  postedByRole: {
    type: String,
    enum: ['alumni', 'admin'],
    required: true
  },
  postedByName: {
    type: String,
    required: true
  },
  expireDate: {
    type: Date,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema); 