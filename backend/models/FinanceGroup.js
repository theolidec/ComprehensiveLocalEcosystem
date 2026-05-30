const mongoose = require('mongoose');

const financeGroupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  color: {
    type: String,
    default: '#6B7280'
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

financeGroupSchema.index({ userId: 1 });

module.exports = mongoose.model('FinanceGroup', financeGroupSchema);
