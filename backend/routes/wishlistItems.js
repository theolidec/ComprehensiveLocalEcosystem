const express = require('express');
const { body, param, validationResult } = require('express-validator');
const WishlistItem = require('../models/WishlistItem');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../config/logger');
const PDFDocument = require('pdfkit');

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', errors.array());
    return res.status(400).json({
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  next();
};

const isValidUrlOrEmpty = (value) => {
  if (!value || value.trim() === '') return true;
  return /^https?:\/\/.+/.test(value);
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, status, priority, search, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };

    if (category && ['birthday', 'christmas', 'other'].includes(category)) {
      query.category = category;
    }
    if (status && ['active', 'purchased', 'archived'].includes(status)) {
      query.status = status;
    }
    if (priority && ['low', 'medium', 'high', 'must-have'].includes(priority)) {
      query.priority = priority;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      WishlistItem.aggregate([
        { $match: query },
        {
          $addFields: {
            priorityOrder: { $arrayElemAt: [[0, 1, 2, 3], { $indexOfArray: [['must-have', 'high', 'medium', 'low'], '$priority'] }] }
          }
        },
        { $sort: { priorityOrder: 1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        { $lookup: { from: 'wishlistreservations', localField: '_id', foreignField: 'wishlistItem', as: 'reservations' } },
        { $project: { reservations: { reservedBy: 1, status: 1, reservedAt: 1, message: 1 } } }
      ]),
      WishlistItem.countDocuments(query)
    ]);

    if (items.length > 0) {
      const itemIds = items.map(i => i._id);
      const populatedItems = await WishlistItem.find({ _id: { $in: itemIds } })
        .populate('reservations', 'reservedBy status reservedAt message');
      const sortedMap = new Map(populatedItems.map(i => [i._id.toString(), i]));
      for (let i = 0; i < items.length; i++) {
        items[i] = sortedMap.get(items[i]._id.toString());
      }
    }

    res.json({ 
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Get wishlist items error:', error);
    res.status(500).json({
      error: 'Failed to fetch wishlist items',
      code: 'SERVER_ERROR'
    });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await WishlistItem.getStatsByUser(req.user._id);
    res.json({ stats });
  } catch (error) {
    logger.error('Get wishlist stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch wishlist stats',
      code: 'SERVER_ERROR'
    });
  }
});

