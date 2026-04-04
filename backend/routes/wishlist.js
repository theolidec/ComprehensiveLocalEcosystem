const express = require('express');
const { body, param, validationResult } = require('express-validator');
const WishlistItem = require('../models/WishlistItem');
const WishlistReservation = require('../models/WishlistReservation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const logger = require('../config/logger');
const { publicReservationLimiter } = require('../config/rateLimiter');

const router = express.Router();

// Simple in-memory cache for public wishlist items
const publicItemCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedItem = (token) => {
  const cached = publicItemCache.get(token);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedItem = (token, data) => {
  publicItemCache.set(token, { data, timestamp: Date.now() });
  // Cleanup old entries
  if (publicItemCache.size > 100) {
    const oldestKey = publicItemCache.keys().next().value;
    publicItemCache.delete(oldestKey);
  }
};

const invalidateCache = (token) => {
  publicItemCache.delete(token);
};

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', errors.array());
    return res.status(400).json({
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  next();
};

// Custom URL validator that accepts empty strings
const isValidUrlOrEmpty = (value) => {
  if (!value || value.trim() === '') return true;
  return /^https?:\/\/.+/.test(value);
};

// Get all wishlist items for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, status, priority, search, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };

    if (category && ['birthday', 'christmas', 'other'].includes(category)) {
      query.category = category;
    }
    if (status && ['active', 'purchased', 'archived'].includes(status)) {
      query.status = status;
    }
    if (priority && ['low', 'medium', 'high', 'must-have'].includes(priority)) {
      query.priority = priority;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      WishlistItem.find(query)
        .populate('reservations', 'reservedBy status reservedAt message')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      WishlistItem.countDocuments(query)
    ]);

    res.json({ 
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Get wishlist items error:', error);
    res.status(500).json({
      error: 'Failed to fetch wishlist items',
      code: 'SERVER_ERROR'
    });
  }
});

// Get wishlist stats for the authenticated user
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await WishlistItem.getStatsByUser(req.user._id);
    res.json({ stats });
  } catch (error) {
    logger.error('Get wishlist stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch wishlist stats',
      code: 'SERVER_ERROR'
    });
  }
});

