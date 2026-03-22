const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  color: {
    type: String,
    required: [true, 'Category color is required'],
    default: '#3B82F6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  icon: {
    type: String,
    required: [true, 'Category icon is required'],
    default: '📅'
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

categorySchema.index({ user: 1, name: 1 }, { unique: true });

// Create default categories for new users
categorySchema.statics.createDefaultCategories = async function(userId) {
  const defaultCategories = [
    { name: 'Work', color: '#3B82F6', icon: '💼', isDefault: true },
    { name: 'Personal', color: '#10B981', icon: '👤', isDefault: true },
    { name: 'Social', color: '#F59E0B', icon: '🎉', isDefault: true },
    { name: 'Health', color: '#EF4444', icon: '🏥', isDefault: true },
    { name: 'Education', color: '#8B5CF6', icon: '📚', isDefault: true },
    { name: 'Travel', color: '#06B6D4', icon: '✈️', isDefault: true }
  ];

  const categories = defaultCategories.map(cat => ({
    ...cat,
    user: userId
  }));

  return this.insertMany(categories);
};

module.exports = mongoose.model('Category', categorySchema);
