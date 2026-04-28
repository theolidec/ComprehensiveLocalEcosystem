const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const paymentCardController = require('../controllers/paymentCardController');

router.use(authenticateToken);

router.get('/', paymentCardController.getAllCards);
router.get('/:id', paymentCardController.getCardById);
router.post('/', paymentCardController.createCard);
router.put('/:id', paymentCardController.updateCard);
router.delete('/:id', paymentCardController.deleteCard);
router.get('/:id/decrypt', paymentCardController.decryptCard);
router.post('/:id/favorite', paymentCardController.toggleFavorite);
router.post('/:id/default', paymentCardController.setDefaultCard);

module.exports = router;
