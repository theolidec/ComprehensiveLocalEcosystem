# Backend Architecture

## Overview

The backend is built on **Node.js** with **Express.js**, using **MongoDB** with **Mongoose** for data persistence. It implements a modular, layered architecture with clear separation of concerns.

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.x |
| Database | MongoDB | 5.0+ |
| ODM | Mongoose | 7.x |
| Authentication | JWT (jsonwebtoken) | 9.x |
| Validation | express-validator | 7.x |
| Rate Limiting | express-rate-limit | 6.x |
| Security | Helmet | 7.x |
| Logging | Winston | 3.x |
| Password Hashing | bcryptjs | 2.x |
| File Uploads | Multer | 1.x |
| CORS | cors | 2.x |

## Project Structure

```
backend/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection
│   ├── logger.js        # Winston logging setup
│   └── rateLimiter.js   # Rate limiting rules
├── controllers/         # Request handlers (business logic)
│   ├── calendarController.js
│   ├── categoryController.js
│   ├── fileController.js
│   ├── fileFolderController.js
│   ├── passwordController.js
│   ├── passwordCategoryController.js
│   ├── settingsController.js
│   ├── wikiController.js
│   └── wikiPageController.js
├── middleware/          # Express middleware
│   └── auth.js          # Authentication middleware
├── models/              # Mongoose schemas
│   ├── User.js
│   ├── RefreshToken.js
│   ├── Event.js
│   ├── Category.js
│   ├── Password.js
│   ├── File.js
│   ├── FileFolder.js
│   ├── Settings.js
│   ├── Wiki.js
│   ├── WikiPage.js
│   ├── WikiVersion.js
│   ├── WikiPermission.js
│   ├── WikiCategory.js
│   ├── WikiWatch.js
│   ├── Wishlist.js
│   ├── WishlistItem.js
│   ├── WishlistReservation.js
│   ├── WishlistCategory.js
│   ├── UserFollow.js
│   └── PasswordCategory.js
├── routes/              # API route definitions
│   ├── auth.js
│   ├── calendar.js
│   ├── categories.js
│   ├── files.js
│   ├── fileFolders.js
│   ├── follow.js
│   ├── passwords.js
│   ├── passwordCategories.js
│   ├── settings.js
│   ├── wikiPages.js
│   ├── wikis.js
│   ├── wishlist.js          # Main router (imports sub-routes)
│   ├── wishlistItems.js     # Item CRUD, stats, analytics
│   ├── wishlistReservations.js  # Reservation operations
│   ├── wishlistPublic.js    # Public token-based access
│   ├── wishlistCategories.js
│   └── wishlists.js
├── services/            # Business logic services
│   ├── passwordService.js
│   └── recurringEventService.js
├── uploads/             # File storage directory
├── logs/                # Log files
├── .env                 # Environment variables
├── .env.example         # Environment template
├── server.js            # Application entry point
└── package.json         # Dependencies
```

## Application Entry Point

**File**: `backend/server.js`

The server initialization follows this sequence:

1. **Environment Setup**: Load `.env` variables
2. **Database Connection**: Connect to MongoDB
3. **Middleware Stack**: Apply security, parsing, logging
4. **Route Registration**: Mount all API routes
5. **Error Handling**: Global error handler
6. **Server Start**: HTTP or HTTPS based on configuration

### Middleware Pipeline

```javascript
// Order matters - applied sequentially
app.use(helmet());           // Security headers
app.use(cors());             // CORS handling
app.use(morgan());           // Request logging
app.use(express.json());     // JSON body parsing
app.use(cookieParser());     // Cookie parsing
app.use(generalLimiter);     // Rate limiting
// ... routes
app.use(errorHandler);       // Global errors
```

## Configuration

### Database (`config/database.js`)

- Connects to MongoDB using `MONGODB_URI`
- Handles connection events (connected, error, disconnected)
- Graceful shutdown on SIGINT
- Automatic index cleanup for legacy indexes

### Logger (`config/logger.js`)

**Winston Configuration**:
- **Level**: `debug` (development), `info` (production)
- **Format**: JSON with timestamps
- **Transports**:
  - `logs/error.log` - Error level only (5MB rotation, 5 files)
  - `logs/combined.log` - All levels (5MB rotation, 5 files)
  - Console (development only, colorized)

### Rate Limiter (`config/rateLimiter.js`)

Five limiter configurations:
1. **generalLimiter**: 1000 requests / 15 minutes (all routes)
2. **authLimiter**: 20 requests / 15 minutes (auth endpoints)
3. **passwordResetLimiter**: 3 requests / hour (password reset)
4. **tokenRefreshLimiter**: 50 requests / 15 minutes (token refresh)
5. **createUserRateLimiter**: User-based limiting (in-memory)

