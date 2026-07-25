const express = require('express');
const { body, param } = require('express-validator');
const Wishlist = require('../models/Wishlist');
const WishlistItem = require('../models/WishlistItem');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const logger = require('../config/logger');

const router = express.Router();

// Get available templates
router.get('/templates', (req, res) => {
  const templates = Wishlist.getTemplates();
  res.json({ templates });
});

// Create wishlist from template
router.post('/from-template', authenticateToken, [
  body('template').isIn(['birthday', 'christmas', 'wedding', 'baby_shower', 'housewarming']).withMessage('Invalid template'),
  body('name').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 50 })
], handleValidationErrors, async (req, res) => {
  try {
    const wishlist = await Wishlist.createFromTemplate(req.user._id, req.body.template, req.body.name);
    logger.info(`Wishlist created from template: ${wishlist.name} by ${req.user.email}`);
    res.status(201).json({ wishlist: { ...wishlist.toObject(), itemCount: 0 } });
  } catch (error) {
    logger.error('Create wishlist from template error:', error);
    res.status(500).json({ error: 'Failed to create wishlist', code: 'SERVER_ERROR' });
  }
});

// Get all wishlists for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    let wishlists = await Wishlist.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    
    if (wishlists.length === 0) {
      const defaultList = await Wishlist.createDefaultWishlist(req.user._id);
      wishlists = [defaultList];
    }
    
    const wishlistIds = wishlists.map(w => w._id);
    const counts = await WishlistItem.aggregate([
      { $match: { wishlist: { $in: wishlistIds }, user: req.user._id } },
      { $group: { _id: '$wishlist', count: { $sum: 1 } } }
    ]);
    
    const countMap = new Map(counts.map(c => [c._id.toString(), c.count]));
    const wishlistsWithCounts = wishlists.map(wl => ({
      ...wl.toObject(),
      itemCount: countMap.get(wl._id.toString()) || 0
    }));
    
    res.json({ wishlists: wishlistsWithCounts });
  } catch (error) {
    logger.error('Get wishlists error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlists', code: 'SERVER_ERROR' });
  }
});

// Create a new wishlist
router.post('/', authenticateToken, [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
  body('description').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 200 }),
  body('color').optional({ nullable: true, checkFalsy: true }).trim().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  body('coverImage').optional({ nullable: true, checkFalsy: true }).trim()
], handleValidationErrors, async (req, res) => {
  try {
    const wishlist = new Wishlist({
      name: req.body.name,
      description: req.body.description,
      user: req.user._id,
      color: req.body.color || '#8b5cf6',
      coverImage: req.body.coverImage,
      isDefault: false
    });
    
    await wishlist.save();
    logger.info(`Wishlist created: ${wishlist.name} by ${req.user.email}`);
    res.status(201).json({ wishlist: { ...wishlist.toObject(), itemCount: 0 } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A wishlist with this name already exists', code: 'DUPLICATE_NAME' });
    }
    logger.error('Create wishlist error:', error);
    res.status(500).json({ error: 'Failed to create wishlist', code: 'SERVER_ERROR' });
  }
});

// Update a wishlist
router.put('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid wishlist ID'),
  body('name').optional({ nullable: true, checkFalsy: true }).trim().notEmpty().isLength({ max: 50 }),
  body('description').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 200 }),
  body('color').optional({ nullable: true, checkFalsy: true }).trim().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
], handleValidationErrors, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found', code: 'NOT_FOUND' });
    }
    
    if (wishlist.isDefault && req.body.name && req.body.name !== wishlist.name) {
      return res.status(403).json({ error: 'Cannot rename default wishlist', code: 'DEFAULT_PROTECTED' });
    }
    
    if (req.body.name) wishlist.name = req.body.name;
    if (req.body.description !== undefined) wishlist.description = req.body.description;
    if (req.body.color) wishlist.color = req.body.color;
    if (req.body.coverImage !== undefined) wishlist.coverImage = req.body.coverImage;
    
    await wishlist.save();
    res.json({ wishlist });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A wishlist with this name already exists', code: 'DUPLICATE_NAME' });
    }
    logger.error('Update wishlist error:', error);
    res.status(500).json({ error: 'Failed to update wishlist', code: 'SERVER_ERROR' });
  }
});

// Delete a wishlist (move items to default or delete)
router.delete('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid wishlist ID')
], handleValidationErrors, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found', code: 'NOT_FOUND' });
    }
    
    if (wishlist.isDefault) {
      return res.status(403).json({ error: 'Cannot delete default wishlist', code: 'DEFAULT_PROTECTED' });
    }
    
    const defaultWishlist = await Wishlist.findOne({ user: req.user._id, isDefault: true });
    if (defaultWishlist) {
      await WishlistItem.updateMany(
        { wishlist: wishlist._id },
        { wishlist: defaultWishlist._id }
      );
    }
    
    await wishlist.deleteOne();
    logger.info(`Wishlist deleted: ${wishlist.name} by ${req.user.email}`);
    res.json({ message: 'Wishlist deleted successfully' });
  } catch (error) {
    logger.error('Delete wishlist error:', error);
    res.status(500).json({ error: 'Failed to delete wishlist', code: 'SERVER_ERROR' });
  }
});

// Get single wishlist with items
router.get('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid wishlist ID')
], handleValidationErrors, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found', code: 'NOT_FOUND' });
    }
    
    const items = await WishlistItem.find({ wishlist: wishlist._id, user: req.user._id })
      .populate('reservations', 'reservedBy status reservedAt message')
      .sort({ priority: -1, createdAt: -1 });
    
    res.json({ wishlist, items });
  } catch (error) {
    logger.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist', code: 'SERVER_ERROR' });
  }
});

module.exports = router;
