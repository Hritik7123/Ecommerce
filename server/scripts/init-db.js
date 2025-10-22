const { sequelize, User, Product, Order, Cart, Review } = require('../models');

const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models (without force to preserve existing data)
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
    let adminUser = await User.findOne({ where: { email: 'admin@ecommerce.com' } });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@ecommerce.com',
        password: 'admin123',
        role: 'admin',
        is_email_verified: true
      });
      console.log('Admin user created:', adminUser.email);
    } else {
      console.log('Admin user already exists:', adminUser.email);
    }
    
    // Check if regular user already exists
    let regularUser = await User.findOne({ where: { email: 'john@example.com' } });
    if (!regularUser) {
      regularUser = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user',
        is_email_verified: true
      });
      console.log('Regular user created:', regularUser.email);
    } else {
      console.log('Regular user already exists:', regularUser.email);
    }
    
    // Create sample products
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
        rating: {
          average: 4.5,
          count: 128
        },
        reviews: [],
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
        rating: {
          average: 4.2,
          count: 89
        },
        reviews: [],
        is_active: true,
        is_featured: true,
        discount: 0
      },
      {
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable organic cotton t-shirt for everyday wear',
        price: 29.99,
        category: 'clothing',
        brand: 'EcoWear',
        images: [
          { url: '/api/placeholder/400/400', alt: 'Cotton T-Shirt' }
        ],
        stock: 100,
        sku: 'CT-OC-003',
        tags: ['organic', 'cotton', 'sustainable'],
        specifications: {
          material: '100% Organic Cotton',
          color: 'White',
          size: 'M'
        },
        rating: {
          average: 4.0,
          count: 45
        },
        reviews: [],
        is_active: true,
        is_featured: false,
        discount: 0
      },
      {
        name: 'Programming Book: JavaScript Guide',
        description: 'Comprehensive guide to modern JavaScript development',
        price: 49.99,
        category: 'books',
        brand: 'TechBooks',
        images: [
          { url: '/api/placeholder/400/400', alt: 'JavaScript Book' }
        ],
        stock: 25,
        sku: 'PB-JS-004',
        tags: ['programming', 'javascript', 'education'],
        specifications: {
          pages: '450',
          language: 'English',
          format: 'Paperback'
        },
        rating: {
          average: 4.8,
          count: 67
        },
        reviews: [],
        is_active: true,
        is_featured: false,
        discount: 10
      }
    ];
    
    for (const productData of products) {
      // Check if product already exists by name
      let product = await Product.findOne({ where: { name: productData.name } });
      if (!product) {
        product = await Product.create(productData);
        console.log(`Product created: ${product.name}`);
      } else {
        // Update existing product with new rating data
        await product.update({
          rating: productData.rating,
          reviews: productData.reviews
        });
        console.log(`Product updated: ${product.name}`);
      }
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
