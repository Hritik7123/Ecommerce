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

// Database connection and sync with improved retry logic and exponential backoff
const initializeDatabase = async (retries = 15, baseDelay = 5000) => {
  console.log('🔄 Starting database initialization...');
  console.log('📍 Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    RENDER: process.env.RENDER,
    HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    HAS_DB_HOST: !!process.env.DB_HOST
  });

  // Show masked DATABASE_URL for debugging
  if (process.env.DATABASE_URL) {
    const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
    console.log(`📊 DATABASE_URL: ${maskedUrl}`);
  }

  for (let i = 0; i < retries; i++) {
    try {
      // Exponential backoff: delay increases with each retry
      const delay = baseDelay * Math.pow(1.5, i);
      
      if (i > 0) {
        console.log(`⏳ Waiting ${(delay / 1000).toFixed(1)} seconds before retry ${i + 1}/${retries}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      console.log(`🔄 Attempting database connection (${i + 1}/${retries})...`);
      
      // Set a timeout for the connection attempt
      const connectionPromise = sequelize.authenticate();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 90 seconds')), 90000)
      );
      
      await Promise.race([connectionPromise, timeoutPromise]);
      console.log('✅ PostgreSQL database connection established successfully');
      
      // Verify connection is actually working
      try {
        await sequelize.query('SELECT 1');
        console.log('✅ Database connection verified');
      } catch (verifyError) {
        console.warn('⚠️ Connection verified but query test failed:', verifyError.message);
      }
      
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
      const errorName = error.name || '';
      
      console.error(`❌ Database connection attempt ${i + 1}/${retries} failed:`);
      console.error(`   Error Type: ${errorName}`);
      console.error(`   Error Message: ${errorMessage}`);
      
      // Provide specific guidance based on error type
      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
        console.error('   → DNS resolution failed. Check DATABASE_URL hostname is correct.');
        console.error('   → For Render: Use External Database URL, not Internal.');
        console.error('   → CRITICAL: Make sure hostname includes full domain (e.g., .render.com)');
      } else if (errorMessage.includes('ECONNREFUSED') || errorName.includes('ConnectionRefused')) {
        console.error('   → Connection refused. Possible causes:');
        console.error('     1. Database service is paused - Check Render dashboard');
        console.error('     2. Database is still starting (cold start takes 30-60 seconds)');
        console.error('     3. Wrong credentials in DATABASE_URL');
        console.error('     4. Database firewall blocking connection');
        console.error('   → Action: Wait a bit longer and retry (Render databases have cold starts)');
      } else if (errorMessage.includes('password') || errorMessage.includes('authentication')) {
        console.error('   → Authentication failed. Check username and password in DATABASE_URL.');
        console.error('   → Verify credentials in Render Dashboard → Database → Connections');
      } else if (errorMessage.includes('timeout')) {
        console.error('   → Connection timeout. Database might be slow to respond.');
        console.error('   → Render free tier databases can be slow on cold start.');
      } else if (errorMessage.includes('SSL') || errorMessage.includes('TLS')) {
        console.error('   → SSL/TLS error. Check SSL configuration.');
        console.error('   → Render requires SSL connections.');
      }
      
      if (i === retries - 1) {
        // Last attempt failed
        console.error('\n❌ ===========================================');
        console.error('❌ Failed to connect to database after all retries');
        console.error('❌ ===========================================\n');
        console.error('📋 CRITICAL CHECKLIST:');
        console.error('   1. ✅ Go to Render Dashboard → Your PostgreSQL Database');
        console.error('   2. ✅ Check database status is "Available" (green), not "Paused"');
        console.error('   3. ✅ Click "Connections" tab');
        console.error('   4. ✅ Copy the COMPLETE "External Connection String"');
        console.error('   5. ✅ Verify it includes: *.render.com (e.g., .oregon-postgres.render.com)');
        console.error('   6. ✅ Go to Web Service → Environment → DATABASE_URL');
        console.error('   7. ✅ Paste the complete External Connection String');
        console.error('   8. ✅ Save changes and redeploy');
        console.error('\n💡 Environment Variables Check:');
        console.error(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
        if (process.env.DATABASE_URL) {
          const masked = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
          console.error(`   DATABASE_URL value: ${masked.substring(0, 80)}...`);
        }
        console.error(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
        
        // In production, start server anyway - connection can be established later
        if (process.env.NODE_ENV === 'production') {
          console.warn('\n⚠️ ===========================================');
          console.warn('⚠️ Server will start WITHOUT database connection');
          console.warn('⚠️ Database connection will be retried on first API call');
          console.warn('⚠️ ===========================================\n');
          
          // Connection will be retried automatically by Sequelize on next query
          return;
        } else {
          console.error('\n💥 Exiting in development mode due to database connection failure');
          process.exit(1);
        }
      }
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
