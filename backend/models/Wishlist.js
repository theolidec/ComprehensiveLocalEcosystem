const mongoose = require('mongoose');

const WISHLIST_TEMPLATES = {
  birthday: {
    name: 'Birthday',
    color: '#8b5cf6',
    icon: 'gift',
    categories: ['Gifts', 'Experience', 'Decorations', 'Food']
  },
  christmas: {
    name: 'Christmas',
    color: '#10b981',
    icon: 'gift',
    categories: ['Gifts', 'Decorations', 'Food', 'Traditions']
  },
  wedding: {
    name: 'Wedding',
    color: '#ec4899',
    icon: 'heart',
    categories: ['Registry', 'Honeymoon', 'Decorations', 'Guest List']
  },
  baby_shower: {
    name: 'Baby Shower',
    color: '#f59e0b',
    icon: 'baby',
    categories: ['Gifts', 'Decorations', 'Food', 'Games']
  },
  housewarming: {
    name: 'Housewarming',
    color: '#3b82f6',
    icon: 'home',
    categories: ['Appliances', 'Decor', 'Furniture', 'Essentials']
  }
};

const wishlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Wishlist name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Wishlist must belong to a user']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  template: {
    type: String,
    enum: ['birthday', 'christmas', 'wedding', 'baby_shower', 'housewarming', null],
    default: null
  },
  coverImage: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#8b5cf6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
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

wishlistSchema.index({ user: 1, name: 1 }, { unique: true });
wishlistSchema.index({ user: 1, isDefault: 1 });

wishlistSchema.statics.createDefaultWishlist = async function(userId) {
  try {
    const existing = await this.findOne({ user: userId, isDefault: true });
    if (existing) return existing;
    
    return await this.create({
      name: 'My Wishes',
      description: 'My default wishlist',
      user: userId,
      isDefault: true,
      color: '#8b5cf6'
    });
  } catch (error) {
    if (error.code === 11000) {
      return await this.findOne({ user: userId, isDefault: true });
    }
    throw error;
  }
};

wishlistSchema.statics.createFromTemplate = async function(userId, templateType, customName) {
  const template = WISHLIST_TEMPLATES[templateType];
  if (!template) {
    throw new Error('Invalid template type');
  }
  
  return await this.create({
    name: customName || template.name,
    description: `${template.name} wishlist`,
    user: userId,
    template: templateType,
    color: template.color,
    isDefault: false
  });
};

wishlistSchema.statics.getTemplates = function() {
  return Object.entries(WISHLIST_TEMPLATES).map(([key, value]) => ({
    id: key,
    ...value
  }));
};

module.exports = mongoose.model('Wishlist', wishlistSchema);
