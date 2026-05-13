const Password = require('../models/Password');
const PaymentCard = require('../models/PaymentCard');
const User = require('../models/User');
const passwordEncryption = require('../services/passwordService');
const logger = require('../config/logger');
const { escapeRegex } = require('../utils/regex');

const MAX_IMPORT_ITEMS = 1000;

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

const getAllPasswords = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { category, favorite, search } = req.query;

    const filter = { userId };
    if (category) filter.category = category;
    if (favorite === 'true') filter.isFavorite = true;
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { website: { $regex: safeSearch, $options: 'i' } },
        { username: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const passwords = await Password.find(filter).sort({ createdAt: -1 });
    res.json(passwords);
  } catch (error) {
    logger.error('Get all passwords error:', error);
    next(error);
  }
};

const getPasswordById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const password = await Password.findOne({ _id: id, userId });
    if (!password) {
      return res.status(404).json({ error: 'Password not found' });
    }

    res.json(password);
  } catch (error) {
    logger.error('Get password by ID error:', error);
    next(error);
  }
};

const createPassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { title, username, email, password, website, category, notes, isFavorite } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const userSalt = await getUserSalt(userId);
    const encryptedPassword = passwordEncryption.encrypt(password, userSalt);

    const newPassword = new Password({
      userId,
      title,
      username,
      email,
      encryptedPassword,
      website,
      category: category || 'other',
      notes,
      isFavorite: isFavorite || false
    });

    await newPassword.save();
    res.status(201).json(newPassword);
  } catch (error) {
    logger.error('Create password error:', error);
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { title, username, email, password, website, category, notes, isFavorite } = req.body;

    const existingPassword = await Password.findOne({ _id: id, userId });
    if (!existingPassword) {
      return res.status(404).json({ error: 'Password not found' });
    }

    if (title) existingPassword.title = title;
    if (username !== undefined) existingPassword.username = username;
    if (email !== undefined) existingPassword.email = email;
    if (password) {
      const userSalt = await getUserSalt(userId);
      existingPassword.encryptedPassword = passwordEncryption.encrypt(password, userSalt);
    }
    if (website !== undefined) existingPassword.website = website;
    if (category) existingPassword.category = category;
    if (notes !== undefined) existingPassword.notes = notes;
    if (isFavorite !== undefined) existingPassword.isFavorite = isFavorite;

    await existingPassword.save();
    res.json(existingPassword);
  } catch (error) {
    logger.error('Update password error:', error);
    next(error);
  }
};

const deletePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deletedPassword = await Password.findOneAndDelete({ _id: id, userId });
    if (!deletedPassword) {
      return res.status(404).json({ error: 'Password not found' });
    }

    res.json({ message: 'Password deleted successfully' });
  } catch (error) {
    logger.error('Delete password error:', error);
    next(error);
  }
};

const decryptPassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const password = await Password.findOne({ _id: id, userId });
    if (!password) {
      return res.status(404).json({ error: 'Password not found' });
    }

    const userSalt = await getUserSalt(userId);
    const decryptedPassword = passwordEncryption.decrypt(password.encryptedPassword, userSalt);
    res.json({ password: decryptedPassword });
  } catch (error) {
    logger.error('Decrypt password error:', error);
    next(error);
  }
};

const toggleFavorite = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const password = await Password.findOne({ _id: id, userId });
    if (!password) {
      return res.status(404).json({ error: 'Password not found' });
    }

    password.isFavorite = !password.isFavorite;
    await password.save();
    res.json(password);
  } catch (error) {
    logger.error('Toggle favorite error:', error);
    next(error);
  }
};

