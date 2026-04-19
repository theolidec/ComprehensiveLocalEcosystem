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

wikiSchema.index({ slug: 1 });
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

wikiSchema.methods.canView = function(user) {
  if (!user) {
    return this.visibility === 'public' || this.allowPublicRead;
  }
  if (this.owner.toString() === user._id.toString()) return true;
  if (this.visibility === 'public' || this.allowPublicRead) return true;
  return false;
};

wikiSchema.methods.canEdit = function(user) {
  if (!user) {
    return this.allowPublicEdit;
  }
  if (this.owner.toString() === user._id.toString()) return true;
  if (this.allowPublicEdit) return true;
  return false;
};

module.exports = mongoose.model('Wiki', wikiSchema);
