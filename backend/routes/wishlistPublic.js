const express = require('express');
const WishlistItem = require('../models/WishlistItem');
const logger = require('../config/logger');

const router = express.Router();

const publicItemCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const getCachedItem = (token) => {
  const cached = publicItemCache.get(token);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedItem = (token, data) => {
  publicItemCache.set(token, { data, timestamp: Date.now() });
  if (publicItemCache.size > 100) {
    const oldestKey = publicItemCache.keys().next().value;
    publicItemCache.delete(oldestKey);
  }
};

const getPublicItemCache = () => publicItemCache;

router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const cachedItem = getCachedItem(token);
    if (cachedItem) {
      return res.json({ item: cachedItem });
    }
    
    const item = await WishlistItem.findByShareToken(token);

    if (!item) {
      return res.status(404).json({
        error: 'Wishlist item not found or not public',
        code: 'NOT_FOUND'
      });
    }

    setCachedItem(token, item);
    
    res.json({ item });
  } catch (error) {
    logger.error('Get public wishlist item error:', error);
    res.status(500).json({
      error: 'Failed to fetch wishlist item',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
module.exports.getPublicItemCache = getPublicItemCache;
