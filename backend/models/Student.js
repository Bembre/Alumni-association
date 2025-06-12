const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Set mongoose to not be so strict about null vs undefined
mongoose.set('strictQuery', false);

const studentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [{
      validator: function(v) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(v);
      },
      message: props => `${props.value} is not a valid email format`
    },
    {
      validator: function(v) {
        return v.endsWith('@mgmcen.ac.in');
      },
      message: props => `${props.value} must be a valid MGM student email (@mgmcen.ac.in)`
    }]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      validator: function(v) {
        return v && v.length >= 6;
      },
      message: props => 'Password must be at least 6 characters long'
    }
  },
  profile: {
    type: String,
    default: null
  },
  department: {
    type: String,
    default: 'Information Technology'
  },
  course: {
    type: String,
    default: 'B. Tech. Information Technology'
  },
  first_name: {
    type: String,
    default: '',
    validate: {
      validator: v => v === '' || /^[A-Za-z]+$/.test(v),
      message: 'First name must contain only letters.'
    },
    required: false
  },
  middle_name: {
    type: String,
    default: '',
    validate: {
      validator: v => v === '' || /^[A-Za-z]+$/.test(v),
      message: 'Middle name must contain only letters.'
    }
  },
  last_name: {
    type: String,
    default: '',
    validate: {
      validator: v => v === '' || /^[A-Za-z]+$/.test(v),
      message: 'Last name must contain only letters.'
    },
    required: false
  },
  dob: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Other'
  },
  current_year: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    default: '1st Year'
  },
  phone: {
    type: String,
    default: '',
    validate: {
      validator: v => v === '' || /^\d{10}$/.test(v),
      message: 'Phone must be 10 digits.'
    },
    required: false
  },
  alt_phone: {
    type: String,
    default: '',
    validate: {
      validator: v => v === '' || /^\d{10}$/.test(v),
      message: 'Alternate phone must be 10 digits.'
    }
  },
  student_id: {
    type: String,
    default: '',
    validate: {
      validator: v => v === '' || /^S\d{10}$/.test(v),
      message: 'Student ID must start with S and be followed by 10 digits.'
    },
    required: false
  },
  current_address: {
    type: String,
    default: ''
  },
  permanent_address: {
    type: String,
    default: ''
  },
  experience: {
    type: [{
      type: {
        type: String,
        enum: ['Internship', 'Work Experience'],
        required: false
      },
      company: {
        type: String,
        required: false
      },
      position: {
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
      description: {
        type: String,
        required: false
      }
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
        enum: ['10th', '12th', 'Graduation', 'Post Graduation'],
        required: false
      },
      institution: {
        type: String,
        required: false
      },
      board: {
        type: String,
        required: false
      },
      year: {
        type: Number,
        required: false
      },
      grade: {
        type: String,
        required: false
      },
      percentage: {
        type: String,
        required: false
      }
    }],
    default: []
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alumni',
    default: null
  },
  mentorship_status: {
    type: String,
    enum: ['Available', 'Mentored', 'Completed'],
    default: 'Available'
  },
  mentorship_start_date: {
    type: Date,
    default: null
  },
  mentorship_end_date: {
    type: Date,
    default: null
  },
  mentorship_notes: {
    type: String,
    default: ''
  },
  resetPasswordOTP: {
    type: String,
    default: null
  },
  resetPasswordOTPExpires: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Hash password before saving
studentSchema.pre('save', async function(next) {
  try {
    console.log('Pre-save middleware triggered for student:', this.email);
    
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
      console.log('Password not modified, skipping hashing');
      return next();
    }

    // Validate password
    if (!this.password || this.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    console.log('Hashing password for student:', this.email);
    
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password using the new salt
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    // Override the cleartext password with the hashed one
    this.password = hashedPassword;
    
    console.log('Password hashed successfully for student:', this.email);
    next();
  } catch (error) {
    console.error('Error in pre-save middleware:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
});

// Add post-save middleware for debugging
studentSchema.post('save', function(error, doc, next) {
  if (error) {
    console.error('Error in post-save middleware:', error);
    console.error('Validation errors:', error.errors);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
  }
  next(error);
});

// Method to compare password
studentSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw new Error('Password comparison failed');
  }
};

module.exports = mongoose.model('Student', studentSchema); 