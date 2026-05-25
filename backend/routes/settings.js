const express = require('express');
const { body, param, validationResult } = require('express-validator');
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');
const { settingsLimiter } = require('../config/rateLimiter');
const logger = require('../config/logger');

const router = express.Router();

const validateSettingsUpdate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Settings validation failed: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({ 
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  next();
};

router.use(authenticateToken);

router.get('/', settingsController.getSettings);

router.put('/', settingsLimiter, [
  body('profile').optional().isObject(),
  body('calendar').optional().isObject(),
  body('notifications').optional().isObject(),
  body('display').optional().isObject(),
  body('privacy').optional().isObject(),
  body('wishlist').optional().isObject(),
  body('radiation').optional().isObject()
], validateSettingsUpdate, settingsController.updateSettings);

router.put('/profile', settingsLimiter, [
  body('name').optional().trim().isLength({ max: 50 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('avatar').optional().trim()
], validateSettingsUpdate, settingsController.updateProfile);

router.put('/calendar', settingsLimiter, [
  body('defaultView').optional().isIn(['month', 'week', 'day', 'agenda']),
  body('weekStartsOn').optional().isInt({ min: 0, max: 6 }),
  body('timezone').optional().isString(),
  body('showWeekNumbers').optional().isBoolean(),
  body('defaultEventDuration').optional().isInt({ min: 15, max: 480 }),
  body('workingHours').optional().isObject()
], validateSettingsUpdate, settingsController.updateCalendarSettings);

router.put('/notifications', settingsLimiter, [
  body('emailReminders').optional().isBoolean(),
  body('reminderTime').optional().isInt({ min: 0, max: 10080 }),
  body('eventUpdates').optional().isBoolean(),
  body('weeklyDigest').optional().isBoolean()
], validateSettingsUpdate, settingsController.updateNotificationSettings);

router.put('/display', settingsLimiter, [
  body('theme').optional().isIn(['light', 'dark', 'system']),
  body('language').optional().isString(),
  body('compactMode').optional().isBoolean(),
  body('showCompletedEvents').optional().isBoolean(),
  body('homepageLayout').optional().isObject()
], validateSettingsUpdate, settingsController.updateDisplaySettings);

router.put('/privacy', settingsLimiter, [
  body('shareCalendar').optional().isBoolean(),
  body('showBusyStatus').optional().isBoolean()
], validateSettingsUpdate, settingsController.updatePrivacySettings);

router.put('/wishlist', settingsLimiter, [
  body('defaultItemsPerPage').optional().isInt({ min: 10, max: 200 })
], validateSettingsUpdate, settingsController.updateWishlistSettings);

router.put('/radiation', settingsLimiter, [
  body('preferredUnit').optional().isIn(['µSv/h', 'mSv/h', 'nSv/h', 'µGy/h', 'mGy/h', 'mR/h', 'CPM']),
  body('defaultLocationId').optional({ nullable: true }),
  body('cpmConversionFactor').optional().isFloat({ min: 1, max: 10000 })
], validateSettingsUpdate, settingsController.updateRadiationSettings);

router.get('/sessions', settingsController.getActiveSessions);

router.delete('/sessions/:sessionId', [
  param('sessionId').isMongoId()
], validateSettingsUpdate, settingsController.revokeSession);

router.post('/reset', settingsLimiter, settingsController.resetSettings);

module.exports = router;
