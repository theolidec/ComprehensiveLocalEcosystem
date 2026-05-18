const mongoose = require('mongoose');
const User = require('../models/User');
const Settings = require('../models/Settings');
const RefreshToken = require('../models/RefreshToken');
const Event = require('../models/Event');
const Category = require('../models/Category');
const Password = require('../models/Password');
const PasswordCategory = require('../models/PasswordCategory');
const PaymentCard = require('../models/PaymentCard');
const Wishlist = require('../models/Wishlist');
const WishlistCategory = require('../models/WishlistCategory');
const WishlistItem = require('../models/WishlistItem');
const WishlistReservation = require('../models/WishlistReservation');
const UserFollow = require('../models/UserFollow');
const File = require('../models/File');
const FileFolder = require('../models/FileFolder');
const DocumentVersion = require('../models/DocumentVersion');
const Wiki = require('../models/Wiki');
const WikiPage = require('../models/WikiPage');
const WikiCategory = require('../models/WikiCategory');
const WikiPermission = require('../models/WikiPermission');
const WikiVersion = require('../models/WikiVersion');
const WikiWatch = require('../models/WikiWatch');
const TrackerTask = require('../models/TrackerTask');
const TrackerQuestion = require('../models/TrackerQuestion');
const TrackerResponse = require('../models/TrackerResponse');
const logger = require('../config/logger');

