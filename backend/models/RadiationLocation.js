const mongoose = require('mongoose');

const radiationLocationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: [100, 'Name cannot exceed 100 characters'] },
  description: { type: String, trim: true, maxlength: [500, 'Description cannot exceed 500 characters'], default: '' },
  coordinates: {
    lat: { type: Number, min: -90, max: 90, default: null },
    lng: { type: Number, min: -180, max: 180, default: null }
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

radiationLocationSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('RadiationLocation', radiationLocationSchema);
