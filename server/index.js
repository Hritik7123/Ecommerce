const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { sequelize } = require('./models');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Environment variables loaded

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

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Database connection and sync with retry logic
const initializeDatabase = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
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
      return; // Success, exit function
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1}/${retries} failed:`, error.message);
      
      if (i === retries - 1) {
        // Last attempt failed
        console.error('❌ Failed to connect to database after all retries');
        console.error('Check your environment variables:');
        console.error('- DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
        console.error('- Ensure database is accessible and credentials are correct');
        console.error('- For Render: Check if database service is running');
        
        // In production, don't crash immediately - allow server to start
        // Database operations will fail gracefully
        if (process.env.NODE_ENV === 'production') {
          console.warn('⚠️ Server will start without database connection. Some features may not work.');
          return;
        } else {
          process.exit(1);
        }
      }
      
      // Wait before retry
      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

initializeDatabase();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/admin', require('./routes/admin'));

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

const PORT = process.env.PORT || 5000;

// Check if port is available before starting
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the process using this port or use a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
