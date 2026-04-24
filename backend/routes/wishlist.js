const express = require('express');
const router = express.Router();

const wishlistItems = require('./wishlistItems');
const wishlistReservations = require('./wishlistReservations');
const wishlistPublic = require('./wishlistPublic');

router.use('/', wishlistItems);
router.use('/', wishlistReservations);
router.use('/public', wishlistPublic);

module.exports = router;
