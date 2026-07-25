const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Return the per-user salt used to derive encryption keys for secrets (passwords,
 * payment cards). Users created before the salt existed get one generated lazily.
 *
 * Usage:
 *   const { getUserSalt } = require('../utils/userSalt');
 *   const userSalt = await getUserSalt(req.user._id);
 */
const getUserSalt = async (userId) => {
  const user = await User.findById(userId).select('+passwordSalt');
  if (!user) {
    throw new Error('User not found');
  }
  if (!user.passwordSalt) {
    user.passwordSalt = crypto.randomBytes(32).toString('hex');
    await user.save();
    logger.info(`Generated passwordSalt for user ${userId}`);
  }
  return user.passwordSalt;
};

module.exports = { getUserSalt };
