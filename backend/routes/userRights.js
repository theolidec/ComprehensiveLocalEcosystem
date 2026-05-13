const express = require('express');
const { body, validationResult } = require('express-validator');
const userRightsController = require('../controllers/userRightsController');
const { authenticateToken } = require('../middleware/auth');
const { userDataLimiter } = require('../config/rateLimiter');
const logger = require('../config/logger');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`User rights validation failed: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  next();
};

router.use(authenticateToken);

router.get('/data', userDataLimiter, userRightsController.getUserData);

router.put('/data', userDataLimiter, [
  body('name').optional().trim().isLength({ min: 1, max: 50 }),
  body('email').optional().isEmail()
], validateRequest, userRightsController.updateUserData);

router.delete('/account', userDataLimiter, [
  body('password').notEmpty().withMessage('Password is required')
], validateRequest, userRightsController.deleteAccount);

router.get('/export', userDataLimiter, userRightsController.exportUserData);

module.exports = router;
