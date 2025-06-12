const mongoose = require('mongoose');

const mentorshipGroupSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alumni',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Add index to prevent duplicate mentorship relationships
mentorshipGroupSchema.index({ mentor: 1, student: 1 }, { unique: true });

const MentorshipGroup = mongoose.model('MentorshipGroup', mentorshipGroupSchema);

module.exports = MentorshipGroup; 