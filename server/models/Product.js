const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100],
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000],
      notEmpty: true
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  category: {
    type: DataTypes.ENUM('electronics', 'clothing', 'books', 'home', 'sports', 'beauty', 'toys', 'other'),
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  images: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  specifications: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  rating_average: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  rating_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  discount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  shipping_info: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'products',
  indexes: [
    {
      fields: ['category', 'price']
    },
    {
      fields: ['is_active', 'is_featured']
    }
  ]
});

module.exports = Product;