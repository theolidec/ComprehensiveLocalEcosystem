const mongoose = require('mongoose');
const logger = require('../config/logger');

const wikiPermissionSchema = new mongoose.Schema({
  wiki: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wiki',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['viewer', 'editor', 'admin'],
    default: 'viewer'
  },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret.__v;
      return ret;
    }
  }
});

wikiPermissionSchema.index({ wiki: 1, user: 1 }, { unique: true });
wikiPermissionSchema.index({ user: 1 });

wikiPermissionSchema.statics.getUserRole = async function(wikiId, userId) {
  if (!userId) return null;
  
  const permission = await this.findOne({ wiki: wikiId, user: userId });
  return permission?.role || null;
};

wikiPermissionSchema.statics.isAdmin = async function(wikiId, userId) {
  const role = await this.getUserRole(wikiId, userId);
  return role === 'admin';
};

wikiPermissionSchema.statics.canEdit = async function(wikiId, userId) {
  const role = await this.getUserRole(wikiId, userId);
  return role === 'admin' || role === 'editor';
};

wikiPermissionSchema.statics.getWikiMembers = async function(wikiId) {
  return this.find({ wiki: wikiId })
    .populate('user', 'name email')
    .populate('grantedBy', 'name email')
    .sort({ role: -1, createdAt: 1 });
};

module.exports = mongoose.model('WikiPermission', wikiPermissionSchema);
