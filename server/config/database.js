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
    parsedConfig = {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
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
  } catch (error) {
    console.error('⚠️ Failed to parse DATABASE_URL:', error.message);
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
    // Fallback to URL string with SSL forced
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
