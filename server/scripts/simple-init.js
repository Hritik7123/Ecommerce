const { sequelize, User, Product, Order, Cart, Review } = require('../models');

const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models without force (to avoid dropping existing tables)
    await sequelize.sync({ alter: false });
    console.log('Database synchronized successfully.');
    
    // Create sample data
    await createSampleData();
    
    console.log('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

const createSampleData = async () => {
  try {
    console.log('Creating sample data...');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@ecommerce.com' } });
    if (!existingAdmin) {
      // Create admin user
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@ecommerce.com',
        password: 'admin123',
        role: 'admin',
        is_email_verified: true
      });
      console.log('Admin user created:', adminUser.email);
    } else {
      console.log('Admin user already exists');
    }
    
    // Check if regular user already exists
    const existingUser = await User.findOne({ where: { email: 'john@example.com' } });
    if (!existingUser) {
      // Create regular user
      const regularUser = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user',
        is_email_verified: true
      });
      console.log('Regular user created:', regularUser.email);
    } else {
      console.log('Regular user already exists');
    }
    
    // Create sample products
    const productCount = await Product.count();
    if (productCount === 0) {
      const products = [
        {
          name: 'Wireless Bluetooth Headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          price: 99.99,
          original_price: 129.99,
          category: 'electronics',
          brand: 'TechSound',
          images: [
            { url: '/api/placeholder/400/400', alt: 'Wireless Headphones' }
          ],
          stock: 50,
          sku: 'WS-BT-001',
          tags: ['wireless', 'bluetooth', 'headphones'],
          specifications: {
            weight: '250g',
            color: 'Black',
            warranty: '2 years'
          },
          is_active: true,
          is_featured: true,
          discount: 23
        },
        {
          name: 'Smart Fitness Watch',
          description: 'Advanced fitness tracking with heart rate monitor',
          price: 199.99,
          category: 'electronics',
          brand: 'FitTech',
          images: [
            { url: '/api/placeholder/400/400', alt: 'Smart Watch' }
          ],
          stock: 30,
          sku: 'SF-WT-002',
          tags: ['fitness', 'smartwatch', 'health'],
          specifications: {
            weight: '45g',
            color: 'Silver',
            warranty: '1 year'
          },
          is_active: true,
          is_featured: true,
          discount: 0
        }
      ];
      
      for (const productData of products) {
        const product = await Product.create(productData);
        console.log(`Product created: ${product.name}`);
      }
    } else {
      console.log('Products already exist');
    }
    
    console.log('Sample data created successfully!');
  } catch (error) {
    console.error('Error creating sample data:', error);
    throw error;
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
