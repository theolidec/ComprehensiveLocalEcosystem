# API Overview

## Radiation Module

Route prefix: `/api/radiation` — All endpoints require JWT authentication except the public measurements feed.

### Locations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/radiation/locations` | Required | List user's locations |
| POST | `/api/radiation/locations` | Required | Create location |
| PUT | `/api/radiation/locations/:id` | Required | Update location |
| DELETE | `/api/radiation/locations/:id` | Required | Delete location |

### Measurements
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/radiation/measurements` | Required | List measurements (with filters) |
| GET | `/api/radiation/measurements/public` | Optional | Public measurements feed |
| POST | `/api/radiation/measurements` | Required | Create measurement |
| PUT | `/api/radiation/measurements/:id` | Required | Update measurement |
| PUT | `/api/radiation/measurements/:id/visibility` | Required | Toggle public/private |
| PUT | `/api/radiation/measurements/:id/restore` | Required | Restore soft-deleted |
| DELETE | `/api/radiation/measurements/:id` | Required | Soft delete (with reason + snapshot) |
| DELETE | `/api/radiation/measurements/:id/hard` | Required | Hard delete (permanent) |

### Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/radiation/analytics/timeseries` | Required | Time-series data (filterable by date/location) |
| GET | `/api/radiation/analytics/by-location` | Required | Average level per location (aggregated) |
| GET | `/api/radiation/analytics/heatmap` | Required | Daily average calendar heatmap |

### Settings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/api/settings/radiation` | Required | Update radiation preferences (unit, CPM factor, default location) |

---

## Music Module

- `/music` route and FloatingMusicPlayer component available on frontend, linking to backend endpoints.


### Endpoints
- POST `/api/music/upload` — Upload a music file (audio only, JWT required)
- GET `/api/music/my` — Get your uploaded music (JWT required)
- GET `/api/music/public` — Get all public music
- GET `/api/music/stream/:id` — Stream music file (public or user-owned)
- PUT `/api/music/:id` — Update music title/artist (JWT required, owner only)
- PUT `/api/music/:id/visibility` — Toggle public/private visibility (JWT required, owner only)
- PUT `/api/music/:id/transfer` — Transfer ownership to another user by email (JWT required, owner only)
- DELETE `/api/music/:id` — Delete music (JWT required, owner only)
- POST `/api/music/playlist` — Create a playlist (JWT required)
- GET `/api/music/playlist/my` — Get your playlists (JWT required)
- GET `/api/music/playlist/public` — Get all public playlists
- POST `/api/music/playlist/add` — Add music to playlist (JWT required)
- POST `/api/music/playlist/remove` — Remove music from playlist (JWT required)
- DELETE `/api/music/playlist/:id` — Delete playlist (JWT required, owner only)

### Models
- Music: userId, filename, originalName, mimeType, size, path, isPublic, title, artist, album, description, tags, isFavorite, isDeleted, deletedAt (coverUrl and duration fields defined but not populated)
- Playlist: userId, name, description, musicIds, isPublic, isDeleted, deletedAt

### Auth
- Most endpoints require JWT. Public endpoints allow unauthenticated access to public music/playlists.

### File Validation
- Only audio files are accepted for upload.

### Streaming
- Supports HTTP range requests for efficient music playback.


Complete reference of all REST API endpoints in the Comprehensive Local Ecosystem.

**Base URL**: `http://localhost:3001/api`

**Authentication**: Most endpoints require JWT authentication via HttpOnly cookies. `Authorization: Bearer` is not accepted.

---

## Authentication Endpoints

### Base: `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Create new user account |
| POST | `/login` | No | Authenticate user |
| POST | `/refresh` | No* | Refresh access token (*uses refresh cookie) |
| GET | `/me` | Yes | Get current user info |
| POST | `/logout` | Yes | Logout current session |
| POST | `/logout-all` | Yes | Logout from all devices |
| POST | `/forgot-password` | No | Request password reset email |
| POST | `/reset-password/:token` | No | Reset password with token |

**Password Reset Flow**:
```bash
# Request password reset
POST /api/auth/forgot-password
{ "email": "user@example.com" }
# Response: { message: 'If an account exists with this email, a password reset link has been sent', code: 'RESET_EMAIL_SENT' }

# Reset password (token from email/log)
POST /api/auth/reset-password/:token
{ "password": "newpassword123" }
# Response: { message: 'Password reset successful. Please login with your new password.', code: 'PASSWORD_RESET_SUCCESS' }
```

