const mongoose = require('mongoose');

const trackerResponseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Response must belong to a user']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  taskCompletions: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrackerTask',
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    durationMinutes: {
      type: Number,
      default: null
    }
  }],
  questionResponses: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrackerQuestion',
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  }],
  mood: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  overallNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
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

trackerResponseSchema.index({ user: 1, date: 1 }, { unique: true });
trackerResponseSchema.index({ user: 1, 'taskCompletions.task': 1 });
trackerResponseSchema.index({ user: 1, 'questionResponses.question': 1 });

trackerResponseSchema.statics.getStreakByUser = async function(userId) {
  const responses = await this.find({ user: userId })
    .sort({ date: -1 })
    .select('date taskCompletions questionResponses')
    .lean();

  if (responses.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hasActivity = (resp) => {
    const hasCompletedTask = resp.taskCompletions?.some(tc => tc.completed);
    const hasAnswer = resp.questionResponses?.some(qr => qr.value !== undefined && qr.value !== null);
    return hasCompletedTask || hasAnswer;
  };

  for (let i = 0; i < responses.length; i++) {
    const respDate = new Date(responses[i].date);
    respDate.setHours(0, 0, 0, 0);

    if (!hasActivity(responses[i])) {
      tempStreak = 0;
      continue;
    }

    if (i === 0) {
      const diffDays = Math.floor((today - respDate) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        tempStreak = 1;
      } else {
        break;
      }
    } else {
      const prevDate = new Date(responses[i - 1].date);
      prevDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((prevDate - respDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 1;
        if (i > 0) break;
      }
    }
  }

  currentStreak = tempStreak;
  if (currentStreak > longestStreak) longestStreak = currentStreak;

  const allStreaks = [];
  let s = 0;
  for (let i = 0; i < responses.length; i++) {
    if (hasActivity(responses[i])) {
      if (i > 0) {
        const prev = new Date(responses[i - 1].date);
        const curr = new Date(responses[i].date);
        prev.setHours(0, 0, 0, 0);
        curr.setHours(0, 0, 0, 0);
        const diff = Math.floor((prev - curr) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          s++;
        } else {
          if (s > 0) allStreaks.push(s);
          s = 1;
        }
      } else {
        s = 1;
      }
    } else {
      if (s > 0) allStreaks.push(s);
      s = 0;
    }
  }
  if (s > 0) allStreaks.push(s);
  if (allStreaks.length > 0) {
    longestStreak = Math.max(longestStreak, ...allStreaks);
  }

  return { currentStreak, longestStreak };
};

trackerResponseSchema.statics.getCompletionRateByUser = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const TrackerTask = require('./TrackerTask');
  const activeTasks = await TrackerTask.countDocuments({
    user: userId,
    status: 'active'
  });

  if (activeTasks === 0) return { rate: 0, totalPossible: 0, totalCompleted: 0 };

  const responses = await this.find({
    user: userId,
    date: { $gte: startDate }
  }).lean();

  let totalPossible = activeTasks * days;
  let totalCompleted = 0;

  responses.forEach(resp => {
    resp.taskCompletions?.forEach(tc => {
      if (tc.completed) totalCompleted++;
    });
  });

  return {
    rate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
    totalPossible,
    totalCompleted
  };
};

trackerResponseSchema.statics.getAnalyticsByUser = async function(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const dailyActivity = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        tasksCompleted: {
          $sum: {
            $size: {
              $filter: {
                input: '$taskCompletions',
                cond: { $eq: ['$$this.completed', true] }
              }
            }
          }
        },
        questionsAnswered: { $sum: { $size: '$questionResponses' } },
        avgMood: { $avg: '$mood' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const moodTrend = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), mood: { $ne: null }, date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        avgMood: { $avg: '$mood' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const weeklyActivity = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-W%V', date: '$date' } },
        tasksCompleted: {
          $sum: {
            $size: {
              $filter: {
                input: '$taskCompletions',
                cond: { $eq: ['$$this.completed', true] }
              }
            }
          }
        },
        daysActive: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const questionStats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), date: { $gte: thirtyDaysAgo } } },
    { $unwind: '$questionResponses' },
    {
      $group: {
        _id: '$questionResponses.question',
        responses: { $push: '$questionResponses.value' },
        count: { $sum: 1 }
      }
    }
  ]);

  const streak = await this.getStreakByUser(userId);
  const completionRate = await this.getCompletionRateByUser(userId, 30);

  return {
    dailyActivity,
    moodTrend,
    weeklyActivity,
    questionStats,
    streak,
    completionRate
  };
};

module.exports = mongoose.model('TrackerResponse', trackerResponseSchema);
