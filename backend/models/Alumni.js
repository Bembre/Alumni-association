const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Set mongoose to not be so strict about null vs undefined
mongoose.set('strictQuery', false);

const alumniSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters long']
  },
  profile: {
    type: String,
    default: ''
  },
  first_name: {
    type: String,
    required: false,
    default: '',
    validate: {
      validator: v => v === '' || /^[A-Za-z]+$/.test(v),
      message: 'First name must contain only letters.'
    }
  },
  middle_name: {
    type: String,
    required: false,
    default: '',
    validate: {
      validator: v => v === '' || /^[A-Za-z]+$/.test(v),
      message: 'Middle name must contain only letters.'
    }
  },
  last_name: {
    type: String,
    required: false,
    default: '',
    validate: {
      validator: v => v === '' || /^[A-Za-z]+$/.test(v),
      message: 'Last name must contain only letters.'
    }
  },
  dob: {
    type: Date,
    required: false,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', '', null],
    required: false,
    default: null
  },
  phone: {
    type: String,
    required: false,
    default: '',
    validate: {
      validator: v => v === '' || /^\d{10}$/.test(v),
      message: 'Phone must be 10 digits.'
    }
  },
  alt_phone: {
    type: String,
    required: false,
    default: '',
    validate: {
      validator: v => v === '' || /^\d{10}$/.test(v),
      message: 'Alternate phone must be 10 digits.'
    }
  },
  current_address: {
    type: String,
    required: false,
    default: ''
  },
  permanent_address: {
    type: String,
    required: false,
    default: ''
  },
  department: {
    type: String,
    required: false,
    default: ''
  },
  course: {
    type: String,
    required: false,
    default: ''
  },
  passing_year: {
    type: Number,
    required: false,
    default: null,
    set: function(value) {
      // Handle string values like "2025-05"
      if (typeof value === 'string') {
        if (value.includes('-')) {
          return parseInt(value.split('-')[0]);
        }
        return parseInt(value) || null;
      }
      return value;
    }
  },
  current_company: {
    type: String,
    required: false,
    default: ''
  },
  designation: {
    type: String,
    required: false,
    default: ''
  },
  current_location: {
    type: String,
    required: false,
    default: ''
  },
  joined_date: {
    type: Date,
    required: false,
    default: null
  },
  experience: {
    type: [{
      company: String,
      position: String,
      years: Number,
      months: Number,
      description: String
    }],
    default: []
  },
  skillset: {
    type: [String],
    default: []
  },
  projects: {
    type: [{
      title: {
        type: String,
        required: false
      },
      description: {
        type: String,
        required: false
      },
      technologies: {
        type: String,
        required: false
      },
      years: {
        type: Number,
        required: false
      },
      months: {
        type: Number,
        required: false
      },
      link: {
        type: String,
        required: false
      }
    }],
    default: []
  },
  achievements: {
    type: [{
      type: {
        type: String,
        enum: ['sports', 'awards', 'academic', 'events'],
        required: false
      },
      title: {
        type: String,
        required: false
      },
      description: {
        type: String,
        required: false
      },
      date: {
        type: Date,
        required: false
      },
      organization: {
        type: String,
        required: false
      }
    }],
    default: []
  },
  education: {
    type: [{
      type: {
        type: String,
        enum: ['10th', '12th', 'Graduation', 'Post Graduation', ''],
        required: false,
        default: ''
      },
      institution: {
        type: String,
        required: false,
        default: ''
      },
      board: {
        type: String,
        required: false,
        default: ''
      },
      year: {
        type: Number,
        required: false
      },
      grade: {
        type: String,
        required: false,
        default: ''
      },
      percentage: {
        type: String,
        required: false,
        default: ''
      }
    }],
    default: []
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  assigned_students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    start_date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Active', 'Completed'],
      default: 'Active'
    }
  }],
  current_students: {
    type: Number,
    default: 0
  },
  max_students: {
    type: Number,
    default: 3
  },
  mentorship_status: {
    type: String,
    enum: ['Available', 'Full'],
    default: 'Available'
  },
  mentorship_preferences: {
    departments: [String],
    courses: [String],
    years: [String]
  },
  can_mentor: {
    type: Boolean,
    default: false
  },
  mentees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  isApproved: {
    type: Boolean,
    default: false
  },
  resetPasswordOTP: {
    type: String,
    default: null
  },
  resetPasswordOTPExpires: {
    type: Date,
    default: null
  },
}, { 
  timestamps: true,
  strict: false // Allow fields not in schema
});

// Hash password before saving
alumniSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
alumniSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to validate profile completion
alumniSchema.methods.validateProfileCompletion = function() {
  // Basic required fields that must exist
  const requiredFields = [
    'first_name',
    'last_name',
    'department',
    'course'
  ];

  // Additional fields that are required but we'll be more lenient about
  const recommendedFields = [
    'dob',
    'gender',
    'phone',
    'current_address',
    'permanent_address',
    'passing_year',
    'current_company',
    'designation',
    'current_location'
  ];

  // Check if basic fields are filled
  const basicFieldsComplete = requiredFields.every(field => {
    const value = this[field];
    return value !== undefined && value !== null && value !== '';
  });

  // For recommended fields, we'll only require a majority (e.g., 70%)
  const recommendedFieldsPresent = recommendedFields.filter(field => {
    const value = this[field];
    return value !== undefined && value !== null && value !== '';
  }).length;
  
  const recommendedFieldsPercentage = recommendedFieldsPresent / recommendedFields.length;
  const sufficientRecommendedFields = recommendedFieldsPercentage >= 0.7;

  // Check if at least one education entry exists
  const hasEducation = 
    Array.isArray(this.education) && 
    this.education.length > 0 &&
    this.education.some(edu => edu.institution);

  // Check if at least one experience entry or skills is provided
  const hasExperience = 
    (Array.isArray(this.experience) && 
     this.experience.length > 0 &&
     this.experience.some(exp => exp.company || exp.position)) ||
    (Array.isArray(this.skillset) && this.skillset.length > 0);

  // We require basic fields and either sufficient recommended fields OR both education and experience
  return basicFieldsComplete && (sufficientRecommendedFields || (hasEducation && hasExperience));
};

module.exports = mongoose.model('Alumni', alumniSchema); 