const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [12, 'Password must be at least 12 characters long'],
    select: false // Don't include password in queries by default
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  passwordSalt: {
    type: String,
    select: false
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date
  },
  // GDPR Art. 7(1) requires the controller to be able to demonstrate that the data
  // subject has consented to processing where consent is the legal basis, and
  // Art. 13 requires evidence of acceptance of the Terms of Service. We persist
  // a minimal, immutable record of the user's affirmative acceptance at registration.
  consent: {
    acceptedTermsAt: { type: Date },
    acceptedPrivacyAt: { type: Date },
    ageConfirmation13Plus: { type: Boolean, default: false },
    ipAtConsent: { type: String },
    userAgentAtConsent: { type: String },
    // Version strings let us re-prompt users when the policies are materially
    // updated. Bump these in routes/auth.js when releasing a new version.
    termsVersion: { type: String },
    privacyVersion: { type: String }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for better performance
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordSalt = crypto.randomBytes(32).toString('hex');
    next();
  } catch (error) {
    logger.error('Password hashing error:', error);
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    logger.error('Password comparison error:', error);
    throw error;
  }
};

// Instance method to generate access token. Payload contains only userId — the auth
// middleware re-fetches the user on every request anyway, so embedding email leaks
// information unnecessarily (JWTs are base64-decodable by anyone holding them).
userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    { userId: this._id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'
    }
  );
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { 
      userId: this._id 
    },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' 
    }
  );
};

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Static method to find user by email with password. Email is lowercased to match
// what's stored (the email path uses `lowercase: true` on save). Without this, a
// login with `User@Example.com` would not match a stored `user@example.com`.
userSchema.statics.findByEmailWithPassword = function(email) {
  if (typeof email !== 'string') return Promise.resolve(null);
  return this.findOne({ email: email.toLowerCase().trim() }).select('+password');
};

// Static method to find by ID and update last login
userSchema.statics.updateLastLogin = function(userId) {
  return this.findByIdAndUpdate(
    userId,
    { 
      lastLogin: new Date(),
      loginAttempts: 0,
      lockUntil: undefined
    },
    { new: true }
  );
};

// Static method to increment login attempts
// After 5 consecutive failed attempts the account is locked for 2 hours.
userSchema.statics.incrementLoginAttempts = async function(userId) {
  const user = await this.findByIdAndUpdate(
    userId,
    { $inc: { loginAttempts: 1 } },
    { new: true }
  );

  if (user && user.loginAttempts >= 5) {
    const alreadyLocked = user.lockUntil && user.lockUntil > new Date();
    if (!alreadyLocked) {
      const lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
      await this.findByIdAndUpdate(userId, { $set: { lockUntil } });
      user.lockUntil = lockUntil;
      logger.warn(`Account locked due to ${user.loginAttempts} failed login attempts: ${user.email}`);
    }
  }

  return user;
};

// Hash a reset token using SHA-256. The plain token is sent to the user (e.g. via email);
// only the hash is persisted, so a database compromise cannot grant password resets.
userSchema.statics.hashResetToken = function(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Static method to generate password reset token. Returns the plain token to the caller.
userSchema.statics.generatePasswordResetToken = async function(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = this.hashResetToken(token);
  const expires = Date.now() + 60 * 60 * 1000; // 1 hour
  await this.findByIdAndUpdate(
    userId,
    {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: new Date(expires)
    }
  );
  return token;
};

// Static method to find by reset token (caller passes the plain token).
userSchema.statics.findByResetToken = function(token) {
  const tokenHash = this.hashResetToken(token);
  return this.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: Date.now() }
  }).select('+password');
};

module.exports = mongoose.model('User', userSchema);
