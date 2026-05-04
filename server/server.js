const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donors');
const grantRoutes = require('./routes/grants');
const transactionRoutes = require('./routes/transactions');
const auditRoutes = require('./routes/audit');
const reportRoutes = require('./routes/reports');
const analysisRoutes = require('./routes/analysis');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Middleware to enforce read-only access for auditors
const enforceAuditorReadOnly = (req, res, next) => {
  if (req.method === 'GET') return next();
  if (req.originalUrl.includes('/api/auth')) return next();
  if (req.originalUrl.includes('/api/analysis')) return next();

  // Auditors are specifically allowed to flag transactions
  if (req.originalUrl.match(/\/api\/transactions\/.*\/flag/) && req.method === 'PATCH') return next();

  try {
    let role = req.user?.role;
    if (!role && req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        role = decoded.role;
      }
    }

    if (role === 'auditor') {
      return res.status(403).json({ message: 'Access denied: Auditors have read-only privileges.' });
    }
  } catch (error) {
    // Token parsing errors will be handled by your main auth middleware
  }
  next();
};

app.use('/api', enforceAuditorReadOnly);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/grants', grantRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analysis', analysisRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 RCZ Donor Tracker API running on port ${PORT}`);
});
