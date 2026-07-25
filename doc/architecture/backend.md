# Backend Architecture

## Overview

The backend is built on **Node.js** with **Express.js**, using **MongoDB** with **Mongoose** for data persistence. It implements a modular, layered architecture with clear separation of concerns.

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.18.x |
| Database | MongoDB | 6.x (Docker `mongo:6`) |
| ODM | Mongoose | 8.6.x |
| Authentication | JWT (jsonwebtoken) | 9.0.x |
| Validation | express-validator | 7.3.x |
| Rate Limiting | express-rate-limit | 7.1.x |
| Security | Helmet | 7.1.x |
| Logging | Winston | 3.15.x |
| Password Hashing | bcryptjs | 3.0.x |
| File Uploads | Multer | 2.1.x |
| CORS | cors | 2.8.x |
| PDF Generation | pdfkit | 0.18.x (used by `routes/wishlistItems.js` for PDF export) |

**Custom implementations** (no external dependency):
- **Env loading** — inline parser in `server.js` (replaces `dotenv`)
- **Cookie parsing** — inline middleware in `server.js` (replaces `cookie-parser`)
- **Request logging** — inline combined-format middleware piped to Winston (replaces `morgan`)
- **Scheduler** — `scheduleDailyCleanup()` in `server.js` using `setTimeout` recursion (replaces `node-cron`); runs at 03:15 daily to clean up expired/revoked refresh tokens

**Active utilities**:
- `backend/utils/regex.js` — `escapeRegex()` helper applied to all user-supplied search inputs before `$regex`/`new RegExp()` (ReDoS defense)

## Project Structure

### Music Module
- `models/Music.js` — Music file schema (audio validation, public/private, metadata)
- `models/Playlist.js` — Playlist schema (music references, public/private)
- `controllers/musicController.js` — Handles upload, streaming, playlist logic
- `routes/music.js` — API endpoints for music and playlist
- Registered as `/api/music` in `server.js`


