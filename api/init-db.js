const { initializeProductionDatabase } = require('../server/scripts/init-production-db');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Initializing production database...');
    await initializeProductionDatabase();
    
    res.status(200).json({ 
      message: 'Database initialized successfully!',
      users: {
        admin: 'admin@ecommerce.com / admin123',
        user: 'john@example.com / password123'
      }
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    res.status(500).json({ 
      message: 'Database initialization failed',
      error: error.message 
    });
  }
}
