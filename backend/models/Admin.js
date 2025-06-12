const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profile: String,
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
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);

// --- SEED ADMIN SCRIPT ---
// To use: run `node backend/models/Admin.js` (after adjusting your DB connection if needed)
if (require.main === module) {
  const mongoose = require('mongoose');
  const Admin = require('./Admin');

  mongoose.connect('mongodb://localhost:27017/alumni-association', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
      const email = 'admin@example.com';
      const password = '123456';
      const username = 'admin';
      let admin = await Admin.findOne({ email });
      if (!admin) {
        admin = new Admin({ email, password, username });
        await admin.save();
        console.log('Seeded admin:', email);
      } else {
        console.log('Admin already exists:', email);
      }
      mongoose.disconnect();
    })
    .catch(err => {
      console.error('Error seeding admin:', err);
      mongoose.disconnect();
    });
} 