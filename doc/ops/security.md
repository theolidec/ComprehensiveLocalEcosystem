# Security Implementation

## Overview

This document details the comprehensive security measures implemented throughout the application. Security is implemented at multiple layers: transport, authentication, authorization, data protection, and application logic.

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                          │
│  • Input validation (express-validator)                       │
│  • Rate limiting (express-rate-limit)                         │
│  • CORS configuration                                        │
├─────────────────────────────────────────────────────────────┤
│                    AUTHENTICATION LAYER                       │
│  • JWT tokens (short-lived access + refresh)                │
│  • HttpOnly cookies                                          │
│  • bcrypt password hashing                                   │
│  • Account lockout protection                                │
├─────────────────────────────────────────────────────────────┤
│                    AUTHORIZATION LAYER                        │
│  • Token verification middleware                             │
│  • User ownership validation                                 │
│  • Role-based access (Wiki permissions)                    │
├─────────────────────────────────────────────────────────────┤
│                    DATA PROTECTION LAYER                      │
│  • AES-256-GCM encryption (passwords, payment cards)        │
│  • Per-user encryption salts                                 │
│  • Secure file storage (hashed filenames)                   │
├─────────────────────────────────────────────────────────────┤
│                    TRANSPORT LAYER                          │
│  • Helmet security headers                                   │
│  • HTTPS support (optional)                                 │
│  • SameSite cookies                                         │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Security

### JWT Implementation

**Access Tokens**:
- **Expiration**: 15 minutes
- **Storage**: HttpOnly cookie
- **Payload**: `{ userId }` only (email was removed in v2.6.0; the auth middleware re-fetches the user on every request anyway)
- **Secret**: `JWT_SECRET` environment variable
- **Transport**: cookies only — `Authorization: Bearer` is not accepted

**Refresh Tokens**:
- **Expiration**: 7 days
- **Storage**: HttpOnly cookie + database
- **Database**: SHA-256 hash of the JWT (the raw JWT is **never** persisted) plus `deviceInfo`
- **Cookie Path**: `/api/auth` (cookie is not sent with non-auth API requests)
- **Rotation**: New token issued on each refresh
- **Revocation**: Can be revoked per-token (verify/revoke hash the input first) or all-user
- **Cleanup**: Daily cron at 03:15 prunes expired/revoked rows

**Token Flow**:
```
1. Login → Server generates access + refresh tokens
2. Both stored in HttpOnly cookies
3. Access token used for API requests (15 min)
4. When expired, refresh token requests new access token
5. Refresh rotates (new refresh token issued)
6. Old refresh tokens tracked as revoked
```

### Cookie Security

Access cookie:
```javascript
{
  httpOnly: true,        // No JavaScript access (XSS protection)
  secure: true,          // HTTPS-only by default; opt-out via ALLOW_INSECURE_COOKIES=true
  sameSite: 'strict',    // CSRF protection
  maxAge: 15 * 60 * 1000, // 15 minutes for access
  path: '/'              // Available on all routes
}
```

Refresh cookie (path-scoped, longer-lived):
```javascript
{
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth'        // Only sent with auth endpoints, not every request
}
```

The `secure` flag is fail-closed: it defaults to `true` regardless of `NODE_ENV`. Set
`ALLOW_INSECURE_COOKIES=true` only for local plain-HTTP development.

### Password Reset (current implementation)

**Status: partially implemented.** `POST /api/auth/forgot-password` generates a 32-byte random reset token, stores **only the SHA-256 hash** plus expiry on the User document (`User.generatePasswordResetToken`), and returns the plain token. The plain token is **never logged** in any environment.

Email delivery is **not yet wired up** — there is no SMTP integration in the codebase, although `SMTP_*` placeholders exist in `backend/.env.example`. Until SMTP integration ships:

- In production: the endpoint returns the neutral message and writes a `warn` log noting that delivery isn't configured. The token is generated and stored but the user has no way to receive it.
- In non-production (`NODE_ENV !== 'production'`): the response body includes a `devResetToken` field so developers can complete the flow without email.

The endpoint also performs equivalent dummy work (`crypto.randomBytes` + sha256 + a no-op `findOne`) when the email doesn't match a user, so response timing doesn't reveal account existence.

`POST /api/auth/reset-password/:token` hashes the incoming plain token and looks it up by hash via `User.findByResetToken`, consumes the token (cleared on successful reset), and re-hashes the new password via the User model's `pre('save')` hook. Password length policy is 12–128 characters.

### Password Security

**Hashing**:
- Algorithm: bcrypt
- Salt Rounds: 12
- Pattern: `bcrypt.hash(password, 12)`

**Account Lockout** (verified working as of v2.6.0):
- Trigger: 5 failed login attempts
- Duration: 2 hours from the moment of the 5th failure
- Reset: Successful login clears `loginAttempts` and `lockUntil`
- Response: HTTP 423 (Locked)
- Implementation: `User.incrementLoginAttempts(userId)` increments `loginAttempts`, then if the new count is ≥ 5 and the account isn't already locked, sets `lockUntil = now + 2h`.

