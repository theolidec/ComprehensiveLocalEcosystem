const mongoose = require('mongoose');

const financeRuleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true,
    maxlength: [150, 'Name cannot exceed 150 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  // percentage: value % of trigger amount; fixed: value absolute; threshold: value is trigger threshold
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'threshold'],
    required: true
  },
  // For on_inflow/on_outflow: account that receives or sends. For threshold: account to watch.
  sourceAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinanceAccount',
    default: null
  },
  // Account to move money TO when rule fires
  targetAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinanceAccount',
    required: true
  },
  // on_inflow: fires when money arrives in sourceAccount
  // on_outflow: fires when money leaves sourceAccount
  // threshold: fires when sourceAccount balance crosses thresholdAmount
  // recurring: fires on a time schedule
  trigger: {
    type: String,
    enum: ['on_inflow', 'on_outflow', 'threshold', 'recurring'],
    required: true
  },
  // For percentage: percentage (0–100). For fixed/threshold: flat amount.
  value: {
    type: Number,
    required: true,
    min: [0, 'Value must be non-negative']
  },
  // Threshold trigger: balance level to watch
  thresholdAmount: {
    type: Number,
    default: null
  },
  thresholdDirection: {
    type: String,
    enum: ['above', 'below'],
    default: 'above'
  },
  // Recurring trigger schedule
  recurringSchedule: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', null],
    default: null
  },
  // Day of week (0=Sun) for weekly, day of month (1–31) for monthly
  recurringDay: {
    type: Number,
    default: null
  },
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Last time this rule generated a pending transaction (for recurring)
  lastTriggeredAt: {
    type: Date,
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

financeRuleSchema.index({ userId: 1, isActive: 1 });
financeRuleSchema.index({ userId: 1, sourceAccountId: 1, trigger: 1 });

module.exports = mongoose.model('FinanceRule', financeRuleSchema);
