const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determine if we're in production (Render/Railway/etc)
const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.RENDER === 'true' || process.env.DB_HOST?.includes('render.com') || process.env.DATABASE_URL?.includes('render.com');

// Parse DATABASE_URL if it exists
let parsedConfig = null;
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    const hostname = url.hostname;
    
    // Validate hostname completeness and AUTO-FIX incomplete hostnames
    const isRenderHostname = hostname.includes('dpg-') || hostname.includes('render.com');
    const isIncompleteHostname = hostname.includes('dpg-') && !hostname.includes('.');
    
    if (isIncompleteHostname) {
      console.error('\n❌ ===========================================');
      console.error('❌ INCOMPLETE DATABASE HOSTNAME DETECTED!');
      console.error('❌ ===========================================');
      
      // Show actual DATABASE_URL (mask password)
      const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
      console.error(`Current DATABASE_URL: ${maskedUrl}`);
      console.error(`Incomplete hostname: ${hostname}`);
      
      // Common Render PostgreSQL regions to try
      const renderRegions = [
        'oregon-postgres.render.com',
        'singapore-postgres.render.com',
        'frankfurt-postgres.render.com',
        'ohio-postgres.render.com',
        'australia-postgres.render.com',
        'brazil-postgres.render.com'
      ];
      
      console.error('\n🔄 ATTEMPTING AUTO-FIX by trying common Render regions...');
      
      // Try to auto-complete with common regions
      let fixed = false;
      for (const region of renderRegions) {
        const completedHostname = `${hostname}.${region}`;
        console.log(`   Trying: ${completedHostname}`);
        
        // Reconstruct URL with completed hostname
        const fixedUrl = process.env.DATABASE_URL.replace(hostname, completedHostname);
        
        // Update parsedConfig with fixed hostname
        try {
          const fixedUrlObj = new URL(fixedUrl);
          parsedConfig = {
            protocol: fixedUrlObj.protocol.replace(':', ''),
            host: completedHostname,
            port: parseInt(fixedUrlObj.port) || 5432,
            database: fixedUrlObj.pathname.slice(1),
            username: fixedUrlObj.username,
            password: fixedUrlObj.password,
            ssl: true
          };
          
          console.log(`✅ Auto-fixed hostname to: ${completedHostname}`);
          console.log('⚠️  If this doesn\'t work, check your Render database region and update DATABASE_URL manually.');
          fixed = true;
          break;
        } catch (e) {
          // Continue to next region
        }
      }
      
      if (!fixed) {
        console.error('\n❌ AUTO-FIX FAILED - Manual fix required:');
        console.error('1. Go to Render Dashboard → Your PostgreSQL Database');
        console.error('2. Click "Connections" tab');
        console.error('3. Copy the COMPLETE "External Connection String"');
        console.error('4. It MUST include: *.render.com (e.g., .oregon-postgres.render.com)');
        console.error('5. Update DATABASE_URL in Render Web Service → Environment');
        console.error('\n❌ ===========================================\n');
        parsedConfig = null;
      }
    } else {
      parsedConfig = {
        protocol: url.protocol.replace(':', ''),
        host: hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1), // Remove leading /
        username: url.username,
        password: url.password,
        ssl: url.searchParams.get('ssl') === 'true' || isProduction || isRender
      };
      
      console.log('📊 Parsed DATABASE_URL:', {
        host: parsedConfig.host,
        port: parsedConfig.port,
        database: parsedConfig.database,
        username: parsedConfig.username,
        ssl: parsedConfig.ssl
      });
      
      // Additional validation for Render hostnames
      if (isRenderHostname && !parsedConfig.host.includes('.render.com')) {
        console.warn('\n⚠️  WARNING: Hostname might be incomplete or incorrect.');
        console.warn('Expected Render hostname format: *.render.com');
        console.warn(`Current hostname: ${parsedConfig.host}\n`);
      }
    }
  } catch (error) {
    console.error('⚠️ Failed to parse DATABASE_URL:', error.message);
    console.error('Make sure DATABASE_URL is a valid PostgreSQL connection string.');
  }
}

// SSL configuration for production databases
const getSSLConfig = () => {
  // Always use SSL for Render or production
  if (isProduction || isRender || parsedConfig?.ssl) {
    return {
      require: true,
      rejectUnauthorized: false
    };
  }
  return false;
};

// Build Sequelize configuration
let sequelize;

// Priority 1: DATABASE_URL (Render, Railway, etc. often provide this)
if (process.env.DATABASE_URL) {
  const sequelizeConfig = {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: getSSLConfig()
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000, // Increased timeout for Render (60 seconds)
      idle: 10000,
      evict: 1000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  };

  // Use parsed config if available, otherwise use URL string
  if (parsedConfig) {
    sequelize = new Sequelize(
      parsedConfig.database,
      parsedConfig.username,
      parsedConfig.password,
      {
        ...sequelizeConfig,
        host: parsedConfig.host,
        port: parsedConfig.port,
        dialect: 'postgres'
      }
    );
  } else {
    // If parsedConfig is null (incomplete hostname), try to use original URL
    // but it will fail - error handling will catch it
    console.warn('⚠️  Using original DATABASE_URL - connection may fail due to incomplete hostname');
    sequelize = new Sequelize(
      process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'sslmode=require',
      sequelizeConfig
    );
  }
}
// Priority 2: DATABASE_PUBLIC_URL (Railway-specific)
else if (process.env.DATABASE_PUBLIC_URL) {
  sequelize = new Sequelize(process.env.DATABASE_PUBLIC_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: getSSLConfig()
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });
}
// Priority 3: Individual environment variables
else {
  sequelize = new Sequelize({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'ecommerce',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: getSSLConfig()
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });
}

// Log connection configuration (without sensitive data)
console.log('🔌 Database Configuration:', {
  dialect: 'postgres',
  host: parsedConfig?.host || process.env.DB_HOST || 'localhost',
  port: parsedConfig?.port || process.env.DB_PORT || 5432,
  database: parsedConfig?.database || process.env.DB_NAME || 'ecommerce',
  ssl: getSSLConfig(),
  isProduction,
  isRender
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the PostgreSQL database:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

module.exports = { sequelize, testConnection };
