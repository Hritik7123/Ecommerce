const { User, Order, Product } = require('../models');
const bcrypt = require('bcryptjs');

const addSampleOrders = async () => {
  try {
    console.log('Adding sample orders with shipping addresses...');

    // Find or create a test user
    let testUser = await User.findOne({ where: { email: 'testuser@example.com' } });
    
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser = await User.create({
        name: 'John Doe',
        email: 'testuser@example.com',
        password: hashedPassword,
        role: 'user',
        phone: '+1-555-0123',
        address: {
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      });
      console.log('Created test user:', testUser.name);
    }

    // Find some products
    const products = await Product.findAll({ limit: 2 });
    
    if (products.length === 0) {
      console.log('No products found. Please add some products first.');
      return;
    }

    // Create sample orders with proper shipping addresses
    const sampleOrders = [
      {
        user_id: testUser.id,
        order_number: `ORD-${Date.now()}-001`,
        items: [
          {
            product: products[0].id,
            name: products[0].name,
            price: products[0].price,
            quantity: 2,
            image: products[0].images?.[0]?.url || ''
          }
        ],
        shipping_address: {
          name: 'John Doe',
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          phone: '+1-555-0123'
        },
        billing_address: {
          name: 'John Doe',
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          phone: '+1-555-0123'
        },
        payment_method: {
          type: 'card',
          details: {
            cardLast4: '4242',
            cardBrand: 'visa'
          }
        },
        payment_status: 'paid',
        status: 'processing',
        subtotal: products[0].price * 2,
        tax: (products[0].price * 2) * 0.08,
        shipping: 10.00,
        discount: 0,
        total: (products[0].price * 2) + ((products[0].price * 2) * 0.08) + 10.00,
        currency: 'USD',
        notes: 'Please deliver during business hours',
        timeline: [
          {
            status: 'pending',
            timestamp: new Date().toISOString(),
            note: 'Order placed'
          },
          {
            status: 'processing',
            timestamp: new Date().toISOString(),
            note: 'Order confirmed and being prepared'
          }
        ]
      },
      {
        user_id: testUser.id,
        order_number: `ORD-${Date.now()}-002`,
        items: [
          {
            product: products[1]?.id || products[0].id,
            name: products[1]?.name || products[0].name,
            price: products[1]?.price || products[0].price,
            quantity: 1,
            image: products[1]?.images?.[0]?.url || products[0].images?.[0]?.url || ''
          }
        ],
        shipping_address: {
          name: 'Jane Smith',
          street: '456 Oak Avenue',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA',
          phone: '+1-555-0456'
        },
        billing_address: {
          name: 'Jane Smith',
          street: '456 Oak Avenue',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA',
          phone: '+1-555-0456'
        },
        payment_method: {
          type: 'paypal',
          details: {
            paypalEmail: 'jane.smith@example.com'
          }
        },
        payment_status: 'paid',
        status: 'shipped',
        subtotal: products[1]?.price || products[0].price,
        tax: ((products[1]?.price || products[0].price) * 0.08),
        shipping: 15.00,
        discount: 5.00,
        total: (products[1]?.price || products[0].price) + ((products[1]?.price || products[0].price) * 0.08) + 15.00 - 5.00,
        currency: 'USD',
        tracking_number: 'TRK123456789',
        notes: 'Fragile item - handle with care',
        timeline: [
          {
            status: 'pending',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            note: 'Order placed'
          },
          {
            status: 'processing',
            timestamp: new Date(Date.now() - 43200000).toISOString(),
            note: 'Order confirmed'
          },
          {
            status: 'shipped',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            note: 'Package shipped with tracking number TRK123456789'
          }
        ]
      }
    ];

    // Create the orders
    for (const orderData of sampleOrders) {
      const order = await Order.create(orderData);
      console.log(`Created order: ${order.order_number} for ${order.shipping_address.name}`);
    }

    console.log('Sample orders created successfully!');
    console.log('You can now view customer profiles and addresses in the admin panel.');

  } catch (error) {
    console.error('Error creating sample orders:', error);
  }
};

// Run the script
addSampleOrders()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