**Request/Response Examples**:

```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
# Response sets HttpOnly cookies: accessToken, refreshToken

# Get current user
GET /api/auth/me
# Response: { user: { id, email, name, lastLogin } }
```

---

## Calendar Endpoints

### Base: `/api/calendar`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events` | Yes | List all events |
| POST | `/events` | Yes | Create new event |
| GET | `/events/:id` | Yes | Get single event |
| PUT | `/events/:id` | Yes | Update event |
| DELETE | `/events/:id` | Yes | Delete event |
| GET | `/events/upcoming` | Yes | Get upcoming events |
| GET | `/events/stats` | Yes | Get event statistics |
| GET | `/events/export` | Yes | Export events as JSON |
| POST | `/events/import` | Yes | Import events from JSON |

**Query Parameters for GET /events**:
- `startDate` - Filter from date (ISO format)
- `endDate` - Filter until date (ISO format)
- `category` - Filter by category
- `search` - Search in title/description

**Event Object**:
```json
{
  "title": "Meeting",
  "description": "Team sync",
  "date": "2026-04-23T10:00:00Z",
  "time": "10:00",
  "location": "Conference Room A",
  "category": "work",
  "color": "#3B82F6",
  "reminder": 15,
  "isRecurring": false,
  "attendees": ["john@example.com"]
}
```

---

## Categories Endpoints

### Base: `/api/categories`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List all event categories |
| POST | `/` | Yes | Create new category |
| PUT | `/:id` | Yes | Update category |
| DELETE | `/:id` | Yes | Delete category |

**Category Object**:
```json
{
  "name": "Work",
  "color": "#3B82F6",
  "icon": "💼"
}
```

---

## Passwords Endpoints

### Base: `/api/passwords`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List all passwords |
| POST | `/` | Yes | Create password entry |
| GET | `/:id` | Yes | Get password metadata |
| GET | `/:id/decrypt` | Yes | Decrypt and view password |
| PUT | `/:id` | Yes | Update password entry |
| DELETE | `/:id` | Yes | Delete password |
| POST | `/:id/favorite` | Yes | Toggle favorite status |
| GET | `/export` | Yes | Export encrypted passwords (JSON) |
| GET | `/export/csv` | Yes | Export decrypted passwords and cards to CSV |
| POST | `/import` | Yes | Import passwords (JSON) |
| POST | `/import/csv` | Yes | Import passwords and cards from CSV |

### Base: `/api/password-categories`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List password categories |
| POST | `/` | Yes | Create category |
| PUT | `/:id` | Yes | Update category |
| DELETE | `/:id` | Yes | Delete category |

**Password Object**:
```json
{
  "title": "Gmail",
  "username": "myusername",
  "email": "user@gmail.com",
  "encryptedPassword": "...",
  "website": "https://gmail.com",
  "category": "social",
  "notes": "Personal email",
  "isFavorite": false
}
```

---

## Payment Cards Endpoints

### Base: `/api/payment-cards`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List all payment cards |
| POST | `/` | Yes | Add new payment card |
| GET | `/:id` | Yes | Get card by ID |
| PUT | `/:id` | Yes | Update card details |
| DELETE | `/:id` | Yes | Delete payment card |
| GET | `/:id/decrypt` | Yes | Decrypt and view card details |
| POST | `/:id/favorite` | Yes | Toggle favorite status |
| POST | `/:id/default` | Yes | Set as default card |

**PaymentCard Object**:
```json
{
  "cardName": "Personal Visa",
  "cardholderName": "John Doe",
  "cardType": "visa",
  "lastFourDigits": "1234",
  "billingAddress": "123 Main St, City, Country",
  "isDefault": true,
  "isFavorite": false
}
```

**Note**: Card number, expiry date, and CVV are encrypted with AES-256-GCM and can only be retrieved via the decrypt endpoint.

---

## Files Endpoints

