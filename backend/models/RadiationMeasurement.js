const mongoose = require('mongoose');

const radiationMeasurementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  date: { type: Date, required: true },
  timeStart: { type: String, trim: true, default: '' },
  timeEnd: { type: String, trim: true, default: '' },

  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'RadiationLocation', default: null },
  locationName: { type: String, trim: true, default: '' },

  averageLevel: { type: Number, required: true, min: 0 },
  peakLevel: { type: Number, min: 0, default: null },

  comments: { type: String, trim: true, maxlength: [2000, 'Comments cannot exceed 2000 characters'], default: '' },
  notes: { type: String, trim: true, maxlength: [5000, 'Notes cannot exceed 5000 characters'], default: '' },
  tags: [{ type: String, trim: true, maxlength: [50, 'Tag cannot exceed 50 characters'] }],

  status: {
    type: String,
    enum: ['Draft', 'Verified', 'Flagged', 'Archived'],
    default: 'Draft'
  },

  isPublic: { type: Boolean, default: false },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  isDeleted: { type: Boolean, default: false, index: true },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deletedAt: { type: Date, default: null },
  deletedReason: { type: String, trim: true, maxlength: [500, 'Reason cannot exceed 500 characters'], default: '' },
  deletedComments: { type: String, default: '' },
  deletedTags: [{ type: String }],
  deletedStatus: { type: String, default: '' }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

radiationMeasurementSchema.index({ userId: 1, isDeleted: 1, date: -1 });
radiationMeasurementSchema.index({ userId: 1, isPublic: 1, isDeleted: 1 });
radiationMeasurementSchema.index({ locationId: 1, isDeleted: 1 });

module.exports = mongoose.model('RadiationMeasurement', radiationMeasurementSchema);
