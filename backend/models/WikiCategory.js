const mongoose = require('mongoose');
const logger = require('../config/logger');

const wikiCategorySchema = new mongoose.Schema({
  wiki: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wiki',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  color: {
    type: String,
    default: '#6B7280'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

wikiCategorySchema.index({ wiki: 1, slug: 1 }, { unique: true });
wikiCategorySchema.index({ wiki: 1, name: 1 });

wikiCategorySchema.statics.generateSlug = async function(wikiId, name) {
  let slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  let counter = 0;
  let finalSlug = slug;
  
  while (await this.findOne({ wiki: wikiId, slug: finalSlug })) {
    counter++;
    finalSlug = `${slug}-${counter}`;
  }
  
  return finalSlug;
};

module.exports = mongoose.model('WikiCategory', wikiCategorySchema);
