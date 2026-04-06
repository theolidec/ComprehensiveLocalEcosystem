# Security Policy

## Table of Contents

- [Reporting a Vulnerability](#reporting-a-vulnerability)
- [Security Features](#security-features)
- [Supported Versions](#supported-versions)
- [Security Configuration](#security-configuration)
- [Best Practices](#best-practices)
- [Incident Response](#incident-response)

---

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Submit your report via our [GitHub Security Advisories](https://github.com/theolidec/ComprehensiveLocalEcosystem/security/advisories/new) page
3. Include the following in your report:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Any suggested fixes (optional)

### Response Timeline

- **Acknowledgment**: Within 7 days
- **Initial Assessment**: Within 14 days
- **Public Disclosure**: After patch release

---

## Security Features

### Authentication & Authorization

- **JWT Authentication**: Access tokens (15min) with refresh tokens (7 days)
- **Token Rotation**: Automatic refresh token rotation
- **Account Lockout**: Automatic account locking after failed login attempts
- **Protected Routes**: Frontend route protection via `ProtectedRoute` component
- **Backend Middleware**: `authenticateToken` middleware for API endpoints

### Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 1000 requests | 15 minutes |
| Authentication | 20 requests | 15 minutes |
| Password Reset | 3 requests | 1 hour |
| Token Refresh | 50 requests | 15 minutes |
| User Actions | 50 actions | 1 hour |
| Categories | 100 requests | 15 minutes |
| Settings | 100 requests | 15 minutes |

### Security Headers

- **Helmet.js** with Content Security Policy (CSP)
- **CORS**: Configured to specific frontend origin only
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY (via Helmet)

### Data Protection

- **Password Hashing**: bcrypt with 12 salt rounds
- **Input Validation**: express-validator for all user inputs
- **Body Size Limits**: 10MB max request size
- **Error Handling**: Production mode hides stack traces

---

## Supported Versions

Currently no versions are Security supported as this is a development project.

---

## Security Configuration

### Required Environment Variables

```env
# REQUIRED - Generate strong random strings (min 32 characters)
JWT_SECRET=your_strong_jwt_secret_here
JWT_REFRESH_SECRET=your_strong_refresh_secret_here
SESSION_SECRET=your_session_secret_here

# Database
MONGODB_URI=mongodb://localhost:27017/full-system-architecture

# CORS - Must match your frontend URL exactly
FRONTEND_URL=http://localhost:3000

# Security (defaults shown)
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
```

### Production Recommendations

1. **Environment**: Set `NODE_ENV=production`
2. **Secrets**: Use environment-specific strong secrets (64+ character random strings)
3. **HTTPS**: Enable HTTPS/TLS termination at reverse proxy
4. **Database**: Use MongoDB authentication
5. **Logging**: Set `LOG_LEVEL=error` in production
6. **Rate Limits**: Consider reducing limits in production

---

## Best Practices

### For Users

- Use strong, unique passwords (12+ characters)
- Enable two-factor authentication when available (future feature)
- Report suspicious activity immediately
- Log out from shared/public devices

### For Developers

- Never commit secrets to version control
- Validate all user inputs server-side
- Use parameterized queries (Mongoose handles this)
- Keep dependencies updated
- Follow principle of least privilege

---

## Incident Response

### If You Suspect a Security Incident

1. **Immediately** change your password
2. **Contact** via [GitHub Security Advisories](https://github.com/theolidec/ComprehensiveLocalEcosystem/security/advisories/new)
3. **Document** what you observed
4. **Preserve** any relevant logs

### Response Procedures

1. **Containment**: Isolate affected systems
2. **Investigation**: Determine root cause and scope
3. **Eradication**: Remove threat and patch vulnerability
4. **Recovery**: Restore services securely
5. **Lessons Learned**: Document and improve

---

## Dependencies Security

The project uses the following security-focused dependencies:

- `helmet` - Security headers
- `bcryptjs` - Password hashing
- `express-rate-limit` - Rate limiting
- `jsonwebtoken` - JWT token handling
- `express-validator` - Input validation
- `cors` - Cross-origin resource sharing

---

## Changelog

- **v2.1.0**: Added File Manager with secure file upload, storage, and sharing
- **v2.0.0**: Added comprehensive rate limiting, account locking, CSP
- **v1.0.0**: Initial security implementation with JWT auth
