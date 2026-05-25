const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const rc = require('../controllers/radiationController');
const logger = require('../config/logger');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Radiation validation failed: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({ errors: errors.array(), code: 'VALIDATION_ERROR' });
  }
  next();
};

// ─── Locations ─────────────────────────────────────────────────────────────────
router.post('/locations', authenticateToken, [
  body('name').notEmpty().trim().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('coordinates.lat').optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
  body('coordinates.lng').optional({ nullable: true }).isFloat({ min: -180, max: 180 })
], validate, rc.createLocation);

router.get('/locations', authenticateToken, rc.getLocations);

router.put('/locations/:id', authenticateToken, [
  param('id').isMongoId(),
  body('name').optional().trim().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 })
], validate, rc.updateLocation);

router.delete('/locations/:id', authenticateToken, [
  param('id').isMongoId()
], validate, rc.deleteLocation);

// ─── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics/timeseries', authenticateToken, rc.getTimeSeries);
router.get('/analytics/by-location', authenticateToken, rc.getByLocation);
router.get('/analytics/heatmap', authenticateToken, rc.getHeatmap);

// ─── Measurements ──────────────────────────────────────────────────────────────
router.post('/measurements', authenticateToken, [
  body('date').notEmpty().isISO8601(),
  body('averageLevel').notEmpty().isFloat({ min: 0 }),
  body('peakLevel').optional({ nullable: true }).isFloat({ min: 0 }),
  body('status').optional().isIn(['Draft', 'Verified', 'Flagged', 'Archived']),
  body('locationId').optional({ nullable: true }).isMongoId(),
  body('isPublic').optional().isBoolean()
], validate, rc.createMeasurement);

router.get('/measurements/public', optionalAuth, rc.getPublicMeasurements);

router.get('/measurements', authenticateToken, rc.getMeasurements);

router.put('/measurements/:id/visibility', authenticateToken, [
  param('id').isMongoId()
], validate, rc.toggleVisibility);

router.put('/measurements/:id/restore', authenticateToken, [
  param('id').isMongoId()
], validate, rc.restoreMeasurement);

router.put('/measurements/:id', authenticateToken, [
  param('id').isMongoId(),
  body('averageLevel').optional().isFloat({ min: 0 }),
  body('peakLevel').optional({ nullable: true }).isFloat({ min: 0 }),
  body('status').optional().isIn(['Draft', 'Verified', 'Flagged', 'Archived']),
  body('locationId').optional({ nullable: true }).isMongoId()
], validate, rc.updateMeasurement);

router.delete('/measurements/:id/hard', authenticateToken, [
  param('id').isMongoId()
], validate, rc.hardDeleteMeasurement);

router.delete('/measurements/:id', authenticateToken, [
  param('id').isMongoId()
], validate, rc.softDeleteMeasurement);

module.exports = router;