## Controllers

Controllers handle HTTP requests and responses, delegating business logic to services or models.

### Pattern

```javascript
// Standard controller structure
const getItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const items = await Model.find({ userId });
    res.json({ items });
  } catch (error) {
    logger.error('Error message:', error);
    res.status(500).json({ 
      error: 'Failed to fetch items',
      code: 'FETCH_ERROR'
    });
  }
};
```

### Key Controllers

| Controller | Purpose | File Size |
|------------|---------|-----------|
| `calendarController.js` | Event CRUD, recurring events, import/export | ~420 lines |
| `categoryController.js` | Category CRUD operations | ~150 lines |
| `fileController.js` | File upload, download, streaming, sharing | ~500 lines |
| `fileFolderController.js` | Folder management, organization | ~300 lines |
| `passwordController.js` | Password CRUD, encryption, favorites | ~250 lines |
| `passwordCategoryController.js` | Password category management | ~120 lines |
| `settingsController.js` | User settings, profile, sessions | ~270 lines |
| `wikiController.js` | Wiki space management, permissions | ~400 lines |
| `wikiPageController.js` | Wiki pages, versions, history | ~800 lines |

## Middleware

### Authentication Middleware (`middleware/auth.js`)

Three middleware functions:

1. **authenticateToken**: Required JWT validation
2. **verifyRefreshToken**: Refresh token validation
3. **optionalAuth**: Optional authentication

### Custom Middleware Pattern

```javascript
const myMiddleware = (req, res, next) => {
  // Pre-processing
  req.customData = value;
  
  // Continue to next middleware/route
  next();
  
  // Or stop with error
  // res.status(400).json({ error: 'Bad request' });
};
```

## Models

Mongoose schemas with methods and statics for business logic.

### Schema Pattern

```javascript
const schema = new mongoose.Schema({
  field: {
    type: String,
    required: [true, 'Message'],
    validate: {
      validator: function(v) { return condition; },
      message: 'Validation failed'
    }
  }
}, {
  timestamps: true,
  toJSON: { transform: function(doc, ret) { delete ret.__v; } }
});

// Instance methods
schema.methods.methodName = function() {
  return this.field;
};

// Static methods
schema.statics.staticMethod = async function(param) {
  return await this.find({ param });
};

// Middleware
schema.pre('save', async function(next) {
  // Pre-save logic
  next();
});

module.exports = mongoose.model('ModelName', schema);
```

### Model Indexing Strategy