// Get wishlist analytics (detailed stats for charts)
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get items added over time (last 60 days)
    const itemsOverTime = await WishlistItem.aggregate([
      { $match: { user: req.user._id, createdAt: { $gte: sixtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalValue: { $sum: { $ifNull: ['$price', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get status breakdown
    const statusBreakdown = await WishlistItem.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: { $ifNull: ['$price', 0] } } } }
    ]);

    // Get priority breakdown
    const priorityBreakdown = await WishlistItem.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get category breakdown
    const categoryBreakdown = await WishlistItem.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalValue: { $sum: { $ifNull: ['$price', 0] } } } }
    ]);

    // Get monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await WishlistItem.aggregate([
      { $match: { user: req.user._id, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          itemsAdded: { $sum: 1 },
          totalValue: { $sum: { $ifNull: ['$price', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get reservation stats
    const reservationStats = await WishlistReservation.aggregate([
      {
        $lookup: {
          from: 'wishlistitems',
          localField: 'wishlistItem',
          foreignField: '_id',
          as: 'item'
        }
      },
      { $unwind: '$item' },
      { $match: { 'item.user': req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      analytics: {
        itemsOverTime,
        statusBreakdown,
        priorityBreakdown,
        categoryBreakdown,
        monthlyTrends,
        reservationStats
      }
    });
  } catch (error) {
    logger.error('Get wishlist analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      code: 'SERVER_ERROR'
    });
  }
});

// Get a single wishlist item by ID
router.get('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid item ID')
], handleValidationErrors, async (req, res) => {
  try {
    const item = await WishlistItem.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('reservations', 'reservedBy status reservedAt message');

    if (!item) {
      return res.status(404).json({
        error: 'Wishlist item not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({ item });
  } catch (error) {
    logger.error('Get wishlist item error:', error);
    res.status(500).json({
      error: 'Failed to fetch wishlist item',
      code: 'SERVER_ERROR'
    });
  }
});

// Create a new wishlist item
router.post('/', authenticateToken, [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('url').optional({ checkFalsy: true }).trim().custom(isValidUrlOrEmpty).withMessage('Please enter a valid URL'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NOK', 'SEK', 'DKK']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'must-have']),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('imageUrl').optional().trim(),
  body('isPublic').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const itemData = {
      title: req.body.title,
      description: req.body.description,
      url: req.body.url,
      price: req.body.price,
      currency: req.body.currency || 'USD',
      priority: req.body.priority || 'medium',
      category: req.body.category || 'birthday',
      imageUrl: req.body.imageUrl,
      isPublic: req.body.isPublic || false,
      user: req.user._id
    };

    // Generate share token if item is public
    if (itemData.isPublic) {
      itemData.shareToken = WishlistItem.generateShareToken();
    }

    const item = new WishlistItem(itemData);
    await item.save();

    logger.info(`Wishlist item created: ${item.title} by ${req.user.email}`);

    res.status(201).json({
      message: 'Wishlist item created successfully',
      item
    });
  } catch (error) {
    logger.error('Create wishlist item error:', error);
    res.status(500).json({
      error: 'Failed to create wishlist item',
      code: 'SERVER_ERROR'
    });
  }
});

// Update a wishlist item
router.put('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid item ID'),
  body('title').optional().trim().notEmpty()
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('url').optional({ checkFalsy: true }).trim().custom(isValidUrlOrEmpty).withMessage('Please enter a valid URL'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NOK', 'SEK', 'DKK']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'must-have']),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('imageUrl').optional().trim(),
  body('isPublic').optional().isBoolean(),
  body('status').optional().isIn(['active', 'purchased', 'archived'])
], handleValidationErrors, async (req, res) => {
  try {
    const item = await WishlistItem.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        error: 'Wishlist item not found',
        code: 'NOT_FOUND'
      });
    }

    const updates = {};
    const allowedFields = ['title', 'description', 'url', 'price', 'currency', 'priority', 'category', 'imageUrl', 'isPublic', 'status'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle share token for public/private toggle
    if (updates.isPublic !== undefined) {
      if (updates.isPublic && !item.shareToken) {
        updates.shareToken = WishlistItem.generateShareToken();
      } else if (!updates.isPublic) {
        updates.shareToken = null;
      }
    }

    Object.assign(item, updates);
    await item.save();

    logger.info(`Wishlist item updated: ${item.title} by ${req.user.email}`);

    res.json({
      message: 'Wishlist item updated successfully',
      item
    });
  } catch (error) {
    logger.error('Update wishlist item error:', error);
    res.status(500).json({
      error: 'Failed to update wishlist item',
      code: 'SERVER_ERROR'
    });
  }
});

// Delete a wishlist item
router.delete('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid item ID')
], handleValidationErrors, async (req, res) => {
  try {
    const item = await WishlistItem.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        error: 'Wishlist item not found',
        code: 'NOT_FOUND'
      });
    }

    // Delete associated reservations
    await WishlistReservation.deleteMany({ wishlistItem: item._id });

    await item.deleteOne();

    logger.info(`Wishlist item deleted: ${item.title} by ${req.user.email}`);

    res.json({
      message: 'Wishlist item deleted successfully'
    });
  } catch (error) {
    logger.error('Delete wishlist item error:', error);
    res.status(500).json({
      error: 'Failed to delete wishlist item',
      code: 'SERVER_ERROR'
    });
  }
});

// Share/unshare wishlist item (toggle public status)
router.post('/:id/share', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid item ID')
], handleValidationErrors, async (req, res) => {
  try {
    const item = await WishlistItem.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        error: 'Wishlist item not found',
        code: 'NOT_FOUND'
      });
    }

    item.isPublic = !item.isPublic;
    if (item.isPublic && !item.shareToken) {
      item.shareToken = WishlistItem.generateShareToken();
    } else if (!item.isPublic) {
      item.shareToken = null;
    }

    await item.save();

    const shareUrl = item.isPublic
      ? `${process.env.FRONTEND_URL}/wishlist/shared/${item.shareToken}`
      : null;

    logger.info(`Wishlist item ${item.isPublic ? 'shared' : 'unshared'}: ${item.title} by ${req.user.email}`);

    res.json({
      message: item.isPublic ? 'Item is now public' : 'Item is now private',
      isPublic: item.isPublic,
      shareToken: item.shareToken,
      shareUrl
    });
  } catch (error) {
    logger.error('Share wishlist item error:', error);
    res.status(500).json({
      error: 'Failed to update share status',
      code: 'SERVER_ERROR'
    });
  }
});

