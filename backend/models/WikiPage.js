const mongoose = require('mongoose');
const logger = require('../config/logger');

const wikiPageSchema = new mongoose.Schema({
  wiki: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wiki',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Page title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Page slug is required'],
    lowercase: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  excerpt: {
    type: String,
    maxlength: 500,
    default: ''
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WikiPage',
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  isHomePage: {
    type: Boolean,
    default: false
  },
  redirectTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WikiPage',
    default: null
  },
  isRedirect: {
    type: Boolean,
    default: false
  },
  infobox: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WikiCategory'
  }],
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastEditedAt: {
    type: Date,
    default: Date.now
  },
  viewCount: {
    type: Number,
    default: 0
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

wikiPageSchema.index({ wiki: 1, slug: 1 }, { unique: true });
wikiPageSchema.index({ wiki: 1, parent: 1 });
wikiPageSchema.index({ title: 'text', content: 'text' });
wikiPageSchema.index({ tags: 1 });
wikiPageSchema.index({ categories: 1 });
wikiPageSchema.index({ lastEditedAt: -1 });

wikiPageSchema.statics.generateSlug = async function(wikiId, title) {
  let slug = title.toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F]+/g, '-')
    .replace(/^-|-$/g, '');
  
  if (!slug) slug = 'untitled';
  
  let counter = 0;
  let finalSlug = slug;
  
  while (await this.findOne({ wiki: wikiId, slug: finalSlug })) {
    counter++;
    finalSlug = `${slug}-${counter}`;
  }
  
  return finalSlug;
};

wikiPageSchema.statics.getPageTree = async function(wikiId) {
  const pages = await this.find({ wiki: wikiId })
    .select('title slug parent order isHomePage')
    .sort({ order: 1, title: 1 });
  
  const pageMap = new Map();
  const roots = [];
  
  pages.forEach(page => {
    pageMap.set(page._id.toString(), { ...page.toObject(), children: [] });
  });
  
  pages.forEach(page => {
    const pageData = pageMap.get(page._id.toString());
    if (page.parent) {
      const parent = pageMap.get(page.parent.toString());
      if (parent) {
        parent.children.push(pageData);
      } else {
        roots.push(pageData);
      }
    } else {
      roots.push(pageData);
    }
  });
  
  return roots;
};

wikiPageSchema.methods.extractHeadings = function() {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings = [];
  let match;
  
  while ((match = headingRegex.exec(this.content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
      slug: match[2].toLowerCase().replace(/[^a-z0-9]+/g, '-')
    });
  }
  
  return headings;
};

wikiPageSchema.methods.extractLinks = function() {
  const linkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(this.content)) !== null) {
    links.push({
      target: match[1].trim(),
      label: match[2] || match[1].trim()
    });
  }
  
  return links;
};

module.exports = mongoose.model('WikiPage', wikiPageSchema);