**Per-User Salt**:
- Generated on account creation
- 32-byte random hex string
- Used for AES key derivation in password manager
- Stored in User model (select: false)

## Authorization

### JWT Middleware

```javascript
const authenticateToken = async (req, res, next) => {
  // 1. Extract from header or cookie
  // 2. Verify JWT signature
  // 3. Lookup user in database
  // 4. Check isActive status
  // 5. Check isLocked status
  // 6. Attach user to request
  // 7. Continue to route handler
};
```

**Error Responses**:
- `401 NO_TOKEN` - No token provided
- `401 USER_INVALID` - User not found/inactive
- `423 ACCOUNT_LOCKED` - Account temporarily locked
- `403 TOKEN_EXPIRED` - Token expired (refresh needed)
- `403 INVALID_TOKEN_FORMAT` - Malformed token

### Resource Ownership

All data access validates user ownership:

```javascript
const item = await Model.findOne({
  _id: req.params.id,
  userId: req.user._id  // Must match authenticated user
});

if (!item) {
  return res.status(404).json({
    error: 'Item not found or access denied'
  });
}
```

### Role-Based Access (Wiki)

**Permission Levels**:
- **Owner**: Full control, delete wiki
- **Admin**: Manage members, edit all pages
- **Editor**: Create/edit pages
- **Viewer**: Read-only access

## Data Protection

### Password Manager Encryption

**Algorithm**: AES-256-GCM

**Key Derivation** (per-entry random salt + per-user salt):
```javascript
const deriveKey = (userSalt, additionalSalt) => {
  return crypto.pbkdf2Sync(
    PASSWORD_MASTER_KEY,
    userSalt + additionalSalt,
    100000,  // Iterations
    32,      // Key length (256 bits)
    'sha256'
  );
};
```

**Encryption Process** (`backend/services/passwordService.js`):
1. Generate a random 32-byte per-entry salt
2. Derive key from `PASSWORD_MASTER_KEY` + user salt + per-entry salt (PBKDF2-SHA256, 100k iterations)
3. Generate random 16-byte IV
4. Create AES-256-GCM cipher
5. Encrypt plaintext, capture the 16-byte auth tag
6. Store as `salt:iv:authTag:ciphertext` (all hex)

**Security Features**:
- Master key never leaves env
- Per-user salt (32 bytes random, generated on first password save)
- Per-entry random salt — same plaintext yields different ciphertext per entry, even for the same user
- Random IV per encryption
- GCM mode provides authentication (tampering invalidates auth tag, decrypt fails)
- Keys derived in memory and discarded

### Payment Card Encryption

Payment cards use the same AES-256-GCM encryption as passwords to protect sensitive card data.

**Stored Data** (encrypted):
- Card number (full)
- Expiry date
- CVV

**Stored Data** (plaintext):
- Card name, cardholder name, card type, last 4 digits, billing address
- isDefault, isFavorite flags

**Security Features**:
- Same encryption key derivation as passwords
- Unique IV per card
- Card type auto-detection (Visa, Mastercard, Amex, Discover)
- Decryption requires authentication

### File Storage Security

**Filename Hashing**:
- Original filenames preserved in database
- Stored with random 32-byte hash prefix
- Pattern: `<hash>-<originalName>`

**Upload Limits**:
- Max size: 500MB per file
- Mime-type validation
- Stored outside web root

**Public Sharing**:
- 32-byte random share tokens
- Token required for public access
- Optional password protection (not implemented)

## Rate Limiting

### Configuration

| Endpoint Type | Window | Max Requests | Code |
|---------------|--------|--------------|------|
| General API | 15 min | 1000 | RATE_LIMIT_EXCEEDED |
| Authentication | 15 min | 20 | AUTH_RATE_LIMIT_EXCEEDED |
| Token Refresh | 15 min | 50 | TOKEN_REFRESH_RATE_LIMIT_EXCEEDED |
| Password Reset | 1 hour | 3 | PASSWORD_RESET_RATE_LIMIT_EXCEEDED |

### Implementation

```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});
```

## Input Validation

### express-validator

All user input validated using express-validator:

```javascript
router.post('/register', [
  body('email')
    .isEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 12, max: 128 })
    .withMessage('Password must be 12-128 characters'),
  body('name')
    .trim()
    .notEmpty()
    .isLength({ max: 50 })
    .withMessage('Name required, max 50 chars')
], validateMiddleware, handler);
```

### Validation Rules

| Field | Rules |
|-------|-------|
| Email | Valid format, lowercased on lookup and save, unique |
| Password | Min 12, max 128 |
| Name | Min 1 char, max 50, trimmed |
| IDs | MongoDB ObjectId validation |
| File uploads | Mime-type, size limits |
| Text fields | Max length, XSS sanitization |
| Search inputs | Regex-escaped via `utils/regex.js` before passing to `$regex` (ReDoS defense) |
| Document image filenames | Must match `^[a-f0-9]{32}\.[a-zA-Z0-9]{1,8}$`; resolved path must stay inside `UPLOAD_DIR/document-images/` |
| CSV/JSON imports | Capped at 1000 rows per request |

