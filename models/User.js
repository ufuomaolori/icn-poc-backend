const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: [true, 'Full name required'], trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: [true, 'Email required'], unique: true, lowercase: true, trim: true, validate: [validator.isEmail, 'Invalid email'] },
  password: { type: String, required: [true, 'Password required'], minlength: 8, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
