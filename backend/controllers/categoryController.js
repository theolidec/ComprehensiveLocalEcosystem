const Category = require('../models/Category');
const Event = require('../models/Event');
const logger = require('../config/logger');
const { sendValidationError, sendDuplicateKeyError } = require('../utils/errorResponses');

const createCategory = async (req, res) => {
  try {
    const { name, color, icon } = req.body;

    const category = new Category({
      name,
      color: color || '#3B82F6',
      icon: icon || '📅',
      user: req.user._id
    });

    await category.save();

    logger.info(`Category created: ${category.name} by ${req.user.email}`);

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    logger.error('Category creation error:', error);
    
    if (error.code === 11000) {
      return sendDuplicateKeyError(res, 'Category name already exists', 'DUPLICATE_CATEGORY');
    }

    if (error.name === 'ValidationError') {
      return sendValidationError(res, error);
    }

    res.status(500).json({
      error: 'Failed to create category',
      code: 'CATEGORY_CREATE_ERROR'
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check if user has any categories, if not create default ones
    const existingCategories = await Category.find({ user: userId });
    if (existingCategories.length === 0) {
      try {
        await Category.createDefaultCategories(userId);
      } catch (createError) {
        logger.error('Failed to create default categories for existing user:', createError);
      }
    }
    
    const categories = await Category.find({ user: userId }).sort({ isDefault: -1, name: 1 });

    res.status(200).json({ categories });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      code: 'CATEGORIES_FETCH_ERROR'
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    // Don't allow updating default categories
    const category = await Category.findOne({ _id: id, user: userId });
    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    if (category.isDefault) {
      return res.status(400).json({
        error: 'Cannot update default categories',
        code: 'CANNOT_UPDATE_DEFAULT'
      });
    }

    const updatedCategory = await Category.findOneAndUpdate(
      { _id: id, user: userId },
      updates,
      { new: true, runValidators: true }
    );

    logger.info(`Category updated: ${updatedCategory.name} by ${req.user.email}`);

    res.status(200).json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    logger.error('Category update error:', error);

    if (error.code === 11000) {
      return sendDuplicateKeyError(res, 'Category name already exists', 'DUPLICATE_CATEGORY');
    }

    if (error.name === 'ValidationError') {
      return sendValidationError(res, error);
    }

    res.status(500).json({
      error: 'Failed to update category',
      code: 'CATEGORY_UPDATE_ERROR'
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const category = await Category.findOne({ _id: id, user: userId });
    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    if (category.isDefault) {
      return res.status(400).json({
        error: 'Cannot delete default categories',
        code: 'CANNOT_DELETE_DEFAULT'
      });
    }

    // Check if category is being used by any events
    const eventsWithCategory = await Event.countDocuments({ 
      user: userId, 
      category: category.name 
    });

    if (eventsWithCategory > 0) {
      return res.status(400).json({
        error: 'Cannot delete category that is in use',
        code: 'CATEGORY_IN_USE',
        eventCount: eventsWithCategory
      });
    }

    await Category.findOneAndDelete({ _id: id, user: userId });

    logger.info(`Category deleted: ${category.name} by ${req.user.email}`);

    res.status(200).json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    logger.error('Category deletion error:', error);

    res.status(500).json({
      error: 'Failed to delete category',
      code: 'CATEGORY_DELETE_ERROR'
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
};
