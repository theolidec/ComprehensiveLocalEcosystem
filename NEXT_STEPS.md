# Security Recommendations

Based on the comprehensive codebase security review, the following improvements are recommended:

## Critical Priority

### 1. Input Validation & Sanitization
- **Calendar/Event Routes**: Add express-validator for `title`, `description`, `location` fields
  - **Location**: `@backend/routes/calendar.js`
  - **Issue**: No server-side validation beyond Mongoose schema
  - **Risk**: XSS, NoSQL injection, DoS via large payloads

- **Category Routes**: Add validation for `name`, `color`, `icon` fields
  - **Location**: `@backend/routes/categories.js`
  - **Issue**: No validation middleware applied

- **Password Routes**: Add validation for `title`, `username`, `website`, `notes`
  - **Location**: `@backend/routes/passwords.js`
  - **Issue**: Only password field is validated, others are unbounded

### 2. Import/Export Security
- **Calendar Import Validation**: Validate imported JSON structure before processing
  - **Location**: `@backend/controllers/calendarController.js:importEvents`
  - **Issue**: No schema validation on imported data
  - **Risk**: Data pollution, prototype pollution attacks

- **Add Rate Limiting to Import/Export**
  - **Location**: `@backend/routes/calendar.js`
  - **Issue**: No rate limits on `/events/export` or `/events/import`
  - **Risk**: Data exfiltration, DoS via repeated imports

### 3. Password Strength Policy
- **Enhance Registration Validation**
  - **Location**: `@backend/routes/auth.js`
  - **Current**: Only min 6 characters
  - **Recommended**: Min 12 chars, require mixed case, numbers, symbols
  - **Why**: bcrypt 12 rounds is strong, but weak passwords undermine it

## High Priority

### 4. Production HTTPS/TLS
- Add TLS termination via reverse proxy (nginx/traefik) OR
- Configure Node.js with `https.createServer()` for direct HTTPS
- **Why**: Current setup only uses HTTP; production requires encrypted transport

### 5. HSTS Header
- Add `Strict-Transport-Security` header in production environment
- Example: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- **Location**: `@backend/server.js` Helmet configuration

### 6. Logger Data Sanitization
- **Prevent Sensitive Data Leakage**
  - **Location**: `@backend/config/logger.js`
  - **Issue**: Logger may capture passwords, tokens, or encrypted data
  - **Fix**: Add redaction patterns for `password`, `token`, `encryptedPassword`, `authorization`

### 7. Avatar URL Validation
- **Settings Avatar Field**
  - **Location**: `@backend/models/Settings.js` and `@backend/routes/settings.js`
  - **Issue**: `avatar` field accepts any string without URL validation
  - **Risk**: XSS via `javascript:` URLs or data exfiltration
  - **Fix**: Add URL regex validation, whitelist `https:` protocol only

## Medium Priority

### 8. Key Rotation Strategy
- Implement versioning for `PASSWORD_MASTER_KEY`
- Store key version identifier alongside encrypted passwords
- Plan for re-encryption workflow when rotating keys
- **Location**: `@backend/services/passwordService.js`

### 9. Secret Validation
- Ensure `PASSWORD_MASTER_KEY` is at least 32 characters of high entropy
- Add startup validation to check secret strength
- **Location**: `@backend/services/passwordService.js:getMasterKey()`

### 10. CSRF Protection Enhancement
- **Current State**: Uses `sameSite: 'strict'` cookies
- **Enhancement**: Add explicit CSRF tokens for defense in depth
- **Location**: `@backend/server.js`, `@backend/routes/auth.js`

### 11. Request Size Limits on Import
- **Location**: `@backend/routes/calendar.js:importEvents`
- **Issue**: 10MB body limit may be too generous for JSON imports
- **Fix**: Add specific limit for import endpoint (e.g., 1MB)

### 12. NoSQL Injection Prevention
- **Audit all MongoDB queries** for user-controlled input
- **Location**: All controllers using `req.query` in MongoDB queries
- **Issue**: `search` parameter in `@backend/controllers/calendarController.js:109` uses `$regex`
- **Status**: Currently safe due to regex escaping, but document security assumption

## Low Priority

### 13. Additional Security Headers
- Consider adding `Referrer-Policy: strict-origin-when-cross-origin`
- Review CSP policy for any unnecessary `unsafe-inline` directives
- **Location**: `@backend/server.js` Helmet configuration

### 14. Structured Audit Logging
- Add dedicated audit log for security events:
  - Login/logout attempts (failed and successful)
  - Password decryption operations
  - Session revocations
  - Settings changes
- **Location**: `@backend/config/logger.js` or separate audit logger

### 15. Export Data Encryption
- **Location**: `@backend/controllers/calendarController.js:exportEvents`
- **Issue**: Exported calendar data is plaintext JSON
- **Enhancement**: Offer encrypted export option with password protection

### 16. Dependency Security Scanning
- Add `npm audit` to CI/CD pipeline
- Consider using Snyk or GitHub Dependabot
- **Location**: `.github/workflows/` (if exists)

## Implementation Notes

### What's Already Secure
- All secrets externalized to environment variables
- AES-256-GCM authenticated encryption correctly implemented
- JWT authentication with proper expiry (15min access, 7day refresh)
- Token rotation and refresh token revocation
- Account lockout after failed login attempts
- HTTP-only, SameSite=Strict cookies
- Tiered rate limiting (auth, general, password reset, token refresh)
- Helmet.js security headers with CSP
- bcrypt password hashing with 12 salt rounds
- User-scoped queries (proper data isolation)
- Graceful shutdown handling

### Security Debt Summary
| Priority | Count | Key Areas |
|----------|-------|-----------|
| Critical | 3 | Input validation, import security, password policy |
| High | 4 | HTTPS, HSTS, logging sanitization, URL validation |
| Medium | 5 | Key rotation, CSRF, request limits |
| Low | 4 | Headers, audit logs, export encryption |
