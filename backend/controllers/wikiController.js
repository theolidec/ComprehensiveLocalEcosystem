const Wiki = require('../models/Wiki');
const WikiPage = require('../models/WikiPage');
const WikiPermission = require('../models/WikiPermission');
const WikiCategory = require('../models/WikiCategory');
const logger = require('../config/logger');

const createWiki = async (req, res) => {
  try {
    const { name, description, visibility, icon, color } = req.body;
    
    const slug = await Wiki.generateSlug(name);
    
    const wiki = new Wiki({
      name,
      slug,
      description: description || '',
      owner: req.user._id,
      visibility: visibility || 'private',
      icon: icon || 'book',
      color: color || '#3B82F6',
      allowPublicRead: visibility === 'public',
      allowPublicEdit: false
    });
    
    await wiki.save();
    
    const homePage = new WikiPage({
      wiki: wiki._id,
      title: 'Home',
      slug: 'home',
      content: `# Welcome to ${name}\n\nThis is the home page of your wiki. Edit it to get started!`,
      isHomePage: true,
      lastEditedBy: req.user._id
    });
    await homePage.save();
    
    logger.info(`Wiki created: ${wiki.name} by ${req.user.email}`);
    
    res.status(201).json({
      message: 'Wiki created successfully',
      wiki
    });
  } catch (error) {
    logger.error('Wiki creation error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Wiki with this name already exists',
        code: 'WIKI_EXISTS'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      error: 'Failed to create wiki',
      code: 'WIKI_CREATE_ERROR'
    });
  }
};

const getWikis = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const ownedWikis = await Wiki.find({ owner: userId }).sort({ createdAt: -1 });
    
    const permissions = await WikiPermission.find({ user: userId })
      .populate('wiki');
    
    const teamWikis = permissions
      .filter(p => p.wiki)
      .map(p => ({ ...p.wiki.toObject(), role: p.role }));
    
    const publicWikis = await Wiki.find({
      $or: [
        { visibility: 'public' },
        { allowPublicRead: true }
      ],
      owner: { $ne: userId }
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      owned: ownedWikis,
      team: teamWikis,
      public: publicWikis
    });
  } catch (error) {
    logger.error('Get wikis error:', error);
    res.status(500).json({
      error: 'Failed to fetch wikis',
      code: 'WIKIS_FETCH_ERROR'
    });
  }
};

