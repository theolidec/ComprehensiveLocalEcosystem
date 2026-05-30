const mongoose = require('mongoose');

const financeBudgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Target specific account or a broad account type
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinanceAccount',
    default: null
  },
  accountType: {
    type: String,
    enum: ['checking', 'savings', 'investment', 'income', 'expense', 'cash', 'credit', 'bridge', null],
    default: null
  },
  // YYYY-MM e.g. "2026-05"
  month: {
    type: String,
    required: true
  },
  // Maximum spend / inflow target for the month
  monthlyTarget: {
    type: Number,
    required: true,
    min: [0, 'Budget target must be non-negative']
  },
  note: {
    type: String,
    default: '',
    maxlength: 500
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

financeBudgetSchema.index({ userId: 1, month: 1 });
financeBudgetSchema.index({ userId: 1, accountId: 1, month: 1 });

module.exports = mongoose.model('FinanceBudget', financeBudgetSchema);
