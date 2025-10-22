const express = require('express');
const { body, validationResult } = require('express-validator');
const { Order, Cart, Product, User, sequelize } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, [
  body('shippingAddress.name').trim().notEmpty().withMessage('Shipping name is required'),
  body('shippingAddress.street').trim().notEmpty().withMessage('Shipping street is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('Shipping city is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('Shipping state is required'),
  body('shippingAddress.zipCode').trim().notEmpty().withMessage('Shipping zip code is required'),
  body('shippingAddress.country').trim().notEmpty().withMessage('Shipping country is required'),
  body('paymentMethod.type').isIn(['card', 'paypal', 'bank_transfer', 'cash_on_delivery']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ where: { user_id: req.userId } });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Get product details for cart items
    const productIds = cart.items.map(item => item.product);
    const products = await Product.findAll({
      where: { id: productIds }
    });

    // Validate products and calculate totals
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = products.find(p => p.id === cartItem.product);
      
      if (!product || !product.is_active) {
        return res.status(400).json({ 
          message: `Product ${product?.name || 'Unknown'} is no longer available` 
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({ 
          message: `Only ${product.stock} items available for ${product.name}` 
        });
      }

      const itemTotal = parseFloat(product.price) * cartItem.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: cartItem.quantity,
        image: product.images[0]?.url || ''
      });
    }

    // Calculate shipping (free shipping over $50)
    const shipping = subtotal >= 50 ? 0 : 10;
    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
    const total = subtotal + shipping + tax;

    // Generate order number
    const orderCount = await Order.count();
    const orderNumber = `ORD-${Date.now()}-${String(orderCount + 1).padStart(4, '0')}`;

    // Create order
    const order = await Order.create({
      user_id: req.userId,
      order_number: orderNumber,
      items: orderItems,
      shipping_address: shippingAddress,
      billing_address: billingAddress || shippingAddress,
      payment_method: paymentMethod,
      subtotal,
      shipping,
      tax,
      discount: 0, // No discount for now
      total,
      notes,
      currency: 'USD'
    });

    // Update product stock
    for (const cartItem of cart.items) {
      const product = products.find(p => p.id === cartItem.product);
      if (product) {
        await product.update({
          stock: product.stock - cartItem.quantity
        });
      }
    }

    // Clear cart
    await Cart.update(
      { items: [], total_items: 0, total_price: 0 },
      { where: { user_id: req.userId } }
    );

    // Format order response to match frontend expectations
    const formattedOrder = {
      id: order.id,
      user: order.user_id,
      orderNumber: order.order_number,
      items: order.items,
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      status: order.status,
      subtotal: parseFloat(order.subtotal),
      tax: parseFloat(order.tax),
      shipping: parseFloat(order.shipping),
      discount: parseFloat(order.discount),
      total: parseFloat(order.total),
      currency: order.currency,
      trackingNumber: order.tracking_number,
      notes: order.notes,
      timeline: order.timeline || [],
      createdAt: order.created_at,
      updatedAt: order.updated_at
    };

    res.status(201).json({
      message: 'Order created successfully',
      order: formattedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders with enhanced history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const whereClause = { user_id: req.userId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (paymentStatus) {
      whereClause.payment_status = paymentStatus;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit: parseInt(limit)
    });

    // Format orders with enhanced information
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      total: parseFloat(order.total),
      currency: order.currency,
      itemCount: order.items.length,
      trackingNumber: order.tracking_number,
      timeline: order.timeline || [],
      canCancel: order.canBeCancelled(),
      canReturn: order.canBeReturned(),
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }));

    res.json({
      orders: formattedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalOrders: count,
        hasNext: parseInt(page) < Math.ceil(count / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order with full details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      where: { 
        id: req.params.id, 
        user_id: req.userId 
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Format order with full details
    const formattedOrder = {
      id: order.id,
      orderNumber: order.order_number,
      items: order.items,
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address,
      paymentMethod: order.payment_method,
      status: order.status,
      paymentStatus: order.payment_status,
      subtotal: parseFloat(order.subtotal),
      tax: parseFloat(order.tax),
      shipping: parseFloat(order.shipping),
      discount: parseFloat(order.discount),
      total: parseFloat(order.total),
      currency: order.currency,
      trackingNumber: order.tracking_number,
      notes: order.notes,
      timeline: order.timeline || [],
      canCancel: order.canBeCancelled(),
      canReturn: order.canBeReturned(),
      createdAt: order.created_at,
      updatedAt: order.updated_at
    };

    res.json({ order: formattedOrder });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id/timeline
// @desc    Get order status timeline
// @access  Private
router.get('/:id/timeline', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      where: { 
        id: req.params.id, 
        user_id: req.userId 
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const timeline = order.getStatusHistory();
    const currentStatus = order.getCurrentStatus();

    res.json({
      orderId: order.id,
      orderNumber: order.order_number,
      currentStatus,
      timeline,
      canCancel: order.canBeCancelled(),
      canReturn: order.canBeReturned()
    });
  } catch (error) {
    console.error('Get order timeline error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/history/summary
// @desc    Get order history summary
// @access  Private
router.get('/history/summary', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get order statistics
    const totalOrders = await Order.count({ where: { user_id: userId } });
    const pendingOrders = await Order.count({ where: { user_id: userId, status: 'pending' } });
    const processingOrders = await Order.count({ where: { user_id: userId, status: 'processing' } });
    const shippedOrders = await Order.count({ where: { user_id: userId, status: 'shipped' } });
    const deliveredOrders = await Order.count({ where: { user_id: userId, status: 'delivered' } });
    const cancelledOrders = await Order.count({ where: { user_id: userId, status: 'cancelled' } });

    // Get recent orders (last 5)
    const recentOrders = await Order.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'order_number', 'status', 'total', 'created_at']
    });

    // Get total spent
    const totalSpentResult = await Order.findOne({
      where: { 
        user_id: userId,
        payment_status: 'paid'
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'totalSpent']
      ],
      raw: true
    });

    const totalSpent = parseFloat(totalSpentResult?.totalSpent || 0);

    res.json({
      summary: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalSpent
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        total: parseFloat(order.total),
        createdAt: order.created_at
      }))
    });
  } catch (error) {
    console.error('Get order history summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/track/:orderNumber
// @desc    Track order by order number (public)
// @access  Public
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await Order.findOne({ 
      where: { order_number: orderNumber }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const timeline = order.getStatusHistory();
    const currentStatus = order.getCurrentStatus();

    res.json({
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      trackingNumber: order.tracking_number,
      currentStatus,
      timeline,
      estimatedDelivery: order.status === 'shipped' ? 
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null, // 3 days from now
      createdAt: order.created_at,
      updatedAt: order.updated_at
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findOne({ 
      where: { 
        id: req.params.id, 
        user_id: req.userId 
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.canBeCancelled()) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled in current status' 
      });
    }

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findByPk(item.product);
      if (product) {
        await product.update({
          stock: product.stock + item.quantity
        });
      }
    }

    const cancelReason = reason || 'Order cancelled by customer';
    order.updateStatus('cancelled', cancelReason, 'customer');
    await order.save();

    res.json({
      message: 'Order cancelled successfully',
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        timeline: order.timeline
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/return
// @desc    Request order return
// @access  Private
router.put('/:id/return', auth, [
  body('reason').trim().notEmpty().withMessage('Return reason is required'),
  body('items').isArray().withMessage('Items to return must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason, items } = req.body;
    
    const order = await Order.findOne({ 
      where: { 
        id: req.params.id, 
        user_id: req.userId 
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.canBeReturned()) {
      return res.status(400).json({ 
        message: 'Order cannot be returned in current status' 
      });
    }

    order.updateStatus('returned', `Return requested: ${reason}`, 'customer');
    await order.save();

    res.json({
      message: 'Return request submitted successfully',
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        timeline: order.timeline
      }
    });
  } catch (error) {
    console.error('Return order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin)
// @access  Private (Admin)
router.get('/admin/all', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus } = req.query;
    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (paymentStatus) whereClause.payment_status = paymentStatus;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(limit),
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalOrders: count
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin)
// @access  Private (Admin)
router.put('/:id/status', auth, adminAuth, [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).withMessage('Invalid status'),
  body('note').optional().trim().isLength({ max: 200 }).withMessage('Note must be less than 200 characters'),
  body('trackingNumber').optional().trim().isLength({ max: 100 }).withMessage('Tracking number must be less than 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, note, trackingNumber } = req.body;

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update tracking number if provided
    if (trackingNumber) {
      order.tracking_number = trackingNumber;
    }

    order.updateStatus(status, note, 'admin');
    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        trackingNumber: order.tracking_number,
        timeline: order.timeline
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
