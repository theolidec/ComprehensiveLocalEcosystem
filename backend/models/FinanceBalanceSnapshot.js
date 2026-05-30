const mongoose = require('mongoose');

const financeBalanceSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // ISO date string YYYY-MM-DD — one snapshot per user per day
  date: {
    type: String,
    required: true
  },
  totalBalance: {
    type: Number,
    required: true
  },
  // Per-account snapshot for drilling down
  accountBalances: [{
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceAccount' },
    name: String,
    balance: Number
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

financeBalanceSnapshotSchema.index({ userId: 1, date: -1 }, { unique: true });

module.exports = mongoose.model('FinanceBalanceSnapshot', financeBalanceSnapshotSchema);
