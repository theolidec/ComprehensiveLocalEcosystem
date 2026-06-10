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
- **Active-Content Sandbox**: Per-response strict CSP (`sandbox`, `default-src 'none'`) applied to all script-capable file streams (SVG, HTML, XHTML, XML, JavaScript) to neutralize stored XSS via uploaded files; `Content-Disposition` filenames are sanitized against header injection
- **trust proxy**: Defaults to internal-only ranges (`loopback, linklocal, uniquelocal`); override via `TRUST_PROXY` env

### Transport

- **nginx**: HTTP (port 80) redirects to HTTPS for everything except the Let's Encrypt ACME challenge
- **HSTS**: Enabled by Helmet defaults and explicitly set by nginx (`max-age=31536000; includeSubDomains`)
- **MongoDB**: Docker port binding restricted to `127.0.0.1` — never published to the LAN

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

- **v2.9.1** (Security review fixes — 2026-06-10):
  - **Vault data-loss bug fixed**: `passwordSalt` (the AES key-derivation salt for the password manager and payment cards) is now generated only once at user creation. Previously every password change/reset regenerated it, permanently breaking decryption of all stored vault entries.
  - **Stored XSS via uploaded files closed**: the per-response sandbox CSP previously applied only to SVG now covers all script-capable MIME types (`text/html`, XHTML, XML, JavaScript) on both authenticated streaming and public share links. `Content-Disposition` filenames sanitized.
  - **Sessions revoked on password reset**: `/api/auth/reset-password/:token` now revokes all refresh tokens for the account.
  - **Refresh token cookie-only**: `verifyRefreshToken` no longer accepts the token from the request body.
  - **Access token lifetime restored to 15 minutes** (dev env had drifted to 7d).
  - **MongoDB no longer LAN-exposed**: docker-compose binds 27017 to `127.0.0.1` only.
  - **Production container hygiene**: removed the `./backend` bind mount and `env_file` from docker-compose so the developer's `backend/.env` (dev secrets) can no longer leak into the production backend container; `PASSWORD_MASTER_KEY` passed explicitly.
  - **CVV optional (PCI DSS)**: storing a card CVV is now the user's explicit choice — no longer required by schema, API, or UI.
  - **Music streaming hardened**: strict `Range` header parsing (416 on invalid/out-of-bounds), removed per-route `Access-Control-Allow-Origin: *` that bypassed the global CORS allow-list.
  - **Atomic account lock**: lockout write is a single conditional update; concurrent failed logins can no longer race the lock check.
  - **HSTS at nginx**: explicit `Strict-Transport-Security` header on the TLS server block.
  - **Repo hygiene**: untracked committed TLS keys/certs, `cookies.txt` (contained real JWTs), log files, `backend/node_modules`, and editor temp files; `.gitignore` extended (`*.key`, `*.crt`, `*.pem`, `cookies.txt`, `*.save`, cert dirs). Git history still contains the old blobs until a history rewrite is performed.
- **v2.7.0** (Legal/GDPR hardening pass — 2026-05-18):
  - **Registration consent gate**: `/api/auth/register` now requires three affirmative-consent flags (`acceptTerms`, `acceptPrivacy`, `confirmAge`) as the literal boolean `true`; missing or false values return 400 (GDPR Art. 7 demonstrable consent).
  - **Consent record persistence**: `User.consent` subdocument captures `acceptedTermsAt`, `acceptedPrivacyAt`, `ageConfirmation13Plus`, `ipAtConsent`, `userAgentAtConsent`, `termsVersion`, `privacyVersion` at registration. Included in the user data export so users can audit their own consent record.
  - **Atomic GDPR erasure**: `deleteAccount` wrapped in a MongoDB `session.withTransaction()` block so all cascading deletes succeed-or-rollback atomically. Falls back to non-atomic erasure with a warning log on standalone (non-replica-set) MongoDB.
  - **Art. 15(4) third-party data leak closed**: `exportUserData` no longer includes other users' email addresses in the `following`/`followers` populated rows — only `id` and `name`.
  - **Frontend password validator synced**: Register form now enforces the same 12–128 character policy as the backend (was silently allowing 6–11 chars and 400-ing at the server).
  - **Cookie banner rewritten**: removed misleading "by continuing to use … you agree" wording (ePrivacy doesn't permit implied consent), removed dead `handleDecline` code, renamed localStorage key from `cookieConsent` to `cookieNoticeSeen` to reflect that the popup is informational for strictly-necessary cookies.
  - **Reservation form privacy notice**: public wishlist reservation form for unauthenticated guests now carries a GDPR Art. 13 notice (legal basis, retention, rights, link to Privacy Policy).
  - **Legal pages rewritten**: `PRIVACY.md` adds Art. 13 disclosures (controller identity placeholder, legal-basis-per-purpose table, sub-processor categories, international-transfer template, Art. 22 declaration of "no automated decision-making", right to lodge a complaint with IMY); `TERMS.md` adds self-hosted framing, MIT/IP distinction, consumer-protection carve-out for liability and indemnification, Rome I / Brussels Ia mandatory-consumer-rules language, ODR-platform link.
  - **GeoGebra trademark cleanup**: removed "GeoGebra" branding from all user-visible copy (LandingPage, Home, Settings, README, MIL-STD-498 SUM). Internal filenames (`GeoGebraCalculator.js/.css`), CSS class prefixes (`.geogebra-*`), and cookie name (`geogebraTheme`) retained for backward compatibility, with disclaimers added in `doc/geogebra-calculator.md` and `doc/frontend-architecture.md`.
  - **THIRD_PARTY_NOTICES.md** added at the repo root listing direct production dependencies and their licenses, with explicit Apache-2.0 NOTICE retention for `pdfjs-dist`/`web-vitals`/`dompurify` and CC BY 4.0 attribution for the Uiverse-derived folder-tree CSS (attribution also inlined at the top of `frontend/src/components/FileManager/FileTree.css`).
  - **Footer cleanup**: removed `[DEBUG: Timeout]` button (was visible in production), removed dead links to non-existent pages (`/about`, `/blog`, `/careers`, `/press`, `/partners`, `/security`, `/support`, `/community`, `/api`, `/legal`), removed placeholder social links (Twitter/LinkedIn/Facebook → `/placeholder`), kept the working GitHub link, fixed copyright year from "© 2024" to "© 2024–{currentYear}".
  - **Root `package.json` license field** set to `MIT` for SBOM/scanner clarity.
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
