const PasswordCategory = require('../models/PasswordCategory');
const logger = require('../config/logger');

const DEFAULT_CATEGORIES = [
  { name: 'Social', icon: '👥', color: '#3B82F6' },
  { name: 'Finance', icon: '💳', color: '#10B981' },
  { name: 'Work', icon: '💼', color: '#F59E0B' },
  { name: 'Shopping', icon: '🛒', color: '#EF4444' },
  { name: 'Entertainment', icon: '🎮', color: '#8B5CF6' },
  { name: 'Other', icon: '📁', color: '#6B7280' }
];

const getAllCategories = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let categories = await PasswordCategory.find({ userId });
    
    if (categories.length === 0) {
      const defaultCats = DEFAULT_CATEGORIES.map(cat => ({
        userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isDefault: true
      }));
      await PasswordCategory.insertMany(defaultCats);
      categories = await PasswordCategory.find({ userId });
    }
    
    res.json(categories);
  } catch (error) {
    logger.error('Get password categories error:', error);
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const existing = await PasswordCategory.findOne({ userId, name });
    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = new PasswordCategory({
      userId,
      name,
      icon: icon || '📁',
      color: color || '#6B7280',
      isDefault: false
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    logger.error('Create password category error:', error);
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { name, icon, color } = req.body;

    const category = await PasswordCategory.findOne({ _id: id, userId });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.isDefault) {
      return res.status(400).json({ error: 'Cannot modify default categories' });
    }

    if (name) category.name = name;
    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();
    res.json(category);
  } catch (error) {
    logger.error('Update password category error:', error);
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const category = await PasswordCategory.findOne({ _id: id, userId });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default categories' });
    }

    await category.deleteOne();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    logger.error('Delete password category error:', error);
    next(error);
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
