const { sequelize } = require('../models');

const testConnection = async () => {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    const result = await sequelize.query('SELECT NOW() as current_time');
    console.log('✅ Database query successful:', result[0][0].current_time);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();
