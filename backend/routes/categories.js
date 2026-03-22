const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

router.use(authenticateToken);

router.post('/', createCategory);

router.get('/', getCategories);

router.put('/:id', updateCategory);

router.delete('/:id', deleteCategory);

module.exports = router;