## HTTP Security Headers

### Helmet Configuration

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],   // Tailwind compatibility
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],     // External product images
      frameAncestors: ["'none'"],                // Clickjacking defense
      formAction: ["'self'"],                    // No cross-origin form posts
      baseUri: ["'self'"],                       // No <base> hijack
      objectSrc: ["'none'"],                     // No <object>/<embed>
    },
  },
}));
```

Per-response headers:
- File streaming endpoints (`streamFile`, `getSharedFile`, `serveDocumentImage`) set `X-Content-Type-Options: nosniff`.
- SVG responses additionally get `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox` so embedded `<script>` cannot execute on top-level navigation.

### Headers Applied

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | DENY | Prevent clickjacking (also CSP `frame-ancestors`) |
| X-XSS-Protection | 0 | Disabled (CSP preferred) |
| Strict-Transport-Security | max-age=31536000 | HTTPS enforcement (Helmet default) |
| Content-Security-Policy | See config | XSS mitigation |

## CORS Configuration

```javascript
// Always allows the configured FRONTEND_URL.
// In non-production, also accepts any RFC 1918 private-network origin so that
// phones/tablets on the LAN can reach the API without extra config.
const corsOriginValidator = (origin, callback) => {
  if (!origin) return callback(null, true); // same-origin / non-browser
  if (origin === FRONTEND_URL) return callback(null, true);
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { hostname } = new URL(origin);
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
      ) return callback(null, true);
    } catch (_) {}
  }
  callback(new Error('CORS: origin not allowed'));
};

app.use(cors({
  origin: corsOriginValidator,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']  // No Authorization — auth is cookies-only.
}));
```

**Security Features**:
- Whitelist-based origin validation, fail-closed in production
- Credentials allowed (cookies)
- Limited HTTP methods
- Cookies-only auth — `Authorization: Bearer` is no longer accepted

## Trust Proxy

```javascript
const TRUST_PROXY = process.env.TRUST_PROXY || 'loopback, linklocal, uniquelocal';
app.set('trust proxy', /^\d+$/.test(TRUST_PROXY) ? Number(TRUST_PROXY) : TRUST_PROXY);
```

Default is internal-only address ranges so a public-facing client cannot spoof
`X-Forwarded-For` and bypass IP-based rate limits. Set `TRUST_PROXY` to a hop count
or comma-separated CIDR list when behind a known proxy chain.

## Environment Variable Security

### Required Variables

```env
# JWT Secrets (generate strong random values)
JWT_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<different-random-64-char-string>

# Encryption Key (min 32 chars)
PASSWORD_MASTER_KEY=<random-32-char-string>

# Database (use authenticated connection in production)
MONGODB_URI=mongodb://user:pass@host:port/db

# CORS (explicit origin, not wildcard)
FRONTEND_URL=https://yourdomain.com
```

### Security Checklist

- [ ] JWT secrets are 64+ character random strings
- [ ] PASSWORD_MASTER_KEY is 32+ characters
- [ ] MongoDB uses authentication
- [ ] FRONTEND_URL matches production domain
- [ ] NODE_ENV=production in production
- [ ] SSL certificates configured
- [ ] .env file not in version control

## Error Handling Security

### Safe Error Messages

```javascript
// Production: Generic message
const message = process.env.NODE_ENV === 'production' 
  ? 'Internal server error' 
  : error.message;

res.status(500).json({
  error: message,
  code: 'INTERNAL_SERVER_ERROR'
});
```

### Information Disclosure Prevention

**Never expose**:
- Stack traces in production
- Database error details
- Internal paths or configurations
- User existence (use "Invalid credentials" not "User not found")

## Logging Security

### Winston Configuration

```javascript
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### Sensitive Data Redaction

```javascript
// Never log
logger.info('User login', {
  email: user.email,      // OK
  // password: password,  // NEVER
  // token: token,        // NEVER
  ip: req.ip             // OK
});
```

## Security Headers for Production

Additional recommended headers (nginx.conf):

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

## Security Checklist for Deployment

### Pre-deployment

- [ ] Change all default secrets
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for production domain
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Configure log rotation
- [ ] Review file upload permissions

### Database

- [ ] Enable MongoDB authentication
- [ ] Use connection string with credentials
- [ ] Enable SSL for database connection
- [ ] Set up automated backups
- [ ] Configure firewall rules

### Monitoring

- [ ] Set up failed login alerts
- [ ] Monitor rate limit triggers
- [ ] Log security events
- [ ] Review logs regularly
- [ ] Set up automated security scanning

## Vulnerability Reporting

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email details to [security contact]
3. Allow 48 hours for response
4. Coordinate disclosure timeline

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CSP Cheat Sheet](https://scotthelme.co.uk/csp-cheat-sheet/)
