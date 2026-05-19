const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', maxlength: [500, 'Description cannot exceed 500 characters'] },
  musicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Music' }],
  isPublic: { type: Boolean, default: false },
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

playlistSchema.index({ userId: 1, isDeleted: 1 });

module.exports = mongoose.model('Playlist', playlistSchema);
