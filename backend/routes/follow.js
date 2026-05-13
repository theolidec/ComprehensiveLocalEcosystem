const express = require('express');
const { param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const UserFollow = require('../models/UserFollow');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../config/logger');
const { escapeRegex } = require('../utils/regex');

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array(), code: 'VALIDATION_ERROR' });
  }
  next();
};

// Get followers of a user
router.get('/:userId/followers', authenticateToken, [
  param('userId').isMongoId().withMessage('Invalid user ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await UserFollow.getFollowers(req.params.userId, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    logger.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to fetch followers', code: 'SERVER_ERROR' });
  }
});

// Get users that a user is following
router.get('/:userId/following', authenticateToken, [
  param('userId').isMongoId().withMessage('Invalid user ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await UserFollow.getFollowing(req.params.userId, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    logger.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to fetch following', code: 'SERVER_ERROR' });
  }
});

// Follow a user
router.post('/follow/:userId', authenticateToken, [
  param('userId').isMongoId().withMessage('Invalid user ID')
], handleValidationErrors, async (req, res) => {
  try {
    const targetUserId = new mongoose.Types.ObjectId(req.params.userId);
    const followerId = req.user._id;
    
    if (followerId.toString() === targetUserId.toString()) {
      return res.status(400).json({ error: 'Cannot follow yourself', code: 'SELF_FOLLOW' });
    }
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    }
    
    await UserFollow.follow(followerId, targetUserId);
    logger.info(`User ${req.user.email} followed user ${targetUserId}`);
    
    res.status(201).json({ message: 'Successfully followed user' });
  } catch (error) {
    logger.error('Follow error:', error);
    res.status(500).json({ error: error.message || 'Failed to follow user', code: 'SERVER_ERROR' });
  }
});

// Unfollow a user
router.delete('/follow/:userId', authenticateToken, [
  param('userId').isMongoId().withMessage('Invalid user ID')
], handleValidationErrors, async (req, res) => {
  try {
    const targetUserId = new mongoose.Types.ObjectId(req.params.userId);
    const followerId = req.user._id;
    
    await UserFollow.unfollow(followerId, targetUserId);
    logger.info(`User ${req.user.email} unfollowed user ${targetUserId}`);
    
    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    logger.error('Unfollow error:', error);
    res.status(500).json({ error: 'Failed to unfollow user', code: 'SERVER_ERROR' });
  }
});

// Check if following
router.get('/following/:userId', authenticateToken, [
  param('userId').isMongoId().withMessage('Invalid user ID')
], handleValidationErrors, async (req, res) => {
  try {
    const targetUserId = new mongoose.Types.ObjectId(req.params.userId);
    const follow = await UserFollow.findOne({ 
      follower: req.user._id, 
      following: targetUserId 
    });
    res.json({ isFollowing: !!follow });
  } catch (error) {
    logger.error('Check follow error:', error);
    res.status(500).json({ error: 'Failed to check follow status', code: 'SERVER_ERROR' });
  }
});

// Get public user profiles with their public wishlists
router.get('/public/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name email');
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    }
    
    const WishlistItem = require('../models/WishlistItem');
    const publicItems = await WishlistItem.find({
      user: req.params.userId,
      isPublic: true
    }).select('title description price category priority createdAt');
    
    const isFollowing = await UserFollow.findOne({
      follower: req.user._id,
      following: req.params.userId
    });
    
    res.json({
      user: {
        id: user._id,
        name: user.name
      },
      publicItemCount: publicItems.length,
      items: publicItems,
      isFollowing: !!isFollowing
    });
  } catch (error) {
    logger.error('Get public profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', code: 'SERVER_ERROR' });
  }
});

// Search users to follow
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ users: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const safeQ = escapeRegex(q);
    const matchFilter = {
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: safeQ, $options: 'i' } },
        { email: { $regex: safeQ, $options: 'i' } }
      ]
    };
    const [users, total] = await Promise.all([
      User.find(matchFilter)
        .select('name email')
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(matchFilter)
    ]);
    
    // Get following status for each user
    const userIds = users.map(u => u._id);
    const following = await UserFollow.find({
      follower: req.user._id,
      following: { $in: userIds }
    });
    
    const followingIds = new Set(following.map(f => f.following.toString()));
    const usersWithStatus = users.map(u => ({
      ...u.toObject(),
      isFollowing: followingIds.has(u._id.toString())
    }));
    
    res.json({
      users: usersWithStatus,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users', code: 'SERVER_ERROR' });
  }
});

module.exports = router;