const getPublicWikis = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const total = await Wiki.countDocuments({
      $or: [
        { visibility: 'public' },
        { allowPublicRead: true }
      ]
    });
    
    const wikis = await Wiki.find({
      $or: [
        { visibility: 'public' },
        { allowPublicRead: true }
      ]
    })
    .populate('owner', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
    res.status(200).json({
      wikis,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get public wikis error:', error);
    res.status(500).json({
      error: 'Failed to fetch public wikis',
      code: 'PUBLIC_WIKIS_ERROR'
    });
  }
};

const getWiki = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const wiki = await Wiki.findOne({ slug })
      .populate('owner', 'name email');
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canView = wiki.canView(req.user);
    if (!canView) {
      return res.status(403).json({
        error: 'You do not have permission to view this wiki',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const canEdit = wiki.canEdit(req.user);
    let role = null;
    if (req.user) {
      role = await WikiPermission.getUserRole(wiki._id, req.user._id);
      if (wiki.owner.toString() === req.user._id.toString()) {
        role = 'owner';
      }
    }
    
    res.status(200).json({
      wiki,
      permissions: {
        canView,
        canEdit,
        role
      }
    });
  } catch (error) {
    logger.error('Get wiki error:', error);
    res.status(500).json({
      error: 'Failed to fetch wiki',
      code: 'WIKI_FETCH_ERROR'
    });
  }
};

const updateWiki = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, description, visibility, icon, color, allowPublicRead, allowPublicEdit } = req.body;
    
    const wiki = await Wiki.findOne({ slug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const isOwner = wiki.owner.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({
        error: 'Only the owner can update wiki settings',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    if (name && name !== wiki.name) {
      const newSlug = await Wiki.generateSlug(name);
      wiki.name = name;
      wiki.slug = newSlug;
    }
    
    if (description !== undefined) wiki.description = description;
    if (visibility) wiki.visibility = visibility;
    if (icon) wiki.icon = icon;
    if (color) wiki.color = color;
    if (allowPublicRead !== undefined) {
      wiki.allowPublicRead = allowPublicRead;
      if (allowPublicRead && wiki.visibility !== 'public') {
        wiki.visibility = 'public';
      }
    }
    if (allowPublicEdit !== undefined) wiki.allowPublicEdit = allowPublicEdit;
    
    await wiki.save();
    
    logger.info(`Wiki updated: ${wiki.name} by ${req.user.email}`);
    
    res.status(200).json({
      message: 'Wiki updated successfully',
      wiki
    });
  } catch (error) {
    logger.error('Wiki update error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Wiki with this name already exists',
        code: 'WIKI_EXISTS'
      });
    }
    
    res.status(500).json({
      error: 'Failed to update wiki',
      code: 'WIKI_UPDATE_ERROR'
    });
  }
};

const deleteWiki = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const wiki = await Wiki.findOne({ slug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const isOwner = wiki.owner.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({
        error: 'Only the owner can delete this wiki',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    await WikiPage.deleteMany({ wiki: wiki._id });
    await WikiPermission.deleteMany({ wiki: wiki._id });
    await WikiCategory.deleteMany({ wiki: wiki._id });
    await wiki.deleteOne();
    
    logger.info(`Wiki deleted: ${wiki.name} by ${req.user.email}`);
    
    res.status(200).json({
      message: 'Wiki deleted successfully'
    });
  } catch (error) {
    logger.error('Wiki delete error:', error);
    res.status(500).json({
      error: 'Failed to delete wiki',
      code: 'WIKI_DELETE_ERROR'
    });
  }
};

const getWikiMembers = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const wiki = await Wiki.findOne({ slug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const isOwner = wiki.owner.toString() === req.user._id.toString();
    const isAdmin = isOwner || await WikiPermission.isAdmin(wiki._id, req.user._id);
    
    if (!isOwner) {
      return res.status(403).json({
        error: 'Only the owner can view members',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const members = await WikiPermission.getWikiMembers(wiki._id);
    
    res.status(200).json({
      owner: {
        id: wiki.owner._id,
        name: wiki.owner.name,
        email: wiki.owner.email
      },
      members
    });
  } catch (error) {
    logger.error('Get wiki members error:', error);
    res.status(500).json({
      error: 'Failed to fetch wiki members',
      code: 'WIKI_MEMBERS_ERROR'
    });
  }
};

const addWikiMember = async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId, role } = req.body;
    
    const wiki = await Wiki.findOne({ slug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const isOwner = wiki.owner.toString() === req.user._id.toString();
    const currentRole = await WikiPermission.getUserRole(wiki._id, req.user._id);
    const canAdd = isOwner || currentRole === 'admin';
    
    if (!canAdd) {
      return res.status(403).json({
        error: 'You do not have permission to add members',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const existing = await WikiPermission.findOne({ wiki: wiki._id, user: userId });
    if (existing) {
      existing.role = role || existing.role;
      await existing.save();
      
      return res.status(200).json({
        message: 'Member role updated',
        permission: existing
      });
    }
    
    const permission = new WikiPermission({
      wiki: wiki._id,
      user: userId,
      role: role || 'viewer',
      grantedBy: req.user._id
    });
    
    await permission.save();
    
    logger.info(`Member added to wiki ${wiki.name} by ${req.user.email}`);
    
    res.status(201).json({
      message: 'Member added successfully',
      permission
    });
  } catch (error) {
    logger.error('Add wiki member error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'User is already a member',
        code: 'MEMBER_EXISTS'
      });
    }
    
    res.status(500).json({
      error: 'Failed to add member',
      code: 'ADD_MEMBER_ERROR'
    });
  }
};

const removeWikiMember = async (req, res) => {
  try {
    const { slug, userId } = req.params;
    
    const wiki = await Wiki.findOne({ slug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const isOwner = wiki.owner.toString() === req.user._id.toString();
    const currentRole = await WikiPermission.getUserRole(wiki._id, req.user._id);
    const canRemove = isOwner || currentRole === 'admin';
    
    if (!canRemove) {
      return res.status(403).json({
        error: 'You do not have permission to remove members',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    if (userId === wiki.owner.toString()) {
      return res.status(400).json({
        error: 'Cannot remove the owner',
        code: 'CANNOT_REMOVE_OWNER'
      });
    }
    
    await WikiPermission.findOneAndDelete({ wiki: wiki._id, user: userId });
    
    logger.info(`Member removed from wiki ${wiki.name} by ${req.user.email}`);
    
    res.status(200).json({
      message: 'Member removed successfully'
    });
  } catch (error) {
    logger.error('Remove wiki member error:', error);
    res.status(500).json({
      error: 'Failed to remove member',
      code: 'REMOVE_MEMBER_ERROR'
    });
  }
};

module.exports = {
  createWiki,
  getWikis,
  getPublicWikis,
  getWiki,
  updateWiki,
  deleteWiki,
  getWikiMembers,
  addWikiMember,
  removeWikiMember
};
