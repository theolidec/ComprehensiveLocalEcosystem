const mongoose = require('mongoose');

const financeTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // deposit: external money in to toAccount; withdrawal: money out from fromAccount;
  // transfer: internal move between accounts; rule_triggered: created by a rule
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer', 'rule_triggered'],
    required: true
  },
  // null = external source/destination (e.g. employer, ATM)
  fromAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinanceAccount',
    default: null
  },
  toAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinanceAccount',
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be positive']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  // pending: created by rule, user has not confirmed yet
  // completed: confirmed and balance updated
  // cancelled: dismissed/declined
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  // Which rule triggered this transaction (if any)
  ruleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinanceRule',
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

financeTransactionSchema.index({ userId: 1, date: -1 });
financeTransactionSchema.index({ userId: 1, status: 1 });
financeTransactionSchema.index({ userId: 1, fromAccountId: 1 });
financeTransactionSchema.index({ userId: 1, toAccountId: 1 });

module.exports = mongoose.model('FinanceTransaction', financeTransactionSchema);
