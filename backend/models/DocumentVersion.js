const mongoose = require('mongoose');
const logger = require('../config/logger');

const documentVersionSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 0
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.content;
      return ret;
    }
  }
});

documentVersionSchema.index({ fileId: 1, version: -1 });

documentVersionSchema.statics.createVersion = async function(fileId, userId, content) {
  const lastVersion = await this.findOne({ fileId }).sort({ version: -1 });
  const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

  const version = new this({
    fileId,
    userId,
    content,
    size: Buffer.byteLength(content || ''),
    version: nextVersion
  });

  await version.save();

  const MAX_VERSIONS = parseInt(process.env.MAX_DOCUMENT_VERSIONS) || 50;
  const count = await this.countDocuments({ fileId });
  if (count > MAX_VERSIONS) {
    const oldest = await this.find({ fileId })
      .sort({ version: 1 })
      .limit(count - MAX_VERSIONS);
    const ids = oldest.map(v => v._id);
    await this.deleteMany({ _id: { $in: ids } });
  }

  return version;
};

module.exports = mongoose.model('DocumentVersion', documentVersionSchema);
