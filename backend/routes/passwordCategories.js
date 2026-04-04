const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const passwordCategoryController = require('../controllers/passwordCategoryController');

router.use(authenticateToken);

router.get('/', passwordCategoryController.getAllCategories);
router.post('/', passwordCategoryController.createCategory);
router.put('/:id', passwordCategoryController.updateCategory);
router.delete('/:id', passwordCategoryController.deleteCategory);

module.exports = router;
