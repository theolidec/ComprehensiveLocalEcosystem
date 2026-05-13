const Wiki = require('../models/Wiki');
const WikiPage = require('../models/WikiPage');
const WikiVersion = require('../models/WikiVersion');
const WikiCategory = require('../models/WikiCategory');
const WikiPermission = require('../models/WikiPermission');
const logger = require('../config/logger');
const { escapeRegex } = require('../utils/regex');

const createPage = async (req, res) => {
  try {
    const { slug: wikiSlug } = req.params;
    const { title, content, parentId, order, tags, categoryIds, infobox } = req.body;
    
    const wiki = await Wiki.findOne({ slug: wikiSlug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canEdit = await wiki.canEdit(req.user);
    logger.debug(`createPage canEdit: wiki=${wikiSlug}, user=${req.user._id}, canEdit=${canEdit}, owner=${wiki.owner._id}`);
    if (!canEdit) {
      return res.status(403).json({
        error: 'You do not have permission to create pages',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const pageSlug = await WikiPage.generateSlug(wiki._id, title);
    logger.debug(`Generated slug: ${pageSlug} for title: ${title}`);
    
    const page = new WikiPage({
      wiki: wiki._id,
      title,
      slug: pageSlug,
      content: content || '',
      parent: parentId || null,
      order: order || 0,
      infobox: infobox || null,
      tags: tags || [],
      categories: categoryIds || [],
      lastEditedBy: req.user._id
    });
    
    await page.save();
    
    await WikiVersion.createVersion(page, req.user, 'Page created');
    
    logger.info(`Wiki page created: ${page.title} (slug: ${page.slug}) in ${wiki.name}`);
    
    res.status(201).json({
      message: 'Page created successfully',
      page
    });
  } catch (error) {
    logger.error('Create page error:', error);
    logger.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      wikiSlug,
      userId: req.user?._id
    });
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'A page with this title already exists',
        code: 'PAGE_EXISTS'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(e => e.message),
        code: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({
      error: 'Failed to create page: ' + error.message,
      code: 'PAGE_CREATE_ERROR'
    });
  }
};

const getPages = async (req, res) => {
  try {
    const { slug: wikiSlug } = req.params;
    
    const wiki = await Wiki.findOne({ slug: wikiSlug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canView = await wiki.canView(req.user);
    if (!canView) {
      return res.status(403).json({
        error: 'You do not have permission to view this wiki',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const tree = await WikiPage.getPageTree(wiki._id);
    
    res.status(200).json({
      pages: tree,
      wiki: {
        id: wiki._id,
        name: wiki.name,
        slug: wiki.slug
      }
    });
  } catch (error) {
    logger.error('Get pages error:', error);
    res.status(500).json({
      error: 'Failed to fetch pages',
      code: 'PAGES_FETCH_ERROR'
    });
  }
};

const getPage = async (req, res) => {
  try {
    const { slug: wikiSlug, pageSlug } = req.params;
    logger.debug(`getPage called: wikiSlug=${wikiSlug}, pageSlug=${pageSlug}, userId=${req.user?._id}`);
    
    const wiki = await Wiki.findOne({ slug: wikiSlug });
    
    if (!wiki) {
      logger.error(`Wiki not found: ${wikiSlug}`);
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canView = await wiki.canView(req.user);
    logger.debug(`canView result for wiki ${wikiSlug}: ${canView}, owner=${wiki.owner._id}, user=${req.user?._id}`);
    if (!canView) {
      return res.status(403).json({
        error: 'You do not have permission to view this wiki',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const page = await WikiPage.findOne({ wiki: wiki._id, slug: pageSlug })
      .populate('categories', 'name slug color')
      .populate('lastEditedBy', 'name');
    
    logger.debug(`Page lookup: wikiId=${wiki._id}, pageSlug=${pageSlug}, found=${!!page}`);
    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      });
    }
    
    page.viewCount += 1;
    await page.save();
    
    const headings = page.extractHeadings();
    const links = page.extractLinks();
    
    const canEdit = await wiki.canEdit(req.user);
    let role = null;
    if (req.user) {
      role = await WikiPermission.getUserRole(wiki._id, req.user._id);
      if (wiki.owner.toString() === req.user._id.toString()) {
        role = 'owner';
      }
    }
    
    res.status(200).json({
      page,
      headings,
      links,
      permissions: {
        canView,
        canEdit,
        role
      }
    });
  } catch (error) {
    logger.error('Get page error:', error);
    res.status(500).json({
      error: 'Failed to fetch page',
      code: 'PAGE_FETCH_ERROR'
    });
  }
};

const updatePage = async (req, res) => {
  try {
    const { slug: wikiSlug, pageSlug } = req.params;
    const { title, content, parentId, order, tags, categoryIds, infobox, editSummary } = req.body;
    
    const wiki = await Wiki.findOne({ slug: wikiSlug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canEdit = await wiki.canEdit(req.user);
    if (!canEdit) {
      return res.status(403).json({
        error: 'You do not have permission to edit this page',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const page = await WikiPage.findOne({ wiki: wiki._id, slug: pageSlug });
    
    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      });
    }
    
    if (title && title !== page.title) {
      page.slug = await WikiPage.generateSlug(wiki._id, title);
      page.title = title;
    }
    
    if (content !== undefined) page.content = content;
    if (parentId !== undefined) page.parent = parentId;
    if (order !== undefined) page.order = order;
    if (tags !== undefined) page.tags = tags;
    if (categoryIds !== undefined) page.categories = categoryIds;
    if (infobox !== undefined) page.infobox = infobox;
    
    page.excerpt = content ? content.substring(0, 500).replace(/[#*`]/g, '').trim() : '';
    page.lastEditedBy = req.user._id;
    page.lastEditedAt = new Date();
    
    await page.save();
    
    await WikiVersion.createVersion(page, req.user, editSummary || '');
    
    logger.info(`Wiki page updated: ${page.title} in ${wiki.name}`);
    
    res.status(200).json({
      message: 'Page updated successfully',
      page,
      slug: page.slug
    });
  } catch (error) {
    logger.error('Update page error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'A page with this title already exists',
        code: 'PAGE_EXISTS'
      });
    }
    
    res.status(500).json({
      error: 'Failed to update page',
      code: 'PAGE_UPDATE_ERROR'
    });
  }
};

const deletePage = async (req, res) => {
  try {
    const { slug: wikiSlug, pageSlug } = req.params;
    
    const wiki = await Wiki.findOne({ slug: wikiSlug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canEdit = await wiki.canEdit(req.user);
    if (!canEdit) {
      return res.status(403).json({
        error: 'You do not have permission to delete this page',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const page = await WikiPage.findOne({ wiki: wiki._id, slug: pageSlug });
    
    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      });
    }
    
    if (page.isHomePage) {
      return res.status(400).json({
        error: 'Cannot delete the home page',
        code: 'CANNOT_DELETE_HOMEPAGE'
      });
    }
    
    const childPages = await WikiPage.countDocuments({ parent: page._id });
    if (childPages > 0) {
      return res.status(400).json({
        error: 'Cannot delete page with child pages',
        code: 'PAGE_HAS_CHILDREN'
      });
    }
    
    await WikiVersion.deleteMany({ page: page._id });
    await page.deleteOne();
    
    logger.info(`Wiki page deleted: ${page.title} from ${wiki.name}`);
    
    res.status(200).json({
      message: 'Page deleted successfully'
    });
  } catch (error) {
    logger.error('Delete page error:', error);
    res.status(500).json({
      error: 'Failed to delete page',
      code: 'PAGE_DELETE_ERROR'
    });
  }
};

const getPageHistory = async (req, res) => {
  try {
    const { slug: wikiSlug, pageSlug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const wiki = await Wiki.findOne({ slug: wikiSlug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canView = await wiki.canView(req.user);
    if (!canView) {
      return res.status(403).json({
        error: 'You do not have permission to view this wiki',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const pageDoc = await WikiPage.findOne({ wiki: wiki._id, slug: pageSlug });
    
    if (!pageDoc) {
      return res.status(404).json({
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      });
    }
    
    const total = await WikiVersion.countDocuments({ page: pageDoc._id });

    // Only expose the editor's name, never their email — this endpoint is reachable
    // by unauthenticated viewers on public wikis.
    const versions = await WikiVersion.find({ page: pageDoc._id })
      .populate('editedBy', 'name')
      .sort({ version: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      versions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get page history error:', error);
    res.status(500).json({
      error: 'Failed to fetch page history',
      code: 'HISTORY_FETCH_ERROR'
    });
  }
};

const getVersion = async (req, res) => {
  try {
    const { slug: wikiSlug, pageSlug, versionId } = req.params;
    
    const wiki = await Wiki.findOne({ slug: wikiSlug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canView = await wiki.canView(req.user);
    if (!canView) {
      return res.status(403).json({
        error: 'You do not have permission to view this wiki',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const page = await WikiPage.findOne({ wiki: wiki._id, slug: pageSlug });
    
    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      });
    }
    
    const version = await WikiVersion.findById(versionId)
      .populate('editedBy', 'name');

    if (!version || version.page.toString() !== page._id.toString()) {
      return res.status(404).json({
        error: 'Version not found',
        code: 'VERSION_NOT_FOUND'
      });
    }
    
    res.status(200).json({
      version
    });
  } catch (error) {
    logger.error('Get version error:', error);
    res.status(500).json({
      error: 'Failed to fetch version',
      code: 'VERSION_FETCH_ERROR'
    });
  }
};

const getDiff = async (req, res) => {
  try {
    const { slug: wikiSlug, pageSlug } = req.params;
    const { v1, v2 } = req.query;
    
    const wiki = await Wiki.findOne({ slug: wikiSlug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canView = await wiki.canView(req.user);
    if (!canView) {
      return res.status(403).json({
        error: 'You do not have permission to view this wiki',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const page = await WikiPage.findOne({ wiki: wiki._id, slug: pageSlug });
    
    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      });
    }
    
    const version1 = await WikiVersion.findById(v1);
    const version2 = await WikiVersion.findById(v2);
    
    if (!version1 || !version2) {
      return res.status(404).json({
        error: 'One or both versions not found',
        code: 'VERSION_NOT_FOUND'
      });
    }
    
    const diff = WikiVersion.getDiff(version1, version2);
    
    res.status(200).json({
      version1,
      version2,
      diff
    });
  } catch (error) {
    logger.error('Get diff error:', error);
    res.status(500).json({
      error: 'Failed to generate diff',
      code: 'DIFF_ERROR'
    });
  }
};

const restoreVersion = async (req, res) => {
  try {
    const { slug: wikiSlug, pageSlug, versionId } = req.params;
    
    const wiki = await Wiki.findOne({ slug: wikiSlug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canEdit = await wiki.canEdit(req.user);
    if (!canEdit) {
      return res.status(403).json({
        error: 'You do not have permission to edit this page',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const page = await WikiPage.findOne({ wiki: wiki._id, slug: pageSlug });
    
    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      });
    }
    
    const version = await WikiVersion.findById(versionId);
    
    if (!version || version.page.toString() !== page._id.toString()) {
      return res.status(404).json({
        error: 'Version not found',
        code: 'VERSION_NOT_FOUND'
      });
    }
    
    page.title = version.title;
    page.content = version.content;
    page.excerpt = version.excerpt;
    page.infobox = version.infobox;
    page.tags = version.tags;
    page.lastEditedBy = req.user._id;
    page.lastEditedAt = new Date();
    
    await page.save();
    
    await WikiVersion.createVersion(page, req.user, `Restored to version ${version.version}`);
    
    logger.info(`Wiki page restored: ${page.title} to version ${version.version}`);
    
    res.status(200).json({
      message: 'Version restored successfully',
      page
    });
  } catch (error) {
    logger.error('Restore version error:', error);
    res.status(500).json({
      error: 'Failed to restore version',
      code: 'RESTORE_ERROR'
    });
  }
};

const getBacklinks = async (req, res) => {
  try {
    const { slug: wikiSlug, pageSlug } = req.params;
    
    const wiki = await Wiki.findOne({ slug: wikiSlug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canView = await wiki.canView(req.user);
    if (!canView) {
      return res.status(403).json({
        error: 'You do not have permission to view this wiki',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const page = await WikiPage.findOne({ wiki: wiki._id, slug: pageSlug });
    
    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      });
    }
    
    const allPages = await WikiPage.find({ wiki: wiki._id });
    
    const backlinks = [];
    const pageTitleLower = page.title.toLowerCase();
    const safePageTitle = escapeRegex(pageTitleLower);

    for (const p of allPages) {
      if (p._id.toString() === page._id.toString()) continue;

      const linkRegex = new RegExp(`\\[\\[${safePageTitle}(\\]|\\|)`, 'i');
      if (linkRegex.test(p.content)) {
        backlinks.push({
          id: p._id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt
        });
      }
    }
    
    res.status(200).json({
      backlinks
    });
  } catch (error) {
    logger.error('Get backlinks error:', error);
    res.status(500).json({
      error: 'Failed to fetch backlinks',
      code: 'BACKLINKS_ERROR'
    });
  }
};

const searchWiki = async (req, res) => {
  try {
    const { slug: wikiSlug } = req.params;
    const { q, limit: limitParam } = req.query;
    
    const wiki = await Wiki.findOne({ slug: wikiSlug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canView = await wiki.canView(req.user);
    if (!canView) {
      return res.status(403).json({
        error: 'You do not have permission to view this wiki',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters',
        code: 'INVALID_SEARCH'
      });
    }
    
    const limit = parseInt(limitParam) || 20;
    const searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    const results = await WikiPage.find({
      wiki: wiki._id,
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex }
      ]
    })
    .select('title slug excerpt tags')
    .limit(limit);
    
    res.status(200).json({
      results,
      query: q
    });
  } catch (error) {
    logger.error('Search wiki error:', error);
    res.status(500).json({
      error: 'Search failed',
      code: 'SEARCH_ERROR'
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const { slug: wikiSlug } = req.params;
    
    const wiki = await Wiki.findOne({ slug: wikiSlug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canView = await wiki.canView(req.user);
    if (!canView) {
      return res.status(403).json({
        error: 'You do not have permission to view this wiki',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const categories = await WikiCategory.find({ wiki: wiki._id })
      .populate('createdBy', 'name')
      .sort({ name: 1 });
    
    res.status(200).json({
      categories
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      code: 'CATEGORIES_FETCH_ERROR'
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { slug: wikiSlug } = req.params;
    const { name, description, color } = req.body;
    
    const wiki = await Wiki.findOne({ slug: wikiSlug });
    
    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }
    
    const canEdit = await wiki.canEdit(req.user);
    if (!canEdit) {
      return res.status(403).json({
        error: 'You do not have permission to create categories',
        code: 'WIKI_ACCESS_DENIED'
      });
    }
    
    const slug = await WikiCategory.generateSlug(wiki._id, name);
    
    const category = new WikiCategory({
      wiki: wiki._id,
      name,
      slug,
      description: description || '',
      color: color || '#6B7280',
      createdBy: req.user._id
    });
    
    await category.save();
    
    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    logger.error('Create category error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Category with this name already exists',
        code: 'CATEGORY_EXISTS'
      });
    }
    
    res.status(500).json({
      error: 'Failed to create category',
      code: 'CATEGORY_CREATE_ERROR'
    });
  }
};

const movePage = async (req, res) => {
  try {
    const { slug: wikiSlug, pageSlug } = req.params;
    const { newTitle, newParentId } = req.body;

    const wiki = await Wiki.findOne({ slug: wikiSlug });

    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }

    const canEdit = await wiki.canEdit(req.user);
    if (!canEdit) {
      return res.status(403).json({
        error: 'You do not have permission to move this page',
        code: 'WIKI_ACCESS_DENIED'
      });
    }

    const page = await WikiPage.findOne({ wiki: wiki._id, slug: pageSlug });

    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      });
    }

    const newSlug = await WikiPage.generateSlug(wiki._id, newTitle);

    const oldTitle = page.title;
    const oldSlug = page.slug;

    page.title = newTitle;
    page.slug = newSlug;
    if (newParentId !== undefined) {
      page.parent = newParentId || null;
    }
    page.lastEditedBy = req.user._id;
    page.lastEditedAt = new Date();

    await page.save();

    await WikiVersion.createVersion(page, req.user, `Moved page from "${oldTitle}"`);

    logger.info(`Wiki page moved: ${oldTitle} -> ${newTitle} in ${wiki.name}`);

    res.status(200).json({
      message: 'Page moved successfully',
      page,
      oldSlug,
      newSlug
    });
  } catch (error) {
    logger.error('Move page error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        error: 'A page with this title already exists',
        code: 'PAGE_EXISTS'
      });
    }

    res.status(500).json({
      error: 'Failed to move page',
      code: 'PAGE_MOVE_ERROR'
    });
  }
};

const createRedirect = async (req, res) => {
  try {
    const { slug: wikiSlug, pageSlug } = req.params;
    const { targetTitle } = req.body;

    const wiki = await Wiki.findOne({ slug: wikiSlug });

    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }

    const canEdit = await wiki.canEdit(req.user);
    if (!canEdit) {
      return res.status(403).json({
        error: 'You do not have permission to create redirects',
        code: 'WIKI_ACCESS_DENIED'
      });
    }

    const page = await WikiPage.findOne({ wiki: wiki._id, slug: pageSlug });

    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      });
    }

    const targetPage = await WikiPage.findOne({ wiki: wiki._id, title: targetTitle });

    if (!targetPage) {
      return res.status(404).json({
        error: 'Target page not found',
        code: 'TARGET_NOT_FOUND'
      });
    }

    page.redirectTo = targetPage._id;
    page.lastEditedBy = req.user._id;
    page.lastEditedAt = new Date();

    await page.save();

    await WikiVersion.createVersion(page, req.user, `Redirect to "${targetTitle}"`);

    logger.info(`Redirect created: ${page.title} -> ${targetTitle}`);

    res.status(200).json({
      message: 'Redirect created successfully',
      page
    });
  } catch (error) {
    logger.error('Create redirect error:', error);
    res.status(500).json({
      error: 'Failed to create redirect',
      code: 'REDIRECT_ERROR'
    });
  }
};

const addToWatchlist = async (req, res) => {
  try {
    const { slug: wikiSlug, pageSlug } = req.params;

    const wiki = await Wiki.findOne({ slug: wikiSlug });

    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }

    const page = await WikiPage.findOne({ wiki: wiki._id, slug: pageSlug });

    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      });
    }

    const WikiWatch = require('../models/WikiWatch');

    const existing = await WikiWatch.findOne({
      user: req.user._id,
      page: page._id
    });

    if (existing) {
      return res.status(400).json({
        error: 'Page already in watchlist',
        code: 'ALREADY_WATCHING'
      });
    }

    const watch = new WikiWatch({
      user: req.user._id,
      page: page._id,
      wiki: wiki._id
    });

    await watch.save();

    logger.info(`Page added to watchlist: ${page.title} by ${req.user.email}`);

    res.status(201).json({
      message: 'Added to watchlist',
      watch
    });
  } catch (error) {
    logger.error('Add to watchlist error:', error);
    res.status(500).json({
      error: 'Failed to add to watchlist',
      code: 'WATCHLIST_ERROR'
    });
  }
};

const removeFromWatchlist = async (req, res) => {
  try {
    const { slug: wikiSlug, pageSlug } = req.params;

    const wiki = await Wiki.findOne({ slug: wikiSlug });

    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }

    const page = await WikiPage.findOne({ wiki: wiki._id, slug: pageSlug });

    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      });
    }

    const WikiWatch = require('../models/WikiWatch');

    await WikiWatch.findOneAndDelete({
      user: req.user._id,
      page: page._id
    });

    res.status(200).json({
      message: 'Removed from watchlist'
    });
  } catch (error) {
    logger.error('Remove from watchlist error:', error);
    res.status(500).json({
      error: 'Failed to remove from watchlist',
      code: 'WATCHLIST_ERROR'
    });
  }
};

const getWatchlist = async (req, res) => {
  try {
    const { slug: wikiSlug } = req.params;

    const WikiWatch = require('../models/WikiWatch');

    let query = { user: req.user._id };

    if (wikiSlug) {
      const wiki = await Wiki.findOne({ slug: wikiSlug });
      if (wiki) {
        query.wiki = wiki._id;
      }
    }

    const watchlist = await WikiWatch.find(query)
      .populate('page', 'title slug')
      .populate('wiki', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json({
      watchlist
    });
  } catch (error) {
    logger.error('Get watchlist error:', error);
    res.status(500).json({
      error: 'Failed to fetch watchlist',
      code: 'WATCHLIST_ERROR'
    });
  }
};

const getRecentChanges = async (req, res) => {
  try {
    const { slug: wikiSlug } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const wiki = await Wiki.findOne({ slug: wikiSlug });

    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }

    const canView = await wiki.canView(req.user);
    if (!canView) {
      return res.status(403).json({
        error: 'You do not have permission to view this wiki',
        code: 'WIKI_ACCESS_DENIED'
      });
    }

    const recentVersions = await WikiVersion.find({ wiki: wiki._id })
      .populate('page', 'title slug')
      .populate('editedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      changes: recentVersions
    });
  } catch (error) {
    logger.error('Get recent changes error:', error);
    res.status(500).json({
      error: 'Failed to fetch recent changes',
      code: 'RECENT_CHANGES_ERROR'
    });
  }
};

const getAllPages = async (req, res) => {
  try {
    const { slug: wikiSlug } = req.params;
    const sort = req.query.sort || 'title';
    const order = req.query.order === 'desc' ? -1 : 1;

    const wiki = await Wiki.findOne({ slug: wikiSlug });

    if (!wiki) {
      return res.status(404).json({
        error: 'Wiki not found',
        code: 'WIKI_NOT_FOUND'
      });
    }

    const canView = await wiki.canView(req.user);
    if (!canView) {
      return res.status(403).json({
        error: 'You do not have permission to view this wiki',
        code: 'WIKI_ACCESS_DENIED'
      });
    }

    const pages = await WikiPage.find({ wiki: wiki._id })
      .select('title slug excerpt lastEditedAt lastEditedBy viewCount')
      .populate('lastEditedBy', 'name')
      .sort({ [sort]: order });

    res.status(200).json({
      pages
    });
  } catch (error) {
    logger.error('Get all pages error:', error);
    res.status(500).json({
      error: 'Failed to fetch pages',
      code: 'PAGES_FETCH_ERROR'
    });
  }
};

module.exports = {
  createPage,
  getPages,
  getPage,
  updatePage,
  deletePage,
  getPageHistory,
  getVersion,
  getDiff,
  restoreVersion,
  getBacklinks,
  searchWiki,
  getCategories,
  createCategory,
  movePage,
  createRedirect,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  getRecentChanges,
  getAllPages
};
