const mongoose = require('mongoose');

const fileFolderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [255, 'Folder name cannot exceed 255 characters']
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileFolder',
    default: null
  },
  color: {
    type: String,
    default: '#6b7280',
    match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color']
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
      return ret;
    }
  }
});

fileFolderSchema.index({ userId: 1, parentId: 1, isDeleted: 1 });
fileFolderSchema.index({ userId: 1, name: 1 });

fileFolderSchema.statics.getUserFolders = function(userId, parentId = null) {
  const query = { userId, isDeleted: false };
  if (parentId === null) {
    query.parentId = null;
  } else {
    query.parentId = parentId;
  }
  return this.find(query).sort({ name: 1 });
};

fileFolderSchema.statics.getPath = async function(folderId) {
  const path = [];
  let current = folderId;
  
  while (current) {
    const folder = await this.findById(current);
    if (!folder) break;
    path.unshift({ _id: folder._id, name: folder.name });
    current = folder.parentId;
  }
  
  return path;
};

fileFolderSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

fileFolderSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

module.exports = mongoose.model('FileFolder', fileFolderSchema);
