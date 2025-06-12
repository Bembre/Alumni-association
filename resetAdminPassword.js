const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./backend/models/Admin');

async function resetPassword() {
  await mongoose.connect('mongodb://localhost:27017/alumni-association', { useNewUrlParser: true, useUnifiedTopology: true });
  const email = 'admin@example.com';
  const newPassword = '123456';
  const hash = await bcrypt.hash(newPassword, 10);
  const result = await Admin.updateOne({ email }, { $set: { password: hash } });
  console.log('Password reset result:', result);
  mongoose.disconnect();
}

resetPassword(); 