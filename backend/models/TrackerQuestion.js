const mongoose = require('mongoose');

const trackerQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Question must belong to a user']
  },
  responseType: {
    type: String,
    enum: ['yesno', 'yesnomaybe', 'scale', 'text', 'number'],
    default: 'yesno'
  },
  scaleMin: {
    type: Number,
    default: 1
  },
  scaleMax: {
    type: Number,
    default: 5
  },
  scaleLabels: {
    minLabel: { type: String, trim: true, default: '' },
    maxLabel: { type: String, trim: true, default: '' }
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    trim: true,
    default: null
  },
  color: {
    type: String,
    trim: true,
    default: null
  },
  reminderTime: {
    type: String,
    default: null
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

trackerQuestionSchema.index({ user: 1, isActive: 1 });
trackerQuestionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('TrackerQuestion', trackerQuestionSchema);
