const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const wikiController = require('../controllers/wikiController');
const logger = require('../config/logger');

const router = express.Router();

router.post('/', authenticateToken, [
  body('name').trim().notEmpty().withMessage('Wiki name is required')
    .isLength({ max: 100 }).withMessage('Wiki name cannot exceed 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('visibility').optional().isIn(['private', 'team', 'public']).withMessage('Invalid visibility'),
  body('icon').optional().isString(),
  body('color').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  await wikiController.createWiki(req, res);
});

router.get('/', authenticateToken, async (req, res) => {
  await wikiController.getWikis(req, res);
});

router.get('/public', optionalAuth, async (req, res) => {
  await wikiController.getPublicWikis(req, res);
});

router.get('/:slug', optionalAuth, async (req, res) => {
  await wikiController.getWiki(req, res);
});

router.put('/:slug', authenticateToken, async (req, res) => {
  await wikiController.updateWiki(req, res);
});

router.delete('/:slug', authenticateToken, async (req, res) => {
  await wikiController.deleteWiki(req, res);
});

router.get('/:slug/members', authenticateToken, async (req, res) => {
  await wikiController.getWikiMembers(req, res);
});

router.post('/:slug/members', authenticateToken, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('role').optional().isIn(['viewer', 'editor', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  await wikiController.addWikiMember(req, res);
});

router.delete('/:slug/members/:userId', authenticateToken, async (req, res) => {
  await wikiController.removeWikiMember(req, res);
});

module.exports = router;
