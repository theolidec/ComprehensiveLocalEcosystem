const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { authenticateToken, verifyRefreshToken } = require('../middleware/auth');
const { authLimiter, tokenRefreshLimiter } = require('../config/rateLimiter');
const logger = require('../config/logger');

const router = express.Router();

// Helper function to set secure cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
  // Set access token cookie (short-lived)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/'
  });

  // Set refresh token cookie (longer-lived)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
};

// Helper function to clear auth cookies
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
};

// Register new user
router.post('/register', authLimiter, [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Registration validation failed: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({ 
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Registration attempt with existing email: ${email}`);
      return res.status(409).json({ 
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create new user
    const user = new User({ email, password, name });
    await user.save();

    logger.info(`New user registered: ${email}`);

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = await RefreshToken.createToken(user, {
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Update last login
    await User.updateLastLogin(user._id);

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed due to server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Login user
router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Login validation failed: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({ 
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findByEmailWithPassword(email);
    
    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${email}`);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      logger.warn(`Login attempt on locked account: ${email}`);
      return res.status(423).json({ 
        error: 'Account is temporarily locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      logger.warn(`Login attempt on inactive account: ${email}`);
      return res.status(401).json({ 
        error: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Validate password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      // Increment login attempts
      await User.incrementLoginAttempts(user._id);
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = await RefreshToken.createToken(user, {
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Update last login and reset login attempts
    await User.updateLastLogin(user._id);

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    logger.info(`User logged in successfully: ${email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed due to server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Refresh access token
router.post('/refresh', tokenRefreshLimiter, verifyRefreshToken, async (req, res) => {
  try {
    const { user, refreshTokenDoc } = req;

    // Revoke old refresh token
    await RefreshToken.revokeToken(refreshTokenDoc.token);

    // Generate new tokens
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = await RefreshToken.createToken(user, {
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Set new cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    logger.info(`Token refreshed for user: ${user.email}`);

    res.json({
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ 
      error: 'Token refresh failed due to server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Get current user info (protected)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'User authenticated',
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        lastLogin: req.user.lastLogin,
        isActive: req.user.isActive
      }
    });
  } catch (error) {
    logger.error('Get user info error:', error);
    res.status(500).json({ 
      error: 'Failed to get user information',
      code: 'SERVER_ERROR'
    });
  }
});

// Logout user (protected)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const refreshToken = req.cookies?.refreshToken;

    // Revoke refresh token if provided
    if (refreshToken) {
      await RefreshToken.revokeToken(refreshToken);
    }

    // Clear cookies
    clearAuthCookies(res);

    logger.info(`User logged out: ${req.user.email}`);

    res.json({ 
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed due to server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Logout from all devices (protected)
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Revoke all refresh tokens for this user
    await RefreshToken.revokeAllUserTokens(userId);

    // Clear cookies
    clearAuthCookies(res);

    logger.info(`User logged out from all devices: ${req.user.email}`);

    res.json({ 
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    logger.error('Logout all error:', error);
    res.status(500).json({ 
      error: 'Logout from all devices failed due to server error',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
