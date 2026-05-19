const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  filename: { type: String, required: true, trim: true },
  originalName: { type: String, required: true, trim: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  isPublic: { type: Boolean, default: false },
  playlistIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }],
  title: { type: String, trim: true },
  artist: { type: String, trim: true },
  album: { type: String, trim: true },
  coverUrl: { type: String, trim: true },
  duration: { type: Number },
  description: { type: String, default: '', maxlength: [500, 'Description cannot exceed 500 characters'] },
  tags: [{ type: String, trim: true, maxlength: [50, 'Tag cannot exceed 50 characters'] }],
  isFavorite: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

musicSchema.index({ userId: 1, isDeleted: 1 });
musicSchema.index({ userId: 1, isFavorite: 1 });

module.exports = mongoose.model('Music', musicSchema);
