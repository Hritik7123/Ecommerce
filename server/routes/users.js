const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Order } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone number must be less than 20 characters'),
  body('address.street').optional().trim().isLength({ max: 100 }).withMessage('Street address must be less than 100 characters'),
  body('address.city').optional().trim().isLength({ max: 50 }).withMessage('City must be less than 50 characters'),
  body('address.state').optional().trim().isLength({ max: 50 }).withMessage('State must be less than 50 characters'),
  body('address.zipCode').optional().trim().isLength({ max: 10 }).withMessage('Zip code must be less than 10 characters'),
  body('address.country').optional().trim().isLength({ max: 50 }).withMessage('Country must be less than 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update(req.body);

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/orders
// @desc    Get user's order history
// @access  Private
router.get('/orders', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { user_id: req.userId };
    
    if (status) {
      filter.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where: filter,
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(limit)
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
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const totalOrders = await Order.count({ where: { user_id: req.userId } });
    const totalSpent = await Order.sum('total', {
      where: { user_id: req.userId, payment_status: 'paid' }
    });

    const recentOrders = await Order.findAll({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.json({
      totalOrders,
      totalSpent: totalSpent || 0,
      recentOrders
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Delete user and related data
    await user.destroy();
    await Order.destroy({ where: { user_id: req.userId } });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
