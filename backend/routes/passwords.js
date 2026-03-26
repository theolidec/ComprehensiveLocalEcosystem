const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const passwordController = require('../controllers/passwordController');

router.use(authenticateToken);

router.get('/', passwordController.getAllPasswords);
router.get('/:id', passwordController.getPasswordById);
router.post('/', passwordController.createPassword);
router.put('/:id', passwordController.updatePassword);
router.delete('/:id', passwordController.deletePassword);
router.get('/:id/decrypt', passwordController.decryptPassword);
router.post('/:id/favorite', passwordController.toggleFavorite);

module.exports = router;
