const mongoose = require('mongoose');

const wishlistCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  color: {
    type: String,
    required: [true, 'Category color is required'],
    default: '#8b5cf6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  icon: {
    type: String,
    default: 'gift'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Category must belong to a user']
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Compound index to ensure unique category names per user
wishlistCategorySchema.index({ user: 1, name: 1 }, { unique: true });

// Create default categories for new users
wishlistCategorySchema.statics.createDefaultCategories = async function(userId) {
  const defaultCategories = [
    { name: 'Birthday', color: '#8b5cf6', icon: 'gift', isDefault: true },
    { name: 'Christmas', color: '#10b981', icon: 'gift', isDefault: true }
  ];

  const categories = defaultCategories.map(cat => ({
    ...cat,
    user: userId
  }));

  try {
    return await this.insertMany(categories, { ordered: false });
  } catch (error) {
    // Ignore duplicate key errors (categories may already exist)
    if (error.code === 11000) {
      return [];
    }
    throw error;
  }
};

module.exports = mongoose.model('WishlistCategory', wishlistCategorySchema);