const exportPasswords = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const passwords = await Password.find({ userId });
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userId: userId.toString(),
      passwords: passwords.map(p => ({
        title: p.title,
        username: p.username,
        email: p.email,
        encryptedPassword: p.encryptedPassword,
        website: p.website,
        category: p.category,
        notes: p.notes,
        isFavorite: p.isFavorite,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=passwords-backup.json');
    res.json(exportData);
  } catch (error) {
    logger.error('Export passwords error:', error);
    next(error);
  }
};

const exportPasswordsCSV = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userSalt = await getUserSalt(userId);

    // Fetch all passwords for the user
    const passwords = await Password.find({ userId });

    // Fetch all payment cards for the user
    const cards = await PaymentCard.find({ userId });

    // CSV headers
    const headers = ['type', 'name', 'url', 'email', 'username', 'password', 'note', 'totp', 'createTime', 'modifyTime', 'category'];

    // Build CSV rows
    const rows = [];

    // Add password entries
    for (const p of passwords) {
      let decryptedPassword = '';
      try {
        decryptedPassword = passwordEncryption.decrypt(p.encryptedPassword, userSalt);
      } catch (err) {
        logger.warn(`Failed to decrypt password for ${p.title}:`, err.message);
      }

      rows.push([
        'login',
        escapeCsvValue(p.title),
        escapeCsvValue(p.website || ''),
        escapeCsvValue(p.email || ''),
        escapeCsvValue(p.username || ''),
        escapeCsvValue(decryptedPassword),
        escapeCsvValue(p.notes || ''),
        '', // totp - not currently supported
        p.createdAt ? p.createdAt.toISOString() : '',
        p.updatedAt ? p.updatedAt.toISOString() : '',
        escapeCsvValue(p.category || 'other')
      ]);
    }

    // Add card entries
    for (const c of cards) {
      let decryptedCardNumber = '';
      let decryptedExpiryDate = '';
      let decryptedCVV = '';
      try {
        decryptedCardNumber = passwordEncryption.decrypt(c.encryptedCardNumber, userSalt);
        decryptedExpiryDate = passwordEncryption.decrypt(c.encryptedExpiryDate, userSalt);
        decryptedCVV = passwordEncryption.decrypt(c.encryptedCVV, userSalt);
      } catch (err) {
        logger.warn(`Failed to decrypt card data for ${c.cardName}:`, err.message);
      }

      // Format card data as a combined "password" field with all sensitive info
      const cardData = `Card Number: ${decryptedCardNumber}, Expiry: ${decryptedExpiryDate}, CVV: ${decryptedCVV}`;

      rows.push([
        'card',
        escapeCsvValue(c.cardName),
        '', // url - cards don't have URLs
        '', // email - cards don't have email
        escapeCsvValue(c.cardholderName || ''),
        escapeCsvValue(cardData),
        escapeCsvValue(c.billingAddress || ''),
        '', // totp - not applicable for cards
        c.createdAt ? c.createdAt.toISOString() : '',
        c.updatedAt ? c.updatedAt.toISOString() : '',
        escapeCsvValue(c.cardType || 'other')
      ]);
    }

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=passwords-export.csv');
    res.send(csvContent);
  } catch (error) {
    logger.error('Export passwords CSV error:', error);
    next(error);
  }
};

// Helper function to escape CSV values
const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // Escape double quotes by doubling them
  const escaped = stringValue.replace(/"/g, '""');
  // Wrap in quotes if the value contains commas, quotes, or newlines
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${escaped}"`;
  }
  return escaped;
};

