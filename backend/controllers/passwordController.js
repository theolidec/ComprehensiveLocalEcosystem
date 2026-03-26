const Password = require('../models/Password');
const passwordEncryption = require('../services/passwordService');
const logger = require('../config/logger');

const getAllPasswords = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { category, favorite, search } = req.query;

    const filter = { userId };
    if (category) filter.category = category;
    if (favorite === 'true') filter.isFavorite = true;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { website: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const passwords = await Password.find(filter).sort({ createdAt: -1 });
    res.json(passwords);
  } catch (error) {
    logger.error('Get all passwords error:', error);
    next(error);
  }
};

const getPasswordById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const password = await Password.findOne({ _id: id, userId });
    if (!password) {
      return res.status(404).json({ error: 'Password not found' });
    }

    res.json(password);
  } catch (error) {
    logger.error('Get password by ID error:', error);
    next(error);
  }
};

const createPassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { title, username, password, website, category, notes, isFavorite } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const encryptedPassword = passwordEncryption.encrypt(password);

    const newPassword = new Password({
      userId,
      title,
      username,
      encryptedPassword,
      website,
      category: category || 'other',
      notes,
      isFavorite: isFavorite || false
    });

    await newPassword.save();
    res.status(201).json(newPassword);
  } catch (error) {
    logger.error('Create password error:', error);
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { title, username, password, website, category, notes, isFavorite } = req.body;

    const existingPassword = await Password.findOne({ _id: id, userId });
    if (!existingPassword) {
      return res.status(404).json({ error: 'Password not found' });
    }

    if (title) existingPassword.title = title;
    if (username !== undefined) existingPassword.username = username;
    if (password) existingPassword.encryptedPassword = passwordEncryption.encrypt(password);
    if (website !== undefined) existingPassword.website = website;
    if (category) existingPassword.category = category;
    if (notes !== undefined) existingPassword.notes = notes;
    if (isFavorite !== undefined) existingPassword.isFavorite = isFavorite;

    await existingPassword.save();
    res.json(existingPassword);
  } catch (error) {
    logger.error('Update password error:', error);
    next(error);
  }
};

const deletePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deletedPassword = await Password.findOneAndDelete({ _id: id, userId });
    if (!deletedPassword) {
      return res.status(404).json({ error: 'Password not found' });
    }

    res.json({ message: 'Password deleted successfully' });
  } catch (error) {
    logger.error('Delete password error:', error);
    next(error);
  }
};

const decryptPassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const password = await Password.findOne({ _id: id, userId });
    if (!password) {
      return res.status(404).json({ error: 'Password not found' });
    }

    const decryptedPassword = passwordEncryption.decrypt(password.encryptedPassword);
    res.json({ password: decryptedPassword });
  } catch (error) {
    logger.error('Decrypt password error:', error);
    next(error);
  }
};

const toggleFavorite = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const password = await Password.findOne({ _id: id, userId });
    if (!password) {
      return res.status(404).json({ error: 'Password not found' });
    }

    password.isFavorite = !password.isFavorite;
    await password.save();
    res.json(password);
  } catch (error) {
    logger.error('Toggle favorite error:', error);
    next(error);
  }
};

module.exports = {
  getAllPasswords,
  getPasswordById,
  createPassword,
  updatePassword,
  deletePassword,
  decryptPassword,
  toggleFavorite
};
