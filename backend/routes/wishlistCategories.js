const express = require('express');
const { body, param } = require('express-validator');
const WishlistCategory = require('../models/WishlistCategory');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const logger = require('../config/logger');

const router = express.Router();

// Helper function to handle validation errors
// Get all categories for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    let categories = await WishlistCategory.find({ user: req.user._id })
      .sort({ isDefault: -1, name: 1 });

    // Auto-initialize default categories if user has none
    if (categories.length === 0) {
      await WishlistCategory.createDefaultCategories(req.user._id);
      categories = await WishlistCategory.find({ user: req.user._id })
        .sort({ isDefault: -1, name: 1 });
      logger.info(`Auto-initialized default wishlist categories for user: ${req.user.email}`);
    }

    res.json({ categories });
  } catch (error) {
    logger.error('Get wishlist categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      code: 'SERVER_ERROR'
    });
  }
});

// Create a new custom category
router.post('/', authenticateToken, [
  body('name').trim().notEmpty().withMessage('Category name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('color').optional().trim().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Please enter a valid hex color'),
  body('icon').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const categoryData = {
      name: req.body.name,
      color: req.body.color || '#8b5cf6',
      icon: req.body.icon || 'gift',
      user: req.user._id,
      isDefault: false
    };

    const category = new WishlistCategory(categoryData);
    await category.save();

    logger.info(`Wishlist category created: ${category.name} by ${req.user.email}`);

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'A category with this name already exists',
        code: 'DUPLICATE_NAME'
      });
    }
    logger.error('Create wishlist category error:', error);
    res.status(500).json({
      error: 'Failed to create category',
      code: 'SERVER_ERROR'
    });
  }
});

// Update a category
router.put('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid category ID'),
  body('name').optional().trim().notEmpty()
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('color').optional().trim().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Please enter a valid hex color'),
  body('icon').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const category = await WishlistCategory.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        code: 'NOT_FOUND'
      });
    }

    // Prevent updating default categories' names
    if (category.isDefault && req.body.name && req.body.name !== category.name) {
      return res.status(403).json({
        error: 'Cannot rename default categories',
        code: 'DEFAULT_CATEGORY_PROTECTED'
      });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.color !== undefined) updates.color = req.body.color;
    if (req.body.icon !== undefined) updates.icon = req.body.icon;

    Object.assign(category, updates);
    await category.save();

    logger.info(`Wishlist category updated: ${category.name} by ${req.user.email}`);

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'A category with this name already exists',
        code: 'DUPLICATE_NAME'
      });
    }
    logger.error('Update wishlist category error:', error);
    res.status(500).json({
      error: 'Failed to update category',
      code: 'SERVER_ERROR'
    });
  }
});

// Delete a category
router.delete('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid category ID')
], handleValidationErrors, async (req, res) => {
  try {
    const category = await WishlistCategory.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        code: 'NOT_FOUND'
      });
    }

    // Prevent deleting default categories
    if (category.isDefault) {
      return res.status(403).json({
        error: 'Cannot delete default categories',
        code: 'DEFAULT_CATEGORY_PROTECTED'
      });
    }

    await category.deleteOne();

    logger.info(`Wishlist category deleted: ${category.name} by ${req.user.email}`);

    res.json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    logger.error('Delete wishlist category error:', error);
    res.status(500).json({
      error: 'Failed to delete category',
      code: 'SERVER_ERROR'
    });
  }
});

// Initialize default categories for a user
router.post('/init', authenticateToken, async (req, res) => {
  try {
    await WishlistCategory.createDefaultCategories(req.user._id);

    const categories = await WishlistCategory.find({ user: req.user._id })
      .sort({ isDefault: -1, name: 1 });

    res.json({
      message: 'Default categories initialized',
      categories
    });
  } catch (error) {
    logger.error('Init wishlist categories error:', error);
    res.status(500).json({
      error: 'Failed to initialize categories',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
