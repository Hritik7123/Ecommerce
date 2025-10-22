const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  shipping_address: {
    type: DataTypes.JSON,
    allowNull: false
  },
  billing_address: {
    type: DataTypes.JSON,
    allowNull: true
  },
  payment_method: {
    type: DataTypes.JSON,
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  payment_intent_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'),
    allowNull: false,
    defaultValue: 'pending'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  shipping: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timeline: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  }
}, {
  tableName: 'orders',
  indexes: [
    {
      fields: ['user_id', 'created_at']
    },
    {
      fields: ['order_number']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_status']
    }
  ],
  hooks: {
    beforeCreate: async (order) => {
      if (!order.order_number) {
        const count = await Order.count();
        order.order_number = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
      }
    }
  }
});

// Instance methods
Order.prototype.addTimelineEntry = function(status, note = '', actor = 'system') {
  const timelineEntry = {
    status,
    note,
    actor,
    timestamp: new Date(),
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
  };
  
  if (!this.timeline) {
    this.timeline = [];
  }
  
  this.timeline.push(timelineEntry);
  return timelineEntry;
};

Order.prototype.updateStatus = function(newStatus, note = '', actor = 'system') {
  const oldStatus = this.status;
  this.status = newStatus;
  this.addTimelineEntry(newStatus, note, actor);
  
  // Add automatic status change note if no note provided
  if (!note) {
    const statusMessages = {
      'pending': 'Order received and is being processed',
      'processing': 'Order is being prepared for shipment',
      'shipped': 'Order has been shipped',
      'delivered': 'Order has been delivered',
      'cancelled': 'Order has been cancelled',
      'returned': 'Order has been returned'
    };
    note = statusMessages[newStatus] || `Status changed from ${oldStatus} to ${newStatus}`;
  }
};

Order.prototype.getStatusHistory = function() {
  return this.timeline || [];
};

Order.prototype.getCurrentStatus = function() {
  return {
    status: this.status,
    paymentStatus: this.payment_status,
    trackingNumber: this.tracking_number,
    lastUpdate: this.timeline && this.timeline.length > 0 
      ? this.timeline[this.timeline.length - 1].timestamp 
      : this.updated_at
  };
};

Order.prototype.canBeCancelled = function() {
  return ['pending', 'processing'].includes(this.status);
};

Order.prototype.canBeReturned = function() {
  return this.status === 'delivered' && this.payment_status === 'paid';
};

module.exports = Order;