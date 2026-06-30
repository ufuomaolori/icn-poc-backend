require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: { success: false, message: 'Too many requests.' } }));
app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => res.json({ success: true, message: 'ICN POC API running', timestamp: new Date() }));
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => res.status(500).json({ success: false, message: err.message }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('[DB] Connected'); app.listen(PORT, () => console.log(`[SERVER] Port ${PORT}`)); })
  .catch(err => { console.error('[DB] Failed:', err.message); process.exit(1); });
