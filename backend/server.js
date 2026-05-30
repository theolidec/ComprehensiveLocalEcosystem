const fs = require('fs');
const path = require('path');

// Load .env file without dotenv — does not overwrite variables already set in the environment
(function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
})();

const https = require('https');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const logger = require('./config/logger');
const { generalLimiter } = require('./config/rateLimiter');
const RefreshToken = require('./models/RefreshToken');
const User = require('./models/User');
const financeController = require('./controllers/financeController');
const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendar');
const categoryRoutes = require('./routes/categories');
const settingsRoutes = require('./routes/settings');
const passwordRoutes = require('./routes/passwords');
const passwordCategoryRoutes = require('./routes/passwordCategories');
const paymentCardRoutes = require('./routes/paymentCards');
const wishlistRoutes = require('./routes/wishlist');
const wishlistCategoryRoutes = require('./routes/wishlistCategories');
const wishlistsRoutes = require('./routes/wishlists');
const followRoutes = require('./routes/follow');
const filesRoutes = require('./routes/files');
const fileFoldersRoutes = require('./routes/fileFolders');
const wikiRoutes = require('./routes/wikis');
const wikiPageRoutes = require('./routes/wikiPages');
const userRightsRoutes = require('./routes/userRights');
const trackerRoutes = require('./routes/tracker');
const musicRoutes = require('./routes/music');
const radiationRoutes = require('./routes/radiation');
const financeRoutes = require('./routes/finance');

const app = express();
const PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const USE_HTTPS = process.env.USE_HTTPS === 'true';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH ? 
  path.resolve(__dirname, process.env.SSL_CERT_PATH) : undefined;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH ? 
  path.resolve(__dirname, process.env.SSL_KEY_PATH) : undefined;

logger.info(`__dirname: ${__dirname}`);
logger.info(`CWD: ${process.cwd()}`);

// Connect to database
connectDB();

// Resolve the allowed CORS origin. In production, FRONTEND_URL MUST be set explicitly —
// falling back to localhost would let any locally-running attacker app hit the API with
// credentials. In development, fall back to localhost:3000 for convenience.
const FRONTEND_URL = process.env.FRONTEND_URL;
if (process.env.NODE_ENV === 'production' && !FRONTEND_URL) {
  logger.error('FATAL: FRONTEND_URL must be set when NODE_ENV=production');
  process.exit(1);
}
const CORS_ORIGIN = FRONTEND_URL || 'http://localhost:3000';

// Trust proxy for rate limiting and IP detection. Trusting too aggressively (e.g. `true` or
// `1` behind multiple hops) lets attackers spoof X-Forwarded-For from anywhere upstream of
// the first proxy. Default to internal-only ranges, override via TRUST_PROXY when the
// deployment topology is known (e.g. number of hops or a comma-separated IP/CIDR list).
const TRUST_PROXY = process.env.TRUST_PROXY || 'loopback, linklocal, uniquelocal';
const trustProxyValue = /^\d+$/.test(TRUST_PROXY) ? Number(TRUST_PROXY) : TRUST_PROXY;
app.set('trust proxy', trustProxyValue);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Tailwind compiled CSS uses inline styles for some utilities; nonce/hash
      // migration is preferred but requires UI work.
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      // imgSrc must allow https: so externally-hosted product images (e.g. wishlist
      // imageUrl, wiki content) render. data: is needed for inline base64 thumbnails.
      imgSrc: ["'self'", "data:", "https:"],
      // Disallow embedding the app in any iframe (clickjacking defense).
      frameAncestors: ["'none'"],
      // Forms can only submit to same-origin endpoints.
      formAction: ["'self'"],
      // Lock the document base URI to same-origin to defeat <base> tag injections.
      baseUri: ["'self'"],
      // Block <object>/<embed>/<applet> entirely.
      objectSrc: ["'none'"],
    },
  },
}));

// CORS origin validator. Always allows the explicitly-configured FRONTEND_URL.
// In development also accepts any private-network origin (RFC 1918) so that
// phones and tablets on the LAN can reach the API without extra config.
const corsOriginValidator = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (origin === CORS_ORIGIN) return callback(null, true);
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { hostname } = new URL(origin);
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
      ) {
        return callback(null, true);
      }
    } catch (_) {}
  }
  callback(new Error('CORS: origin not allowed'));
};

