# Authentication System

## Overview

The authentication system provides secure JWT-based authentication with refresh tokens, HttpOnly cookies, rate limiting, and account protection. It implements industry best practices for web application security including token rotation, device tracking, and automatic account locking.

## Features

- **JWT-based Authentication**: Short-lived access tokens (15 minutes) with refresh tokens (7 days)
- **HttpOnly Cookies**: Secure token storage preventing XSS attacks
- **Token Rotation**: Automatic refresh token rotation on each use
- **Rate Limiting**: Protection against brute force attacks
- **Account Locking**: Automatic 2-hour lock after 5 failed login attempts
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Session Management**: Individual and bulk logout capabilities
- **Device Tracking**: Monitor login sessions across devices
- **Password Reset**: Email-based password reset functionality

## Architecture

### Token Flow

```
┌─────────────┐     Login      ┌─────────────┐
│   Client    │ ─────────────→ │   Backend   │
│  (Browser)  │                │   (Node.js) │
└─────────────┘                └─────────────┘
                                      │
                                      ▼
                              ┌─────────────┐
                              │  Generate   │
                              │   Tokens    │
                              │  + Cookies  │
                              └─────────────┘
                                      │
         ┌────────────────────────────┘
         │
         ▼
┌─────────────┐
│  HttpOnly   │
│   Cookies   │
│             │
│ accessToken │ (15 min)
│ refreshToken│ (7 days)
└─────────────┘
```

### Authentication Flow

1. **Registration**: User creates account → Password hashed with bcrypt → Default categories created → Tokens generated
2. **Login**: Credentials validated → Account lock check → Tokens generated → Cookies set
3. **Authenticated Requests**: Cookie parsed → JWT verified → User attached to request
4. **Token Refresh**: Refresh token validated → New tokens generated → Old token revoked
5. **Logout**: Cookies cleared → Refresh token revoked

## Data Models

### User Schema

```javascript
{
  email: String (required, unique, lowercase),
  password: String (required, minlength: 6, select: false),
  name: String (required, trim, maxlength: 50),
  isActive: Boolean (default: true),
  lastLogin: Date,
  loginAttempts: Number (default: 0),
  lockUntil: Date,
  passwordSalt: String (select: false)
}
```

**Indexes**: `email: 1`, `createdAt: -1`

**Methods**:
- `comparePassword(candidatePassword)` - bcrypt comparison
- `generateAccessToken()` - JWT with 15min expiry
- `generateRefreshToken()` - JWT with 7day expiry

**Static Methods**:
- `findByEmailWithPassword(email)` - Include password field
- `updateLastLogin(userId)` - Reset attempts, update timestamp
- `incrementLoginAttempts(userId)` - Track failures, lock if needed

### RefreshToken Schema

```javascript
{
  token: String (required, unique),
  user: ObjectId (ref: 'User', required),
  expiresAt: Date (required, TTL: 7 days),
  isRevoked: Boolean (default: false),
  deviceInfo: {
    userAgent: String,
    ip: String
  }
}
```

**Indexes**: `token: 1`, `user: 1`, `expiresAt: 1`

**Static Methods**:
- `createToken(user, deviceInfo)` - Create and save new token
- `verifyToken(token)` - Validate and return token doc
- `revokeToken(token)` - Mark as revoked
- `revokeAllUserTokens(userId)` - Bulk revoke
- `cleanupExpiredTokens()` - Remove old tokens

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/register` | Create new account | 20/15min |
| POST | `/login` | Authenticate user | 20/15min |
| POST | `/refresh` | Refresh tokens | 50/15min |
| GET | `/me` | Get current user | General |
| POST | `/logout` | Logout session | General |
| POST | `/logout-all` | Logout all devices | General |
| POST | `/forgot-password` | Request reset | 3/hour |
| POST | `/reset-password/:token` | Reset password | 3/hour |

### Request/Response Examples

**Register:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

# Response 201
{
  "message": "User registered successfully",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
# Sets HttpOnly cookies: accessToken, refreshToken
```

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

