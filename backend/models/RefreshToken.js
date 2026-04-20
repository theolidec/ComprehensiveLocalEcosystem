const mongoose = require('mongoose');
const logger = require('../config/logger');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 60 * 60 * 24 * 7 // 7 days TTL
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  deviceInfo: {
    userAgent: String,
    ip: String
  }
}, {
  timestamps: true
});

// Index for better performance
refreshTokenSchema.index({ user: 1 });

// Static method to create and save refresh token
refreshTokenSchema.statics.createToken = async function(user, deviceInfo = {}) {
  try {
    const token = user.generateRefreshToken();
    const refreshToken = new this({
      token,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceInfo
    });
    
    await refreshToken.save();
    return token;
  } catch (error) {
    logger.error('Error creating refresh token:', error);
    throw error;
  }
};

// Static method to verify and get refresh token
refreshTokenSchema.statics.verifyToken = async function(token) {
  try {
    const refreshToken = await this.findOne({ 
      token, 
      isRevoked: false 
    }).populate('user');
    
    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      return null;
    }
    
    return refreshToken;
  } catch (error) {
    logger.error('Error verifying refresh token:', error);
    return null;
  }
};

// Static method to revoke token
refreshTokenSchema.statics.revokeToken = async function(token) {
  try {
    await this.findOneAndUpdate(
      { token },
      { isRevoked: true }
    );
  } catch (error) {
    logger.error('Error revoking refresh token:', error);
    throw error;
  }
};

// Static method to revoke all user tokens
refreshTokenSchema.statics.revokeAllUserTokens = async function(userId) {
  try {
    await this.updateMany(
      { user: userId },
      { isRevoked: true }
    );
  } catch (error) {
    logger.error('Error revoking all user tokens:', error);
    throw error;
  }
};

// Static method to cleanup expired tokens (called by cron job)
refreshTokenSchema.statics.cleanupExpiredTokens = async function() {
  try {
    const result = await this.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isRevoked: true }
      ]
    });
    
    logger.info(`Cleaned up ${result.deletedCount} expired/revoked tokens`);
    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired tokens:', error);
    throw error;
  }
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
