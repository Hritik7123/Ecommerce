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

// Make database initialization non-blocking - don't wait for it
// Server starts immediately, DB connects in background
let dbConnectionStatus = 'connecting';
let dbConnectionError = null;

const initializeDatabase = async (retries = 20, baseDelay = 3000) => {
  console.log('🔄 Starting database initialization (non-blocking)...');
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
    
    // Validate hostname format
    try {
      const url = new URL(process.env.DATABASE_URL);
      const hostname = url.hostname;
      if (hostname.includes('dpg-') && !hostname.includes('.')) {
        console.error('❌ INCOMPLETE HOSTNAME DETECTED - Database connection will fail!');
        console.error(`   Current: ${hostname}`);
        console.error(`   Required: ${hostname}.REGION-postgres.render.com`);
      }
    } catch (e) {
      // URL parsing failed
    }
  }

  for (let i = 0; i < retries; i++) {
    try {
      // Exponential backoff: delay increases with each retry
      const delay = baseDelay * Math.pow(1.2, i);
      
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
        dbConnectionStatus = 'connected';
        dbConnectionError = null;
      } catch (verifyError) {
        console.warn('⚠️ Connection verified but query test failed:', verifyError.message);
        dbConnectionStatus = 'error';
        dbConnectionError = verifyError.message;
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
        console.error('     1. Database service is paused - Check Render dashboard → Resume database');
        console.error('     2. Database is still starting (cold start takes 30-90 seconds on Render free tier)');
        console.error('     3. Wrong credentials in DATABASE_URL - Verify in Render Dashboard');
        console.error('     4. Using Internal URL instead of External URL');
        console.error('   → Action: Wait longer - Render free databases are slow on cold start');
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
      
      dbConnectionError = errorMessage;
      
      if (i === retries - 1) {
        // Last attempt failed
        console.error('\n❌ ===========================================');
        console.error('❌ Failed to connect to database after all retries');
        console.error('❌ ===========================================\n');
        console.error('📋 CRITICAL CHECKLIST:');
        console.error('   1. ✅ Go to Render Dashboard → Your PostgreSQL Database');
        console.error('   2. ✅ Check database status - MUST be "Available" (green), not "Paused"');
        console.error('   3. ✅ If paused, click "Resume" to start the database');
        console.error('   4. ✅ Click "Connections" tab');
        console.error('   5. ✅ Copy the COMPLETE "External Connection String"');
        console.error('   6. ✅ Verify it includes: *.render.com (e.g., .oregon-postgres.render.com)');
        console.error('   7. ✅ Go to Web Service → Environment → DATABASE_URL');
        console.error('   8. ✅ Paste the complete External Connection String');
        console.error('   9. ✅ Save changes and redeploy');
        console.error('\n💡 Environment Variables Check:');
        console.error(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
        if (process.env.DATABASE_URL) {
          const masked = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
          console.error(`   DATABASE_URL value: ${masked}`);
          // Check if hostname is complete
          try {
            const url = new URL(process.env.DATABASE_URL);
            if (url.hostname.includes('dpg-') && !url.hostname.includes('.')) {
              console.error(`   ❌ HOSTNAME IS INCOMPLETE: ${url.hostname}`);
              console.error(`   ❌ NEEDS: ${url.hostname}.REGION-postgres.render.com`);
            }
          } catch (e) {}
        }
        console.error(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
        
        dbConnectionStatus = 'failed';
        
        // DON'T EXIT - Server must start anyway
        console.warn('\n⚠️ ===========================================');
        console.warn('⚠️ Server WILL START without database connection');
        console.warn('⚠️ Database connection can be retried via /api/health endpoint');
        console.warn('⚠️ Fix DATABASE_URL and connection will work automatically');
        console.warn('⚠️ ===========================================\n');
        return;
      }
    }
  }
};

// Start database initialization in background - don't block server startup
initializeDatabase().catch(err => {
  console.error('Database initialization error (non-fatal):', err.message);
  dbConnectionStatus = 'error';
  dbConnectionError = err.message;
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/admin', require('./routes/admin'));

// Enhanced Health check endpoint with database status
app.get('/api/health', async (req, res) => {
  const healthStatus = {
    status: 'OK',
    message: 'E-commerce API is running',
    timestamp: new Date().toISOString(),
    database: {
      status: dbConnectionStatus,
      error: dbConnectionError
    }
  };

  // Try to test database connection if not connected
  if (dbConnectionStatus !== 'connected') {
    try {
      await sequelize.authenticate();
      await sequelize.query('SELECT 1');
      dbConnectionStatus = 'connected';
      dbConnectionError = null;
      healthStatus.database.status = 'connected';
      healthStatus.message = 'E-commerce API is running - Database connected';
    } catch (err) {
      dbConnectionStatus = 'error';
      dbConnectionError = err.message;
      healthStatus.database.status = 'error';
      healthStatus.database.error = err.message;
      healthStatus.message = 'E-commerce API is running - Database connection failed';
    }
  }

  const statusCode = dbConnectionStatus === 'connected' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
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
