const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  total_items: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'carts',
  indexes: [
    {
      fields: ['user_id']
    }
  ],
  hooks: {
    beforeSave: (cart) => {
      if (cart.changed('items')) {
        cart.calculateTotals();
      }
    }
  }
});

// Instance methods
Cart.prototype.addItem = function(productId, quantity = 1, price = 0) {
  console.log('Adding item to cart:', { productId, quantity, price });
  console.log('Cart items before:', this.items);
  
  const existingItem = this.items.find(item => item.product === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
    console.log('Updated existing item quantity to:', existingItem.quantity);
  } else {
    this.items.push({
      product: productId,
      quantity: quantity,
      price: price,
      added_at: new Date()
    });
    console.log('Added new item to cart');
  }
  
  // Tell Sequelize that the items field has changed
  this.changed('items', true);
  
  this.calculateTotals();
  
  console.log('Cart items after:', this.items);
  console.log('Items count:', this.items.length);
};

Cart.prototype.removeItem = function(productId) {
  this.items = this.items.filter(item => item.product !== productId);
  // Tell Sequelize that the items field has changed
  this.changed('items', true);
  this.calculateTotals();
};

Cart.prototype.updateItemQuantity = function(productId, quantity, price = null) {
  const item = this.items.find(item => item.product === productId);
  
  if (item) {
    if (quantity <= 0) {
      this.removeItem(productId);
    } else {
      item.quantity = quantity;
      if (price !== null) {
        item.price = price;
      }
      // Tell Sequelize that the items field has changed
      this.changed('items', true);
    }
  }
  
  this.calculateTotals();
};

Cart.prototype.clearCart = function() {
  this.items = [];
  this.total_items = 0;
  this.total_price = 0;
  // Tell Sequelize that the items field has changed
  this.changed('items', true);
};

Cart.prototype.calculateTotals = function() {
  let totalItems = 0;
  let totalPrice = 0;
  
  // Calculate totals based on stored prices in items
  this.items.forEach(item => {
    totalItems += item.quantity;
    totalPrice += (item.price || 0) * item.quantity;
  });
  
  this.total_items = totalItems;
  this.total_price = totalPrice;
};

module.exports = Cart;