### Base: `/api/files`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List files with pagination |
| GET | `/all` | Yes | List all files (flat list, max 1000) |
| POST | `/upload` | Yes | Upload file (multipart/form-data) |
| POST | `/document-image` | Yes | Upload image for document embedding (multipart/form-data) |
| GET | `/document-images/:filename` | No | Serve document image |
| GET | `/stats` | Yes | Storage statistics |
| GET | `/trash` | Yes | List deleted files |
| DELETE | `/trash/empty` | Yes | Permanently delete all trash |
| POST | `/create-text` | Yes | Create text/markdown/HTML file |
| GET | `/:id` | Yes | File metadata |
| GET | `/:id/download` | Yes | Download file |
| GET | `/:id/stream` | Yes | Stream file content |
| GET | `/:id/dataurl` | Yes | Get as base64 data URL |
| GET | `/:id/content` | Yes | Read text file content |
| PUT | `/:id` | Yes | Update metadata |
| PUT | `/:id/content` | Yes | Update text file content (auto-creates version for HTML) |
| PUT | `/:id/move` | Yes | Move to folder |
| PUT | `/:id/share` | Yes | Toggle public sharing |
| DELETE | `/:id` | Yes | Soft delete (move to trash) |
| DELETE | `/:id/permanent` | Yes | Permanently delete |
| POST | `/:id/restore` | Yes | Restore from trash |
| GET | `/:id/versions` | Yes | List document version history |
| GET | `/:id/versions/:versionId` | Yes | Get specific version content |
| GET | `/shared/:token` | No | Access shared file |

### Base: `/api/file-folders`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List folders (tree) |
| GET | `/all` | Yes | List all folders (flat) |
| GET | `/path/:id` | Yes | Get breadcrumb path |
| POST | `/` | Yes | Create folder |
| GET | `/:id` | Yes | Folder contents |
| PUT | `/:id` | Yes | Update folder |
| PUT | `/:id/move` | Yes | Move folder |
| DELETE | `/:id` | Yes | Soft delete folder |
| DELETE | `/:id/permanent` | Yes | Permanent delete |
| POST | `/:id/restore` | Yes | Restore from trash |

**File Upload**:
```bash
curl -X POST http://localhost:3001/api/files/upload \
  -H "Cookie: accessToken=<jwt>" \
  -F "file=@document.pdf" \
  -F "folderId=folder-id" \
  -F "description=My document"
```

---

## Wishlist Endpoints

### Base: `/api/wishlist`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get all wishlist items |
| POST | `/` | Yes | Create wishlist item |
| GET | `/:id` | Yes | Get single item |
| PUT | `/:id` | Yes | Update item |
| DELETE | `/:id` | Yes | Delete item |
| GET | `/stats` | Yes | Get statistics |
| GET | `/analytics` | Yes | Get detailed analytics |
| POST | `/:id/share` | Yes | Toggle public sharing |
| GET | `/public/:token` | No | View public item |
| POST | `/:id/reserve` | Optional | Reserve/purchase item |
| GET | `/:id/reservations` | Yes | Get reservations |
| DELETE | `/reservations/:reservationId` | Optional | Cancel reservation |

### Base: `/api/wishlist-categories`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List categories |
| POST | `/` | Yes | Create category |
| PUT | `/:id` | Yes | Update category |
| DELETE | `/:id` | Yes | Delete category |
| POST | `/init` | Yes | Initialize default categories |

### Base: `/api/wishlists`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/templates` | No | Get available templates |
| POST | `/from-template` | Yes | Create wishlist from template |
| GET | `/` | Yes | List my wishlists |
| POST | `/` | Yes | Create wishlist |
| GET | `/:id` | Yes | Get wishlist |
| PUT | `/:id` | Yes | Update wishlist |
| DELETE | `/:id` | Yes | Delete wishlist |

**WishlistItem Object**:
```json
{
  "title": "Coffee Maker",
  "description": "Espresso machine",
  "url": "https://example.com/coffee",
  "price": 299.99,
  "currency": "USD",
  "priority": "high",
  "category": "Birthday",
  "imageUrl": "https://...",
  "isPublic": false
}
```

---

## User Following Endpoints

### Base: `/api/follow`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:userId/followers` | Yes | Get user's followers |
| GET | `/:userId/following` | Yes | Get users being followed |
| POST | `/follow/:userId` | Yes | Follow a user |
| DELETE | `/follow/:userId` | Yes | Unfollow a user |
| GET | `/following/:userId` | Yes | Check if following |
| GET | `/public/:userId` | Yes | Get public profile |
| GET | `/search` | Yes | Search users |

**Search Query Parameters**:
- `q` - Search query (name or email)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

---

## Settings Endpoints

