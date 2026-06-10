const PaymentCard = require('../models/PaymentCard');
const User = require('../models/User');
const passwordEncryption = require('../services/passwordService');
const logger = require('../config/logger');

const getUserSalt = async (userId) => {
  const user = await User.findById(userId).select('+passwordSalt');
  if (!user) {
    throw new Error('User not found');
  }
  if (!user.passwordSalt) {
    user.passwordSalt = require('crypto').randomBytes(32).toString('hex');
    await user.save();
    logger.info(`Generated passwordSalt for user ${userId}`);
  }
  return user.passwordSalt;
};

const detectCardType = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  if (/^6(?:011|5)/.test(cleaned)) return 'discover';
  return 'other';
};

const getAllCards = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { favorite, cardType } = req.query;

    const filter = { userId };
    if (favorite === 'true') filter.isFavorite = true;
    if (cardType) filter.cardType = cardType;

    const cards = await PaymentCard.find(filter).sort({ isDefault: -1, createdAt: -1 });
    res.json(cards);
  } catch (error) {
    logger.error('Get all cards error:', error);
    next(error);
  }
};

const getCardById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const card = await PaymentCard.findOne({ _id: id, userId });
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json(card);
  } catch (error) {
    logger.error('Get card by ID error:', error);
    next(error);
  }
};

const createCard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { cardName, cardholderName, cardNumber, expiryDate, cvv, cardType, billingAddress, isDefault } = req.body;

    if (!cardNumber) {
      return res.status(400).json({ error: 'Card number is required' });
    }

    if (!expiryDate) {
      return res.status(400).json({ error: 'Expiry date is required' });
    }

    // CVV is intentionally optional: PCI DSS 3.2 forbids storing CVV/CVC after
    // authorization, even encrypted. Storing it here is the user's own choice.
    const userSalt = await getUserSalt(userId);
    const encryptedCardNumber = passwordEncryption.encrypt(cardNumber, userSalt);
    const encryptedExpiryDate = passwordEncryption.encrypt(expiryDate, userSalt);
    const encryptedCVV = cvv ? passwordEncryption.encrypt(cvv, userSalt) : undefined;

    const detectedCardType = cardType || detectCardType(cardNumber);
    const lastFour = cardNumber.replace(/\s/g, '').slice(-4);

    if (isDefault) {
      await PaymentCard.updateMany({ userId }, { isDefault: false });
    }

    const newCard = new PaymentCard({
      userId,
      cardName,
      cardholderName,
      encryptedCardNumber,
      encryptedExpiryDate,
      encryptedCVV,
      cardType: detectedCardType,
      lastFourDigits: lastFour,
      billingAddress,
      isDefault: isDefault || false,
      isFavorite: false
    });

    await newCard.save();
    res.status(201).json(newCard);
  } catch (error) {
    logger.error('Create card error:', error);
    next(error);
  }
};

const updateCard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { cardName, cardholderName, cardNumber, expiryDate, cvv, cardType, billingAddress, isDefault } = req.body;

    const existingCard = await PaymentCard.findOne({ _id: id, userId });
    if (!existingCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const userSalt = await getUserSalt(userId);

    if (cardName) existingCard.cardName = cardName;
    if (cardholderName !== undefined) existingCard.cardholderName = cardholderName;
    if (cardNumber) {
      existingCard.encryptedCardNumber = passwordEncryption.encrypt(cardNumber, userSalt);
      existingCard.lastFourDigits = cardNumber.replace(/\s/g, '').slice(-4);
      if (cardType) {
        existingCard.cardType = cardType;
      } else {
        existingCard.cardType = detectCardType(cardNumber);
      }
    }
    if (expiryDate) {
      existingCard.encryptedExpiryDate = passwordEncryption.encrypt(expiryDate, userSalt);
    }
    if (cvv) {
      existingCard.encryptedCVV = passwordEncryption.encrypt(cvv, userSalt);
    }
    if (cardType && !cardNumber) existingCard.cardType = cardType;
    if (billingAddress !== undefined) existingCard.billingAddress = billingAddress;

    if (isDefault !== undefined && isDefault !== existingCard.isDefault) {
      if (isDefault) {
        await PaymentCard.updateMany({ userId, _id: { $ne: id } }, { isDefault: false });
      }
      existingCard.isDefault = isDefault;
    }

    await existingCard.save();
    res.json(existingCard);
  } catch (error) {
    logger.error('Update card error:', error);
    next(error);
  }
};

const deleteCard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deletedCard = await PaymentCard.findOneAndDelete({ _id: id, userId });
    if (!deletedCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    logger.error('Delete card error:', error);
    next(error);
  }
};

const decryptCard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const card = await PaymentCard.findOne({ _id: id, userId });
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const userSalt = await getUserSalt(userId);
    const decryptedCardNumber = passwordEncryption.decrypt(card.encryptedCardNumber, userSalt);
    const decryptedExpiryDate = passwordEncryption.decrypt(card.encryptedExpiryDate, userSalt);
    const decryptedCVV = card.encryptedCVV ? passwordEncryption.decrypt(card.encryptedCVV, userSalt) : null;

    res.json({
      cardNumber: decryptedCardNumber,
      expiryDate: decryptedExpiryDate,
      cvv: decryptedCVV
    });
  } catch (error) {
    logger.error('Decrypt card error:', error);
    next(error);
  }
};

const toggleFavorite = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const card = await PaymentCard.findOne({ _id: id, userId });
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    card.isFavorite = !card.isFavorite;
    await card.save();
    res.json(card);
  } catch (error) {
    logger.error('Toggle favorite error:', error);
    next(error);
  }
};

const setDefaultCard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const card = await PaymentCard.findOne({ _id: id, userId });
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await PaymentCard.updateMany({ userId }, { isDefault: false });
    card.isDefault = true;
    await card.save();

    res.json(card);
  } catch (error) {
    logger.error('Set default card error:', error);
    next(error);
  }
};

module.exports = {
  getAllCards,
  getCardById,
  createCard,
  updateCard,
  deleteCard,
  decryptCard,
  toggleFavorite,
  setDefaultCard
};
