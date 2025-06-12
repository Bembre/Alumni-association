const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    default: ''
  },
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
  senderRole: {
    type: String,
    enum: ['alumni', 'student'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  file: {
    id: String,
    name: String,
    type: String,
    size: Number
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'reactions.userModel'
    },
    userModel: {
      type: String,
      enum: ['Student', 'Alumni']
    },
    emoji: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  isGroup: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Message', messageSchema); 