### Base: `/api/settings`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get all settings |
| PUT | `/` | Yes | Update settings (bulk) |
| PUT | `/profile` | Yes | Update profile only |
| PUT | `/calendar` | Yes | Update calendar preferences |
| PUT | `/notifications` | Yes | Update notification preferences |
| PUT | `/display` | Yes | Update display preferences |
| PUT | `/privacy` | Yes | Update privacy settings |
| PUT | `/wishlist` | Yes | Update wishlist settings |
| GET | `/sessions` | Yes | List active sessions |
| DELETE | `/sessions/:sessionId` | Yes | Revoke a session |
| DELETE | `/reset` | Yes | Reset to defaults |
| POST | `/avatar` | Yes | Upload avatar |
| DELETE | `/avatar` | Yes | Remove avatar |

**Settings Object**:
```json
{
  "profile": {
    "name": "John Doe",
    "bio": "Software developer",
    "avatar": "https://..."
  },
  "calendar": {
    "defaultView": "month",
    "weekStartsOn": 0,
    "timezone": "UTC"
  },
  "notifications": {
    "emailReminders": true,
    "reminderTime": 15
  },
  "display": {
    "theme": "system",
    "language": "en"
  },
  "privacy": {
    "shareCalendar": false
  }
}
```

---

## Wiki Endpoints

### Base: `/api/wikis`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Create wiki |
| GET | `/` | Yes | List my wikis |
| GET | `/public` | No | List public wikis |
| GET | `/:slug` | Yes* | Get wiki (*public if allowPublicRead) |
| PUT | `/:slug` | Yes | Update wiki |
| DELETE | `/:slug` | Yes | Delete wiki |
| GET | `/:slug/members` | Yes | List members |
| POST | `/:slug/members` | Yes | Add member |
| DELETE | `/:slug/members/:userId` | Yes | Remove member |

### Base: `/api/wikis/:slug/pages`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Create page |
| GET | `/` | Yes* | Get page tree |
| GET | `/all` | Yes* | List all pages |
| GET | `/:pageSlug` | Yes* | Get page |
| PUT | `/:pageSlug` | Yes | Update page |
| DELETE | `/:pageSlug` | Yes | Delete page |
| GET | `/:pageSlug/history` | Yes | Page history |
| GET | `/:pageSlug/history/:versionId` | Yes | Specific version |
| POST | `/:pageSlug/restore/:versionId` | Yes | Restore version |
| GET | `/:pageSlug/diff` | Yes | Compare versions |
| GET | `/:pageSlug/backlinks` | Yes | Pages linking here |
| POST | `/:pageSlug/move` | Yes | Move/rename page |
| POST | `/:pageSlug/redirect` | Yes | Create redirect |
| POST | `/:pageSlug/watch` | Yes | Watch page |
| DELETE | `/:pageSlug/watch` | Yes | Unwatch page |

**Wiki Object**:
```json
{
  "name": "Team Knowledge Base",
  "slug": "team-kb",
  "description": "Internal documentation",
  "visibility": "private",
  "allowPublicRead": false,
  "allowPublicEdit": false,
  "icon": "📚",
  "color": "#3B82F6"
}
```

**Page Object**:
```json
{
  "title": "Getting Started",
  "slug": "getting-started",
  "content": "# Welcome...",
  "excerpt": "Introduction...",
  "parent": null,
  "order": 0,
  "tags": ["guide"],
  "isHomePage": true
}
```

---

## Daily Tracker Endpoints

### Base: `/api/tracker`

#### Tasks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tasks` | Yes | List tasks with filtering and pagination |
| GET | `/tasks/today` | Yes | Get today's tasks with completion status |
| POST | `/tasks` | Yes | Create new task |
| PUT | `/tasks/:id` | Yes | Update task |
| DELETE | `/tasks/:id` | Yes | Delete task |

**Query Parameters for GET /tasks**:
- `status` - Filter by status (active, paused, completed, archived)
- `recurrence` - Filter by recurrence type
- `priority` - Filter by priority (low, medium, high, urgent)
- `category` - Filter by category
- `search` - Search in title/description
- `sort` - Sort by (order, priority, dueDate, createdAt)
- `page`, `limit` - Pagination

#### Questions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/questions` | Yes | List questions |
| POST | `/questions` | Yes | Create question |
| PUT | `/questions/:id` | Yes | Update question |
| DELETE | `/questions/:id` | Yes | Delete question |

