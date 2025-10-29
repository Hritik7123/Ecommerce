const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determine if we're in production (Render/Railway/etc)
const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.RENDER || process.env.DB_HOST?.includes('render.com') || process.env.DATABASE_URL?.includes('render.com');

// SSL configuration for production databases
const sslConfig = (isProduction || isRender) ? {
  require: true,
  rejectUnauthorized: false
} : false;

// Build Sequelize configuration
let sequelize;

// Priority 1: DATABASE_URL (Render, Railway, etc. often provide this)
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: sslConfig
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });
}
// Priority 2: DATABASE_PUBLIC_URL (Railway-specific)
else if (process.env.DATABASE_PUBLIC_URL) {
  sequelize = new Sequelize(process.env.DATABASE_PUBLIC_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: sslConfig
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
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
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ecommerce',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: sslConfig
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });
}

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the PostgreSQL database:', error);
  }
};

module.exports = { sequelize, testConnection };
