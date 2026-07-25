/**
 * Helpers for the error responses controllers return from their catch blocks.
 * They keep the JSON body shape identical across modules.
 *
 * Usage:
 *   const { sendValidationError, sendDuplicateKeyError } = require('../utils/errorResponses');
 *   if (error.name === 'ValidationError') return sendValidationError(res, error);
 *   if (error.code === 11000) return sendDuplicateKeyError(res, 'Wiki with this name already exists', 'WIKI_EXISTS');
 */

/**
 * 400 response for a Mongoose ValidationError, listing each field message.
 * `code` is only included when supplied, matching the callers that send one.
 */
const sendValidationError = (res, error, code) => {
  const body = {
    error: 'Validation failed',
    details: Object.values(error.errors).map(e => e.message)
  };
  if (code) body.code = code;
  return res.status(400).json(body);
};

/** 400 response for a MongoDB duplicate key error (code 11000). */
const sendDuplicateKeyError = (res, message, code) =>
  res.status(400).json({ error: message, code });

module.exports = { sendValidationError, sendDuplicateKeyError };
