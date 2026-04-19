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
│  • AES-256-GCM encryption (passwords)                        │
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
- **Payload**: `{ userId, email }`
- **Secret**: `JWT_SECRET` environment variable

**Refresh Tokens**:
- **Expiration**: 7 days
- **Storage**: HttpOnly cookie + database
- **Database**: Hashed token with device info
- **Rotation**: New token issued on each refresh
- **Revocation**: Can be revoked per-token or all-user

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

```javascript
{
  httpOnly: true,        // No JavaScript access (XSS protection)
  secure: true,          // HTTPS only in production
  sameSite: 'strict',    // CSRF protection
  maxAge: 15 * 60 * 1000, // 15 minutes for access
  path: '/'              // Available on all routes
}
```

### Password Security

**Hashing**:
- Algorithm: bcrypt
- Salt Rounds: 12
- Pattern: `bcrypt.hash(password, 12)`

**Account Lockout**:
- Trigger: 5 failed login attempts
- Duration: 2 hours
- Reset: Successful login clears attempts
- Response: HTTP 423 (Locked)

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

**Key Derivation**:
```javascript
const deriveKey = (masterKey, userSalt) => {
  return crypto.pbkdf2Sync(
    masterKey,
    userSalt,
    100000,  // Iterations
    32,      // Key length (256 bits)
    'sha256'
  );
};
```

**Encryption Process**:
1. Derive key from `PASSWORD_MASTER_KEY` + user salt
2. Generate random 16-byte IV
3. Create AES-256-GCM cipher
4. Encrypt password
5. Store: `iv:authTag:ciphertext`

**Security Features**:
- Unique key per user
- Random IV per encryption
- GCM mode provides authentication
- Keys never stored

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
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
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
| Email | Valid format, normalized, unique |
| Password | Min 6 chars, max 128 |
| Name | Min 1 char, max 50, trimmed |
| IDs | MongoDB ObjectId validation |
| File uploads | Mime-type, size limits |
| Text fields | Max length, XSS sanitization |

## HTTP Security Headers

### Helmet Configuration

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Headers Applied

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-XSS-Protection | 0 | Disabled (CSP preferred) |
| Strict-Transport-Security | max-age=31536000 | HTTPS enforcement |
| Content-Security-Policy | See config | XSS mitigation |

## CORS Configuration

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Security Features**:
- Whitelist-based origin validation
- Credentials allowed (cookies)
- Limited HTTP methods
- Explicit allowed headers

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