#### Responses / Check-in

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/responses` | Yes | List responses with date filtering |
| GET | `/responses/today` | Yes | Get today's response |
| POST | `/responses` | Yes | Save/upsert daily response (upsert by date) |

#### Statistics & Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stats` | Yes | Overview statistics (streaks, completion rate, task counts) |
| GET | `/analytics` | Yes | Detailed analytics (daily activity, mood trends, question stats) |
| GET | `/heatmap` | Yes | Yearly activity heatmap data |

**Query Parameters for GET /heatmap**:
- `year` - Target year (default: current year)

#### Data Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/export` | Yes | Export all tracker data as JSON |
| POST | `/import` | Yes | Import tracker data from JSON |

**Task Object**:
```json
{
  "title": "Morning Meditation",
  "description": "10 minutes mindfulness",
  "category": "Health",
  "priority": "high",
  "recurrence": "daily",
  "estimatedMinutes": 10,
  "tags": ["mindfulness"]
}
```

**Task Update Fields** (PUT /tasks/:id):
- `title`, `description`, `category`, `priority`
- `recurrence`, `customRecurrenceDays`, `weeklyDays`
- `dueDate`, `startDate`, `endDate`
- `estimatedMinutes`, `status`, `isCompleted`, `completedAt`, `order`, `tags`

**Status Values**: `active`, `paused`, `completed`, `archived`
**Priority Values**: `low`, `medium`, `high`, `urgent`
**Recurrence Values**: `none`, `daily`, `weekly`, `biweekly`, `monthly`, `quarterly`, `yearly`, `custom`

**Question Object**:
```json
{
  "question": "Did I learn something today?",
  "responseType": "yesno",
  "category": "Learning",
  "isRequired": true,
  "icon": "book"
}
```

**Yes/No/Maybe Question**:
```json
{
  "question": "Will you attend the meeting?",
  "responseType": "yesnomaybe",
  "category": "Work",
  "isRequired": true
}
```

**Response Object**:
```json
{
  "date": "2026-05-02",
  "taskCompletions": [{ "task": "taskId", "completed": true }],
  "questionResponses": [{ "question": "questionId", "value": true }],
  "mood": 4,
  "overallNotes": "Great day!"
}
```

---

## User Rights Endpoints

### Base: `/api/user`

These endpoints implement GDPR user rights: access, correction, deletion, and data export.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/data` | Yes | Get all user data (access right) |
| PUT | `/data` | Yes | Update name/email (correction right) |
| DELETE | `/account` | Yes | Delete account and all data (deletion right) |
| GET | `/export` | Yes | Export all data as JSON (portability right) |

**Rate Limit**: 10 requests per hour per user

**GET /api/user/data** - Access your personal data:
```bash
GET /api/user/data
# Response: { user: { id, email, name, isActive, lastLogin, createdAt }, settings: {...}, activeSessions: [...] }
```

**PUT /api/user/data** - Correct inaccurate data:
```bash
PUT /api/user/data
{
  "name": "New Name",
  "email": "newemail@example.com"
}
# Response: { message: 'User data updated successfully', user: {...} }
```

**DELETE /api/user/account** - Request deletion of your data:
```bash
DELETE /api/user/account
{
  "password": "your-current-password"
}
# Response: { message: 'Account deleted successfully' }
# This permanently deletes: account, settings, calendar events, categories, passwords, wishlists, files, wikis, and social connections
```

**GET /api/user/export** - Export all your data:
```bash
GET /api/user/export
# Response: Downloads JSON file with all user data including calendar, passwords, wishlists, files, and wikis
```

---

## System Endpoints

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | System health status |

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2026-04-19T12:00:00.000Z"
}
```

> **Note**: `uptime` and `environment` were removed in v2.6.0 (security hardening) to avoid leaking server fingerprint information.

### Server Info

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Server information |

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 423 | Locked (account locked) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional info
}
```

Example:
```json
{
  "error": "User with this email already exists",
  "code": "USER_EXISTS"
}
```

---

## Testing with cURL

```bash
# Set cookie file
cookies="cookies.txt"

# Login
 curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c $cookies

# Use authenticated request
curl http://localhost:3001/api/calendar/events -b $cookies

# Upload file
curl -X POST http://localhost:3001/api/files/upload \
  -b $cookies \
  -F "file=@photo.jpg"
```
