const { validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * Express middleware that rejects a request when express-validator collected any
 * validation errors. Shared by every route file so the 400 response shape stays
 * identical across the API.
 *
 * Usage:
 *   const { handleValidationErrors } = require('../middleware/validation');
 *   router.post('/', [body('name').notEmpty()], handleValidationErrors, handler);
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', errors.array());
    return res.status(400).json({
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  next();
};

module.exports = { handleValidationErrors };