const getUserData = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password -passwordSalt');
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const settings = await Settings.findOne({ userId });
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

    // Perform the full erasure cascade. When called with a session, every operation
    // participates in the same transaction so that either all data is erased or
    // none of it is (GDPR Art. 17). When called without a session (standalone
    // MongoDB without a replica set), operations run non-atomically.
    const performErasure = async (session) => {
      const opt = session ? { session } : {};

      // Delete reservations on this user's wishlist items before deleting the items.
      const userWishlistItems = await WishlistItem.find({ user: userId }, null, opt);
      const userWishlistItemIds = userWishlistItems.map(i => i._id);
      if (userWishlistItemIds.length > 0) {
        await WishlistReservation.deleteMany({ wishlistItem: { $in: userWishlistItemIds } }, opt);
      }

      // Delete document versions for this user's files (file cleanup will follow).
      const userFiles = await File.find({ userId }, null, opt);
      const userFileIds = userFiles.map(f => f._id);
      if (userFileIds.length > 0) {
        await DocumentVersion.deleteMany({ fileId: { $in: userFileIds } }, opt);
      }

      // Inside a transaction, sequential ops avoid write-conflict retries. Outside,
      // sequential is only marginally slower than Promise.all and far simpler to reason
      // about for a one-time per-user operation.
      await RefreshToken.deleteMany({ user: userId }, opt);
      await Settings.deleteOne({ userId }, opt);
      await Event.deleteMany({ user: userId }, opt);
      await Category.deleteMany({ user: userId }, opt);
      await Password.deleteMany({ userId }, opt);
      await PasswordCategory.deleteMany({ userId }, opt);
      await PaymentCard.deleteMany({ userId }, opt);
      await Wishlist.deleteMany({ user: userId }, opt);
      await WishlistCategory.deleteMany({ user: userId }, opt);
      await WishlistItem.deleteMany({ user: userId }, opt);
      await UserFollow.deleteMany({ $or: [{ follower: userId }, { following: userId }] }, opt);
      await File.deleteMany({ userId }, opt);
      await FileFolder.deleteMany({ userId }, opt);
      await TrackerTask.deleteMany({ user: userId }, opt);
      await TrackerQuestion.deleteMany({ user: userId }, opt);
      await TrackerResponse.deleteMany({ user: userId }, opt);
      // Memberships in other users' wikis and watch entries owned by this user
      await WikiPermission.deleteMany({ user: userId }, opt);
      await WikiWatch.deleteMany({ user: userId }, opt);

      const userWikis = await Wiki.find({ owner: userId }, null, opt);
      const wikiIds = userWikis.map(w => w._id);
      if (wikiIds.length > 0) {
        await WikiPage.deleteMany({ wiki: { $in: wikiIds } }, opt);
        await WikiCategory.deleteMany({ wiki: { $in: wikiIds } }, opt);
        await WikiPermission.deleteMany({ wiki: { $in: wikiIds } }, opt);
        await WikiVersion.deleteMany({ wiki: { $in: wikiIds } }, opt);
        await WikiWatch.deleteMany({ wiki: { $in: wikiIds } }, opt);
        await Wiki.deleteMany({ owner: userId }, opt);
      }

      await User.findByIdAndDelete(userId, opt);
    };

    let session = null;
    try {
      session = await mongoose.startSession();
      await session.withTransaction(() => performErasure(session));
    } catch (txErr) {
      // Standalone (non-replica-set) MongoDB does not support transactions. In that
      // case, fall back to non-atomic erasure and warn the operator. This is the only
      // error we tolerate here; everything else is re-thrown.
      const isStandaloneError =
        txErr && (
          txErr.code === 20 ||
          txErr.codeName === 'IllegalOperation' ||
          /Transaction numbers are only allowed on a replica set/i.test(String(txErr.message || ''))
        );
      if (!isStandaloneError) {
        throw txErr;
      }
      logger.warn(
        'MongoDB transactions are unavailable on this deployment (standalone server). ' +
        'Performing non-atomic GDPR erasure; if this fails partway through, an operator ' +
        'must run a sweeper to remove orphan records. Enable a replica set to make ' +
        'erasure atomic.'
      );
      await performErasure(null);
    } finally {
      if (session) {
        await session.endSession();
      }
    }

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
      paymentCards,
      wishlists,
      wishlistCategories,
      wishlistItems,
      following,
      followers,
      files,
      folders,
      wikis,
      trackerTasks,
      trackerQuestions,
      trackerResponses
    ] = await Promise.all([
      Settings.findOne({ userId }),
      Event.find({ user: userId }).sort({ date: -1 }),
      Category.find({ user: userId }),
      Password.find({ userId }),
      PasswordCategory.find({ userId }),
      PaymentCard.find({ userId }),
      Wishlist.find({ user: userId }),
      WishlistCategory.find({ user: userId }),
      WishlistItem.find({ user: userId }),
      UserFollow.find({ follower: userId }).populate('following', 'name'),
      UserFollow.find({ following: userId }).populate('follower', 'name'),
      File.find({ userId }),
      FileFolder.find({ userId }),
      Wiki.find({ owner: userId }),
      TrackerTask.find({ user: userId }),
      TrackerQuestion.find({ user: userId }),
      TrackerResponse.find({ user: userId })
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        // Demonstrable-consent record (GDPR Art. 7(1)). Included in the export so
        // the user can see exactly what they accepted, when, from which IP, and
        // against which version of our policies.
        consent: user.consent || null
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
          email: p.email,
          website: p.website,
          encryptedPassword: p.encryptedPassword,
          category: p.category,
          notes: p.notes,
          isFavorite: p.isFavorite,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }))
      },
      paymentCards: paymentCards.map(c => ({
        id: c._id,
        cardName: c.cardName,
        cardholderName: c.cardholderName,
        encryptedCardNumber: c.encryptedCardNumber,
        encryptedExpiryDate: c.encryptedExpiryDate,
        encryptedCVV: c.encryptedCVV,
        cardType: c.cardType,
        lastFourDigits: c.lastFourDigits,
        billingAddress: c.billingAddress,
        isDefault: c.isDefault,
        isFavorite: c.isFavorite,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      })),
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
          template: w.template,
          color: w.color,
          isDefault: w.isDefault,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt
        })),
        items: wishlistItems.map(i => ({
          id: i._id,
          wishlist: i.wishlist,
          title: i.title,
          description: i.description,
          price: i.price,
          currency: i.currency,
          url: i.url,
          imageUrl: i.imageUrl,
          category: i.category,
          priority: i.priority,
          status: i.status,
          isPublic: i.isPublic,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt
        }))
      },
      tracker: {
        tasks: trackerTasks,
        questions: trackerQuestions,
        responses: trackerResponses
      },
      social: {
        following: following.map(f => ({
          id: f._id,
          user: f.following ? {
            id: f.following._id,
            name: f.following.name
          } : null,
          createdAt: f.createdAt
        })),
        followers: followers.map(f => ({
          id: f._id,
          user: f.follower ? {
            id: f.follower._id,
            name: f.follower.name
          } : null,
          createdAt: f.createdAt
        }))
      },
      files: {
        folders: folders.map(f => ({
          id: f._id,
          name: f.name,
          parentId: f.parentId,
          color: f.color,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt
        })),
        files: files.map(f => ({
          id: f._id,
          originalName: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
          folderId: f.folderId,
          description: f.description,
          tags: f.tags,
          isFavorite: f.isFavorite,
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