// CORS configuration
app.use(cors({
  origin: corsOriginValidator,
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// Logging middleware — combined log format without morgan
app.use((req, res, next) => {
  const start = Date.now();
  const { method, url, ip, httpVersion } = req;
  const ua = req.get('User-Agent') || '-';
  const ref = req.get('Referer') || '-';
  res.on('finish', () => {
    const ms = Date.now() - start;
    const size = res.get('Content-Length') || '-';
    logger.info(`${ip} - "${method} ${url} HTTP/${httpVersion}" ${res.statusCode} ${size} "${ref}" "${ua}" +${ms}ms`);
  });
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware — custom replacement for cookie-parser
app.use((req, _res, next) => {
  const header = req.headers.cookie || '';
  req.cookies = Object.fromEntries(
    header.split(';')
      .map(c => c.trim())
      .filter(Boolean)
      .map(c => {
        const i = c.indexOf('=');
        const k = c.slice(0, i).trim();
        const v = c.slice(i + 1);
        try { return [k, decodeURIComponent(v)]; } catch { return [k, v]; }
      })
  );
  next();
});

// Rate limiting middleware
app.use(generalLimiter);

// Health check endpoint. Public and unauthenticated, so reveal only liveness — not
// uptime or environment, which can help an attacker fingerprint deploys.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend server is running!',
    version: '2.0.0',
    features: ['JWT Authentication', 'Refresh Tokens', 'Rate Limiting', 'MongoDB Integration']
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/password-categories', passwordCategoryRoutes);
app.use('/api/payment-cards', paymentCardRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/wishlist-categories', wishlistCategoryRoutes);
app.use('/api/wishlists', wishlistsRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/file-folders', fileFoldersRoutes);
app.use('/api/wikis', wikiRoutes);
app.use('/api/wikis/:slug/pages', wikiPageRoutes);
app.use('/api/user', userRightsRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/radiation', radiationRoutes);
app.use('/api/finance', financeRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(error.status || 500).json({
    error: message,
    code: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// Schedule a daily cleanup of expired/revoked refresh tokens at 03:15 server time.
// Custom scheduler — no dependency on node-cron.
(function scheduleDailyCleanup() {
  const msUntilNext = () => {
    const now = new Date();
    const next = new Date();
    next.setHours(3, 15, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next - now;
  };
  const run = async () => {
    try {
      await RefreshToken.cleanupExpiredTokens();
    } catch (error) {
      logger.error('Scheduled refresh-token cleanup failed:', error);
    }
    setTimeout(run, msUntilNext());
  };
  setTimeout(run, msUntilNext());
})();

// Schedule a daily finance job at 03:30 server time.
// Snapshots balances for net-worth tracking and fires due recurring rules
// for all users that have finance accounts.
(function scheduleDailyFinance() {
  const msUntilNext = () => {
    const now = new Date();
    const next = new Date();
    next.setHours(3, 30, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next - now;
  };
  const run = async () => {
    try {
      const users = await User.find({}, '_id').lean();
      for (const user of users) {
        await financeController.snapshotBalances(user._id);
        await financeController.processRecurringRules(user._id);
      }
    } catch (error) {
      logger.error('Daily finance scheduler failed:', error);
    }
    setTimeout(run, msUntilNext());
  };
  setTimeout(run, msUntilNext());
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server with HTTPS support
if (USE_HTTPS && SSL_CERT_PATH && SSL_KEY_PATH) {
  try {
    const certContent = fs.readFileSync(SSL_CERT_PATH);
    const keyContent = fs.readFileSync(SSL_KEY_PATH);
    
    const httpsOptions = {
      cert: certContent,
      key: keyContent
    };
    
    const server = https.createServer(httpsOptions, app);
    server.listen(HTTPS_PORT, () => {
      logger.info(`HTTPS Server is running on port ${HTTPS_PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`CORS origin: ${CORS_ORIGIN}`);
    });
  } catch (error) {
    logger.error('Failed to start HTTPS server:', error.message);
    logger.error('Stack:', error.stack);
    logger.info('Falling back to HTTP server');
    app.listen(PORT, () => {
      logger.info(`HTTP Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`CORS origin: ${CORS_ORIGIN}`);
    });
  }
} else {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`CORS origin: ${CORS_ORIGIN}`);
  });
}