- **User model**: `email: 1` (unique lookup), `createdAt: -1` (sorting)
- **Event model**: `user: 1, date: -1` (user's events by date)
- **File model**: `userId: 1, folderId: 1` (folder contents)
- **RefreshToken**: `token: 1` (verification), `user: 1` (user sessions)

## Routes

Route files define API endpoints and connect them to controllers.

### Route Pattern

```javascript
const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validate = [
  body('field').isEmail(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Routes
router.get('/', authenticateToken, controller.getAll);
router.post('/', authenticateToken, validate, controller.create);

module.exports = router;
```

### Route Registration (server.js)

```javascript
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/wikis', wikiRoutes);
```

## Services

Services encapsulate reusable business logic outside controllers.

### Password Service (`services/passwordService.js`)

AES-256-GCM encryption/decryption for password manager with secure key derivation.

**Purpose**: Provides military-grade encryption for stored passwords with per-user salt for additional security.

**Key Features**:
- **AES-256-GCM Encryption**: Industry-standard authenticated encryption
- **PBKDF2 Key Derivation**: 100,000 iterations with SHA-256 for secure key generation
- **Per-User Salt**: Each user has a unique salt combined with master key
- **Password Generator**: Configurable secure password generation

**Configuration**:
```javascript
ALGORITHM = 'aes-256-gcm'
IV_LENGTH = 16
AUTH_TAG_LENGTH = 16
SALT_LENGTH = 32
KEY_LENGTH = 32
ITERATIONS = 100000
```

**Methods**:

```javascript
// Encrypt a plaintext password
encrypt(plaintext, userSalt)
// Returns: 'salt:iv:authTag:encrypted' (hex encoded)

// Decrypt an encrypted password
decrypt(encryptedData, userSalt)
// Returns: plaintext password

// Generate secure random password
generatePassword(length = 16, options = {})
// Options: { uppercase, lowercase, numbers, symbols }
```

**Security Details**:
- Master key from `PASSWORD_MASTER_KEY` environment variable
- Random salt (32 bytes) for each encryption operation
- Random IV (16 bytes) for each encryption operation
- Auth tag (16 bytes) for integrity verification
- Combined salt format: `userSalt + randomSalt` for key derivation

**Usage Example**:
```javascript
const { encrypt, decrypt, generatePassword } = require('./services/passwordService');

// Encrypt
const encrypted = encrypt('myPassword123', userSalt);

// Decrypt
const decrypted = decrypt(encrypted, userSalt);

// Generate
const newPassword = generatePassword(20, { symbols: false });
```

### Recurring Event Service (`services/recurringEventService.js`)

Expands recurring events into individual instances for calendar display.

**Purpose**: Generates event instances based on recurring patterns for a given date range, handling edge cases like month boundaries and leap years.

**Supported Patterns**:
- **Daily**: Every day
- **Weekly**: Every 7 days
- **Monthly**: Same day each month (handles month-end cases)
- **Yearly**: Same date each year (handles Feb 29 on leap years)

**Key Methods**:

```javascript
// Generate all instances for a date range
generateInstances(event, rangeStart, rangeEnd)
// Returns: Array of event instances

// Expand multiple events (mix of recurring and non-recurring)
expandRecurringEvents(events, rangeStart, rangeEnd)
// Returns: Sorted array of all instances

// Find next occurrence from today
getNextOccurrenceFromToday(event)
// Returns: Date or null

// Check if a specific date is an occurrence
isRecurringOnDate(event, checkDate)
// Returns: boolean

// Get human-readable pattern description
getPatternDescription(pattern)
// Returns: e.g., "Every month"
```

**Features**:
- **Instance Limits**: Maximum 100 instances to prevent infinite loops
- **End Date Support**: Respects `recurringEndDate` if set
- **Occurrence Limits**: Respects `recurringOccurrences` if set
- **Edge Case Handling**:
  - Month boundaries (Jan 31 → Feb 28/29)
  - Leap years (Feb 29 → Feb 28 on non-leap years)
  - Range optimization (finds first occurrence in range efficiently)
- **Instance Metadata**: Each instance includes `originalEventId`, `isRecurringInstance`, and `recurringPattern`

**Instance Structure**:
```javascript
{
  _id: 'originalId_2024-01-15',
  originalEventId: 'originalId',
  date: new Date('2024-01-15'),
  isRecurringInstance: true,
  recurringPattern: 'weekly',
  // ... other event fields
}
```

**Usage Example**:
```javascript
const RecurringEventService = require('./services/recurringEventService');

// Get instances for a month
const events = await Event.find({ userId });
const rangeStart = new Date('2024-01-01');
const rangeEnd = new Date('2024-01-31');
const allInstances = RecurringEventService.expandRecurringEvents(events, rangeStart, rangeEnd);
```

## Error Handling

### Global Error Handler

```javascript
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(error.status || 500).json({
    error: message,
    code: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});
```

### 404 Handler

```javascript
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND'
  });
});
```

## HTTPS Support

Conditional HTTPS startup based on environment variables:

```javascript
if (USE_HTTPS && SSL_CERT_PATH && SSL_KEY_PATH) {
  const httpsOptions = {
    cert: fs.readFileSync(SSL_CERT_PATH),
    key: fs.readFileSync(SSL_KEY_PATH)
  };
  https.createServer(httpsOptions, app).listen(HTTPS_PORT);
} else {
  app.listen(PORT);
}
```

## Environment Variables

```env
# Server
PORT=3001
HTTPS_PORT=3443
USE_HTTPS=false

# Security
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
PASSWORD_MASTER_KEY=encryption_key

# Database
MONGODB_URI=mongodb://localhost:27017/dbname

# CORS
FRONTEND_URL=http://localhost:3000

# SSL (optional)
SSL_CERT_PATH=certs/server.crt
SSL_KEY_PATH=certs/server.key

# Logging
LOG_LEVEL=debug
NODE_ENV=development
```

## File Upload Handling

**Multer Configuration** (`routes/files.js`):

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/files/');
  },
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, `${unique}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});
```

## Request Flow

```
HTTP Request
    │
    ▼
Helmet (security headers)
    │
    ▼
CORS (origin check)
    │
    ▼
Morgan (logging)
    │
    ▼
JSON Parser
    │
    ▼
Cookie Parser
    │
    ▼
Rate Limiter
    │
    ▼
Route Handler
    │
    ▼
Auth Middleware (if required)
    │
    ▼
Validation Middleware
    │
    ▼
Controller
    │
    ├─► Model/Service
    │
    ▼
Response
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development (with nodemon)
npm run dev

# Start production
npm start

# Run tests
npm test
```

## Testing

Controllers and services can be tested using Jest with supertest for HTTP assertions.

Example test pattern:
```javascript
const request = require('supertest');
const app = require('../server');

describe('Auth Routes', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'pass123', name: 'Test' });
    expect(res.status).toBe(201);
  });
});
```
