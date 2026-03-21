# Enhanced Authentication System Documentation

## Overview

This is a production-ready authentication system built with React (frontend) and Node.js/Express (backend) that implements industry best practices for security, scalability, and maintainability.

## 🚀 Key Features

### Security Features
- **JWT-based Authentication**: Short-lived access tokens (15 minutes) with refresh tokens (7 days)
- **HttpOnly Cookies**: Secure token storage preventing XSS attacks
- **Rate Limiting**: Protection against brute force attacks
- **Account Locking**: Automatic account lock after 5 failed login attempts
- **Password Security**: bcrypt hashing with 12 salt rounds
- **CORS Protection**: Configured for secure cross-origin requests
- **Security Headers**: Helmet middleware for additional security

### Frontend Features
- **React 19.2.4**: Latest React version with modern hooks
- **TypeScript Support**: Type definitions for authentication and API interfaces
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Modern icon library
- **Form Validation**: Client-side validation with real-time feedback
- **Loading States**: Comprehensive loading indicators and disabled states
- **Error Handling**: User-friendly error messages and recovery options

### Backend Features
- **MongoDB Integration**: Scalable database with Mongoose ODM
- **Refresh Token System**: Automatic token rotation with device tracking
- **Comprehensive Logging**: Winston-based structured logging
- **Error Handling**: Detailed error codes and messages
- **Session Management**: Logout from all devices functionality
- **Health Monitoring**: Built-in health check endpoints

### Form Validation Features
- **Password Strength Requirements**: Minimum 6 characters with uppercase, lowercase, and number requirements
- **Real-time Validation**: Immediate feedback as users type
- **Confirm Password**: Password matching validation during registration
- **Email Format Validation**: Proper email format checking
- **Name Validation**: Minimum length requirements for user names

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 5.0+
- npm or yarn

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Root directory
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Configuration

Copy the environment template and configure:

```bash
cd backend
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Server Configuration
PORT=3001

# JWT Secrets (Generate strong secrets for production)
JWT_SECRET=your_super_secret_jwt_key_here_replace_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_replace_in_production

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/full-system-architecture

# Environment Configuration
NODE_ENV=development

# Token Expiration Configuration
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### 3. Database Setup

Ensure MongoDB is running and create the database:

```bash
# Start MongoDB (if using local installation)
mongod

# Optional: Create database and initial user
mongo
use full-system-architecture
```

### 4. Start the Application

```bash
# From root directory - starts both frontend and backend
npm run dev

# Or start individually
cd backend && npm run dev
cd frontend && npm start
```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
- `400` - Validation errors
- `409` - User already exists
- `429` - Rate limit exceeded
- `500` - Server error

#### POST `/api/auth/login`
Authenticate user and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "name": "John Doe",
    "lastLogin": "2024-01-15T10:30:00.000Z"
  }
}
```

**Cookies Set:**
- `accessToken` - HttpOnly, 15 minutes
- `refreshToken` - HttpOnly, 7 days

**Error Responses:**
- `400` - Validation errors
- `401` - Invalid credentials
- `423` - Account locked
- `429` - Rate limit exceeded
- `500` - Server error

#### POST `/api/auth/refresh`
Refresh access token using refresh token.

**Cookies Required:**
- `refreshToken` - Valid refresh token

**Response (200):**
```json
{
  "message": "Token refreshed successfully"
}
```

#### GET `/api/auth/me`
Get current authenticated user information.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "message": "User authenticated",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "name": "John Doe",
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "isActive": true
  }
}
```

#### POST `/api/auth/logout`
Logout current session.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

#### POST `/api/auth/logout-all`
Logout from all devices.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "message": "Logged out from all devices successfully"
}
```

### System Endpoints