# Response 200
{
  "message": "Login successful",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Get Current User:**
```bash
GET /api/auth/me
Cookie: accessToken=<jwt>

# Response 200
{
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "name": "John Doe",
    "lastLogin": "2026-04-19T10:30:00.000Z"
  }
}
```

**Refresh Token:**
```bash
POST /api/auth/refresh
Cookie: refreshToken=<jwt>

# Response 200
{
  "message": "Token refreshed successfully"
}
# Sets new HttpOnly cookies
```

## Middleware

### authenticateToken

Verifies JWT from Authorization header or cookies.

```javascript
// Usage
const { authenticateToken } = require('./middleware/auth');
router.get('/protected', authenticateToken, handler);
```

**Behavior**:
1. Extract token from `Authorization: Bearer <token>` or `cookies.accessToken`
2. Verify JWT signature with `JWT_SECRET`
3. Fetch user from database
4. Check `isActive` and `isLocked` status
5. Attach `req.user` and `req.token`

**Error Responses**:
- `401 NO_TOKEN` - No token provided
- `401 USER_INVALID` - User not found or inactive
- `423 ACCOUNT_LOCKED` - Account temporarily locked
- `403 INVALID_TOKEN_FORMAT` - Malformed JWT
- `403 TOKEN_EXPIRED` - Token expired, needs refresh

### verifyRefreshToken

Validates refresh token for token rotation.

**Behavior**:
1. Extract from request body or `cookies.refreshToken`
2. Verify in database (not revoked, not expired)
3. Verify JWT signature with `JWT_REFRESH_SECRET`
4. Attach `req.user`, `req.refreshToken`, `req.refreshTokenDoc`

### optionalAuth

Allows both authenticated and unauthenticated access.

```javascript
// Usage for public routes with auth benefits
router.get('/public-content', optionalAuth, handler);
// req.user will be set if authenticated, undefined otherwise
```

## Security Features

### Rate Limiting

| Endpoint | Window | Max Requests |
|----------|--------|--------------|
| General API | 15 min | 1000 |
| Authentication | 15 min | 20 |
| Token Refresh | 15 min | 50 |
| Password Reset | 1 hour | 3 |

### Account Locking

- Triggered after 5 failed login attempts
- Lock duration: 2 hours
- Attempts reset on successful login
- Returns HTTP 423 with `ACCOUNT_LOCKED` code

### Password Security

- **Hashing**: bcrypt with 12 salt rounds
- **Per-user salt**: 32-byte random salt for password encryption
- **Minimum length**: 6 characters
- **Not returned**: Password field excluded from queries by default

### Cookie Security

```javascript
{
  httpOnly: true,      // No JavaScript access
  secure: true,        // HTTPS only (production)
  sameSite: 'strict',  // CSRF protection
  path: '/'           // All routes
}
```

## Frontend Integration

### AuthContext

Location: `frontend/src/contexts/AuthContext.js`

**State**:
```javascript
{
  user: null | User,
  isAuthenticated: boolean,
  loading: boolean,
  error: string | null
}
```

**Methods**:
- `login(email, password)` - Authenticate and store user
- `register(email, password, name)` - Create account
- `logout()` - Clear session, revoke token
- `logoutAll()` - Revoke all sessions
- `refreshToken()` - Renew access token
- `verifyAuth()` - Check existing session on mount

**Usage**:
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  // ...
}
```

### Axios Configuration

```javascript
// Automatic cookie handling
axios.defaults.withCredentials = true;

// Protected route wrapper
<ProtectedRoute>
  <MyComponent />
</ProtectedRoute>
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `NO_TOKEN` | Access token required | 401 |
| `USER_INVALID` | User not found or inactive | 401 |
| `ACCOUNT_LOCKED` | Account temporarily locked | 423 |
| `INVALID_TOKEN_FORMAT` | Malformed JWT | 403 |
| `TOKEN_EXPIRED` | Access token expired | 403 |
| `NO_REFRESH_TOKEN` | Refresh token required | 401 |
| `INVALID_REFRESH_TOKEN` | Refresh token invalid | 401 |
| `REFRESH_TOKEN_EXPIRED` | Refresh token expired | 403 |
| `INVALID_CREDENTIALS` | Wrong email/password | 401 |
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `USER_EXISTS` | Email already registered | 409 |
| `AUTH_RATE_LIMIT_EXCEEDED` | Too many auth attempts | 429 |
| `SERVER_ERROR` | Internal server error | 500 |

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=12

# Cookie Domain (production)
FRONTEND_URL=http://localhost:3000
```

## Integration Points

- **Settings Module**: Session management, active sessions list
- **Password Module**: Per-user salt for encryption
- **Rate Limiter**: Auth-specific rate limiting rules
- **Frontend Router**: ProtectedRoute wrapper for auth-required routes

## File Locations

| Component | Path |
|-----------|------|
| Auth Routes | `backend/routes/auth.js` |
| Auth Middleware | `backend/middleware/auth.js` |
| User Model | `backend/models/User.js` |
| RefreshToken Model | `backend/models/RefreshToken.js` |
| Rate Limiter | `backend/config/rateLimiter.js` |
| AuthContext | `frontend/src/contexts/AuthContext.js` |
| ProtectedRoute | `frontend/src/components/Auth/ProtectedRoute.js` |
| AuthPage | `frontend/src/components/Auth/AuthPage.js` |
