require('dotenv').config();
const fs = require('fs');
const https = require('https');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const logger = require('./config/logger');
const { generalLimiter } = require('./config/rateLimiter');
const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendar');
const categoryRoutes = require('./routes/categories');
const settingsRoutes = require('./routes/settings');
const passwordRoutes = require('./routes/passwords');
const passwordCategoryRoutes = require('./routes/passwordCategories');
const wishlistRoutes = require('./routes/wishlist');
const wishlistCategoryRoutes = require('./routes/wishlistCategories');
const wishlistsRoutes = require('./routes/wishlists');
const followRoutes = require('./routes/follow');
const filesRoutes = require('./routes/files');
const fileFoldersRoutes = require('./routes/fileFolders');
const wopiRoutes = require('./routes/wopi');

const app = express();
const PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const USE_HTTPS = process.env.USE_HTTPS === 'true';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH ? 
  require('path').resolve(__dirname, process.env.SSL_CERT_PATH) : undefined;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH ? 
  require('path').resolve(__dirname, process.env.SSL_KEY_PATH) : undefined;

logger.info(`__dirname: ${__dirname}`);
logger.info(`CWD: ${process.cwd()}`);

// Connect to database
connectDB();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Rate limiting middleware
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
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
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/wishlist-categories', wishlistCategoryRoutes);
app.use('/api/wishlists', wishlistsRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/file-folders', fileFoldersRoutes);
app.use('/wopi', wopiRoutes);

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
  console.log(`[HTTPS] Attempting to start with cert: ${SSL_CERT_PATH}, key: ${SSL_KEY_PATH}`);
  try {
    const certContent = fs.readFileSync(SSL_CERT_PATH);
    const keyContent = fs.readFileSync(SSL_KEY_PATH);
    console.log(`[HTTPS] Cert file size: ${certContent.length}, Key file size: ${keyContent.length}`);
    
    const httpsOptions = {
      cert: certContent,
      key: keyContent
    };
    
    const server = https.createServer(httpsOptions, app);
    server.listen(HTTPS_PORT, () => {
      logger.info(`HTTPS Server is running on port ${HTTPS_PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('[HTTPS] Error:', error);
    logger.error('Failed to start HTTPS server:', error.message);
    logger.error('Stack:', error.stack);
    logger.info('Falling back to HTTP server');
    app.listen(PORT, () => {
      logger.info(`HTTP Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  }
} else {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });
}
