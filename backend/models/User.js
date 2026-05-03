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
    minlength: [6, 'Password must be at least 6 characters long'],
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

// Instance method to generate access token
userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    { 
      userId: this._id,
      email: this.email 
    },
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

// Static method to find user by email with password
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email }).select('+password');
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
userSchema.statics.incrementLoginAttempts = function(userId) {
  return this.findByIdAndUpdate(
    userId,
    { 
      $inc: { loginAttempts: 1 },
      $set: { lockUntil: this.loginAttempts + 1 >= 5 ? Date.now() + 2 * 60 * 60 * 1000 : undefined } // Lock for 2 hours after 5 attempts
    },
    { new: true }
  );
};

// Static method to generate password reset token
userSchema.statics.generatePasswordResetToken = function(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 60 * 60 * 1000; // 1 hour
  return this.findByIdAndUpdate(
    userId,
    {
      resetPasswordToken: token,
      resetPasswordExpires: new Date(expires)
    },
    { new: true }
  );
};

// Static method to find by reset token
userSchema.statics.findByResetToken = function(token) {
  return this.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  }).select('+password');
};

module.exports = mongoose.model('User', userSchema);
