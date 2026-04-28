const User = require('../models/User');
const Settings = require('../models/Settings');
const RefreshToken = require('../models/RefreshToken');
const Event = require('../models/Event');
const Category = require('../models/Category');
const Password = require('../models/Password');
const PasswordCategory = require('../models/PasswordCategory');
const Wishlist = require('../models/Wishlist');
const WishlistCategory = require('../models/WishlistCategory');
const WishlistItem = require('../models/WishlistItem');
const WishlistReservation = require('../models/WishlistReservation');
const UserFollow = require('../models/UserFollow');
const File = require('../models/File');
const FileFolder = require('../models/FileFolder');
const Wiki = require('../models/Wiki');
const WikiPage = require('../models/WikiPage');
const WikiCategory = require('../models/WikiCategory');
const WikiPermission = require('../models/WikiPermission');
const WikiVersion = require('../models/WikiVersion');
const WikiWatch = require('../models/WikiWatch');
const logger = require('../config/logger');

const getUserData = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password -passwordSalt');
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const settings = await Settings.findOne({ user: userId });
    const refreshTokens = await RefreshToken.find({ user: userId, isRevoked: false })
      .select('deviceInfo createdAt expiresAt');

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      settings: settings || {},
      activeSessions: refreshTokens.map(t => ({
        id: t._id,
        deviceInfo: t.deviceInfo,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt
      }))
    });
  } catch (error) {
    logger.error('Get user data error:', error);
    res.status(500).json({ error: 'Failed to retrieve user data', code: 'SERVER_ERROR' });
  }
};

const updateUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email } = req.body;

    const updateData = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.length > 50) {
        return res.status(400).json({ error: 'Name must be 1-50 characters', code: 'VALIDATION_ERROR' });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format', code: 'VALIDATION_ERROR' });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use', code: 'EMAIL_EXISTS' });
      }
      updateData.email = email.toLowerCase().trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update', code: 'VALIDATION_ERROR' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password -passwordSalt');

    logger.info(`User data updated for user: ${user.email}`);

    res.status(200).json({
      message: 'User data updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    logger.error('Update user data error:', error);
    res.status(500).json({ error: 'Failed to update user data', code: 'SERVER_ERROR' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account', code: 'VALIDATION_ERROR' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn(`Account deletion attempt with invalid password for user: ${user.email}`);
      return res.status(401).json({ error: 'Invalid password', code: 'INVALID_CREDENTIALS' });
    }

    logger.info(`Starting account deletion for user: ${user.email}`);

    await Promise.all([
      RefreshToken.deleteMany({ user: userId }),
      Settings.deleteOne({ user: userId }),
      Event.deleteMany({ user: userId }),
      Category.deleteMany({ user: userId }),
      Password.deleteMany({ user: userId }),
      PasswordCategory.deleteMany({ user: userId }),
      Wishlist.deleteMany({ user: userId }),
      WishlistCategory.deleteMany({ user: userId }),
      WishlistItem.deleteMany({ user: userId }),
      WishlistReservation.deleteMany({ $or: [{ reservedBy: userId }, { owner: userId }] }),
      UserFollow.deleteMany({ $or: [{ follower: userId }, { following: userId }] }),
      File.deleteMany({ user: userId }),
      FileFolder.deleteMany({ user: userId })
    ]);

    const userWikis = await Wiki.find({ owner: userId });
    const wikiIds = userWikis.map(w => w._id);
    if (wikiIds.length > 0) {
      await Promise.all([
        WikiPage.deleteMany({ wiki: { $in: wikiIds } }),
        WikiCategory.deleteMany({ wiki: { $in: wikiIds } }),
        WikiPermission.deleteMany({ wiki: { $in: wikiIds } }),
        WikiVersion.deleteMany({ wiki: { $in: wikiIds } }),
        WikiWatch.deleteMany({ wiki: { $in: wikiIds } }),
        Wiki.deleteMany({ owner: userId })
      ]);
    }

    await User.findByIdAndDelete(userId);

    logger.info(`Account deleted successfully for user ID: ${userId}`);

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account', code: 'SERVER_ERROR' });
  }
};

const exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password -passwordSalt');
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const [
      settings,
      events,
      categories,
      passwords,
      passwordCategories,
      wishlists,
      wishlistCategories,
      wishlistItems,
      following,
      followers,
      files,
      folders,
      wikis
    ] = await Promise.all([
      Settings.findOne({ user: userId }),
      Event.find({ user: userId }).sort({ date: -1 }),
      Category.find({ user: userId }),
      Password.find({ user: userId }),
      PasswordCategory.find({ user: userId }),
      Wishlist.find({ user: userId }),
      WishlistCategory.find({ user: userId }),
      WishlistItem.find({ user: userId }),
      UserFollow.find({ follower: userId }).populate('following', 'name email'),
      UserFollow.find({ following: userId }).populate('follower', 'name email'),
      File.find({ user: userId }),
      FileFolder.find({ user: userId }),
      Wiki.find({ owner: userId })
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      settings: settings || {},
      calendar: {
        events: events.map(e => ({
          id: e._id,
          title: e.title,
          description: e.description,
          date: e.date,
          time: e.time,
          location: e.location,
          category: e.category,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt
        })),
        categories: categories.map(c => ({
          id: c._id,
          name: c.name,
          color: c.color,
          icon: c.icon
        }))
      },
      passwords: {
        categories: passwordCategories.map(c => ({
          id: c._id,
          name: c.name,
          color: c.color,
          icon: c.icon
        })),
        entries: passwords.map(p => ({
          id: p._id,
          title: p.title,
          username: p.username,
          url: p.url,
          category: p.category,
          notes: p.notes,
          favorite: p.favorite,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }))
      },
      wishlists: {
        categories: wishlistCategories.map(c => ({
          id: c._id,
          name: c.name,
          color: c.color,
          icon: c.icon
        })),
        lists: wishlists.map(w => ({
          id: w._id,
          name: w.name,
          description: w.description,
          isPublic: w.isPublic,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt
        })),
        items: wishlistItems.map(i => ({
          id: i._id,
          wishlist: i.wishlist,
          name: i.name,
          description: i.description,
          price: i.price,
          url: i.url,
          imageUrl: i.imageUrl,
          category: i.category,
          priority: i.priority,
          reserved: i.reserved,
          purchased: i.purchased,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt
        }))
      },
      social: {
        following: following.map(f => ({
          id: f._id,
          user: {
            id: f.following._id,
            name: f.following.name,
            email: f.following.email
          },
          createdAt: f.createdAt
        })),
        followers: followers.map(f => ({
          id: f._id,
          user: {
            id: f.follower._id,
            name: f.follower.name,
            email: f.follower.email
          },
          createdAt: f.createdAt
        }))
      },
      files: {
        folders: folders.map(f => ({
          id: f._id,
          name: f.name,
          parentFolder: f.parentFolder,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt
        })),
        files: files.map(f => ({
          id: f._id,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size,
          folder: f.folder,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt
        }))
      },
      wikis: wikis.map(w => ({
        id: w._id,
        name: w.name,
        slug: w.slug,
        description: w.description,
        visibility: w.visibility,
        icon: w.icon,
        color: w.color,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt
      }))
    };

    logger.info(`Data export completed for user: ${user.email}`);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${user.email}-${new Date().toISOString().split('T')[0]}.json"`);
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    logger.error('Export user data error:', error);
    res.status(500).json({ error: 'Failed to export user data', code: 'SERVER_ERROR' });
  }
};

module.exports = {
  getUserData,
  updateUserData,
  deleteAccount,
  exportUserData
};
