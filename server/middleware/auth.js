const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Use the same JWT secret as in auth.js
    const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_make_it_long_and_secure_12345';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Cache user data to avoid repeated database queries
    if (!req.user || req.user.id !== decoded.userId) {
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }

      req.userId = user.id;
      req.user = user;
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin authorization middleware
const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { auth, adminAuth };