// Create a reservation for a wishlist item (public endpoint - no auth required)
router.post('/:id/reserve', publicReservationLimiter, optionalAuth, [
  param('id').isMongoId().withMessage('Invalid item ID'),
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email').optional().trim().isEmail().withMessage('Please enter a valid email'),
  body('message').optional().trim().isLength({ max: 200 }),
  body('status').optional().isIn(['reserved', 'purchased']).withMessage('Status must be reserved or purchased')
], handleValidationErrors, async (req, res) => {
  try {
    const item = await WishlistItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        error: 'Wishlist item not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if item is public or user owns it
    if (!item.isPublic && (!req.user || item.user.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Check if item is already purchased
    const existingReservations = await WishlistReservation.find({
      wishlistItem: item._id,
      status: 'purchased'
    });

    if (existingReservations.length > 0) {
      return res.status(400).json({
        error: 'This item has already been purchased',
        code: 'ALREADY_PURCHASED'
      });
    }

    const reservation = new WishlistReservation({
      wishlistItem: item._id,
      reservedBy: {
        name: req.body.name,
        email: req.body.email
      },
      message: req.body.message,
      status: req.body.status || 'reserved'
    });

    await reservation.save();

    // Add reservation to item
    item.reservations.push(reservation._id);
    await item.save();

    // Update item status if purchased
    if (reservation.status === 'purchased') {
      item.status = 'purchased';
      await item.save();
    }

    logger.info(`Reservation created for item: ${item.title}`);

    // Invalidate cache for this item
    if (item.shareToken) {
      invalidateCache(item.shareToken);
    }

    res.status(201).json({
      message: 'Item reserved successfully',
      reservation
    });
  } catch (error) {
    logger.error('Create reservation error:', error);
    res.status(500).json({
      error: 'Failed to create reservation',
      code: 'SERVER_ERROR'
    });
  }
});

// Get reservations for a wishlist item (owner only)
router.get('/:id/reservations', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid item ID')
], handleValidationErrors, async (req, res) => {
  try {
    const item = await WishlistItem.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        error: 'Wishlist item not found',
        code: 'NOT_FOUND'
      });
    }

    const reservations = await WishlistReservation.find({ wishlistItem: item._id })
      .sort({ reservedAt: -1 });

    res.json({ reservations });
  } catch (error) {
    logger.error('Get reservations error:', error);
    res.status(500).json({
      error: 'Failed to fetch reservations',
      code: 'SERVER_ERROR'
    });
  }
});

// Cancel a reservation (owner or the person who reserved)
router.delete('/reservations/:reservationId', optionalAuth, [
  param('reservationId').isMongoId().withMessage('Invalid reservation ID')
], handleValidationErrors, async (req, res) => {
  try {
    const reservation = await WishlistReservation.findById(req.params.reservationId)
      .populate('wishlistItem');

    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if user has permission to cancel
    const isOwner = req.user && reservation.wishlistItem.user.toString() === req.user._id.toString();
    const isPublicItem = reservation.wishlistItem.isPublic;

    if (!isOwner && !isPublicItem) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Update item status if this was a purchase
    if (reservation.status === 'purchased') {
      reservation.wishlistItem.status = 'active';
      await reservation.wishlistItem.save();
    }

    // Remove reservation reference from item
    await WishlistItem.findByIdAndUpdate(
      reservation.wishlistItem._id,
      { $pull: { reservations: reservation._id } }
    );

    await reservation.deleteOne();

    logger.info(`Reservation cancelled for item: ${reservation.wishlistItem.title}`);

    res.json({
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    logger.error('Cancel reservation error:', error);
    res.status(500).json({
      error: 'Failed to cancel reservation',
      code: 'SERVER_ERROR'
    });
  }
});

// Get public wishlist item by share token
router.get('/public/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Check cache first
    const cachedItem = getCachedItem(token);
    if (cachedItem) {
      return res.json({ item: cachedItem });
    }
    
    const item = await WishlistItem.findByShareToken(token);

    if (!item) {
      return res.status(404).json({
        error: 'Wishlist item not found or not public',
        code: 'NOT_FOUND'
      });
    }

    // Cache the result
    setCachedItem(token, item);
    
    res.json({ item });
  } catch (error) {
    logger.error('Get public wishlist item error:', error);
    res.status(500).json({
      error: 'Failed to fetch wishlist item',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
