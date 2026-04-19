const mongoose = require('mongoose');
const logger = require('../config/logger');

const wikiVersionSchema = new mongoose.Schema({
  page: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WikiPage',
    required: true
  },
  wiki: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wiki',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    default: ''
  },
  version: {
    type: Number,
    required: true
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  editSummary: {
    type: String,
    maxlength: 500,
    default: ''
  },
  infobox: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }]
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

wikiVersionSchema.index({ page: 1, version: -1 });
wikiVersionSchema.index({ wiki: 1, editedBy: 1 });
wikiVersionSchema.index({ createdAt: -1 });

wikiVersionSchema.statics.createVersion = async function(page, user, editSummary = '') {
  const latestVersion = await this.findOne({ page: page._id })
    .sort({ version: -1 })
    .select('version');
  
  const version = new this({
    page: page._id,
    wiki: page.wiki,
    title: page.title,
    content: page.content,
    excerpt: page.excerpt,
    version: (latestVersion?.version || 0) + 1,
    editedBy: user._id,
    editSummary,
    infobox: page.infobox,
    tags: page.tags
  });
  
  await version.save();
  return version;
};

wikiVersionSchema.statics.getDiff = function(version1, version2) {
  const lines1 = version1.content.split('\n');
  const lines2 = version2.content.split('\n');
  
  const diff = [];
  let i = 0, j = 0;
  
  while (i < lines1.length || j < lines2.length) {
    if (i >= lines1.length) {
      diff.push({ type: 'added', line: j + 1, content: lines2[j] });
      j++;
    } else if (j >= lines2.length) {
      diff.push({ type: 'removed', line: i + 1, content: lines1[i] });
      i++;
    } else if (lines1[i] === lines2[j]) {
      diff.push({ type: 'unchanged', line: i + 1, content: lines1[i] });
      i++;
      j++;
    } else {
      diff.push({ type: 'removed', line: i + 1, content: lines1[i] });
      diff.push({ type: 'added', line: j + 1, content: lines2[j] });
      i++;
      j++;
    }
  }
  
  return diff;
};

module.exports = mongoose.model('WikiVersion', wikiVersionSchema);
