const mongoose = require('mongoose');

const passwordCategorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [30, 'Category name cannot exceed 30 characters']
  },
  icon: {
    type: String,
    default: '📁'
  },
  color: {
    type: String,
    default: '#6B7280'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

passwordCategorySchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('PasswordCategory', passwordCategorySchema);
