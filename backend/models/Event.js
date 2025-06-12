const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['reunion', 'knowledge_sharing', 'webinar', 'expert_lecture'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    required: function() {
      return ['reunion', 'knowledge_sharing', 'expert_lecture'].includes(this.type);
    }
  },
  link: {
    type: String,
    required: function() {
      return this.type === 'webinar';
    }
  },
  organizer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'organizerModel',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    organizerModel: {
      type: String,
      enum: ['Alumni', 'Admin'],
      required: true
    }
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'participantModel',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    participantModel: {
      type: String,
      enum: ['Alumni', 'Student'],
      required: true
    },
    registrationDate: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  maxParticipants: {
    type: Number,
    default: null // null means unlimited
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual property to check if event is active (not expired)
eventSchema.virtual('isActive').get(function() {
  return new Date() < this.expiryDate;
});

// Virtual property to get number of participants
eventSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Method to check if event is full
eventSchema.methods.isFull = function() {
  if (!this.maxParticipants) return false;
  return this.participants.length >= this.maxParticipants;
};

// Method to check if user has registered
eventSchema.methods.isUserRegistered = function(userId) {
  return this.participants.some(p => p.userId.toString() === userId.toString());
};

// Add a text index for searching
eventSchema.index({ title: 'text', description: 'text', type: 'text' });

module.exports = mongoose.model('Event', eventSchema); 