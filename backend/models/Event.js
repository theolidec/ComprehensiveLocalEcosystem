const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  time: {
    type: String,
    default: null
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Event category is required'],
    default: 'work'
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  attendees: [{
    type: String,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email']
  }],
  reminder: {
    type: Number,
    default: 15,
    enum: [0, 5, 15, 30, 60, 1440]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Event must belong to a user']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', null],
    default: null
  },
  isCompleted: {
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

eventSchema.index({ user: 1, date: 1 });
eventSchema.index({ user: 1, category: 1 });
eventSchema.index({ date: 1 });

eventSchema.pre('save', function(next) {
  const categoryColors = {
    work: '#3B82F6',
    personal: '#10B981',
    social: '#F59E0B',
    health: '#EF4444',
    education: '#8B5CF6',
    travel: '#06B6D4',
    other: '#6B7280'
  };
  
  if (!this.color || this.isModified('category')) {
    this.color = categoryColors[this.category] || '#3B82F6';
  }
  
  next();
});

eventSchema.statics.findByUserAndDateRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1, time: 1 });
};

eventSchema.statics.findUpcomingByUser = function(userId, limit = 5) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.find({
    user: userId,
    date: { $gte: today }
  })
    .sort({ date: 1, time: 1 })
    .limit(limit);
};

eventSchema.statics.getStatsByUser = async function(userId, month, year) {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
  
  const totalEvents = await this.countDocuments({ user: userId });
  
  const thisMonthEvents = await this.countDocuments({
    user: userId,
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth
    }
  });
  
  const categoryStats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  
  const categoryCount = {};
  categoryStats.forEach(stat => {
    categoryCount[stat._id] = stat.count;
  });
  
  return { totalEvents, thisMonth: thisMonthEvents, categoryCount };
};

module.exports = mongoose.model('Event', eventSchema);
