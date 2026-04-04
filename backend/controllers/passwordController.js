const Password = require('../models/Password');
const User = require('../models/User');
const passwordEncryption = require('../services/passwordService');
const logger = require('../config/logger');

const getUserSalt = async (userId) => {
  const user = await User.findById(userId).select('+passwordSalt');
  if (!user) {
    throw new Error('User not found');
  }
  if (!user.passwordSalt) {
    user.passwordSalt = require('crypto').randomBytes(32).toString('hex');
    await user.save();
    logger.info(`Generated passwordSalt for user ${userId}`);
  }
  return user.passwordSalt;
};

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

    const userSalt = await getUserSalt(userId);
    const encryptedPassword = passwordEncryption.encrypt(password, userSalt);

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
    if (password) {
      const userSalt = await getUserSalt(userId);
      existingPassword.encryptedPassword = passwordEncryption.encrypt(password, userSalt);
    }
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

    const userSalt = await getUserSalt(userId);
    const decryptedPassword = passwordEncryption.decrypt(password.encryptedPassword, userSalt);
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

const exportPasswords = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const passwords = await Password.find({ userId });
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userId: userId.toString(),
      passwords: passwords.map(p => ({
        title: p.title,
        username: p.username,
        encryptedPassword: p.encryptedPassword,
        website: p.website,
        category: p.category,
        notes: p.notes,
        isFavorite: p.isFavorite,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=passwords-backup.json');
    res.json(exportData);
  } catch (error) {
    logger.error('Export passwords error:', error);
    next(error);
  }
};

const importPasswords = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { passwords, password } = req.body;

    if (!passwords || !Array.isArray(passwords)) {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Encryption password is required' });
    }

    const userSalt = await getUserSalt(userId);
    const imported = [];
    const errors = [];

    for (const item of passwords) {
      try {
        const newPassword = new Password({
          userId,
          title: item.title,
          username: item.username,
          encryptedPassword: item.encryptedPassword,
          website: item.website,
          category: item.category || 'other',
          notes: item.notes,
          isFavorite: item.isFavorite || false
        });
        await newPassword.save();
        imported.push(item.title);
      } catch (err) {
        errors.push({ title: item.title, error: err.message });
      }
    }

    res.json({ 
      message: `Successfully imported ${imported.length} passwords`,
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    logger.error('Import passwords error:', error);
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
  toggleFavorite,
  exportPasswords,
  importPasswords
};
