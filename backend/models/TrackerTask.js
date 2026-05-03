const mongoose = require('mongoose');

const trackerTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must belong to a user']
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  recurrence: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom'],
    default: 'none'
  },
  customRecurrenceDays: {
    type: Number,
    default: null,
    min: [1, 'Custom recurrence must be at least 1 day']
  },
  weeklyDays: [{
    type: String,
    enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  }],
  dueDate: {
    type: Date,
    default: null
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  estimatedMinutes: {
    type: Number,
    default: null,
    min: [1, 'Estimated time must be at least 1 minute']
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'archived'],
    default: 'active'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
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

trackerTaskSchema.index({ user: 1, status: 1 });
trackerTaskSchema.index({ user: 1, dueDate: 1 });
trackerTaskSchema.index({ user: 1, recurrence: 1 });
trackerTaskSchema.index({ user: 1, category: 1 });

trackerTaskSchema.statics.getStatsByUser = async function(userId) {
  const objectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  const [counts, breakdowns] = await Promise.all([
    this.aggregate([
      { $match: { user: objectId } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          completedTasks: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          overdueTasks: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$status', 'active'] },
                  { $eq: ['$isCompleted', false] },
                  { $lt: ['$dueDate', now] },
                  { $ne: ['$dueDate', null] }
                ]},
                1,
                0
              ]
            }
          },
          recurringTasks: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$status', 'active'] },
                  { $ne: ['$recurrence', 'none'] }
                ]},
                1,
                0
              ]
            }
          }
        }
      }
    ]),
    this.aggregate([
      { $match: { user: objectId, status: 'active' } },
      {
        $group: {
          _id: null,
          byPriority: { $push: { k: '$priority', v: 1 } },
          byCategory: { $push: { k: '$category', v: 1 } }
        }
      }
    ])
  ]);

  const countResult = counts[0] || { totalTasks: 0, completedTasks: 0, overdueTasks: 0, recurringTasks: 0 };
  const breakdownResult = breakdowns[0] || { byPriority: [], byCategory: [] };

  const byPriority = {};
  breakdownResult.byPriority.forEach(item => {
    byPriority[item.k] = (byPriority[item.k] || 0) + 1;
  });

  const byCategory = {};
  breakdownResult.byCategory.forEach(item => {
    byCategory[item.k] = (byCategory[item.k] || 0) + 1;
  });

  return {
    totalTasks: countResult.totalTasks,
    completedTasks: countResult.completedTasks,
    overdueTasks: countResult.overdueTasks,
    recurringTasks: countResult.recurringTasks,
    byPriority,
    byCategory
  };
};

module.exports = mongoose.model('TrackerTask', trackerTaskSchema);
