# Database Models

## Overview

All data is stored in **MongoDB** using **Mongoose** ODM. The database follows a document-oriented schema design with references between collections.

## Database Connection

**File**: `backend/config/database.js`

```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

**Connection Events**:
- `connected` - Successfully connected
- `error` - Connection error
- `disconnected` - Connection lost

## Model Summary

| Model | File | Purpose | Relationships |
|-------|------|---------|---------------|
| User | `User.js` | User accounts | Parent of all user data |
| RefreshToken | `RefreshToken.js` | Session tokens | References User |
| Event | `Event.js` | Calendar events | References User |
| Category | `Category.js` | Event categories | References User |
| Password | `Password.js` | Stored passwords | References User |
| PasswordCategory | `PasswordCategory.js` | Password groups | References User |
| PaymentCard | `PaymentCard.js` | Stored payment cards | References User |
| File | `File.js` | Uploaded files | References User, FileFolder |
| FileFolder | `FileFolder.js` | File organization | References User, FileFolder (self) |
| Settings | `Settings.js` | User preferences | References User (1:1) |
| Wishlist | `Wishlist.js` | Wishlist containers | References User |
| WishlistCategory | `WishlistCategory.js` | Per-user wishlist category labels | References User |
| WishlistItem | `WishlistItem.js` | Wishlist entries | References User, Wishlist |
| WishlistReservation | `WishlistReservation.js` | Item reservations | References User, WishlistItem |
| UserFollow | `UserFollow.js` | Social following | References User (2x) |
| Wiki | `Wiki.js` | Wiki spaces | References User (owner) |
| WikiPage | `WikiPage.js` | Wiki articles | References Wiki, User |
| WikiVersion | `WikiVersion.js` | Page history | References WikiPage, Wiki |
| WikiPermission | `WikiPermission.js` | Access control | References Wiki, User |
| WikiCategory | `WikiCategory.js` | Page categories | References Wiki |
| WikiWatch | `WikiWatch.js` | Page monitoring | References User, WikiPage |
| TrackerTask | `TrackerTask.js` | Daily tracker tasks | References User |
| TrackerQuestion | `TrackerQuestion.js` | Tracker questions | References User |
| TrackerResponse | `TrackerResponse.js` | Daily check-in responses | References User |

---

## User Model

**File**: `backend/models/User.js`

```javascript
{
  // Required fields
  email: String,           // Unique, lowercase, validated
  password: String,        // Hashed, min 12 chars, select: false
  name: String,            // Required, trimmed, max 50 chars

  // Status fields
  isActive: Boolean,       // Default: true
  lastLogin: Date,         // Updated on successful login
  loginAttempts: Number,   // Default: 0
  lockUntil: Date,         // Account lock expiry
  passwordSalt: String,    // 32-byte salt, select: false

  // Password reset
  resetPasswordToken: String,    // SHA-256 hash, select: false
  resetPasswordExpires: Date,    // Token TTL

  // GDPR Art. 7 demonstrable-consent record (captured at registration)
  consent: {
    acceptedTermsAt: Date,
    acceptedPrivacyAt: Date,
    ageConfirmation13Plus: Boolean,   // Default: false
    ipAtConsent: String,
    userAgentAtConsent: String,
    termsVersion: String,             // e.g., '2026-05-18'
    privacyVersion: String            // e.g., '2026-05-18'
  },

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `email: 1` - Unique lookup
- `createdAt: -1` - Sorting

**Virtuals**:
- `isLocked` - Computed from `lockUntil`

**Methods**:
- `comparePassword(candidatePassword)` - bcrypt comparison
- `generateAccessToken()` - JWT (15 min expiry)
- `generateRefreshToken()` - JWT (7 day expiry)

**Statics**:
- `findByEmailWithPassword(email)` - Include password field
- `updateLastLogin(userId)` - Reset attempts, set timestamp
- `incrementLoginAttempts(userId)` - Track failures, lock account

**Pre-save Hook**:
- Hashes password with bcrypt (12 salt rounds)
- Generates unique 32-byte salt

---

## RefreshToken Model

**File**: `backend/models/RefreshToken.js`

```javascript
{
  token: String,           // Unique, required
  user: ObjectId,          // Ref: 'User', required
  expiresAt: Date,         // TTL: 7 days, required
  isRevoked: Boolean,      // Default: false
  deviceInfo: {
    userAgent: String,
    ip: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `token: 1` - Verification lookup
- `user: 1` - User session queries
- `expiresAt: 1` - TTL and cleanup

**Statics**:
- `createToken(user, deviceInfo)` - Create and save
- `verifyToken(token)` - Validate and return doc
- `revokeToken(token)` - Mark revoked
- `revokeAllUserTokens(userId)` - Bulk revoke
- `cleanupExpiredTokens()` - Delete old tokens

---

## Event Model

**File**: `backend/models/Event.js`

```javascript
{
  // Core fields
  title: String,           // Required, max 100 chars
  description: String,     // Max 500 chars
  date: Date,              // Required
  time: String,            // Time string
  location: String,        // Max 200 chars
  
  // Categorization
  category: String,        // Default: 'work'
  color: String,           // Hex color
  
  // Attendees and reminders
  attendees: [String],     // Email addresses
  reminder: Number,        // Minutes (0, 5, 15, 30, 60, 1440)
  
  // Recurrence
  isRecurring: Boolean,
  recurringPattern: String,   // daily/weekly/monthly/yearly
  recurringEndDate: Date,
  recurringOccurrences: Number, // 1-365
  
  // Additional
  timezone: String,
  isAllDay: Boolean,
  duration: Number,        // Minutes, 0-1440
  isCompleted: Boolean,
  
  // Relations
  user: ObjectId,          // Ref: 'User', required
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `user: 1, date: -1` - User's events by date
- `user: 1, category: 1` - Category filtering

**Statics**:
- `getUpcomingEvents(userId, limit)` - Next N events
- `getEventStats(userId, year, month)` - Monthly statistics

---

## Category Model

**File**: `backend/models/Category.js`

```javascript
{
  name: String,            // Required, max 50 chars
  color: String,           // Hex, default: '#6B7280'
  icon: String,            // Emoji, default: '📁'
  user: ObjectId,          // Ref: 'User', required
  isDefault: Boolean,      // System category flag
  createdAt: Date,
  updatedAt: Date
}
```

**Statics**:
- `createDefaultCategories(userId)` - Create 6 default categories

---

## Password Model

**File**: `backend/models/Password.js`

```javascript
{
  title: String,           // Required, max 100 chars
  username: String,        // Max 100 chars
  encryptedPassword: String,  // AES-256-GCM encrypted
  website: String,         // Max 200 chars
  category: String,        // Enum: social/finance/work/shopping/entertainment/other
  notes: String,           // Max 1000 chars
  isFavorite: Boolean,     // Default: false
  userId: ObjectId,        // Ref: 'User', required, indexed
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `userId: 1` - User's passwords
- `userId: 1, category: 1` - Category filtering
- `userId: 1, isFavorite: 1` - Favorites

---

## PasswordCategory Model

**File**: `backend/models/PasswordCategory.js`

```javascript
{
  userId: ObjectId,        // Ref: 'User', required
  name: String,            // Required, max 50 chars
  icon: String,            // Emoji, default: '📁'
  color: String,           // Hex, default: '#6B7280'
  isDefault: Boolean,      // Default: false
  createdAt: Date,
  updatedAt: Date
}
```

**Default Categories**:
- Social (Blue, 👥)
- Finance (Green, 💳)
- Work (Orange, 💼)
- Shopping (Red, 🛒)
- Entertainment (Purple, 🎮)
- Other (Gray, 📁)

---

## PaymentCard Model

**File**: `backend/models/PaymentCard.js`

```javascript
{
  userId: ObjectId,          // Ref: 'User', required, indexed
  cardName: String,          // Required, max 100 chars
  cardholderName: String,    // Max 100 chars
  encryptedCardNumber: String,  // Required, AES-256-GCM encrypted
  encryptedExpiryDate: String,  // Required
  encryptedCVV: String,      // Required
  cardType: String,          // Enum: visa/mastercard/amex/discover/other
  lastFourDigits: String,    // 4 digits
  billingAddress: String,    // Max 500 chars
  isDefault: Boolean,        // Default: false
  isFavorite: Boolean,       // Default: false
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `userId: 1` - User's cards
- `userId: 1, createdAt: -1` - Sorting
- `userId: 1, isDefault: 1` - Default card lookup
- `userId: 1, cardType: 1` - Card type filtering

---

## File Model

**File**: `backend/models/File.js`

```javascript
{
  userId: ObjectId,        // Ref: 'User', required, indexed
  filename: String,        // Stored name, required
  originalName: String,    // Original name, required
  mimeType: String,        // MIME type, required
  size: Number,            // Bytes, required
  path: String,            // Filesystem path, required
  
  // Organization
  folderId: ObjectId,      // Ref: 'FileFolder', default: null
  description: String,     // Max 500 chars
  tags: [String],          // Each max 50 chars
  
  // Flags
  isFavorite: Boolean,     // Default: false
  isDeleted: Boolean,      // Default: false
  deletedAt: Date,
  isPublic: Boolean,       // Default: false
  shareToken: String,      // Unique, sparse
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `userId: 1` - User's files
- `userId: 1, folderId: 1` - Folder contents
- `userId: 1, isDeleted: 1` - Trash filtering
- `shareToken: 1` - Public access

---

## FileFolder Model

**File**: `backend/models/FileFolder.js`

```javascript
{
  userId: ObjectId,        // Ref: 'User', required, indexed
  name: String,            // Required
  parentId: ObjectId,      // Ref: 'FileFolder', default: null
  color: String,           // Hex, default: '#6b7280'
  isDeleted: Boolean,      // Default: false
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `userId: 1` - User's folders
- `userId: 1, parentId: 1` - Folder tree
- `userId: 1, isDeleted: 1` - Active folders

---

## Settings Model

**File**: `backend/models/Settings.js`

```javascript
{
  userId: ObjectId,        // Ref: 'User', required, unique
  
  profile: {
    name: String,
    bio: String,
    avatar: String         // URL
  },
  
  calendar: {
    defaultView: String,   // Enum: month/week/day/agenda
    weekStartsOn: Number,  // 0-6 (Sunday=0)
    timezone: String,      // Default: 'UTC'
    showWeekNumbers: Boolean,
    defaultEventDuration: Number,  // 15-480 min
    workingHours: {
      start: String,       // HH:MM, default: '09:00'
      end: String          // HH:MM, default: '17:00'
    }
  },
  
  notifications: {
    emailReminders: Boolean,   // Default: true
    reminderTime: Number,      // 0-10080 min, default: 15
    eventUpdates: Boolean,     // Default: true
    weeklyDigest: Boolean      // Default: false
  },
  
  display: {
    theme: String,         // Enum: light/dark/system
    language: String,      // Default: 'en'
    compactMode: Boolean,
    showCompletedEvents: Boolean
  },
  
  privacy: {
    shareCalendar: Boolean,
    showBusyStatus: Boolean,
    allowThemeCookie: Boolean    // Login page + Graphing Calculator theme cookies
  },

  wishlist: {
    defaultItemsPerPage: Number, // 10-200, default: 20
    saveItemsPerPageCookie: Boolean // Default: true
  },

  createdAt: Date,
  updatedAt: Date
}
```

**Statics**:
- `getOrCreateForUser(userId)` - Returns existing or creates new

---

## Wishlist Model

**File**: `backend/models/Wishlist.js`

```javascript
{
  name: String,            // Required
  description: String,
  user: ObjectId,          // Ref: 'User', required
  isDefault: Boolean,      // Default: false
  template: String,        // Enum: birthday/christmas/wedding/baby_shower/housewarming
  coverImage: String,      // URL
  color: String,           // Hex
  createdAt: Date,
  updatedAt: Date
}
```

---

## WishlistCategory Model

**File**: `backend/models/WishlistCategory.js`

```javascript
{
  name: String,            // Required, trim, max 50 chars
  color: String,           // Required, hex, default: '#8b5cf6'
  icon: String,            // Default: 'gift'
  user: ObjectId,          // Ref: 'User', required (categories are per-user, not per-wishlist)
  isDefault: Boolean,      // Default: false
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ user: 1, name: 1 }` (unique compound) - one category name per user

**Statics**:
- `createDefaultCategories(userId)` - Creates `Birthday` and `Christmas` defaults; ignores duplicate-key errors via `insertMany({ ordered: false })`

---

## WishlistItem Model

**File**: `backend/models/WishlistItem.js`

```javascript
{
  title: String,           // Required, max 100 chars
  description: String,     // Max 500 chars
  url: String,             // Valid URL
  price: Number,           // Min: 0
  currency: String,        // Enum: USD/EUR/GBP/CAD/AUD/NOK/SEK/DKK
  priority: String,        // Enum: low/medium/high/must-have
  
  // Relations
  wishlist: ObjectId,      // Ref: 'Wishlist'
  category: String,
  user: ObjectId,          // Ref: 'User', required
  
  // Media
  imageUrl: String,
  
  // Sharing
  isPublic: Boolean,       // Default: false
  shareToken: String,      // Unique, sparse
  
  // Status
  status: String,          // Enum: active/purchased/archived
  reservations: [ObjectId], // Ref: 'WishlistReservation'
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `user: 1, category: 1`
- `user: 1, status: 1`
- `category: 1, isPublic: 1`
- `shareToken: 1`
- `user: 1, wishlist: 1`

---

## WishlistReservation Model

**File**: `backend/models/WishlistReservation.js`

```javascript
{
  item: ObjectId,          // Ref: 'WishlistItem', required
  reservedBy: ObjectId,    // Ref: 'User', required
  wishlist: ObjectId,      // Ref: 'Wishlist', required
  message: String,
  status: String,          // Enum: reserved/purchased/cancelled
  isAnonymous: Boolean,    // Default: false
  reservedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## UserFollow Model

**File**: `backend/models/UserFollow.js`

```javascript
{
  follower: ObjectId,      // Ref: 'User', required
  following: ObjectId,     // Ref: 'User', required
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `follower: 1, following: 1` - Unique compound
- `following: 1, createdAt: -1` - Followers list

**Statics**:
- `follow(followerId, followingId)` - Create follow
- `unfollow(followerId, followingId)` - Remove follow
- `getFollowers(userId, page, limit)` - Paginated followers
- `getFollowing(userId, page, limit)` - Paginated following

---

## Wiki Model

**File**: `backend/models/Wiki.js`

```javascript
{
  name: String,            // Required
  slug: String,            // Unique, required, URL-friendly
  description: String,
  owner: ObjectId,         // Ref: 'User', required
  
  // Visibility
  visibility: String,        // Enum: private/public
  icon: String,
  color: String,           // Hex
  allowPublicRead: Boolean,
  allowPublicEdit: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## WikiPage Model

**File**: `backend/models/WikiPage.js`

```javascript
{
  wiki: ObjectId,          // Ref: 'Wiki', required
  title: String,           // Required, max 200 chars
  slug: String,            // Required, lowercase
  content: String,         // Markdown
  excerpt: String,         // Max 500 chars
  
  // Hierarchy
  parent: ObjectId,        // Ref: 'WikiPage'
  order: Number,           // Default: 0
  isHomePage: Boolean,     // Default: false
  
  // Redirect
  redirectTo: ObjectId,    // Ref: 'WikiPage'
  isRedirect: Boolean,
  
  // Metadata
  infobox: Object,         // Structured data
  tags: [String],
  categories: [ObjectId], // Ref: 'WikiCategory'
  viewCount: Number,
  
  // Editing
  lastEditedBy: ObjectId,  // Ref: 'User'
  lastEditedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `wiki: 1, slug: 1` - Unique
- `wiki: 1, parent: 1` - Tree structure
- Text index: `title + content` - Search

**Methods**:
- `generateSlug(wikiId, title)` - Create unique slug
- `getPageTree(wikiId)` - Hierarchical tree
- `extractHeadings()` - Parse markdown headers
- `extractLinks()` - Parse [[WikiLinks]]

---

## WikiVersion Model

**File**: `backend/models/WikiVersion.js`

```javascript
{
  page: ObjectId,          // Ref: 'WikiPage', required
  wiki: ObjectId,          // Ref: 'Wiki', required
  title: String,
  content: String,
  version: Number,
  editSummary: String,
  editedBy: ObjectId,      // Ref: 'User'
  createdAt: Date
}
```

---

## WikiPermission Model

**File**: `backend/models/WikiPermission.js`

```javascript
{
  wiki: ObjectId,          // Ref: 'Wiki', required
  user: ObjectId,          // Ref: 'User', required
  role: String,            // Enum: admin/editor/viewer
  grantedBy: ObjectId,     // Ref: 'User'
  createdAt: Date,
  updatedAt: Date
}
```

---

## WikiCategory Model

**File**: `backend/models/WikiCategory.js`

```javascript
{
  wiki: ObjectId,          // Ref: 'Wiki', required
  name: String,            // Required
  slug: String,            // Required
  description: String,
  color: String,           // Hex
  createdAt: Date,
  updatedAt: Date
}
```

---

## WikiWatch Model

**File**: `backend/models/WikiWatch.js`

```javascript
{
  user: ObjectId,          // Ref: 'User', required
  page: ObjectId,          // Ref: 'WikiPage', required
  wiki: ObjectId,          // Ref: 'Wiki', required
  createdAt: Date
}
```

---

## TrackerTask Model

**File**: `backend/models/TrackerTask.js`

```javascript
{
  title: String,           // Required, max 100 chars
  description: String,     // Max 500 chars
  user: ObjectId,          // Ref: 'User', required, indexed
  category: String,        // Max 50 chars
  priority: String,        // Enum: low/medium/high/urgent
  recurrence: String,      // Enum: none/daily/weekly/biweekly/monthly/quarterly/yearly/custom
  customRecurrenceDays: Number,  // For custom recurrence
  weeklyDays: [Number],    // 0-6 for weekly recurrence
  dueDate: Date,
  startDate: Date,
  endDate: Date,
  estimatedMinutes: Number,
  status: String,          // Enum: active/paused/completed/archived
  isCompleted: Boolean,
  completedAt: Date,
  order: Number,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `user: 1, status: 1` - Filter by status
- `user: 1, dueDate: 1` - Due date sorting
- `user: 1, recurrence: 1` - Recurrence filtering
- `user: 1, category: 1` - Category filtering

**Statics**:
- `getStatsByUser(userId)` - Get task statistics

---

## TrackerQuestion Model

**File**: `backend/models/TrackerQuestion.js`

```javascript
{
  question: String,        // Required
  user: ObjectId,          // Ref: 'User', required, indexed
  responseType: String,    // Enum: yesno/yesnomaybe/scale/text/number
  scaleMin: Number,        // For scale type
  scaleMax: Number,
  scaleLabels: {
    minLabel: String,
    maxLabel: String
  },
  category: String,
  isActive: Boolean,       // Default: true
  isRequired: Boolean,     // Default: false
  order: Number,
  icon: String,
  color: String,
  reminderTime: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `user: 1, isActive: 1` - Active questions
- `user: 1, category: 1` - Category filtering

---

## TrackerResponse Model

**File**: `backend/models/TrackerResponse.js`

```javascript
{
  user: ObjectId,          // Ref: 'User', required, indexed
  date: Date,              // Required (unique per user)
  taskCompletions: [{
    task: ObjectId,        // Ref: 'TrackerTask'
    completed: Boolean,
    completedAt: Date
  }],
  questionResponses: [{
    question: ObjectId,    // Ref: 'TrackerQuestion'
    value: mongoose.Mixed // Boolean/Number/String based on question type
  }],
  mood: Number,            // 1-5
  overallNotes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `user: 1, date: 1` - Unique compound (one response per day)
- `user: 1, taskCompletions.task: 1` - Task completion lookup
- `user: 1, questionResponses.question: 1` - Question response lookup

**Statics**:
- `getStreakByUser(userId)` - Calculate current streak
- `getCompletionRateByUser(userId, days)` - Calculate completion rate
- `getAnalyticsByUser(userId)` - Get detailed analytics

---

## Schema Patterns

### Common Options

All schemas use these common options:

```javascript
{
  timestamps: true,  // Adds createdAt, updatedAt
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;  // Remove version key
      return ret;
    }
  }
}
```

### Indexing Strategy

1. **Foreign Keys**: Index all `ObjectId` reference fields
2. **Query Patterns**: Index common query combinations
3. **Unique Constraints**: Use compound indexes for uniqueness
4. **Text Search**: Create text indexes for search fields
5. **TTL**: Use `expires` for auto-deletion (refresh tokens)

### Validation Pattern

```javascript
field: {
  type: String,
  required: [true, 'Custom error message'],
  minlength: [min, 'Too short'],
  maxlength: [max, 'Too long'],
  match: [/regex/, 'Invalid format'],
  enum: {
    values: ['a', 'b'],
    message: 'Must be a or b'
  },
  validate: {
    validator: function(v) {
      return validationLogic(v);
    },
    message: 'Validation failed'
  }
}
```

### Pre-save Hook Pattern

```javascript
schema.pre('save', async function(next) {
  if (!this.isModified('field')) return next();
  
  // Transform data
  this.field = transform(this.field);
  
  next();
});
```

## Data Relationships

```
User
├── RefreshTokens (1:N)
├── Events (1:N)
├── Categories (1:N)
├── Passwords (1:N)
├── PasswordCategories (1:N)
├── PaymentCards (1:N)
├── Files (1:N)
├── FileFolders (1:N)
├── DocumentVersions (1:N, via File)
├── Settings (1:1)
├── Wishlists (1:N)
├── WishlistCategories (1:N)              # Per-user labels, not nested under Wishlist
├── WishlistItems (1:N, may reference Wishlist)
│   └── WishlistReservations (1:N)
├── Following (UserFollow 1:N, as follower)
├── Followers (UserFollow 1:N, as following)
├── TrackerTasks (1:N)
├── TrackerQuestions (1:N)
├── TrackerResponses (1:N, unique per [user, date])
└── Wikis (1:N, as owner)
    ├── WikiPages (1:N)
    │   └── WikiVersions (1:N)
    ├── WikiPermissions (1:N)
    ├── WikiCategories (1:N)
    └── WikiWatch (1:N)
```
