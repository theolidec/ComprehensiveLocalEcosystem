const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Item title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  url: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL']
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: null
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NOK', 'SEK', 'DKK']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'must-have'],
    default: 'medium'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    default: 'Birthday'
  },
  imageUrl: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Wishlist item must belong to a user']
  },
  wishlist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wishlist',
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['active', 'purchased', 'archived'],
    default: 'active'
  },
  reservations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WishlistReservation'
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
wishlistItemSchema.index({ user: 1, category: 1 });
wishlistItemSchema.index({ user: 1, status: 1 });
wishlistItemSchema.index({ category: 1, isPublic: 1 });
wishlistItemSchema.index({ user: 1, wishlist: 1 });

// Static method to generate unique share token
wishlistItemSchema.statics.generateShareToken = function() {
  return require('crypto').randomBytes(16).toString('hex');
};

// Static method to get wishlist stats by user
wishlistItemSchema.statics.getStatsByUser = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalValue: { $sum: { $ifNull: ['$price', 0] } },
        byPriority: {
          $push: '$priority'
        }
      }
    }
  ]);

  const result = {
    birthday: { totalItems: 0, totalValue: 0, byPriority: {} },
    christmas: { totalItems: 0, totalValue: 0, byPriority: {} },
    other: { totalItems: 0, totalValue: 0, byPriority: {} }
  };

  stats.forEach(stat => {
    const priorityCount = {};
    stat.byPriority.forEach(p => {
      priorityCount[p] = (priorityCount[p] || 0) + 1;
    });
    result[stat._id] = {
      totalItems: stat.totalItems,
      totalValue: stat.totalValue,
      byPriority: priorityCount
    };
  });

  return result;
};

// Static method to find public wishlist by share token
wishlistItemSchema.statics.findByShareToken = function(token) {
  return this.findOne({ shareToken: token, isPublic: true })
    .populate('reservations', 'reservedBy reservedAt message')
    .select('-user');
};

// Instance method to check if fully reserved
wishlistItemSchema.methods.isFullyReserved = async function() {
  await this.populate('reservations');
  return this.reservations.some(r => r.status === 'purchased');
};

module.exports = mongoose.model('WishlistItem', wishlistItemSchema);
