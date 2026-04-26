const Settings = require('../models/Settings');
const RefreshToken = require('../models/RefreshToken');
const logger = require('../config/logger');

const settingsController = {
  getSettings: async (req, res) => {
    try {
      const settings = await Settings.getOrCreateForUser(req.user._id);
      res.json({ settings });
    } catch (error) {
      logger.error('Get settings error:', error);
      res.status(500).json({ 
        error: 'Failed to get settings',
        code: 'SERVER_ERROR'
      });
    }
  },

  updateSettings: async (req, res) => {
    try {
      const allowedUpdates = ['profile', 'calendar', 'notifications', 'display', 'privacy', 'wishlist'];
      const updates = {};
      
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const settings = await Settings.findOneAndUpdate(
        { userId: req.user._id },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!settings) {
        return res.status(404).json({ 
          error: 'Settings not found',
          code: 'NOT_FOUND'
        });
      }

      logger.info(`Settings updated for user: ${req.user.email}`);

      res.json({
        message: 'Settings updated successfully',
        settings
      });
    } catch (error) {
      logger.error('Update settings error:', error);
      res.status(500).json({ 
        error: 'Failed to update settings',
        code: 'SERVER_ERROR'
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { name, bio, avatar } = req.body;
      
      const settings = await Settings.findOneAndUpdate(
        { userId: req.user._id },
        { 
          $set: {
            'profile.name': name,
            'profile.bio': bio,
            'profile.avatar': avatar
          }
        },
        { new: true, runValidators: true }
      );

      res.json({
        message: 'Profile updated successfully',
        profile: settings.profile
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ 
        error: 'Failed to update profile',
        code: 'SERVER_ERROR'
      });
    }
  },

  updateCalendarSettings: async (req, res) => {
    try {
      const allowedFields = [
        'defaultView', 'weekStartsOn', 'timezone', 'showWeekNumbers',
        'defaultEventDuration', 'workingHours'
      ];
      
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[`calendar.${field}`] = req.body[field];
        }
      }

      const settings = await Settings.findOneAndUpdate(
        { userId: req.user._id },
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({
        message: 'Calendar settings updated successfully',
        calendar: settings.calendar
      });
    } catch (error) {
      logger.error('Update calendar settings error:', error);
      res.status(500).json({ 
        error: 'Failed to update calendar settings',
        code: 'SERVER_ERROR'
      });
    }
  },

  updateNotificationSettings: async (req, res) => {
    try {
      const allowedFields = ['emailReminders', 'reminderTime', 'eventUpdates', 'weeklyDigest'];
      
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[`notifications.${field}`] = req.body[field];
        }
      }

      const settings = await Settings.findOneAndUpdate(
        { userId: req.user._id },
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({
        message: 'Notification settings updated successfully',
        notifications: settings.notifications
      });
    } catch (error) {
      logger.error('Update notification settings error:', error);
      res.status(500).json({ 
        error: 'Failed to update notification settings',
        code: 'SERVER_ERROR'
      });
    }
  },

  updateDisplaySettings: async (req, res) => {
    try {
      const allowedFields = ['theme', 'language', 'compactMode', 'showCompletedEvents'];
      
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[`display.${field}`] = req.body[field];
        }
      }

      const settings = await Settings.findOneAndUpdate(
        { userId: req.user._id },
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({
        message: 'Display settings updated successfully',
        display: settings.display
      });
    } catch (error) {
      logger.error('Update display settings error:', error);
      res.status(500).json({ 
        error: 'Failed to update display settings',
        code: 'SERVER_ERROR'
      });
    }
  },

  updatePrivacySettings: async (req, res) => {
    try {
      const allowedFields = ['shareCalendar', 'showBusyStatus', 'allowThemeCookie'];
      
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[`privacy.${field}`] = req.body[field];
        }
      }

      const settings = await Settings.findOneAndUpdate(
        { userId: req.user._id },
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({
        message: 'Privacy settings updated successfully',
        privacy: settings.privacy
      });
    } catch (error) {
      logger.error('Update privacy settings error:', error);
      res.status(500).json({ 
        error: 'Failed to update privacy settings',
        code: 'SERVER_ERROR'
      });
    }
  },

  updateWishlistSettings: async (req, res) => {
    try {
      const allowedFields = ['defaultItemsPerPage', 'saveItemsPerPageCookie'];
      
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[`wishlist.${field}`] = req.body[field];
        }
      }

      const settings = await Settings.findOneAndUpdate(
        { userId: req.user._id },
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({
        message: 'Wishlist settings updated successfully',
        wishlist: settings.wishlist
      });
    } catch (error) {
      logger.error('Update wishlist settings error:', error);
      res.status(500).json({ 
        error: 'Failed to update wishlist settings',
        code: 'SERVER_ERROR'
      });
    }
  },

  getActiveSessions: async (req, res) => {
    try {
      const sessions = await RefreshToken.find({ 
        user: req.user._id,
        isRevoked: false 
      }).select('userAgent ip createdAt expiresAt');

      const now = new Date();
      const sessionsWithStatus = sessions.map(session => ({
        ...session.toObject(),
        isExpired: session.expiresAt < now,
        currentSession: false
      }));

      res.json({ sessions: sessionsWithStatus });
    } catch (error) {
      logger.error('Get active sessions error:', error);
      res.status(500).json({ 
        error: 'Failed to get active sessions',
        code: 'SERVER_ERROR'
      });
    }
  },

  revokeSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = await RefreshToken.findOneAndUpdate(
        { _id: sessionId, user: req.user._id },
        { isRevoked: true },
        { new: true }
      );

      if (!session) {
        return res.status(404).json({ 
          error: 'Session not found',
          code: 'NOT_FOUND'
        });
      }

      logger.info(`Session revoked for user: ${req.user.email}`);

      res.json({ message: 'Session revoked successfully' });
    } catch (error) {
      logger.error('Revoke session error:', error);
      res.status(500).json({ 
        error: 'Failed to revoke session',
        code: 'SERVER_ERROR'
      });
    }
  },

  resetSettings: async (req, res) => {
    try {
      await Settings.findOneAndUpdate(
        { userId: req.user._id },
        {
          $set: {
            calendar: Settings.schema.paths.calendar.defaultValue,
            notifications: Settings.schema.paths.notifications.defaultValue,
            display: Settings.schema.paths.display.defaultValue,
            privacy: Settings.schema.paths.privacy.defaultValue,
            wishlist: Settings.schema.paths.wishlist.defaultValue
          }
        }
      );

      const settings = await Settings.getOrCreateForUser(req.user._id);

      logger.info(`Settings reset for user: ${req.user.email}`);

      res.json({
        message: 'Settings reset to defaults',
        settings
      });
    } catch (error) {
      logger.error('Reset settings error:', error);
      res.status(500).json({ 
        error: 'Failed to reset settings',
        code: 'SERVER_ERROR'
      });
    }
  }
};

module.exports = settingsController;
