# API Overview

Complete reference of all REST API endpoints in the Comprehensive Local Ecosystem.

**Base URL**: `http://localhost:3001/api`

**Authentication**: Most endpoints require JWT authentication via HttpOnly cookies or `Authorization: Bearer <token>` header.

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
| GET | `/export` | Yes | Export encrypted passwords |
| POST | `/import` | Yes | Import passwords |

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
  "username": "user@gmail.com",
  "encryptedPassword": "...",
  "website": "https://gmail.com",
  "category": "social",
  "notes": "Personal email",
  "isFavorite": false
}
```

---

## Files Endpoints

### Base: `/api/files`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List files with pagination |
| POST | `/upload` | Yes | Upload file (multipart/form-data) |
| GET | `/stats` | Yes | Storage statistics |
| GET | `/trash` | Yes | List deleted files |
| DELETE | `/trash/empty` | Yes | Permanently delete all trash |
| POST | `/create-text` | Yes | Create text/markdown file |
| GET | `/:id` | Yes | File metadata |
| GET | `/:id/download` | Yes | Download file |
| GET | `/:id/stream` | Yes | Stream file content |
| GET | `/:id/dataurl` | Yes | Get as base64 data URL |
| GET | `/:id/content` | Yes | Read text file content |
| PUT | `/:id` | Yes | Update metadata |
| PUT | `/:id/content` | Yes | Update text file content |
| PUT | `/:id/move` | Yes | Move to folder |
| PUT | `/:id/share` | Yes | Toggle public sharing |
| DELETE | `/:id` | Yes | Soft delete (move to trash) |
| DELETE | `/:id/permanent` | Yes | Permanently delete |
| POST | `/:id/restore` | Yes | Restore from trash |
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

## System Endpoints

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | System health status |

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2026-04-19T12:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

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
