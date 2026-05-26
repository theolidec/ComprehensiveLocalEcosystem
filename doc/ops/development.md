# Development Guide

## Overview

This guide covers development workflows, debugging techniques, and common tasks for the Comprehensive Local Ecosystem.

## Development Environment

### Prerequisites

- **Node.js**: 18+ (check with `node --version`)
- **npm**: 9+ (check with `npm --version`)
- **MongoDB**: 5.0+ (or use Docker)
- **Docker & Docker Compose**: For containerized services
- **Git**: For version control

### Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd ComprehensiveLocalEcosystem

# 2. Run automated setup
bash setup.sh

# 3. Start development environment
npm run dev:all
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MongoDB: localhost:27017

## Project Structure

```
ComprehensiveLocalEcosystem/
├── backend/              # Node.js/Express backend
├── frontend/             # React frontend
├── doc/                  # Documentation (this directory)
├── data/                 # Persistent data (Docker volumes)
├── docker-compose.yml    # Docker orchestration
├── package.json          # Root package scripts
├── setup.sh              # Automated setup script
└── .windsurfrules        # IDE rules
```

## NPM Scripts

### Root Level

```bash
npm run dev:all       # Start MongoDB + frontend + backend
npm run dev:services  # Start MongoDB container only
npm run dev           # Start frontend + backend (services must be running)
npm start             # Start all services with Docker Compose
npm stop              # Stop all services
npm build             # Build Docker images
npm logs              # View logs
```

### Backend

```bash
cd backend
npm run dev           # Start with nodemon (auto-reload)
npm start             # Start production mode
npm test              # Run tests
```

### Frontend

```bash
cd frontend
npm start             # Start development server
npm run build         # Create production build
npm test              # Run tests
```

## Environment Configuration

### Backend `.env`

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secrets (generate strong random strings)
JWT_SECRET=dev_secret_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_change

# Token Expiration
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Database
MONGODB_URI=mongodb://localhost:27017/full-system-architecture

# CORS
FRONTEND_URL=http://localhost:3000

# Security
BCRYPT_SALT_ROUNDS=12
PASSWORD_MASTER_KEY=dev_master_key_32chars_long

# Logging
LOG_LEVEL=debug
```

### Frontend `.env`

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_VERSION=$npm_package_version
```

## Debugging

### Backend Debugging

**Console Logging**:
```javascript
const logger = require('./config/logger');

logger.debug('Debug information', { variable: value });
logger.info('Informational message');
logger.warn('Warning message');
logger.error('Error occurred', { error: err.message });
```

**Log Files**:
- `backend/logs/error.log` - Error level logs
- `backend/logs/combined.log` - All logs

**Using Node.js Inspector**:
```bash
node --inspect-brk server.js
# Then open chrome://inspect in Chrome
```

### Frontend Debugging

**React DevTools**:
- Install browser extension
- Inspect component hierarchy
- View props and state
- Debug context values

**Console Logging**:
```javascript
// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data);
}

// Better: use a debug utility
const debug = (msg, data) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${msg}:`, data);
  }
};
```

**Network Debugging**:
- Open browser DevTools
- Go to Network tab
- Filter by XHR/fetch
- Inspect request/response

### API Testing

**Using curl**:
```bash
# Login and save cookies
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Use cookies for authenticated requests
curl http://localhost:3001/api/auth/me -b cookies.txt

# Get events
curl http://localhost:3001/api/calendar/events -b cookies.txt

# Create event
curl -X POST http://localhost:3001/api/calendar/events \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Meeting",
    "date": "2026-04-23T10:00:00Z",
    "category": "work"
  }'
```

**Using HTTP Client (VS Code extension)**:
```http
### Login
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

### Get User
GET http://localhost:3001/api/auth/me
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Create controller** (`backend/controllers/newController.js`):
```javascript
const logger = require('../config/logger');

exports.getItems = async (req, res) => {
  try {
    const items = await Model.find({ userId: req.user._id });
    res.json({ items });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};
```

2. **Create routes** (`backend/routes/newRoutes.js`):
```javascript
const express = require('express');
const controller = require('../controllers/newController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.get('/', authenticateToken, controller.getItems);
module.exports = router;
```

