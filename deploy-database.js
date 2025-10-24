#!/usr/bin/env node

/**
 * Production Database Initialization Script
 * 
 * This script initializes your production database with sample data.
 * Run this after setting up your production database and environment variables.
 * 
 * Usage:
 * 1. Set up production database (Neon, Supabase, or Railway)
 * 2. Add environment variables to Vercel
 * 3. Run: node deploy-database.js
 */

const { initializeProductionDatabase } = require('./server/scripts/init-production-db');

console.log('🚀 Starting production database initialization...');
console.log('📋 Make sure you have:');
console.log('   1. Set up production database (Neon/Supabase/Railway)');
console.log('   2. Added environment variables to Vercel');
console.log('   3. Deployed your application to Vercel');
console.log('');

// Check if we're in production environment
if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  Warning: This script is designed for production use.');
  console.log('   Make sure your environment variables are set correctly.');
  console.log('');
}

// Initialize the database
initializeProductionDatabase()
  .then(() => {
    console.log('');
    console.log('✅ Production database initialization completed!');
    console.log('🎉 Your e-commerce application is now ready!');
    console.log('');
    console.log('📝 Test credentials:');
    console.log('   Admin: admin@ecommerce.com / admin123');
    console.log('   User:  john@example.com / password123');
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Database initialization failed:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Check your database connection string');
    console.error('   2. Verify environment variables are set');
    console.error('   3. Ensure database is accessible from Vercel');
    process.exit(1);
  });
