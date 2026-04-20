const mongoose = require('mongoose');
const logger = require('../config/logger');

const fileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileFolder',
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
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isFavorite: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.shareToken;
      return ret;
    }
  }
});

fileSchema.index({ userId: 1, isDeleted: 1 });
fileSchema.index({ userId: 1, folderId: 1 });
fileSchema.index({ userId: 1, isFavorite: 1 });

fileSchema.statics.getUserFiles = function(userId, folderId = null, includeDeleted = false) {
  const query = { userId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  if (folderId === null) {
    query.folderId = null;
  } else {
    query.folderId = folderId;
  }
  return this.find(query).sort({ createdAt: -1 });
};

fileSchema.statics.getTrash = function(userId) {
  return this.find({ userId, isDeleted: true }).sort({ deletedAt: -1 });
};

fileSchema.statics.searchFiles = function(userId, searchTerm) {
  return this.find({
    userId,
    isDeleted: false,
    $or: [
      { originalName: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  }).sort({ createdAt: -1 });
};

fileSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

fileSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

fileSchema.methods.generateShareToken = function() {
  const crypto = require('crypto');
  this.shareToken = crypto.randomBytes(32).toString('hex');
  return this.shareToken;
};

module.exports = mongoose.model('File', fileSchema);
