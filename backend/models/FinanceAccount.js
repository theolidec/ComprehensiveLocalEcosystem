const mongoose = require('mongoose');

const financeAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['checking', 'savings', 'investment', 'income', 'expense', 'cash', 'credit', 'bridge'],
    default: 'checking'
  },
  balance: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  // Canvas position for the flowchart
  position: {
    x: { type: Number, default: 100 },
    y: { type: Number, default: 100 }
  },
  // Group assignment for the flow map canvas
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinanceGroup',
    default: null
  },
  // Soft-delete: archived accounts are hidden from main views but retain transaction history
  isArchived: {
    type: Boolean,
    default: false
  },
  // Reserved for future banking API integration
  isExternal: {
    type: Boolean,
    default: false
  },
  externalAccountId: {
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

financeAccountSchema.index({ userId: 1, name: 1 });
financeAccountSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('FinanceAccount', financeAccountSchema);
