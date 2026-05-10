const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  username: {
    type: String,
    trim: true,
    maxlength: [100, 'Username cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    maxlength: [100, 'Email cannot exceed 100 characters']
  },
  encryptedPassword: {
    type: String,
    required: [true, 'Password is required']
  },
  website: {
    type: String,
    trim: true,
    maxlength: [200, 'Website cannot exceed 200 characters']
  },
  category: {
    type: String,
    enum: ['social', 'finance', 'work', 'shopping', 'entertainment', 'other'],
    default: 'other'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isFavorite: {
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

passwordSchema.index({ userId: 1, createdAt: -1 });
passwordSchema.index({ userId: 1, category: 1 });
passwordSchema.index({ userId: 1, isFavorite: 1 });

module.exports = mongoose.model('Password', passwordSchema);
