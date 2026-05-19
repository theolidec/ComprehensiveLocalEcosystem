const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profile: {
    name: {
      type: String,
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
      default: ''
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    }
  },
  calendar: {
    defaultView: {
      type: String,
      enum: ['month', 'week', 'day', 'agenda'],
      default: 'month'
    },
    weekStartsOn: {
      type: Number,
      min: 0,
      max: 6,
      default: 0
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    showWeekNumbers: {
      type: Boolean,
      default: false
    },
    defaultEventDuration: {
      type: Number,
      min: 15,
      max: 480,
      default: 60
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '17:00'
      }
    }
  },
  notifications: {
    emailReminders: {
      type: Boolean,
      default: true
    },
    reminderTime: {
      type: Number,
      min: 0,
      max: 10080,
      default: 15
    },
    eventUpdates: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: false
    }
  },
  display: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'en'
    },
    compactMode: {
      type: Boolean,
      default: false
    },
    showCompletedEvents: {
      type: Boolean,
      default: true
    },
    homepageLayout: {
      showDailyTracker: {
        type: Boolean,
        default: true
      },
      showEvents: {
        type: Boolean,
        default: true
      },
      showQuickAccess: {
        type: Boolean,
        default: true
      },
      showProTips: {
        type: Boolean,
        default: true
      },
      order: {
        type: [String],
        default: ['dailyTracker', 'events', 'quickAccess', 'proTips']
      },
      quickActions: {
        type: [String],
        default: ['calendar', 'passwords', 'wishlist', 'files', 'calculator', 'following', 'wikis', 'tracker']
      }
    }
  },
  privacy: {
    shareCalendar: {
      type: Boolean,
      default: false
    },
    showBusyStatus: {
      type: Boolean,
      default: true
    },
    allowThemeCookie: {
      type: Boolean,
      default: true
    }
  },
  wishlist: {
    defaultItemsPerPage: {
      type: Number,
      min: 10,
      max: 200,
      default: 20
    },
    saveItemsPerPageCookie: {
      type: Boolean,
      default: true
    }
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

settingsSchema.statics.getOrCreateForUser = async function(userId) {
  let settings = await this.findOne({ userId });
  if (!settings) {
    settings = await this.create({ userId });
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
