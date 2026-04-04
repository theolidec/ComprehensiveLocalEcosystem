const mongoose = require('mongoose');

const wishlistReservationSchema = new mongoose.Schema({
  wishlistItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WishlistItem',
    required: [true, 'Reservation must be for a wishlist item']
  },
  reservedBy: {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  status: {
    type: String,
    enum: ['reserved', 'purchased', 'cancelled'],
    default: 'reserved'
  },
  message: {
    type: String,
    trim: true,
    maxlength: [200, 'Message cannot exceed 200 characters']
  },
  reservedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
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

// Index for efficient lookups
wishlistReservationSchema.index({ wishlistItem: 1 });
wishlistReservationSchema.index({ 'reservedBy.email': 1 });

// Pre-save middleware to update updatedAt
wishlistReservationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('WishlistReservation', wishlistReservationSchema);
