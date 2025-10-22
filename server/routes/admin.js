const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Product, Order, Review } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Apply admin authentication to all routes
router.use(auth, adminAuth);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();
    
    const totalRevenue = await Order.sum('total', {
      where: { payment_status: 'paid' }
    });

    const recentOrders = await Order.findAll({
      order: [['created_at', 'DESC']],
      limit: 10,
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email']
      }]
    });

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyRevenue = await Order.sum('total', {
      where: {
        payment_status: 'paid',
        created_at: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // For now, we'll return empty array for top products
    // This would require a more complex query with JSON operations
    const topProducts = [];

    // Format recent orders to ensure numeric fields are properly converted
    const formattedRecentOrders = recentOrders.map(order => ({
      ...order.toJSON(),
      total: parseFloat(order.total) || 0,
      subtotal: parseFloat(order.subtotal) || 0,
      tax: parseFloat(order.tax) || 0,
      shipping: parseFloat(order.shipping) || 0,
      discount: parseFloat(order.discount) || 0
    }));

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: parseFloat(totalRevenue) || 0,
        monthlyRevenue: parseFloat(monthlyRevenue) || 0
      },
      recentOrders: formattedRecentOrders,
      topProducts
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      filter.role = role;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: users } = await User.findAndCountAll({
      where: filter,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    const total = count;

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin)
router.put('/users/:id/role', [
  body('role').isIn(['user', 'admin']).withMessage('Role must be either user or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;

    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ role });

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow admin to delete themselves
    if (user._id.toString() === req.userId.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    await Order.deleteMany({ user: req.params.id });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/products
// @desc    Get all products for admin
// @access  Private (Admin)
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, isActive, search } = req.query;
    const where = {};
    
    if (category) where.category = category;
    if (isActive !== undefined) where.is_active = isActive === 'true';
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(limit),
      include: [
        {
          model: Review,
          as: 'reviews',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'avatar']
            }
          ]
        }
      ]
    });

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalProducts: count
      }
    });
  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/products/:id/status
// @desc    Update product status
// @access  Private (Admin)
router.put('/products/:id/status', [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive, isFeatured } = req.body;
    const updateData = { is_active: isActive };
    
    if (isFeatured !== undefined) {
      updateData.is_featured = isFeatured;
    }

    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update(updateData);

    res.json({
      message: 'Product status updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders for admin
// @access  Private (Admin)
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus, startDate, endDate } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) filter.created_at[Op.gte] = new Date(startDate);
      if (endDate) filter.created_at[Op.lte] = new Date(endDate);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where: filter,
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(limit),
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'address']
        }
      ]
    });

    const total = count;

    // Format orders to ensure numeric fields are properly converted
    const formattedOrders = orders.map(order => ({
      ...order.toJSON(),
      total: parseFloat(order.total) || 0,
      subtotal: parseFloat(order.subtotal) || 0,
      tax: parseFloat(order.tax) || 0,
      shipping: parseFloat(order.shipping) || 0,
      discount: parseFloat(order.discount) || 0
    }));

    res.json({
      orders: formattedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total
      }
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private (Admin)
router.put('/orders/:id/status', [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).withMessage('Invalid status'),
  body('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']).withMessage('Invalid payment status'),
  body('note').optional().isString().withMessage('Note must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, paymentStatus, note } = req.body;
    const updateData = { status };
    
    if (paymentStatus !== undefined) {
      updateData.payment_status = paymentStatus;
    }
    
    if (note !== undefined) {
      updateData.notes = note;
    }

    const order = await Order.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.update(updateData);

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
