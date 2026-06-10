const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const logger = require('../config/logger');

const authenticateToken = async (req, res, next) => {
  try {
    // Tokens are issued via HttpOnly cookies only — no Authorization header support.
    // Cookies prevent JS from reading the token and pair with sameSite=strict for CSRF.
    const token = req.cookies?.accessToken;

    if (!token) {
      logger.warn('Access denied - No token provided');
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      logger.warn(`Access denied - User not found or inactive: ${decoded.userId}`);
      return res.status(401).json({ 
        error: 'Invalid token - User not found or inactive',
        code: 'USER_INVALID'
      });
    }

    // Check if user account is locked
    if (user.isLocked) {
      logger.warn(`Access denied - Account locked: ${user.email}`);
      return res.status(423).json({ 
        error: 'Account is temporarily locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Attach user to request object
    req.user = user;
    req.token = token;

    logger.debug(`User authenticated successfully: ${user.email}`);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Access denied - Invalid token format');
      return res.status(403).json({ 
        error: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
    } else if (error.name === 'TokenExpiredError') {
      logger.warn('Access denied - Token expired');
      return res.status(403).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else {
      logger.error('Authentication error:', error);
      return res.status(500).json({ 
        error: 'Authentication server error',
        code: 'AUTH_ERROR'
      });
    }
  }
};

// Middleware to verify refresh token
const verifyRefreshToken = async (req, res, next) => {
  try {
    // HttpOnly cookie only — mirroring authenticateToken. Accepting the token
    // from the request body would let script-injected code replay a token it
    // obtained elsewhere and weakens the cookie-only design.
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      logger.warn('Token refresh denied - No refresh token provided');
      return res.status(401).json({ 
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token in database
    const tokenDoc = await RefreshToken.verifyToken(refreshToken);
    
    if (!tokenDoc) {
      logger.warn('Token refresh denied - Invalid or expired refresh token');
      return res.status(401).json({ 
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Verify JWT
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      logger.warn(`Token refresh denied - User not found or inactive: ${decoded.userId}`);
      return res.status(401).json({ 
        error: 'Invalid refresh token - User not found or inactive',
        code: 'USER_INVALID'
      });
    }

    // Attach user and token to request
    req.user = user;
    req.refreshToken = refreshToken;
    req.refreshTokenDoc = tokenDoc;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Token refresh denied - Invalid refresh token format');
      return res.status(403).json({ 
        error: 'Invalid refresh token format',
        code: 'INVALID_REFRESH_TOKEN_FORMAT'
      });
    } else if (error.name === 'TokenExpiredError') {
      logger.warn('Token refresh denied - Refresh token expired');
      return res.status(403).json({ 
        error: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    } else {
      logger.error('Refresh token verification error:', error);
      return res.status(500).json({ 
        error: 'Token refresh server error',
        code: 'REFRESH_ERROR'
      });
    }
  }
};

// Optional authentication middleware (doesn't throw error if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (user && user.isActive && !user.isLocked) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Optional auth - continue even if token is invalid
    next();
  }
};

module.exports = { 
  authenticateToken, 
  verifyRefreshToken, 
  optionalAuth 
};
