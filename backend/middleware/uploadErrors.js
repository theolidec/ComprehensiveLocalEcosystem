const multer = require('multer');
const logger = require('../config/logger');

// Multer rejects uploads (size limit, unexpected field, disallowed mime type from a
// fileFilter) by passing an error to next(). Without this middleware those client
// errors reach the global handler and are reported as an opaque 500 "Internal server
// error", so the UI cannot tell the user what went wrong.
const MULTER_STATUS = {
  LIMIT_FILE_SIZE: 413,
  LIMIT_PART_COUNT: 413,
  LIMIT_FILE_COUNT: 413,
  LIMIT_FIELD_KEY: 400,
  LIMIT_FIELD_VALUE: 413,
  LIMIT_FIELD_COUNT: 400,
  LIMIT_UNEXPECTED_FILE: 400,
};

const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    logger.warn(`Upload rejected (${error.code}): ${error.message}`);
    return res.status(MULTER_STATUS[error.code] || 400).json({
      error: error.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : error.message,
      code: error.code,
    });
  }

  // Errors raised by a fileFilter are plain Errors — treat them as rejected input.
  if (error && error.fromFileFilter) {
    logger.warn(`Upload rejected by file filter: ${error.message}`);
    return res.status(400).json({
      error: error.message,
      code: 'INVALID_FILE_TYPE',
    });
  }

  return next(error);
};

// Builds the error a fileFilter should pass to its callback so that
// handleUploadErrors can distinguish it from an unexpected failure.
const fileFilterError = (message) => {
  const error = new Error(message);
  error.fromFileFilter = true;
  return error;
};

module.exports = { handleUploadErrors, fileFilterError };
