const rateLimit = require('express-rate-limit');
const logger = require('./logger');

// General rate limiter for all requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (increased from 100)
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs (increased from 5)
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count successful requests too
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Email: ${req.body?.email || 'unknown'}`);
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts, please try again later.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}, Email: ${req.body?.email || 'unknown'}`);
    res.status(429).json({
      error: 'Too many password reset attempts, please try again later.',
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Token refresh rate limiter
const tokenRefreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 token refresh requests per windowMs (increased from 10)
  message: {
    error: 'Too many token refresh attempts, please try again later.',
    code: 'TOKEN_REFRESH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Token refresh rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many token refresh attempts, please try again later.',
      code: 'TOKEN_REFRESH_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Create a rate limiter that checks user ID instead of IP (for logged-in users)
const createUserRateLimiter = (windowMs, max, message) => {
  const userRequests = new Map();

  // Periodic cleanup instead of scanning the whole Map on every request,
  // which would be O(total users) per request. unref() so the timer never
  // keeps the process alive on shutdown.
  const cleanup = setInterval(() => {
    const windowStart = Date.now() - windowMs;
    for (const [key, requests] of userRequests.entries()) {
      const fresh = requests.filter(time => time > windowStart);
      if (fresh.length === 0) {
        userRequests.delete(key);
      } else {
        userRequests.set(key, fresh);
      }
    }
  }, Math.min(windowMs, 5 * 60 * 1000));
  cleanup.unref();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create this caller's request array, pruning only their own entries
    const requests = (userRequests.get(userId) || []).filter(time => time > windowStart);
    userRequests.set(userId, requests);

    // Check if limit exceeded
    if (requests.length >= max) {
      logger.warn(`User rate limit exceeded for user: ${userId}, Path: ${req.path}`);
      return res.status(429).json({
        error: message,
        code: 'USER_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round((windowMs - (now - requests[0])) / 1000)
      });
    }

    // Add current request
    requests.push(now);
    next();
  };
};

// User-specific rate limiter for sensitive operations
const userActionLimiter = createUserRateLimiter(
  60 * 60 * 1000, // 1 hour
  50, // 50 actions per hour
  'Too many actions performed, please try again later.'
);

// Settings rate limiter
const settingsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 settings requests per windowMs
  message: {
    error: 'Too many settings requests, please try again later.',
    code: 'SETTINGS_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Settings rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many settings requests, please try again later.',
      code: 'SETTINGS_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Public wishlist reservation rate limiter (stricter for public endpoints)
const publicReservationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 reservations per hour
  message: {
    error: 'Too many reservation attempts, please try again later.',
    code: 'RESERVATION_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Public reservation rate limit exceeded for IP: ${req.ip}, Item: ${req.params?.id}`);
    res.status(429).json({
      error: 'Too many reservation attempts, please try again later.',
      code: 'RESERVATION_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// User data rate limiter (for data access, export, delete)
const userDataLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each user to 10 data operations per hour
  message: {
    error: 'Too many data operations, please try again later.',
    code: 'USER_DATA_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`User data rate limit exceeded for user: ${req.user?._id}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many data operations, please try again later.',
      code: 'USER_DATA_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  tokenRefreshLimiter,
  userActionLimiter,
  settingsLimiter,
  publicReservationLimiter,
  userDataLimiter
};