router.get('/export/pdf', authenticateToken, async (req, res) => {
  try {
    const { category, status, priority, search, items: itemIds } = req.query;
    const query = { user: req.user._id };

    if (itemIds) {
      const ids = itemIds.split(',');
      query._id = { $in: ids };
    } else {
      if (category && ['birthday', 'christmas', 'other'].includes(category)) {
        query.category = category;
      }
      if (status && ['active', 'purchased', 'archived'].includes(status)) {
        query.status = status;
      }
      if (priority && ['low', 'medium', 'high', 'must-have'].includes(priority)) {
        query.priority = priority;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
    }

    const items = await WishlistItem.find(query)
      .sort({ title: 1 })
      .select('title description url price currency priority category status createdAt');

    const priorityOrder = { 'must-have': 0, 'high': 1, 'medium': 2, 'low': 3 };
    items.sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 4;
      const pb = priorityOrder[b.priority] ?? 4;
      if (pa !== pb) return pa - pb;
      if (!!a.url !== !!b.url) return b.url ? -1 : 1;
      return a.title.localeCompare(b.title);
    });

    const priorityColors = {
      'must-have': '#ef4444',
      'high': '#f97316',
      'medium': '#3b82f6',
      'low': '#6b7280'
    };

    const doc = new PDFDocument({ margin: 50 });
    const filename = `wishlist-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    const userName = req.user.name || 'My Wishlist';
    doc.fontSize(24).text(userName, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#666').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1.5);

    const tableTop = doc.y;
    const columns = {
      title: { x: 60, width: 140 },
      description: { x: 200, width: 140 },
      category: { x: 340, width: 60 },
      price: { x: 400, width: 60 },
      link: { x: 460, width: 80 }
    };

    doc.fontSize(9).font('Helvetica-Bold');
    doc.fillColor('#000').text('Title', columns.title.x, tableTop);
    doc.text('Description', columns.description.x, tableTop);
    doc.text('Category', columns.category.x, tableTop);
    doc.text('Price', columns.price.x, tableTop);
    doc.text('Link', columns.link.x, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke('#ccc');
    doc.moveDown(1);

    let y = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    const itemsWithUrls = [];

    items.forEach((item, index) => {
      if (y > 680) {
        doc.addPage();
        y = 50;
      }

      const title = item.title.length > 25 ? item.title.substring(0, 22) + '...' : item.title;
      const description = item.description 
        ? (item.description.length > 30 ? item.description.substring(0, 27) + '...' : item.description)
        : '-';
      const price = item.price ? `${item.currency || '$'}${item.price.toFixed(2)}` : '-';
      const priorityColor = priorityColors[item.priority] || '#6b7280';

      doc.circle(50, y + 4, 4).fill(priorityColor);

      doc.fillColor('#000').text(title, columns.title.x, y, { width: columns.title.width });
      doc.text(description, columns.description.x, y, { width: columns.description.width });
      doc.text(item.category || '-', columns.category.x, y, { width: columns.category.width });
      doc.text(price, columns.price.x, y, { width: columns.price.width });

      if (item.url) {
        doc.fillColor('#0066cc').text('Click here', columns.link.x, y, { width: columns.link.width, link: item.url });
        itemsWithUrls.push({ title: item.title, url: item.url });
      } else {
        doc.fillColor('#ccc').text('-', columns.link.x, y, { width: columns.link.width });
      }
      doc.fillColor('#000');

      doc.moveTo(50, y + 11).lineTo(540, y + 11).stroke('#eee');
      y += 16;
    });

    if (itemsWithUrls.length > 0) {
      y += 20;
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Links', 50, y);
      y += 15;
      doc.font('Helvetica').fontSize(9);

      itemsWithUrls.forEach((item, idx) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.fillColor('#000');
        const titleStr = `${idx + 1}. ${item.title}: `;
        const titleWidth = doc.widthOfString(titleStr);
        const urlWidth = 490 - titleWidth;
        doc.text(titleStr, 50, y, { continued: true });
        doc.fillColor('#0066cc');
        const urlY = doc.text(item.url, { link: item.url, width: urlWidth });
        const linesWrapped = Math.ceil(doc.widthOfString(item.url) / urlWidth);
        doc.fillColor('#000');
        y += Math.max(14, linesWrapped * 12);
      });
    }

    const totalValue = items.reduce((sum, item) => sum + (item.price || 0), 0);
    y += 10;
    doc.moveTo(50, y).lineTo(530, y).stroke('#ccc');
    y += 10;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(`Total Items: ${items.length}`, 50, y, { width: 230 });
    doc.text(`Total Value: $${totalValue.toFixed(2)}`, 300, y, { width: 230 });

    doc.end();
    logger.info(`PDF export: ${items.length} items by ${req.user.email}`);
  } catch (error) {
    logger.error('PDF export error:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      code: 'SERVER_ERROR'
    });
  }
});

router.post('/import/csv', authenticateToken, async (req, res) => {
  try {
    const { csv } = req.body;
    if (!csv || typeof csv !== 'string') {
      return res.status(400).json({ error: 'CSV content is required', code: 'VALIDATION_ERROR' });
    }

    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must have header and at least one data row', code: 'VALIDATION_ERROR' });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const headerMap = {
      'Title': 'title',
      'Description': 'description',
      'Price': 'price',
      'Currency': 'currency',
      'Priority': 'priority',
      'Category': 'category',
      'Status': 'status',
      'URL': 'url'
    };

    const validPriorities = ['low', 'medium', 'high', 'must-have'];
    const validStatuses = ['active', 'purchased', 'archived'];
    const validCategories = ['birthday', 'christmas', 'other'];
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NOK', 'SEK', 'DKK'];

    const items = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      const row = values.map(v => v.trim().replace(/^"|"$/g, ''));

      if (row.length === 0 || row.every(v => !v)) continue;

      const item = { user: req.user._id };
      headers.forEach((header, idx) => {
        const field = headerMap[header];
        if (field && row[idx]) {
          if (field === 'price') {
            const price = parseFloat(row[idx]);
            if (!isNaN(price)) item.price = price;
          } else if (field === 'priority') {
            const priority = row[idx].toLowerCase();
            if (validPriorities.includes(priority)) item.priority = priority;
          } else if (field === 'status') {
            const status = row[idx].toLowerCase();
            if (validStatuses.includes(status)) item.status = status;
          } else if (field === 'category') {
            const category = row[idx].toLowerCase();
            if (validCategories.includes(category)) item.category = category;
          } else if (field === 'currency') {
            const currency = row[idx].toUpperCase();
            if (validCurrencies.includes(currency)) item.currency = currency;
          } else {
            item[field] = row[idx];
          }
        }
      });

      if (!item.title) {
        errors.push(`Row ${i + 1}: Title is required`);
        continue;
      }
      if (!item.category) item.category = 'other';
      if (!item.priority) item.priority = 'medium';
      if (!item.status) item.status = 'active';
      if (!item.currency) item.currency = 'USD';

      items.push(item);
    }

    if (items.length === 0) {
      return res.status(400).json({
        error: 'No valid items found in CSV',
        code: 'VALIDATION_ERROR',
        details: errors
      });
    }

    const created = await WishlistItem.insertMany(items);
    logger.info(`CSV import: ${created.length} items by ${req.user.email}`);
    res.json({ imported: created.length, errors });
  } catch (error) {
    logger.error('CSV import error:', error);
    res.status(500).json({ error: 'Failed to import CSV', code: 'SERVER_ERROR' });
  }
});

router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const itemsOverTime = await WishlistItem.aggregate([
      { $match: { user: req.user._id, createdAt: { $gte: sixtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalValue: { $sum: { $ifNull: ['$price', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const statusBreakdown = await WishlistItem.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: { $ifNull: ['$price', 0] } } } }
    ]);

    const priorityBreakdown = await WishlistItem.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const categoryBreakdown = await WishlistItem.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalValue: { $sum: { $ifNull: ['$price', 0] } } } }
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await WishlistItem.aggregate([
      { $match: { user: req.user._id, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          itemsAdded: { $sum: 1 },
          totalValue: { $sum: { $ifNull: ['$price', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const WishlistReservation = require('../models/WishlistReservation');
    const reservationStats = await WishlistReservation.aggregate([
      {
        $lookup: {
          from: 'wishlistitems',
          localField: 'wishlistItem',
          foreignField: '_id',
          as: 'item'
        }
      },
      { $unwind: '$item' },
      { $match: { 'item.user': req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      analytics: {
        itemsOverTime,
        statusBreakdown,
        priorityBreakdown,
        categoryBreakdown,
        monthlyTrends,
        reservationStats
      }
    });
  } catch (error) {
    logger.error('Get wishlist analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      code: 'SERVER_ERROR'
    });
  }
});

router.get('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid item ID')
], handleValidationErrors, async (req, res) => {
  try {
    const item = await WishlistItem.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('reservations', 'reservedBy status reservedAt message');

    if (!item) {
      return res.status(404).json({
        error: 'Wishlist item not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({ item });
  } catch (error) {
    logger.error('Get wishlist item error:', error);
    res.status(500).json({
      error: 'Failed to fetch wishlist item',
      code: 'SERVER_ERROR'
    });
  }
});

router.post('/', authenticateToken, [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('url').optional({ checkFalsy: true }).trim().custom(isValidUrlOrEmpty).withMessage('Please enter a valid URL'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NOK', 'SEK', 'DKK']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'must-have']),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('imageUrl').optional().trim(),
  body('isPublic').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const itemData = {
      title: req.body.title,
      description: req.body.description,
      url: req.body.url,
      price: req.body.price,
      currency: req.body.currency || 'USD',
      priority: req.body.priority || 'medium',
      category: req.body.category || 'birthday',
      imageUrl: req.body.imageUrl,
      isPublic: req.body.isPublic || false,
      user: req.user._id
    };

    if (itemData.isPublic) {
      itemData.shareToken = WishlistItem.generateShareToken();
    }

    const item = new WishlistItem(itemData);
    await item.save();

    logger.info(`Wishlist item created: ${item.title} by ${req.user.email}`);

    res.status(201).json({
      message: 'Wishlist item created successfully',
      item
    });
  } catch (error) {
    logger.error('Create wishlist item error:', error);
    res.status(500).json({
      error: 'Failed to create wishlist item',
      code: 'SERVER_ERROR'
    });
  }
});

router.put('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid item ID'),
  body('title').optional().trim().notEmpty()
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('url').optional({ checkFalsy: true }).trim().custom(isValidUrlOrEmpty).withMessage('Please enter a valid URL'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NOK', 'SEK', 'DKK']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'must-have']),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('imageUrl').optional().trim(),
  body('isPublic').optional().isBoolean(),
  body('status').optional().isIn(['active', 'purchased', 'archived'])
], handleValidationErrors, async (req, res) => {
  try {
    const item = await WishlistItem.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        error: 'Wishlist item not found',
        code: 'NOT_FOUND'
      });
    }

    const updates = {};
    const allowedFields = ['title', 'description', 'url', 'price', 'currency', 'priority', 'category', 'imageUrl', 'isPublic', 'status'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.isPublic !== undefined) {
      if (updates.isPublic && !item.shareToken) {
        updates.shareToken = WishlistItem.generateShareToken();
      } else if (!updates.isPublic && item.shareToken) {
        updates.shareToken = null;
      }
    }

    Object.assign(item, updates);
    await item.save();

    logger.info(`Wishlist item updated: ${item.title} by ${req.user.email}`);

    res.json({
      message: 'Wishlist item updated successfully',
      item
    });
  } catch (error) {
    logger.error('Update wishlist item error:', error);
    res.status(500).json({
      error: 'Failed to update wishlist item',
      code: 'SERVER_ERROR'
    });
  }
});

router.delete('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid item ID')
], handleValidationErrors, async (req, res) => {
  try {
    const item = await WishlistItem.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        error: 'Wishlist item not found',
        code: 'NOT_FOUND'
      });
    }

    const WishlistReservation = require('../models/WishlistReservation');
    await WishlistReservation.deleteMany({ wishlistItem: item._id });

    await item.deleteOne();

    logger.info(`Wishlist item deleted: ${item.title} by ${req.user.email}`);

    res.json({
      message: 'Wishlist item deleted successfully'
    });
  } catch (error) {
    logger.error('Delete wishlist item error:', error);
    res.status(500).json({
      error: 'Failed to delete wishlist item',
      code: 'SERVER_ERROR'
    });
  }
});

router.post('/:id/share', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid item ID')
], handleValidationErrors, async (req, res) => {
  try {
    const item = await WishlistItem.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        error: 'Wishlist item not found',
        code: 'NOT_FOUND'
      });
    }

    item.isPublic = !item.isPublic;
    if (item.isPublic && !item.shareToken) {
      item.shareToken = WishlistItem.generateShareToken();
    } else if (!item.isPublic) {
      item.shareToken = null;
    }

    await item.save();

    const shareUrl = item.isPublic
      ? `${process.env.FRONTEND_URL}/wishlist/shared/${item.shareToken}`
      : null;

    logger.info(`Wishlist item ${item.isPublic ? 'shared' : 'unshared'}: ${item.title} by ${req.user.email}`);

    res.json({
      message: item.isPublic ? 'Item is now public' : 'Item is now private',
      isPublic: item.isPublic,
      shareToken: item.shareToken,
      shareUrl
    });
  } catch (error) {
    logger.error('Share wishlist item error:', error);
    res.status(500).json({
      error: 'Failed to update share status',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