const importPasswords = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { passwords, password } = req.body;

    if (!passwords || !Array.isArray(passwords)) {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    if (passwords.length > MAX_IMPORT_ITEMS) {
      return res.status(413).json({
        error: `Import exceeds maximum of ${MAX_IMPORT_ITEMS} items`,
        code: 'IMPORT_TOO_LARGE'
      });
    }

    if (!password) {
      return res.status(400).json({ error: 'Encryption password is required' });
    }

    const userSalt = await getUserSalt(userId);
    const imported = [];
    const errors = [];

    for (const item of passwords) {
      try {
        const newPassword = new Password({
          userId,
          title: item.title,
          username: item.username,
          email: item.email,
          encryptedPassword: item.encryptedPassword,
          website: item.website,
          category: item.category || 'other',
          notes: item.notes,
          isFavorite: item.isFavorite || false
        });
        await newPassword.save();
        imported.push(item.title);
      } catch (err) {
        errors.push({ title: item.title, error: err.message });
      }
    }

    res.json({
      message: `Successfully imported ${imported.length} passwords`,
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    logger.error('Import passwords error:', error);
    next(error);
  }
};

const importPasswordsCSV = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { csvData } = req.body;

    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({ error: 'CSV data is required' });
    }

    const userSalt = await getUserSalt(userId);
    const importedPasswords = [];
    const importedCards = [];
    const errors = [];

    // Parse CSV - handle both Unix (\n) and Windows (\r\n) line endings
    const lines = csvData.split('\n')
      .map(line => line.replace(/\r$/, '')) // Strip trailing \r from Windows line endings
      .filter(line => line.trim());

    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must have at least a header row and one data row' });
    }

    if (lines.length - 1 > MAX_IMPORT_ITEMS) {
      return res.status(413).json({
        error: `CSV exceeds maximum of ${MAX_IMPORT_ITEMS} data rows`,
        code: 'CSV_TOO_LARGE'
      });
    }

    // Parse header
    const headers = parseCsvLine(lines[0]);

    // Define standard headers and their aliases
    const headerAliases = {
      type: ['type', 'itemtype', 'entrytype', 'kind'],
      name: ['name', 'title', 'entryname', 'sitename', 'servicename'],
      url: ['url', 'website', 'link', 'site', 'uri', 'webaddress'],
      email: ['email', 'mail', 'emailaddress', 'e-mail'],
      username: ['username', 'user', 'login', 'userid', 'loginname', 'account'],
      password: ['password', 'pass', 'passwd', 'pwd', 'secret', 'credential'],
      note: ['note', 'notes', 'comment', 'comments', 'description', 'memo'],
      totp: ['totp', '2fa', 'twofactor', 'otp', 'authenticator', '2fa_key'],
      createTime: ['createtime', 'created', 'createdat', 'datecreated', 'creationdate'],
      modifyTime: ['modifytime', 'modified', 'updatedat', 'datemodified', 'lastmodified', 'changed'],
      category: ['category', 'type', 'group', 'folder', 'vault', 'tags', 'collection']
    };

    // Map column indices
    const columnMap = {};
    headers.forEach((header, index) => {
      const normalized = header.toLowerCase().trim();

      // Check each standard header's aliases
      for (const [standardHeader, aliases] of Object.entries(headerAliases)) {
        if (aliases.includes(normalized)) {
          columnMap[standardHeader] = index;
          break;
        }
      }
    });

    logger.info(`CSV import: Found ${lines.length - 1} data rows. Headers detected: ${Object.keys(columnMap).join(', ') || 'none'}`);
    logger.info('CSV import: Sensitive data excluded from logs for security');

    if (!columnMap['name']) {
      return res.status(400).json({ error: 'Could not find a valid name/title column. Supported headers: name, title, entryname, sitename' });
    }

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      if (values.length < 2) continue; // Skip empty lines

      const type = values[columnMap['type']] || 'login';
      const name = values[columnMap['name']] || '';

      if (!name) {
        errors.push({ row: i, name: 'unnamed', error: 'Name is required' });
        continue;
      }

      try {
        if (type === 'card') {
          // Parse card data
          const passwordField = values[columnMap['password']] || '';
          const cardNumberMatch = passwordField.match(/Card Number:\s*([^,]+)/);
          const expiryMatch = passwordField.match(/Expiry:\s*([^,]+)/);
          const cvvMatch = passwordField.match(/CVV:\s*(\d+)/);

          const cardNumber = cardNumberMatch ? cardNumberMatch[1].trim() : '';
          const expiryDate = expiryMatch ? expiryMatch[1].trim() : '';
          const cvv = cvvMatch ? cvvMatch[1].trim() : '';

          if (!cardNumber) {
            errors.push({ row: i, name, error: 'Card number is required' });
            continue;
          }

          const encryptedCardNumber = passwordEncryption.encrypt(cardNumber, userSalt);
          const encryptedExpiryDate = expiryDate ? passwordEncryption.encrypt(expiryDate, userSalt) : '';
          const encryptedCVV = cvv ? passwordEncryption.encrypt(cvv, userSalt) : '';

          const lastFour = cardNumber.replace(/\s/g, '').slice(-4);

          // Detect card type
          const cleaned = cardNumber.replace(/\s/g, '');
          let cardType = values[columnMap['category']] || 'other';
          if (!['visa', 'mastercard', 'amex', 'discover', 'other'].includes(cardType)) {
            if (/^4/.test(cleaned)) cardType = 'visa';
            else if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) cardType = 'mastercard';
            else if (/^3[47]/.test(cleaned)) cardType = 'amex';
            else if (/^6(?:011|5)/.test(cleaned)) cardType = 'discover';
            else cardType = 'other';
          }

          const newCard = new PaymentCard({
            userId,
            cardName: name,
            cardholderName: values[columnMap['username']] || '',
            encryptedCardNumber,
            encryptedExpiryDate,
            encryptedCVV,
            cardType,
            lastFourDigits: lastFour,
            billingAddress: values[columnMap['note']] || '',
            isDefault: false,
            isFavorite: false
          });
          await newCard.save();
          importedCards.push(name);
        } else {
          // Login/password entry
          const passwordValue = values[columnMap['password']] || '';
          const encryptedPassword = passwordValue ? passwordEncryption.encrypt(passwordValue, userSalt) : '';

          const rawCategory = values[columnMap['category']] || 'other';
          const categoryValue = mapCategoryToEnum(rawCategory);

          const newPassword = new Password({
            userId,
            title: name,
            username: values[columnMap['username']] || '',
            email: values[columnMap['email']] || '',
            encryptedPassword,
            website: values[columnMap['url']] || '',
            category: categoryValue,
            notes: values[columnMap['note']] || '',
            isFavorite: false
          });
          await newPassword.save();
          importedPasswords.push(name);
        }
      } catch (err) {
        // Don't log sensitive data, just track the error
        errors.push({ row: i, name, error: err.message });
      }
    }

    res.json({
      message: `Successfully imported ${importedPasswords.length} passwords and ${importedCards.length} cards`,
      passwordsImported: importedPasswords,
      cardsImported: importedCards,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    logger.error('Import CSV error:', error);
    next(error);
  }
};