```
backend/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection + legacy index cleanup
│   ├── logger.js        # Winston logging setup
│   └── rateLimiter.js   # Rate limiting rules (8 limiters)
├── controllers/         # Request handlers (business logic) — 14 files
│   ├── calendarController.js
│   ├── categoryController.js
│   ├── fileController.js
│   ├── fileFolderController.js
│   ├── financeController.js
│   ├── musicController.js
│   ├── passwordController.js
│   ├── passwordCategoryController.js
│   ├── paymentCardController.js
│   ├── radiationController.js
│   ├── settingsController.js
│   ├── userRightsController.js
│   ├── wikiController.js
│   └── wikiPageController.js
├── middleware/          # Express middleware
│   ├── auth.js          # Authentication middleware
│   ├── asyncHandler.js  # Forwards async handler rejections to the error handler
│   └── uploadErrors.js  # Translates multer/fileFilter failures into 4xx responses
├── models/              # Mongoose schemas
│   ├── User.js
│   ├── RefreshToken.js
│   ├── Event.js
│   ├── Category.js
│   ├── Password.js
│   ├── File.js
│   ├── FileFolder.js
│   ├── DocumentVersion.js   # Document version history
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
│   ├── PasswordCategory.js
│   ├── PaymentCard.js
│   ├── TrackerTask.js
│   ├── TrackerQuestion.js
│   ├── TrackerResponse.js
│   ├── Music.js
│   ├── Playlist.js
│   ├── RadiationLocation.js
│   ├── RadiationMeasurement.js
│   ├── FinanceAccount.js
│   ├── FinanceGroup.js
│   ├── FinanceRule.js
│   ├── FinanceTransaction.js
│   ├── FinanceBalanceSnapshot.js
│   └── FinanceBudget.js
├── routes/              # API route definitions — 23 files
│   ├── auth.js
│   ├── calendar.js
│   ├── categories.js
│   ├── files.js
│   ├── fileFolders.js
│   ├── follow.js
│   ├── music.js
│   ├── passwords.js
│   ├── passwordCategories.js
│   ├── paymentCards.js
│   ├── finance.js
│   ├── radiation.js
│   ├── settings.js
│   ├── tracker.js
│   ├── userRights.js
│   ├── wikiPages.js
│   ├── wikis.js
│   ├── wishlist.js              # Main router (imports sub-routes)
│   ├── wishlistItems.js         # Item CRUD, stats, analytics, PDF export
│   ├── wishlistReservations.js  # Reservation operations
│   ├── wishlistPublic.js        # Public token-based access (with caching)
│   ├── wishlistCategories.js
│   └── wishlists.js
├── services/            # Business logic services
│   ├── passwordService.js
│   └── recurringEventService.js
├── utils/               # Shared utilities
│   └── regex.js         # escapeRegex() for ReDoS-safe MongoDB queries
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
app.use(requestLogger);      // Request logging (custom)
app.use(express.json());     // JSON body parsing
app.use(parseCookies);       // Cookie parsing (custom)
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

Eight limiter configurations:
1. **generalLimiter**: 1000 requests / 15 minutes (all routes)
2. **authLimiter**: 20 requests / 15 minutes (auth endpoints)
3. **passwordResetLimiter**: 3 requests / hour (password reset)
4. **tokenRefreshLimiter**: 50 requests / 15 minutes (token refresh)
5. **userActionLimiter**: 50 actions / hour (in-memory, user-keyed via `createUserRateLimiter`)
6. **settingsLimiter**: 100 requests / 15 minutes (settings endpoints)
7. **publicReservationLimiter**: 10 requests / hour (public wishlist reservations)
8. **userDataLimiter**: 10 requests / hour (GDPR data access/export/delete)

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
| `calendarController.js` | Event CRUD, recurring events, import/export | ~350 lines |
| `categoryController.js` | Category CRUD operations | ~150 lines |
| `fileController.js` | File upload, download, streaming, sharing | ~500 lines |
| `fileFolderController.js` | Folder management, organization | ~250 lines |
| `musicController.js` | Music upload, streaming, playlist management | ~280 lines |
| `passwordController.js` | Password CRUD, encryption, favorites | ~230 lines |
| `passwordCategoryController.js` | Password category management | ~100 lines |
| `paymentCardController.js` | Payment card CRUD, encryption | ~200 lines |
| `financeController.js` | Accounts, groups, rules, transactions, budgets, snapshots, analytics | ~800 lines |
| `radiationController.js` | Radiation measurements, locations, analytics | ~400 lines |
| `settingsController.js` | User settings, profile, sessions | ~250 lines |
| `userRightsController.js` | GDPR user rights (access, export, delete) | ~450 lines |
| `wikiController.js` | Wiki space management, permissions | ~360 lines |
| `wikiPageController.js` | Wiki pages, versions, history | ~900 lines |

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

All 20 API namespaces mounted under `/api/*`:

```javascript
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/password-categories', passwordCategoryRoutes);
app.use('/api/payment-cards', paymentCardRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/wishlist-categories', wishlistCategoryRoutes);
app.use('/api/wishlists', wishlistsRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/file-folders', fileFoldersRoutes);
app.use('/api/wikis', wikiRoutes);
app.use('/api/wikis/:slug/pages', wikiPageRoutes);  // Nested mount; :slug forwarded
app.use('/api/user', userRightsRoutes);              // GDPR endpoints
app.use('/api/tracker', trackerRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/radiation', radiationRoutes);
app.use('/api/finance', financeRoutes);
```

**Note**: `wikiPageRoutes` is mounted under `/api/wikis/:slug/pages`, so the wiki slug is available via `req.params.slug` inside the page router (Express forwards parent params).

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
  const status = error.status || error.statusCode || 500;

  // 5xx = server fault (logger.error), 4xx = client fault (logger.warn)
  if (status >= 500) logger.error('Unhandled error:', { ... });
  else logger.warn('Request rejected:', { ... });

  // A partially-written response cannot be replaced
  if (res.headersSent) return next(error);

  // Only 5xx messages are masked in production; 4xx messages are deliberate
  const message = process.env.NODE_ENV === 'production' && status >= 500
    ? 'Internal server error'
    : error.message;

  res.status(status).json({
    error: message,
    // Numeric driver codes (e.g. MongoDB 11000) are not exposed
    code: (typeof error.code === 'string' && error.code) ||
      (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});
```

### Async Handler (`middleware/asyncHandler.js`)

Express 4 does not forward a rejected promise returned by an `async` route handler
to the error middleware: the rejection is lost and the request hangs until the
client times out. Route handlers that do not catch internally are wrapped:

```javascript
const asyncHandler = require('../middleware/asyncHandler');

router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  await wikiController.getWiki(req, res);
}));
```

Used by `routes/wikis.js` and `routes/wikiPages.js`, whose handlers delegate to
the controllers instead of running their own `try/catch`.

### Upload Errors (`middleware/uploadErrors.js`)

Multer reports rejected uploads (size limit exceeded, unexpected field,
`fileFilter` rejection) through `next(error)`. `handleUploadErrors` is mounted
directly after each `upload.single(...)` and translates them into client errors
instead of an opaque 500:

| Multer condition | Response |
|------------------|----------|
| `LIMIT_FILE_SIZE` | `413` `{ error: 'File is too large', code: 'LIMIT_FILE_SIZE' }` |
| other `MulterError` | `413`/`400` with the multer `code` |
| `fileFilter` rejection | `400` `{ code: 'INVALID_FILE_TYPE' }` |

`fileFilter` implementations must build their error with `fileFilterError(message)`
so it can be told apart from an unexpected server failure.

### Process-Level Handlers

`server.js` registers `unhandledRejection` (logged) and `uncaughtException`
(logged, then `process.exit(1)` so the supervisor restarts a process left in an
undefined state). Without them these failures only reach stderr and never the
winston log files.

### Optional Authentication

`optionalAuth` continues as an anonymous request only for token problems
(`JsonWebTokenError`, `TokenExpiredError`, `NotBeforeError`). Any other failure
(e.g. the user lookup failing) is logged and passed to `next(error)` rather than
being silently downgraded to "not logged in".

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
Custom request logger (logging)
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

## Performance Optimizations

The backend implements several database query optimizations to minimize latency and reduce database load.

### Query Optimization Patterns

#### 1. Batch Queries with Aggregation (Wishlists)
**File**: `routes/wishlists.js`

Instead of N+1 queries (1 query per wishlist), uses a single aggregation pipeline:

```javascript
// Before: N+1 queries
wishlists.map(async (wl) => {
  const itemCount = await WishlistItem.countDocuments({ wishlist: wl._id });
});

// After: 2 queries total
const wishlistIds = wishlists.map(w => w._id);
const counts = await WishlistItem.aggregate([
  { $match: { wishlist: { $in: wishlistIds } } },
  { $group: { _id: '$wishlist', count: { $sum: 1 } } }
]);
```

#### 2. Parallel Queries with Promise.all
**File**: `routes/wishlistItems.js`

Analytics endpoint runs multiple aggregations in parallel instead of sequentially:

```javascript
const [breakdowns, itemsOverTime, monthlyTrends, reservationStats] = await Promise.all([
  WishlistItem.aggregate([...]),  // $facet for status/priority/category
  WishlistItem.aggregate([...]),  // items over time
  WishlistItem.aggregate([...]),  // monthly trends
  WishlistReservation.aggregate([...])  // reservation stats
]);
```

#### 3. $facet for Multi-Result Aggregations
Combines multiple aggregations that scan the same collection into a single pipeline:

```javascript
WishlistItem.aggregate([
  { $match: { user: req.user._id } },
  {
    $facet: {
      statusBreakdown: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
      priorityBreakdown: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
      categoryBreakdown: [{ $group: { _id: '$category', count: { $sum: 1 } } }]
    }
  }
]);
```

#### 4. Optimized Stats Aggregation (Tracker)
**File**: `models/TrackerTask.js`

Combines 6 sequential database calls into 2 parallel aggregations:

```javascript
// Before: 6 separate queries
const totalTasks = await this.countDocuments({...});
const completedTasks = await this.countDocuments({...});
const overdueTasks = await this.countDocuments({...});
const recurringTasks = await this.countDocuments({...});
const byPriority = await this.aggregate([...]);
const byCategory = await this.aggregate([...]);

// After: 2 parallel aggregations
const [counts, breakdowns] = await Promise.all([
  this.aggregate([{ $group: { _id: null, totalTasks: {...}, ... }}]),
  this.aggregate([{ $match: { status: 'active' } }, { $group: {...} }])
]);
```

### Database Indexing Strategy

Indexes are defined in model files for optimal query performance:

| Model | Index | Purpose |
|-------|-------|---------|
| `User` | `email: 1` (unique) | Fast user lookup |
| `User` | `createdAt: -1` | Sorting by creation date |
| `Wishlist` | `user: 1, name: 1` (unique) | User's wishlists |
| `Wishlist` | `user: 1, isDefault: 1` | Default wishlist lookup |
| `WishlistItem` | `user: 1, category: 1` | Filtered item queries |
| `WishlistItem` | `user: 1, status: 1` | Status filtering |
| `WishlistItem` | `user: 1, wishlist: 1` | Wishlist items |
| `TrackerTask` | `user: 1, status: 1` | Task filtering |
| `TrackerTask` | `user: 1, dueDate: 1` | Overdue queries |
| `TrackerTask` | `user: 1, recurrence: 1` | Recurring task queries |
| `TrackerTask` | `user: 1, category: 1` | Category filtering |

### Pagination and Limits

All list endpoints implement pagination with configurable limits:

```javascript
const limitNum = Math.min(200, Math.max(1, parseInt(limit))); // Cap at 200
const skip = (pageNum - 1) * limitNum;
```

### Rate Limiting

Multiple rate limiters protect against abuse:

| Limiter | Limit | Window | Purpose |
|---------|-------|--------|---------|
| `generalLimiter` | 1000 | 15 min | All API routes |
| `authLimiter` | 20 | 15 min | Auth endpoints |
| `passwordResetLimiter` | 3 | 1 hour | Password reset |
| `tokenRefreshLimiter` | 50 | 15 min | Token refresh |
| `userActionLimiter` | 50 | 1 hour | User actions |
| `settingsLimiter` | 100 | 15 min | Settings changes |
| `publicReservationLimiter` | 10 | 1 hour | Public reservations |
| `userDataLimiter` | 10 | 1 hour | GDPR data access/export/delete |

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