#### GET `/health`
System health check.

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "development"
}
```

#### GET `/`
Server information.

**Response (200):**
```json
{
  "message": "Backend server is running!",
  "version": "2.0.0",
  "features": ["JWT Authentication", "Refresh Tokens", "Rate Limiting", "MongoDB Integration"]
}
```

## 🔒 Security Implementation

### Token Management
- **Access Tokens**: 15-minute expiration, stored in HttpOnly cookies
- **Refresh Tokens**: 7-day expiration, stored in HttpOnly cookies with database tracking
- **Token Rotation**: New refresh tokens issued on each refresh
- **Device Tracking**: User agent and IP address logged for each token

### Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **Token Refresh**: 10 attempts per 15 minutes per IP
- **Password Reset**: 3 attempts per hour per IP
- **User Actions**: 10 actions per hour per authenticated user

### Account Security
- **Password Hashing**: bcrypt with 12 salt rounds
- **Account Locking**: 2-hour lock after 5 failed attempts
- **Login Tracking**: Last login timestamp and attempt counting
- **Session Management**: Individual and bulk logout capabilities

### Data Protection
- **Input Validation**: Comprehensive validation using express-validator
- **SQL Injection Prevention**: Mongoose ODM provides protection
- **XSS Protection**: HttpOnly cookies and Helmet security headers
- **CSRF Protection**: SameSite cookie policy

## 🏗️ Architecture

### Backend Structure
```
backend/
├── config/
│   ├── database.js      # MongoDB connection
│   ├── logger.js        # Winston logging configuration
│   └── rateLimiter.js   # Rate limiting configuration
├── middleware/
│   └── auth.js          # Authentication middleware
├── models/
│   ├── User.js          # User model with security features
│   └── RefreshToken.js  # Refresh token model
├── routes/
│   └── auth.js          # Authentication routes
├── logs/                # Log files directory
├── server.js            # Express server setup
└── .env.example         # Environment variables template
```

### Frontend Structure
```
frontend/src/
├── components/
│   ├── ProtectedRoute.js    # Route protection wrapper
│   ├── AuthPage.js          # Login/Register container
│   ├── Login.js             # Login form with validation
│   ├── Register.js          # Registration form with validation
│   ├── Header.js            # Navigation header
│   ├── Hero.js              # Landing page hero section
│   ├── ProductGrid.js       # Product showcase component
│   ├── Features.js          # Features display component
│   └── Footer.js            # Page footer
├── contexts/
│   └── AuthContext.js       # Authentication state management
├── config/
│   └── api.js               # API endpoint configuration
├── types/
│   └── auth.ts              # TypeScript type definitions
└── App.js                   # Main routing and app structure
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3001 | No |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | - | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 | Yes |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `NODE_ENV` | Environment mode | development | No |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token lifetime | 15m | No |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifetime | 7d | No |
| `BCRYPT_SALT_ROUNDS` | Password hashing salt rounds | 12 | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window duration | 900000 | No |
| `RATE_LIMIT_MAX_REQUESTS` | General rate limit max requests | 100 | No |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | Authentication rate limit | 5 | No |
| `LOG_LEVEL` | Logging level | debug | No |
| `REACT_APP_API_URL` | Frontend API URL | http://localhost:3001 | No |

### Database Schema

#### User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  isActive: Boolean (default: true),
  lastLogin: Date,
  loginAttempts: Number (default: 0),
  lockUntil: Date,
  timestamps: true
}
```

#### RefreshToken Model
```javascript
{
  token: String (unique, required),
  user: ObjectId (ref: User),
  expiresAt: Date (TTL index),
  isRevoked: Boolean (default: false),
  deviceInfo: {
    userAgent: String,
    ip: String
  },
  timestamps: true
}
```

## 🚀 Deployment

### Production Considerations

1. **Environment Setup**
   ```env
   NODE_ENV=production
   JWT_SECRET=your_production_jwt_secret
   JWT_REFRESH_SECRET=your_production_refresh_secret
   MONGODB_URI=mongodb://your-production-db
   ```

2. **Security Headers**
   - HTTPS enforcement
   - Secure cookie flags
   - Content Security Policy

3. **Database Security**
   - MongoDB authentication
   - Connection encryption
   - Regular backups

4. **Monitoring**
   - Log aggregation
   - Performance monitoring
   - Error tracking

### Docker Deployment

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/auth-system
    depends_on:
      - mongo
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
  
  mongo:
    image: mongo:5.0
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo_data:
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### TypeScript Support
- **Backend**: TypeScript configuration with strict mode enabled
- **Frontend**: TypeScript type definitions for authentication interfaces
- **Type Safety**: Comprehensive type coverage for API responses and state management

### API Testing Examples

```bash
# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Get user info
curl -X GET http://localhost:3001/api/auth/me \
  -b cookies.txt
```

## 📊 Monitoring & Logging

### Log Levels
- **Error**: System errors, authentication failures
- **Warn**: Security events, rate limiting
- **Info**: Successful operations, system events
- **Debug**: Detailed development information

### Log Files
- `logs/error.log` - Error-level logs
- `logs/combined.log` - All logs

### Monitoring Metrics
- Request rates and response times
- Authentication success/failure rates
- Database connection status
- Memory and CPU usage

## 🔄 Maintenance

### Regular Tasks
1. **Database Maintenance**
   - Index optimization
   - Backup verification
   - Log rotation

2. **Security Updates**
   - Dependency updates
   - Security patch application
   - Token rotation

3. **Performance Monitoring**
   - Log analysis
   - Performance metrics review
   - Resource usage optimization

## 🐛 Troubleshooting

### Common Issues

#### Authentication Failures
- Check JWT secrets match between environments
- Verify cookie settings in browser
- Check CORS configuration

#### Database Connection Issues
- Verify MongoDB is running
- Check connection string format
- Ensure database user permissions

#### Rate Limiting Issues
- Check IP detection configuration
- Verify rate limiter settings
- Monitor logs for blocked requests

### Debug Mode
Enable debug logging:
```env
NODE_ENV=development
DEBUG=auth:*
```

## 📝 Development Guidelines

### Code Standards
- ESLint configuration for code quality
- Prettier for code formatting
- Git hooks for pre-commit checks

### Security Best Practices
- Regular security audits
- Dependency vulnerability scanning
- Code review requirements

### Performance Optimization
- Database query optimization
- Caching strategies
- Load testing

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Version**: 2.0.0  
**Last Updated**: 2024-01-15  
**Status**: Production Ready
