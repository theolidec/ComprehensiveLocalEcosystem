const express = require('express');
const { body, param } = require('express-validator');
const WishlistItem = require('../models/WishlistItem');
const WishlistReservation = require('../models/WishlistReservation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const logger = require('../config/logger');
const { publicReservationLimiter } = require('../config/rateLimiter');

const router = express.Router();

const invalidateCache = (token) => {
  const publicItemCache = require('./wishlistPublic').getPublicItemCache();
  if (publicItemCache) {
    publicItemCache.delete(token);
  }
};

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

    if (!item.isPublic && (!req.user || item.user.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

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

    item.reservations.push(reservation._id);
    await item.save();

    if (reservation.status === 'purchased') {
      item.status = 'purchased';
      await item.save();
    }

    logger.info(`Reservation created for item: ${item.title}`);

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

    const isOwner = req.user && reservation.wishlistItem.user.toString() === req.user._id.toString();
    const isPublicItem = reservation.wishlistItem.isPublic;

    if (!isOwner && !isPublicItem) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    if (reservation.status === 'purchased') {
      reservation.wishlistItem.status = 'active';
      await reservation.wishlistItem.save();
    }

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

module.exports = router;
