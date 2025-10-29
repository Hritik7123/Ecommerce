const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Enable trust proxy for Vercel
app.set('trust proxy', 1);

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

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Database initialization (non-blocking and error-safe)
let sequelize = null;
const initializeDatabase = async () => {
  try {
    // Only try to connect if DATABASE_URL is provided
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ No DATABASE_URL provided, skipping database connection');
      return;
    }

    const { sequelize: db } = require('../server/models');
    sequelize = db;
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL database connection established successfully');
    
    // Only sync if tables don't exist (first run)
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    if (tableExists.length === 0) {
      await sequelize.sync({ alter: true });
      console.log('✅ PostgreSQL database synchronized successfully');
    } else {
      console.log('✅ Database tables already exist, skipping sync');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    // Don't exit in serverless environment - app should still work
  }
};

// Initialize database on startup (non-blocking)
initializeDatabase();

// Routes - only load if database is available
try {
  app.use('/api/auth', require('../server/routes/auth'));
  app.use('/api/products', require('../server/routes/products'));
  app.use('/api/users', require('../server/routes/users'));
  app.use('/api/orders', require('../server/routes/orders'));
  app.use('/api/cart', require('../server/routes/cart'));
  app.use('/api/admin', require('../server/routes/admin'));
} catch (error) {
  console.error('⚠️ Error loading routes:', error.message);
  // Continue without routes if they fail to load
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'E-commerce API is running',
    timestamp: new Date().toISOString(),
    database: sequelize ? 'connected' : 'not connected'
  });
});

// Basic root route for testing
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  } else {
    res.json({ 
      message: 'E-commerce API is running',
      status: 'OK',
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - serve React app for non-API routes in production
app.use('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ message: 'Route not found' });
  } else if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  } else {
    res.status(404).json({ message: 'Route not found' });
  }
});

// Export for Vercel serverless function
module.exports = app;