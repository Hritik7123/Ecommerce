const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('../server/models');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection and sync
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL database connection established successfully');
    
    // Only sync if tables don't exist (first run)
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    if (tableExists.length === 0) {
      await sequelize.sync({ alter: true });
      console.log('PostgreSQL database synchronized successfully');
    } else {
      console.log('Database tables already exist, skipping sync');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    // Don't exit in serverless environment
  }
};

// Initialize database on startup
initializeDatabase();

// Routes
app.use('/api/auth', require('../server/routes/auth'));
app.use('/api/products', require('../server/routes/products'));
app.use('/api/users', require('../server/routes/users'));
app.use('/api/orders', require('../server/routes/orders'));
app.use('/api/cart', require('../server/routes/cart'));
app.use('/api/admin', require('../server/routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'E-commerce API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