// Helper function to map category names to valid enum values
const mapCategoryToEnum = (rawCategory) => {
  const normalized = rawCategory.toLowerCase().trim();

  // Valid enum values
  const validCategories = ['social', 'finance', 'work', 'shopping', 'entertainment', 'other'];
  if (validCategories.includes(normalized)) {
    return normalized;
  }

  // Map common category names
  const categoryMap = {
    // Social
    social: 'social',
    personal: 'social',
    family: 'social',
    friends: 'social',
    messaging: 'social',
    chat: 'social',
    communication: 'social',
    email: 'social',

    // Finance
    finance: 'finance',
    financial: 'finance',
    banking: 'finance',
    bank: 'finance',
    payment: 'finance',
    money: 'finance',
    credit: 'finance',
    debit: 'finance',
    investment: 'finance',
    crypto: 'finance',
    cryptocurrency: 'finance',
    wallet: 'finance',

    // Work
    work: 'work',
    business: 'work',
    professional: 'work',
    career: 'work',
    job: 'work',
    office: 'work',
    productivity: 'work',
    tools: 'work',
    development: 'work',
    dev: 'work',

    // Shopping
    shopping: 'shopping',
    ecommerce: 'shopping',
    retail: 'shopping',
    store: 'shopping',
    amazon: 'shopping',
    online: 'shopping',
    marketplace: 'shopping',

    // Entertainment
    entertainment: 'entertainment',
    media: 'entertainment',
    streaming: 'entertainment',
    video: 'entertainment',
    music: 'entertainment',
    gaming: 'entertainment',
    games: 'entertainment',
    fun: 'entertainment',
    hobby: 'entertainment',
    leisure: 'entertainment',
    movies: 'entertainment',
    tv: 'entertainment',
    netflix: 'entertainment',
    youtube: 'entertainment',
    twitch: 'entertainment',

    // Other (default)
    other: 'other',
    misc: 'other',
    miscellaneous: 'other',
    general: 'other',
    uncategorized: 'other',
    default: 'other'
  };

  return categoryMap[normalized] || 'other';
};

// Helper function to parse a CSV line handling quoted values
const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  values.push(current.trim());
  return values;
};

module.exports = {
  getAllPasswords,
  getPasswordById,
  createPassword,
  updatePassword,
  deletePassword,
  decryptPassword,
  toggleFavorite,
  exportPasswords,
  exportPasswordsCSV,
  importPasswords,
  importPasswordsCSV
};
