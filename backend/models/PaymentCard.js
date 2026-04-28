const mongoose = require('mongoose');

const paymentCardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  cardName: {
    type: String,
    required: [true, 'Card name is required'],
    trim: true,
    maxlength: [100, 'Card name cannot exceed 100 characters']
  },
  cardholderName: {
    type: String,
    trim: true,
    maxlength: [100, 'Cardholder name cannot exceed 100 characters']
  },
  encryptedCardNumber: {
    type: String,
    required: [true, 'Card number is required']
  },
  encryptedExpiryDate: {
    type: String,
    required: [true, 'Expiry date is required']
  },
  encryptedCVV: {
    type: String,
    required: [true, 'CVV is required']
  },
  cardType: {
    type: String,
    enum: ['visa', 'mastercard', 'amex', 'discover', 'other'],
    default: 'other'
  },
  lastFourDigits: {
    type: String,
    validate: {
      validator: function(v) {
        return /^\d{4}$/.test(v);
      },
      message: 'Last four digits must be exactly 4 digits'
    }
  },
  billingAddress: {
    type: String,
    trim: true,
    maxlength: [500, 'Billing address cannot exceed 500 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
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

paymentCardSchema.index({ userId: 1, createdAt: -1 });
paymentCardSchema.index({ userId: 1, isDefault: 1 });
paymentCardSchema.index({ userId: 1, cardType: 1 });

module.exports = mongoose.model('PaymentCard', paymentCardSchema);
