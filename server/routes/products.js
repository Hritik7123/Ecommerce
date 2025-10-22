const express = require('express');
const { body, validationResult, query } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Product, Review } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
    }
  }
});

// @route   POST /api/products/upload
// @desc    Upload product image
// @access  Private (Admin)
router.post('/upload', auth, adminAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

// @route   GET /api/products
// @desc    Get all products with filtering, sorting, and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['electronics', 'clothing', 'books', 'home', 'sports', 'beauty', 'toys', 'other']),
  query('sort').optional().isIn(['name', 'price', 'rating', 'createdAt', '-name', '-price', '-rating', '-createdAt']),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 12,
      category,
      sort = '-createdAt',
      minPrice,
      maxPrice,
      search,
      featured
    } = req.query;

    // Build filter object
    const whereClause = { is_active: true };
    
    if (category) whereClause.category = category;
    if (featured === 'true') whereClause.is_featured = true;
    
    // Price range filter
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Build sort object
    const orderClause = [];
    if (sort.startsWith('-')) {
      orderClause.push([sort.substring(1), 'DESC']);
    } else {
      orderClause.push([sort, 'ASC']);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      order: orderClause,
      offset,
      limit: parseInt(limit),
      include: [{
        model: Review,
        as: 'reviews',
        include: [{
          model: require('../models').User,
          as: 'user',
          attributes: ['name', 'avatar']
        }]
      }]
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts: count,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Review,
        as: 'reviews',
        include: [{
          model: require('../models').User,
          as: 'user',
          attributes: ['name', 'avatar']
        }]
      }]
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin)
router.post('/', auth, adminAuth, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
  body('description').trim().isLength({ min: 1, max: 1000 }).withMessage('Description is required and must be less than 1000 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isIn(['electronics', 'clothing', 'books', 'home', 'sports', 'beauty', 'toys', 'other']).withMessage('Invalid category'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Clean up the data before creating
    const productData = { ...req.body };
    
    // Handle empty strings for numeric fields
    if (productData.original_price === '' || productData.original_price === null) {
      productData.original_price = null;
    } else if (productData.original_price !== undefined) {
      productData.original_price = parseFloat(productData.original_price);
    }
    
    if (productData.price !== undefined) {
      productData.price = parseFloat(productData.price);
    }
    
    if (productData.discount !== undefined) {
      productData.discount = parseFloat(productData.discount);
    }
    
    if (productData.stock !== undefined) {
      productData.stock = parseInt(productData.stock);
    }

    // Handle tags array
    if (productData.tags && typeof productData.tags === 'string') {
      productData.tags = productData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    const product = await Product.create(productData);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Clean up the data before updating
    const updateData = { ...req.body };
    
    // Handle empty strings for numeric fields
    if (updateData.original_price === '' || updateData.original_price === null) {
      updateData.original_price = null;
    } else if (updateData.original_price !== undefined) {
      updateData.original_price = parseFloat(updateData.original_price);
    }
    
    if (updateData.price !== undefined) {
      updateData.price = parseFloat(updateData.price);
    }
    
    if (updateData.discount !== undefined) {
      updateData.discount = parseFloat(updateData.discount);
    }
    
    if (updateData.stock !== undefined) {
      updateData.stock = parseInt(updateData.stock);
    }

    // Handle tags array
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    await product.update(updateData);

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.destroy();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Add product review
// @access  Private
router.post('/:id/reviews', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, comment } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      where: {
        product_id: req.params.id,
        user_id: req.userId
      }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Add review
    const review = await Review.create({
      product_id: req.params.id,
      user_id: req.userId,
      rating,
      comment
    });

    // Update product rating average
    const reviews = await Review.findAll({
      where: { product_id: req.params.id }
    });
    
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    await product.update({
      rating_average: averageRating,
      rating_count: reviews.length
    });

    res.status(201).json({
      message: 'Review added successfully',
      product
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/categories/list
// @desc    Get all categories
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.findAll({
      attributes: ['category'],
      where: { is_active: true },
      group: ['category'],
      raw: true
    });
    
    const categoryList = categories.map(item => item.category);
    res.json({ categories: categoryList });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
