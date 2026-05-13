# Security Policy

## Table of Contents

- [Outstanding Action Required](#outstanding-action-required)
- [Reporting a Vulnerability](#reporting-a-vulnerability)
- [Security Features](#security-features)
- [Supported Versions](#supported-versions)
- [Security Configuration](#security-configuration)
- [Best Practices](#best-practices)
- [Incident Response](#incident-response)

---

## Outstanding Action Required

`backend/.env` contains real-looking secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`,
`PASSWORD_MASTER_KEY`, `MONGODB_URI` credentials). The file is now gitignored, but
earlier commits added it to git history, so the values **may still be recoverable
from the repo's commit log**.

The repository owner must:

1. Rotate `JWT_SECRET` and `JWT_REFRESH_SECRET` (forces every user to log in again — acceptable).
2. Rotate the MongoDB credentials.
3. Rotate `PASSWORD_MASTER_KEY` **with a re-encryption migration**: changing this key without re-encrypting will make every stored password and payment card permanently undecryptable. Plan: dump-and-decrypt under the old key, then re-encrypt under the new key inside a maintenance window.
4. Consider scrubbing the secrets from git history with `git filter-repo` or BFG Repo-Cleaner and force-pushing.

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

- **JWT Authentication**: Access tokens (15min) with refresh tokens (7 days), cookies-only (no `Authorization: Bearer` header support)
- **Token Rotation**: Automatic refresh token rotation
- **Refresh Token Storage**: SHA-256 hash of the JWT is persisted, never the raw JWT
- **Refresh Cookie Path**: Refresh-token cookie is scoped to `/api/auth` only
- **Cookie Secure Flag**: HTTPS-only by default (fail-closed); set `ALLOW_INSECURE_COOKIES=true` for local plain-HTTP dev
- **Account Lockout**: 2-hour lock after 5 failed login attempts (verified working)
- **Password Policy**: 12-128 characters minimum at register and reset
- **Password Reset Tokens**: Stored as SHA-256 hash; raw token is never logged
- **JWT Payload**: Contains only `userId` (no email)
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
| Settings | 100 requests | 15 minutes |
| Public Reservations | 10 requests | 1 hour |
| GDPR Data Operations | 10 requests | 1 hour |

### Security Headers

- **Helmet.js** with Content Security Policy (CSP) including `frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'self'`, `object-src 'none'`
- **CORS**: Restricted to specific `FRONTEND_URL`; production startup aborts if `FRONTEND_URL` is unset
- **CORS Headers**: Only `Content-Type` is allowed (no `Authorization`)
- **X-Content-Type-Options**: nosniff (default + per-response on file streaming)
- **X-Frame-Options**: DENY (via Helmet, plus CSP `frame-ancestors`)
- **SVG Sandbox**: Per-response strict CSP applied to SVG file streams to neutralize embedded `<script>`
- **trust proxy**: Defaults to internal-only ranges (`loopback, linklocal, uniquelocal`); override via `TRUST_PROXY` env

### Transport

- **nginx**: HTTP (port 80) redirects to HTTPS for everything except the Let's Encrypt ACME challenge
- **HSTS**: Enabled by Helmet defaults

### Data Protection

- **Password Hashing**: bcrypt with 12 salt rounds
- **Encrypted Vault**: AES-256-GCM with PBKDF2-100k key derivation (per-user salt + per-entry random salt)
- **Input Validation**: express-validator for all user inputs
- **Regex Safety**: All user-supplied search inputs are escaped before being passed to `$regex`/`new RegExp()` to prevent ReDoS
- **Body Size Limits**: 10MB max request size
- **CSV/JSON Imports**: Capped at 1000 rows per request and gated by per-user rate limiter
- **Error Handling**: Production mode hides stack traces
- **Path Traversal**: File-streaming endpoints validate filenames and resolve absolute paths inside their intended directory

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

# REQUIRED for password / payment-card encryption (32+ chars)
PASSWORD_MASTER_KEY=your_strong_master_key_here

# Database
MONGODB_URI=mongodb://localhost:27017/full-system-architecture

# CORS - Must match your frontend URL exactly. REQUIRED in production
# (the server refuses to start without it when NODE_ENV=production).
FRONTEND_URL=http://localhost:3000

# Cookie security - by default cookies are issued with Secure (HTTPS-only).
# Set this to "true" only for local plain-HTTP development.
ALLOW_INSECURE_COOKIES=false

# Trust proxy configuration. Defaults to internal-only IP ranges.
# Override with a hop count (e.g. "1") or comma-separated CIDRs when the
# deployment topology is known.
TRUST_PROXY=loopback, linklocal, uniquelocal

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

- **v2.6.0** (Security hardening pass):
  - Fixed account lockout (`incrementLoginAttempts` was never actually setting `lockUntil`).
  - Fixed GDPR account deletion / data export to use correct per-model field names and to cascade across `PaymentCard`, `DocumentVersion`, `TrackerTask/Question/Response`, and cross-user `WikiPermission`/`WikiWatch` rows.
  - Reset tokens now stored as SHA-256 hash; plain tokens are no longer logged. In dev (`NODE_ENV !== 'production'`) the plain token is returned as `devResetToken` in the response for testing until SMTP is wired up.
  - Refresh tokens stored as SHA-256 hash; verify/revoke hash before lookup. Existing pre-fix sessions are invalidated.
  - Path-traversal defense + auth on `/api/files/document-images/:filename`.
  - Regex-escape helper applied across all `$regex`/`new RegExp()` callsites (passwords, files, wishlist, follow, tracker, calendar, wiki backlinks, File model).
  - Wiki page routes reordered: `/watchlist`, `/recent-changes`, `/all` no longer shadowed by `/:pageSlug`.
  - Wiki page history populates editor `name` only (no email) — was leaking emails on public-wiki history.
  - CORS fail-closed when `FRONTEND_URL` unset in production.
  - Cookie `Secure` default inverted to fail-closed; opt-out via `ALLOW_INSECURE_COOKIES=true`.
  - Refresh-token cookie path scoped to `/api/auth`.
  - nginx HTTP→HTTPS redirect enabled.
  - CSP tightened: added `frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'self'`, `object-src 'none'`.
  - SVG file responses get a per-response sandbox CSP and `X-Content-Type-Options: nosniff` to neutralize embedded `<script>`.
  - `trust proxy` defaulted to internal-only ranges; overridable via `TRUST_PROXY`.
  - Password length policy raised to 12–128 characters.
  - JWT access-token payload reduced to `userId` only.
  - Wishlist CSV import + Password JSON/CSV import gated by per-user `userActionLimiter` (50/hour) and 1000-row cap.
  - GDPR endpoints `/api/user/data` GET and `/api/user/export` now rate-limited.
  - `/health` endpoint stops leaking `uptime` and `environment`.
  - `Authorization: Bearer` no longer accepted; cookies-only.
  - Email lowercased at lookup in `findByEmailWithPassword`, `/register`, `/forgot-password`.
  - Daily cron job (03:15) prunes revoked/expired refresh tokens.
  - Per-request access-control diagnostic logs demoted from `info` to `debug`.
- **v2.5.0**: Added Payment Cards vault — credit/debit card numbers, expiry dates, and CVVs are encrypted with AES-256-GCM using the same per-user salt + master-key key-derivation pipeline as passwords. Only `lastFourDigits`, card name, cardholder name, type, and billing address are stored in plaintext.
- **v2.4.0**: Added GDPR User Rights endpoints (`/api/user/data`, `/api/user/export`, `/api/user/account`) with a dedicated `userDataLimiter` (10 req/hour). Account deletion requires re-authentication via password and cascades through all user-owned collections.
- **v2.3.0**: Updated rate limiting configuration, added recurring event support
- **v2.2.0**: Added GeoGebra Calculator (client-side only, no server security impact)
- **v2.1.0**: Added File Manager with secure file upload, storage, and sharing
- **v2.0.0**: Added comprehensive rate limiting, account locking, CSP
- **v1.0.0**: Initial security implementation with JWT auth
