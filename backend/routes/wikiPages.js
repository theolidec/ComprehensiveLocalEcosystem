const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const wikiPageController = require('../controllers/wikiPageController');
const asyncHandler = require('../middleware/asyncHandler');
const logger = require('../config/logger');

const router = express.Router({ mergeParams: true });

router.post('/', authenticateToken, [
  body('title').trim().notEmpty().withMessage('Page title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('content').optional({ nullable: true }).isString(),
  body('parentId').optional({ nullable: true }).isMongoId(),
  body('order').optional({ nullable: true }).isInt({ min: 0 }),
  body('tags').optional({ nullable: true }).isArray(),
  body('categoryIds').optional({ nullable: true }).isArray(),
  body('infobox').optional({ nullable: true }).isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  await wikiPageController.createPage(req, res);
}));

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  await wikiPageController.getPages(req, res);
}));

router.get('/search', optionalAuth, asyncHandler(async (req, res) => {
  await wikiPageController.searchWiki(req, res);
}));

router.get('/categories', optionalAuth, asyncHandler(async (req, res) => {
  await wikiPageController.getCategories(req, res);
}));

router.post('/categories', authenticateToken, [
  body('name').trim().notEmpty().withMessage('Category name is required')
    .isLength({ max: 100 }).withMessage('Category name cannot exceed 100 characters'),
  body('description').optional().isLength({ max: 500 }),
  body('color').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  await wikiPageController.createCategory(req, res);
}));

// Literal-path routes must be declared BEFORE the `/:pageSlug` catch-all,
// otherwise Express will treat them as a page slug lookup.
router.get('/watchlist', authenticateToken, asyncHandler(async (req, res) => {
  await wikiPageController.getWatchlist(req, res);
}));

router.get('/recent-changes', optionalAuth, asyncHandler(async (req, res) => {
  await wikiPageController.getRecentChanges(req, res);
}));

router.get('/all', optionalAuth, asyncHandler(async (req, res) => {
  await wikiPageController.getAllPages(req, res);
}));

router.get('/:pageSlug', optionalAuth, asyncHandler(async (req, res) => {
  await wikiPageController.getPage(req, res);
}));

router.put('/:pageSlug', authenticateToken, [
  body('title').optional({ nullable: true }).trim().isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('content').optional({ nullable: true }).isString(),
  body('parentId').optional({ nullable: true }),
  body('order').optional({ nullable: true }).isInt({ min: 0 }),
  body('tags').optional({ nullable: true }).isArray(),
  body('categoryIds').optional({ nullable: true }).isArray(),
  body('infobox').optional({ nullable: true }),
  body('editSummary').optional({ nullable: true }).isLength({ max: 500 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  await wikiPageController.updatePage(req, res);
}));

router.delete('/:pageSlug', authenticateToken, asyncHandler(async (req, res) => {
  await wikiPageController.deletePage(req, res);
}));

router.get('/:pageSlug/history', optionalAuth, asyncHandler(async (req, res) => {
  await wikiPageController.getPageHistory(req, res);
}));

router.get('/:pageSlug/history/:versionId', optionalAuth, asyncHandler(async (req, res) => {
  await wikiPageController.getVersion(req, res);
}));

router.get('/:pageSlug/diff', optionalAuth, asyncHandler(async (req, res) => {
  await wikiPageController.getDiff(req, res);
}));

router.post('/:pageSlug/restore/:versionId', authenticateToken, asyncHandler(async (req, res) => {
  await wikiPageController.restoreVersion(req, res);
}));

router.get('/:pageSlug/backlinks', optionalAuth, asyncHandler(async (req, res) => {
  await wikiPageController.getBacklinks(req, res);
}));

router.post('/:pageSlug/move', authenticateToken, [
  body('newTitle').trim().notEmpty().withMessage('New title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('newParentId').optional()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  await wikiPageController.movePage(req, res);
}));

router.post('/:pageSlug/redirect', authenticateToken, [
  body('targetTitle').trim().notEmpty().withMessage('Target title is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  await wikiPageController.createRedirect(req, res);
}));

router.post('/:pageSlug/watch', authenticateToken, asyncHandler(async (req, res) => {
  await wikiPageController.addToWatchlist(req, res);
}));

router.delete('/:pageSlug/watch', authenticateToken, asyncHandler(async (req, res) => {
  await wikiPageController.removeFromWatchlist(req, res);
}));

module.exports = router;
