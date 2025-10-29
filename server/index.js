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
const initializeDatabase = async (retries = 10, delay = 10000) => {
  console.log('🔄 Starting database initialization...');
  console.log('📍 Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    RENDER: process.env.RENDER,
    HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    HAS_DB_HOST: !!process.env.DB_HOST
  });

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Attempting database connection (${i + 1}/${retries})...`);
      
      // Set a timeout for the connection attempt
      const connectionPromise = sequelize.authenticate();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 60 seconds')), 60000)
      );
      
      await Promise.race([connectionPromise, timeoutPromise]);
      console.log('✅ PostgreSQL database connection established successfully');
      
      // Only sync if tables don't exist (first run)
      try {
        const tableExists = await sequelize.getQueryInterface().showAllTables();
        if (tableExists.length === 0) {
          console.log('🔄 Creating database tables...');
          await sequelize.sync({ alter: true });
          console.log('✅ PostgreSQL database synchronized successfully');
        } else {
          console.log(`✅ Database tables already exist (${tableExists.length} tables), skipping sync`);
        }
      } catch (syncError) {
        console.warn('⚠️ Database sync warning:', syncError.message);
        // Don't fail if sync fails - tables might already exist
      }
      
      return; // Success, exit function
    } catch (error) {
      const errorMessage = error.message || error.toString();
      console.error(`❌ Database connection attempt ${i + 1}/${retries} failed:`);
      console.error(`   Error: ${errorMessage}`);
      
      // Provide specific guidance based on error type
      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
        console.error('   → DNS resolution failed. Check DATABASE_URL hostname is correct.');
        console.error('   → For Render: Use External Database URL, not Internal.');
      } else if (errorMessage.includes('ECONNREFUSED')) {
        console.error('   → Connection refused. Check database is running and accessible.');
        console.error('   → For Render: Ensure database service is "Available" not "Paused".');
      } else if (errorMessage.includes('password') || errorMessage.includes('authentication')) {
        console.error('   → Authentication failed. Check username and password in DATABASE_URL.');
      } else if (errorMessage.includes('timeout')) {
        console.error('   → Connection timeout. Database might be slow to respond.');
      }
      
      if (i === retries - 1) {
        // Last attempt failed
        console.error('\n❌ ===========================================');
        console.error('❌ Failed to connect to database after all retries');
        console.error('❌ ===========================================\n');
        console.error('📋 Troubleshooting Checklist:');
        console.error('   1. ✅ Verify DATABASE_URL is set correctly in Render');
        console.error('   2. ✅ Use External Database URL (not Internal)');
        console.error('   3. ✅ Ensure database service is "Available" in Render dashboard');
        console.error('   4. ✅ Check database and web service are in same region');
        console.error('   5. ✅ Verify database credentials are correct');
        console.error('   6. ✅ Check Render database logs for errors');
        console.error('\n💡 Environment Variables Check:');
        console.error(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
        console.error(`   DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
        console.error(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
        
        // In production, don't crash immediately - allow server to start
        // Database operations will fail gracefully
        if (process.env.NODE_ENV === 'production') {
          console.warn('\n⚠️ ===========================================');
          console.warn('⚠️ Server will start WITHOUT database connection');
          console.warn('⚠️ API endpoints requiring database will fail');
          console.warn('⚠️ ===========================================\n');
          return;
        } else {
          console.error('\n💥 Exiting in development mode due to database connection failure');
          process.exit(1);
        }
      }
      
      // Wait before retry (longer delay for Render)
      const waitTime = delay / 1000;
      console.log(`⏳ Waiting ${waitTime} seconds before retry...`);
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
