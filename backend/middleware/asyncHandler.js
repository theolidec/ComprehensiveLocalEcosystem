// Express 4 does not forward rejected promises returned by an async handler to
// the error-handling middleware — the rejection is lost and the request hangs
// until the client times out. Wrapping a handler routes any rejection to
// next(), so it reaches the global error handler in server.js.
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

module.exports = asyncHandler;
