const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ success: false, message: 'All fields required.' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ success: false, message: 'Email already registered.' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be 8+ characters.' });
    const user = await User.create({ fullName, email, password });
    res.status(201).json({ success: true, message: 'Account created.', token: signToken(user._id), user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: Object.values(err.errors).map(e => e.message).join('. ') });
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated.' });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Login successful.', token: signToken(user._id), user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, lastLogin: user.lastLogin } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getMe = (req, res) => {
  res.json({ success: true, user: { id: req.user._id, fullName: req.user.fullName, email: req.user.email, role: req.user.role, createdAt: req.user.createdAt, lastLogin: req.user.lastLogin } });
};