3. **Register route** (`backend/server.js`):
```javascript
const newRoutes = require('./routes/newRoutes');
app.use('/api/new-resource', newRoutes);
```

4. **Create service** (`frontend/src/services/newAPI.js`):
```javascript
import api from '../utils/fetchClient';
import { API_URLS } from '../config/api';

export const getItems = async () => {
  const response = await api.get(API_URLS.NEW_ITEMS);
  return response.data;
};
```

5. **Add URL** (`frontend/src/config/api.js`):
```javascript
export const API_URLS = {
  // ... existing URLs
  NEW_ITEMS: `${API_BASE}/new-resource`
};
```

### Adding a New Component

1. **Create component file**:
```javascript
// src/components/NewFeature/NewComponent.js
import React, { useState, useEffect } from 'react';

const NewComponent = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    // Load data
  };
  
  return <div>{/* Component JSX */}</div>;
};

export default NewComponent;
```

2. **Add route** (if page component):
```javascript
import NewComponent from './components/NewFeature/NewComponent';

<Route path="/new-path" element={
  <ProtectedRoute>
    <NewComponent />
  </ProtectedRoute>
} />
```

3. **Add to sidebar** (if needed):
```javascript
// In Sidebar.js
{
  name: 'New Feature',
  path: '/new-path',
  icon: IconName
}
```

### Database Migrations

MongoDB is schemaless, but data migrations may be needed:

```javascript
// Migration script example (run manually or via npm script)
const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Add new field to existing documents
  await User.updateMany(
    { newField: { $exists: false } },
    { $set: { newField: 'defaultValue' } }
  );
  
  console.log('Migration complete');
  process.exit(0);
}

migrate();
```

## Testing

### Backend Tests

```bash
cd backend
npm test

# Run specific test
npm test -- --grep "Auth Routes"

# Coverage report
npm test -- --coverage
```

**Test Pattern**:
```javascript
const request = require('supertest');
const app = require('../server');

describe('Feature', () => {
  let authCookie;
  
  beforeAll(async () => {
    // Login and get cookie
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    authCookie = res.headers['set-cookie'];
  });
  
  it('should get items', async () => {
    const res = await request(app)
      .get('/api/items')
      .set('Cookie', authCookie);
    
    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
  });
});
```

### Frontend Tests

```bash
cd frontend
npm test

# Run in CI mode
npm test -- --watchAll=false

# Coverage
npm test -- --coverage
```

**Test Pattern**:
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders and handles interaction', () => {
  render(<MyComponent />);
  
  const button = screen.getByText('Click me');
  fireEvent.click(button);
  
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

## Code Style

### JavaScript/Node.js

- Use single quotes for strings
- 2-space indentation
- Semicolons required
- CamelCase for variables/functions
- PascalCase for classes/components
- UPPER_SNAKE_CASE for constants

**ESLint/Prettier**:
```bash
# Check style
npm run lint

# Fix style issues
npm run lint:fix
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes, commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

**Commit Message Format**:
```
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example: `feat(auth): add password reset functionality`

## Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Find and kill process using port
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

**MongoDB connection error**:
```bash
# Check if MongoDB is running
docker-compose ps

# Restart MongoDB
docker-compose restart mongodb

# Check logs
docker-compose logs mongodb
```

**Module not found**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**JWT verification fails**:
- Check `JWT_SECRET` matches between sessions
- Verify token hasn't expired
- Ensure cookies are being sent

**CORS errors**:
- Verify `FRONTEND_URL` matches actual frontend URL
- Check cookies include `withCredentials: true`

### Debug Mode

Enable detailed logging:
```env
LOG_LEVEL=debug
```

Request/response logging:
```javascript
// Add temporary logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

## Performance Optimization

### Backend

- Use database indexes
- Implement pagination for lists
- Cache frequently accessed data
- Use lean() for read-only queries

### Frontend

- Lazy load routes
- Memoize expensive computations
- Debounce search inputs
- Optimize images

## Useful Tools

- **MongoDB Compass**: GUI for database
- **Postman/Insomnia**: API testing
- **React DevTools**: Component debugging
- **Redux DevTools**: State debugging
- **Browser DevTools**: Network, console

## Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
