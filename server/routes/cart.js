const express = require('express');
const { body, validationResult } = require('express-validator');
const { Cart, Product } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ 
      where: { user_id: req.userId }
    });

    if (!cart) {
      cart = await Cart.create({ 
        user_id: req.userId, 
        items: [],
        total_items: 0,
        total_price: 0
      });
    }
    
    console.log('Cart retrieved:', {
      userId: req.userId,
      itemsCount: cart.items.length,
      items: cart.items.map(item => ({ product: item.product, quantity: item.quantity }))
    });

    // Get product details for cart items
    const productIds = cart.items.map(item => item.product);
    const products = await Product.findAll({
      where: { 
        id: productIds,
        is_active: true 
      }
    });

    // Don't filter out products aggressively - just show what's in the cart
    // The frontend will handle displaying appropriate messages for missing products

    // Transform items for response (don't modify the actual cart)
    const transformedItems = cart.items.map(item => {
      const product = products.find(p => p.id === item.product);
      return {
        product: product || { 
          id: item.product, 
          name: 'Product not found', 
          price: item.price || 0,
          images: [{ url: '/api/placeholder/100/100', alt: 'Product not found' }],
          stock: 0,
          is_active: false
        },
        quantity: item.quantity,
        addedAt: item.added_at || new Date().toISOString()
      };
    });

    // Transform cart data to match frontend expectations (camelCase)
    const transformedCart = {
      ...cart.toJSON(),
      items: transformedItems,
      totalItems: cart.total_items,
      totalPrice: cart.total_price
    };
    delete transformedCart.total_items;
    delete transformedCart.total_price;

    res.json({ cart: transformedCart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post('/add', auth, [
  body('productId').isUUID().withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity } = req.body;

    // Check if product exists and is active
    const product = await Product.findByPk(productId);
    if (!product || !product.is_active) {
      return res.status(404).json({ message: 'Product not found or not available' });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock} items available in stock` 
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ where: { user_id: req.userId } });
    if (!cart) {
      cart = await Cart.create({ 
        user_id: req.userId, 
        items: [],
        total_items: 0,
        total_price: 0
      });
    }

    // Add item to cart
    cart.addItem(productId, quantity, product.price);
    await cart.save();

    // Reload cart from database to ensure we have the latest data
    cart = await Cart.findOne({ where: { user_id: req.userId } });
    
    console.log('Cart after adding item:', {
      userId: req.userId,
      itemsCount: cart.items.length,
      items: cart.items.map(item => ({ product: item.product, quantity: item.quantity }))
    });

    // Get updated cart with product details
    const productIds = cart.items.map(item => item.product);
    const products = await Product.findAll({
      where: { id: productIds }
    });

    // Transform items for response (don't modify the actual cart)
    const transformedItems = cart.items.map(item => {
      const product = products.find(p => p.id === item.product);
      return {
        product: product,
        quantity: item.quantity,
        addedAt: item.added_at || new Date().toISOString()
      };
    });

    // Transform cart data to match frontend expectations (camelCase)
    const transformedCart = {
      ...cart.toJSON(),
      items: transformedItems,
      totalItems: cart.total_items,
      totalPrice: cart.total_price
    };
    delete transformedCart.total_items;
    delete transformedCart.total_price;

    res.json({
      message: 'Item added to cart successfully',
      cart: transformedCart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/cart/update
// @desc    Update item quantity in cart
// @access  Private
router.put('/update', auth, [
  body('productId').isUUID().withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 0, max: 99 }).withMessage('Quantity must be between 0 and 99')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ where: { user_id: req.userId } });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Check if product exists in cart
    const cartItem = cart.items.find(item => item.product === productId);
    if (!cartItem) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      cart.removeItem(productId);
    } else {
      // Check stock availability
      const product = await Product.findByPk(productId);
      if (!product || product.stock < quantity) {
        return res.status(400).json({ 
          message: `Only ${product.stock} items available in stock` 
        });
      }
      cart.updateItemQuantity(productId, quantity, product.price);
    }

    await cart.save();

    // Get updated cart with product details
    const productIds = cart.items.map(item => item.product);
    const products = await Product.findAll({
      where: { id: productIds }
    });

    // Transform items for response (don't modify the actual cart)
    const transformedItems = cart.items.map(item => {
      const product = products.find(p => p.id === item.product);
      return {
        product: product,
        quantity: item.quantity,
        addedAt: item.added_at || new Date().toISOString()
      };
    });

    // Transform cart data to match frontend expectations (camelCase)
    const transformedCart = {
      ...cart.toJSON(),
      items: transformedItems,
      totalItems: cart.total_items,
      totalPrice: cart.total_price
    };
    delete transformedCart.total_items;
    delete transformedCart.total_price;

    res.json({
      message: 'Cart updated successfully',
      cart: transformedCart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/cart/remove
// @desc    Remove item from cart
// @access  Private
router.delete('/remove', auth, [
  body('productId').isUUID().withMessage('Valid product ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId } = req.body;

    const cart = await Cart.findOne({ where: { user_id: req.userId } });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.removeItem(productId);
    await cart.save();

    // Get updated cart with product details
    const productIds = cart.items.map(item => item.product);
    const products = await Product.findAll({
      where: { id: productIds }
    });

    // Transform items for response (don't modify the actual cart)
    const transformedItems = cart.items.map(item => {
      const product = products.find(p => p.id === item.product);
      return {
        product: product,
        quantity: item.quantity,
        addedAt: item.added_at || new Date().toISOString()
      };
    });

    // Transform cart data to match frontend expectations (camelCase)
    const transformedCart = {
      ...cart.toJSON(),
      items: transformedItems,
      totalItems: cart.total_items,
      totalPrice: cart.total_price
    };
    delete transformedCart.total_items;
    delete transformedCart.total_price;

    res.json({
      message: 'Item removed from cart successfully',
      cart: transformedCart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete('/clear', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { user_id: req.userId } });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.clearCart();
    await cart.save();

    // Transform cart data to match frontend expectations (camelCase)
    const transformedCart = {
      ...cart.toJSON(),
      items: [], // Empty items array after clearing
      totalItems: cart.total_items,
      totalPrice: cart.total_price
    };
    delete transformedCart.total_items;
    delete transformedCart.total_price;

    res.json({
      message: 'Cart cleared successfully',
      cart: transformedCart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cart/count
// @desc    Get cart item count
// @access  Private
router.get('/count', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { user_id: req.userId } });
    const count = cart ? cart.total_items : 0;

    res.json({ count });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
