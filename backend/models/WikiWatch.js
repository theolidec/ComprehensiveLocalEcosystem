const mongoose = require('mongoose');
const logger = require('../config/logger');

const wikiWatchSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  notifyOnEdit: {
    type: Boolean,
    default: true
  },
  notifyOnDelete: {
    type: Boolean,
    default: true
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

wikiWatchSchema.index({ user: 1, page: 1 }, { unique: true });
wikiWatchSchema.index({ user: 1, wiki: 1 });
wikiWatchSchema.index({ page: 1 });

wikiWatchSchema.statics.isWatching = async function(userId, pageId) {
  if (!userId) return false;
  const watch = await this.findOne({ user: userId, page: pageId });
  return !!watch;
};

wikiWatchSchema.statics.getUserWatchlist = async function(userId, wikiId = null) {
  const query = { user: userId };
  if (wikiId) query.wiki = wikiId;
  
  return this.find(query)
    .populate('page', 'title slug')
    .populate('wiki', 'name slug')
    .sort({ createdAt: -1 });
};

wikiWatchSchema.statics.notifyWatchers = async function(pageId, action) {
  const watches = await this.find({ page: pageId })
    .populate('user', 'email name');
  
  const notifications = [];
  
  for (const watch of watches) {
    if (action === 'edit' && !watch.notifyOnEdit) continue;
    if (action === 'delete' && !watch.notifyOnDelete) continue;
    
    notifications.push({
      user: watch.user,
      pageId,
      action
    });
  }
  
  return notifications;
};

module.exports = mongoose.model('WikiWatch', wikiWatchSchema);
