const mongoose = require('mongoose');
const logger = require('../config/logger');

const wikiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Wiki name is required'],
    trim: true,
    maxlength: [100, 'Wiki name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Wiki slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visibility: {
    type: String,
    enum: ['private', 'team', 'public'],
    default: 'private'
  },
  icon: {
    type: String,
    default: 'book'
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  allowPublicRead: {
    type: Boolean,
    default: false
  },
  allowPublicEdit: {
    type: Boolean,
    default: false
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

wikiSchema.index({ owner: 1 });
wikiSchema.index({ visibility: 1 });
wikiSchema.index({ allowPublicRead: 1 });

wikiSchema.statics.generateSlug = async function(name) {
  let slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  let counter = 0;
  let finalSlug = slug;
  
  while (await this.findOne({ slug: finalSlug })) {
    counter++;
    finalSlug = `${slug}-${counter}`;
  }
  
  return finalSlug;
};

wikiSchema.methods.canView = async function(user) {
  if (!user) {
    return this.visibility === 'public' || this.allowPublicRead;
  }
  
  const ownerId = this.owner._id ? this.owner._id.toString() : this.owner.toString();
  if (ownerId === user._id.toString()) return true;
  if (this.visibility === 'public' || this.allowPublicRead) return true;
  
  const WikiPermission = mongoose.model('WikiPermission');
  const permission = await WikiPermission.findOne({ wiki: this._id, user: user._id });
  return !!permission;
};

wikiSchema.methods.canEdit = async function(user) {
  logger.info('canEdit called:', { 
    wikiId: this._id, 
    userId: user?._id, 
    owner: this.owner,
    ownerId: this.owner._id ? this.owner._id.toString() : this.owner.toString(),
    userIdStr: user?._id?.toString(),
    allowPublicEdit: this.allowPublicEdit 
  });
  
  if (!user) {
    return this.allowPublicEdit;
  }
  
  const ownerId = this.owner._id ? this.owner._id.toString() : this.owner.toString();
  const userIdStr = user._id.toString();
  logger.info('canEdit comparison:', { ownerId, userIdStr, match: ownerId === userIdStr });
  
  if (ownerId === userIdStr) return true;
  if (this.allowPublicEdit) return true;
  
  const WikiPermission = mongoose.model('WikiPermission');
  const permission = await WikiPermission.findOne({ wiki: this._id, user: user._id });
  logger.info('canEdit permission check:', { permission: permission?.role });
  return permission && (permission.role === 'editor' || permission.role === 'admin');
};

module.exports = mongoose.model('Wiki', wikiSchema);
