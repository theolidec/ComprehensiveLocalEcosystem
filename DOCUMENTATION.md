# Comprehensive Local Ecosystem Documentation

## Overview

This is a full-featured web application ecosystem combining robust authentication, dynamic calendar management, and modern user interface design. Built with React (frontend) and Node.js/Express (backend) implementing industry best practices for security, scalability, and user experience.

## 🚀 Key Features

### Authentication System
- **JWT-based Authentication**: Short-lived access tokens (15 minutes) with refresh tokens (7 days)
- **HttpOnly Cookies**: Secure token storage preventing XSS attacks
- **Rate Limiting**: Protection against brute force attacks
- **Account Locking**: Automatic account lock after 5 failed login attempts
- **Password Security**: bcrypt hashing with 12 salt rounds
- **CORS Protection**: Configured for secure cross-origin requests
- **Security Headers**: Helmet middleware for additional security
- **Password Reset**: Email-based password reset functionality

### Calendar System
- **Full Calendar Management**: Create, edit, delete events with rich details
- **Multiple View Modes**: Month, week, and day views
- **Event Categories**: Work, Personal, Social, Health, Education, Travel
- **Advanced Features**: Event search, filtering, attendees, reminders
- **Data Persistence**: Local storage with export functionality
- **Statistics Dashboard**: Event tracking and analytics
- **Responsive Design**: Mobile-friendly calendar interface

### Frontend Features
- **React 19.2.4**: Latest React version with modern hooks
- **TypeScript Support**: Type definitions for authentication and API interfaces
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Modern icon library
- **Form Validation**: Client-side validation with real-time feedback
- **Loading States**: Comprehensive loading indicators and disabled states
- **Error Handling**: User-friendly error messages and recovery options
- **Component Architecture**: Modular, reusable components
- **Category Manager**: Custom category creation and management UI
- **Settings Page**: User preferences and account settings
- **File Manager**
  - **Complete File Management**: Upload, download, organize files with folder structure
  - **Document Viewer**: Built-in text and markdown file editor with live preview
  - **File Organization**: Create folders, move files, favorite files
  - **File Types Supported**: Images, documents, spreadsheets, presentations, code files, archives, audio, video
  - **Trash System**: Soft delete with restore functionality
  - **File Sharing**: Generate shareable links for files
  - **Storage Stats**: Track storage usage
  - **Search & Filter**: Find files by name, type, or tags
  - **Large File Support**: Up to 500MB per file

- **GeoGebra Calculator**
  - **Interactive Graphing**: Canvas-based graphing of functions and equations
  - **Object Types**: Functions, parametric curves, points, circles, polygons, implicit equations
  - **Advanced Math**: Inequalities, conic sections, geometric constructions
  - **Navigation**: Pan, zoom, mouse wheel controls
  - **Themes**: Light/dark mode support
  - **State Management**: Save and restore calculator states
  - **Command Interface**: Text-based input for rapid object creation

- **Wiki System**
  - **Wiki Spaces**: Create multiple wiki workspaces for different projects
  - **Hierarchical Pages**: Parent-child page relationships for organized structure
  - **Version Control**: Full page history with diff viewing and restore capability
  - **Access Control**: Owner, Admin, Editor, Viewer role-based permissions with frontend `permissions` state
  - **Permission Methods**: Async `canView()` and `canEdit()` methods on Wiki model
  - **Public/Private Wikis**: Share wikis publicly or keep them private
  - **Categories**: Organize pages with custom categories
  - **Full-Text Search**: Search within wiki content
  - **Backlinks**: Track pages linking to the current page
  - **Watchlist**: Monitor pages for changes
  - **Infoboxes**: Structured data templates for pages
  - **Redirects**: Page aliases and redirects support
  - **Recent Changes**: Activity feed for wiki edits
  - **Markdown Support**: Rich markdown editing with live preview
  - **WikiLinks**: Internal linking with `[[Page Name]]` syntax

### Backend Features
- **MongoDB Integration**: Scalable database with Mongoose ODM
- **Refresh Token System**: Automatic token rotation with device tracking
- **Comprehensive Logging**: Winston-based structured logging
- **Error Handling**: Detailed error codes and messages
- **Session Management**: Logout from all devices functionality
- **Health Monitoring**: Built-in health check endpoints
- **Security Middleware**: Helmet, CORS, rate limiting
- **Category API**: Custom event category management
- **Settings API**: User preferences and account management

## 📋 Prerequisites

- Node.js 18+
- MongoDB 6.0+
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

#### POST `/api/auth/forgot-password`
Request password reset email.

**Authentication Required:** No

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent"
}
```

#### POST `/api/auth/reset-password/:token`
Reset password using reset token.

**Authentication Required:** No

**Request Body:**
```json
{
  "password": "newPassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

### Calendar Endpoints

#### GET `/api/calendar/events`
Get all calendar events for the authenticated user.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "events": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "Team Meeting",
      "description": "Weekly team sync",
      "date": "2024-01-15",
      "time": "10:00",
      "location": "Conference Room",
      "category": "Work",
      "attendees": ["john@example.com", "jane@example.com"],
      "reminder": "15 minutes before",
      "color": "#3B82F6",
      "createdAt": "2024-01-14T08:00:00.000Z",
      "updatedAt": "2024-01-14T08:00:00.000Z"
    }
  ]
}
```

#### POST `/api/calendar/events`
Create a new calendar event.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "title": "Team Meeting",
  "description": "Weekly team sync",
  "date": "2024-01-15",
  "time": "10:00",
  "location": "Conference Room",
  "category": "Work",
  "attendees": ["john@example.com", "jane@example.com"],
  "reminder": "15 minutes before"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Event created successfully",
  "event": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "title": "Team Meeting",
    "description": "Weekly team sync",
    "date": "2024-01-15",
    "time": "10:00",
    "location": "Conference Room",
    "category": "Work",
    "attendees": ["john@example.com", "jane@example.com"],
    "reminder": "15 minutes before",
    "color": "#3B82F6",
    "createdAt": "2024-01-14T08:00:00.000Z",
    "updatedAt": "2024-01-14T08:00:00.000Z"
  }
}
```

#### PUT `/api/calendar/events/:id`
Update an existing calendar event.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "title": "Updated Team Meeting",
  "description": "Updated weekly team sync",
  "date": "2024-01-15",
  "time": "11:00",
  "location": "New Conference Room",
  "category": "Work"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Event updated successfully",
  "event": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "title": "Updated Team Meeting",
    "description": "Updated weekly team sync",
    "date": "2024-01-15",
    "time": "11:00",
    "location": "New Conference Room",
    "category": "Work",
    "attendees": ["john@example.com", "jane@example.com"],
    "reminder": "15 minutes before",
    "color": "#3B82F6",
    "updatedAt": "2024-01-14T09:00:00.000Z"
  }
}
```

#### DELETE `/api/calendar/events/:id`
Delete a calendar event.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

#### GET `/api/calendar/events/:id`
Get a specific calendar event.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "event": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "title": "Team Meeting",
    "description": "Weekly team sync",
    "date": "2024-01-15",
    "time": "10:00",
    "location": "Conference Room",
    "category": "Work",
    "attendees": ["john@example.com", "jane@example.com"],
    "reminder": "15 minutes before",
    "color": "#3B82F6",
    "createdAt": "2024-01-14T08:00:00.000Z",
    "updatedAt": "2024-01-14T08:00:00.000Z"
  }
}
```

### Category Endpoints

#### GET `/api/categories`
Get all categories for the authenticated user.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "categories": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Work",
      "color": "#3B82F6",
      "user": "64f8a1b2c3d4e5f6a7b8c9d1"
    }
  ]
}
```

#### POST `/api/categories`
Create a new category.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "name": "Custom Category",
  "color": "#FF5733"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "category": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Custom Category",
    "color": "#FF5733",
    "user": "64f8a1b2c3d4e5f6a7b8c9d1"
  }
}
```

#### PUT `/api/categories/:id`
Update a category.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "name": "Updated Category",
  "color": "#00FF00"
}
```

#### DELETE `/api/categories/:id`
Delete a category.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

### Settings Endpoints

#### GET `/api/settings`
Get user settings.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "settings": {
    "user": "64f8a1b2c3d4e5f6a7b8c9d0",
    "theme": "light",
    "language": "en",
    "notifications": {
      "email": true,
      "push": false
    },
    "preferences": {
      "defaultView": "month",
      "weekStart": "monday"
    }
  }
}
```

#### PUT `/api/settings`
Update user settings.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "theme": "dark",
  "notifications": {
    "email": true,
    "push": true
  },
  "preferences": {
    "defaultView": "week",
    "weekStart": "sunday"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "settings": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": true
    },
    "preferences": {
      "defaultView": "week",
      "weekStart": "sunday"
    }
  }
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

### Password Endpoints

#### GET `/api/passwords`
Get all password entries for the authenticated user.

**Authentication Required:** Yes

**Query Parameters:**
- `category` - Filter by password category ID
- `search` - Search in title, username, website, notes
- `favoritesOnly` - Filter to favorites only (true/false)

**Response (200):**
```json
{
  "success": true,
  "passwords": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "Gmail Account",
      "username": "user@gmail.com",
      "website": "https://gmail.com",
      "encryptedPassword": "aes256encrypted...",
      "category": "64f8a1b2c3d4e5f6a7b8c9d1",
      "notes": "Personal email account",
      "isFavorite": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### POST `/api/passwords`
Create a new password entry.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "title": "Gmail Account",
  "username": "user@gmail.com",
  "password": "mySecurePassword123!",
  "website": "https://gmail.com",
  "category": "64f8a1b2c3d4e5f6a7b8c9d1",
  "notes": "Personal email account"
}
```

#### GET `/api/passwords/:id/decrypt`
Decrypt and view the actual password value.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "password": "mySecurePassword123!"
}
```

### Payment Card Endpoints

#### GET `/api/payment-cards`
Get all payment cards for the authenticated user.

**Authentication Required:** Yes

**Query Parameters:**
- `cardType` - Filter by card type (visa, mastercard, amex, discover, other)
- `favorite` - Filter to favorites only (true/false)

**Response (200):**
```json
{
  "success": true,
  "cards": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "cardName": "Personal Visa",
      "cardholderName": "John Doe",
      "cardType": "visa",
      "lastFourDigits": "1234",
      "billingAddress": "123 Main St, City, Country",
      "isDefault": true,
      "isFavorite": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### POST `/api/payment-cards`
Create a new payment card.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "cardName": "Personal Visa",
  "cardholderName": "John Doe",
  "cardNumber": "4111111111111111",
  "expiryDate": "12/25",
  "cvv": "123",
  "cardType": "visa",
  "billingAddress": "123 Main St, City, Country",
  "isDefault": false
}
```

#### GET `/api/payment-cards/:id/decrypt`
Decrypt and view the full card details.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "card": {
    "cardNumber": "4111111111111111",
    "expiryDate": "12/25",
    "cvv": "123"
  }
}
```

#### POST `/api/payment-cards/:id/favorite`
Toggle favorite status for a payment card.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "card": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "isFavorite": true
  }
}
```

#### POST `/api/payment-cards/:id/default`
Set a payment card as the default card.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "card": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "isDefault": true
  }
}
```

### Wishlist Endpoints

#### GET `/api/wishlist`
Get all wishlist items with pagination and filtering.

**Authentication Required:** Yes

**Query Parameters:**
- `category` - Filter by category (birthday, christmas, other)
- `status` - Filter by status (active, purchased, archived)
- `priority` - Filter by priority (low, medium, high, must-have)
- `search` - Search in title and description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 50)

**Response (200):**
```json
{
  "items": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "Nintendo Switch",
      "description": "OLED model with extra controllers",
      "url": "https://example.com/switch",
      "price": 349.99,
      "currency": "USD",
      "priority": "high",
      "category": "birthday",
      "isPublic": true,
      "shareToken": "abc123...",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### GET `/api/wishlist/public/:token`
Get a public wishlist item by share token (no authentication required).

**Authentication Required:** No

### Follow Endpoints

#### POST `/api/follow/follow/:userId`
Follow a user.

**Authentication Required:** Yes

**Response (201):**
```json
{
  "message": "Successfully followed user"
}
```

#### GET `/api/follow/public/:userId`
Get public profile of a user with their public wishlists.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Jane Doe"
  },
  "publicItemCount": 15,
  "items": [...],
  "isFollowing": true
}
```

### Wiki Endpoints

#### POST `/api/wikis`
Create a new wiki workspace.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "name": "Project Documentation",
  "description": "Team knowledge base",
  "visibility": "private",
  "icon": "📚",
  "color": "#3B82F6"
}
```

**Response (201):**
```json
{
  "success": true,
  "wiki": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "slug": "project-documentation",
    "name": "Project Documentation",
    "description": "Team knowledge base",
    "visibility": "private",
    "owner": "64f8a1b2c3d4e5f6a7b8c9d1"
  }
}
```

#### GET `/api/wikis`
List wikis owned by or accessible to the authenticated user.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "wikis": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "slug": "project-documentation",
      "name": "Project Documentation",
      "visibility": "private",
      "pageCount": 15
    }
  ]
}
```

#### GET `/api/wikis/:slug/pages`
Get the page tree for a wiki.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "pages": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "Home",
      "slug": "home",
      "isHomePage": true,
      "children": [
        {
          "id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "title": "Getting Started",
          "slug": "getting-started"
        }
      ]
    }
  ]
}
```

#### POST `/api/wikis/:slug/pages`
Create a new wiki page.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "title": "Getting Started",
  "content": "# Getting Started\n\nWelcome to the wiki!",
  "parent": "64f8a1b2c3d4e5f6a7b8c9d0",
  "categories": ["64f8a1b2c3d4e5f6a7b8c9d2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "page": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "title": "Getting Started",
    "slug": "getting-started",
    "content": "# Getting Started\n\nWelcome to the wiki!",
    "excerpt": "Welcome to the wiki!"
  }
}
```

#### GET `/api/wikis/:slug/pages/:pageSlug`
Get a specific wiki page.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "page": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "title": "Getting Started",
    "slug": "getting-started",
    "content": "# Getting Started\n\nWelcome!",
    "lastEditedBy": "64f8a1b2c3d4e5f6a7b8c9d1",
    "lastEditedAt": "2024-01-15T10:30:00.000Z",
    "viewCount": 42
  }
}
```

#### GET `/api/wikis/:slug/pages/:pageSlug/history`
Get version history for a page.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "versions": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "version": 3,
      "title": "Getting Started",
      "editSummary": "Added installation instructions",
      "editedBy": "64f8a1b2c3d4e5f6a7b8c9d1",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### POST `/api/wikis/:slug/pages/:pageSlug/restore/:versionId`
Restore a page to a previous version.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "message": "Page restored successfully",
  "page": { ... }
}
```

#### GET `/api/wikis/:slug/search`
Search within a wiki.

**Authentication Required:** Yes

**Query Parameters:**
- `q` - Search query string

**Response (200):**
```json
{
  "success": true,
  "results": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "Getting Started",
      "slug": "getting-started",
      "excerpt": "...search term found here..."
    }
  ]
}
```

#### GET `/api/wikis/:slug/recent-changes`
Get recent changes for a wiki.

**Authentication Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "changes": [
    {
      "page": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "Getting Started",
      "action": "edited",
      "editedBy": "64f8a1b2c3d4e5f6a7b8c9d1",
      "editedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## 🔒 Security Implementation

### Token Management
- **Access Tokens**: 15-minute expiration, stored in HttpOnly cookies
- **Refresh Tokens**: 7-day expiration, stored in HttpOnly cookies with database tracking
- **Token Rotation**: New refresh tokens issued on each refresh
- **Device Tracking**: User agent and IP address logged for each token

### Rate Limiting
- **General API**: 1000 requests per 15 minutes per IP
- **Authentication**: 20 attempts per 15 minutes per IP
- **Token Refresh**: 50 attempts per 15 minutes per IP
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
│   ├── database.js          # MongoDB connection
│   ├── logger.js            # Winston logging configuration
│   └── rateLimiter.js       # Rate limiting configuration
├── controllers/
│   ├── calendarController.js      # Calendar API logic
│   ├── categoryController.js      # Category management
│   ├── fileController.js          # File management
│   ├── fileFolderController.js    # File folder management
│   ├── passwordController.js      # Password management
│   ├── passwordCategoryController.js  # Password categories
│   ├── settingsController.js      # User settings management
│   ├── wikiController.js          # Wiki workspace management
│   ├── wikiPageController.js      # Wiki page operations
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   ├── User.js              # User model with security features
│   ├── Password.js          # Password reset token model
│   ├── RefreshToken.js      # Refresh token model
│   ├── Event.js             # Calendar event model
│   ├── Category.js          # Event category model
│   ├── Settings.js          # User settings model
│   ├── File.js              # File model
│   ├── FileFolder.js        # File folder model
│   ├── Wishlist.js          # Wishlist model
│   ├── WishlistItem.js      # Wishlist item model
│   ├── WishlistCategory.js  # Wishlist category model
│   ├── WishlistReservation.js # Reservation model
│   ├── UserFollow.js        # User following model
│   ├── PasswordCategory.js  # Password category model
│   ├── Wiki.js              # Wiki workspace model
│   ├── WikiPage.js          # Wiki page model
│   ├── WikiVersion.js       # Wiki version history model
│   ├── WikiPermission.js    # Wiki permission model
│   ├── WikiCategory.js      # Wiki category model
│   └── WikiWatch.js         # Wiki watchlist model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── calendar.js          # Calendar API routes
│   │   ├── categories.js        # Category routes
│   │   ├── files.js             # File routes
│   │   ├── fileFolders.js       # File folder routes
│   │   ├── passwords.js         # Password routes
│   │   ├── passwordCategories.js  # Password category routes
│   │   ├── wishlist.js          # Wishlist routes
│   │   ├── wishlistCategories.js    # Wishlist category routes
│   │   ├── wishlists.js         # Wishlist management routes
│   │   ├── follow.js            # User following routes
│   │   ├── settings.js          # Settings routes
│   │   ├── wikis.js             # Wiki routes
│   │   └── wikiPages.js         # Wiki page routes
├── services/                # Business logic services
│   ├── passwordService.js   # Password encryption service
│   └── recurringEventService.js   # Recurring event expansion
├── logs/                    # Log files directory
├── uploads/                 # File uploads directory
├── server.js                # Express server setup
├── .env.example             # Environment variables template
└── tsconfig.json            # TypeScript configuration
```

### Frontend Structure
```
frontend/src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── AuthPage.js          # Login/Register container
│   │   │   ├── Login.js             # Login form with validation
│   │   │   ├── Register.js          # Registration form
│   │   │   └── ProtectedRoute.js    # Route protection wrapper
│   │   ├── Layout/
│   │   │   ├── Header.js            # Navigation header
│   │   │   ├── Footer.js            # Page footer
│   │   │   ├── Sidebar.js           # Navigation sidebar
│   │   │   ├── Row.js               # Layout row component
│   │   │   └── Toast.js             # Toast notification component
│   │   ├── Pages/
│   │   │   ├── Calendar.js          # Full calendar system
│   │   │   ├── CategoryManager.js   # Category management UI
│   │   │   ├── DocumentViewer.js    # Document editor/viewer
│   │   │   ├── DocumentEditor.js    # Full-screen document editor
│   │   │   ├── FileManager.js       # File management UI
│   │   │   ├── PasswordManager.js   # Password management UI
│   │   │   ├── Settings.js          # User settings page
│   │   │   ├── UserFollowing.js     # User following/social page
│   │   │   ├── Hero.js              # Landing page hero
│   │   │   ├── LandingPage.js       # Landing page container
│   │   │   ├── Home.js              # Home dashboard
│   │   │   ├── ProductGrid.js       # Product showcase
│   │   │   ├── Features.js          # Features display
│   │   │   ├── Privacy.js           # Privacy policy page
│   │   │   ├── Terms.js             # Terms of service page
│   │   │   ├── Cookies.js           # Cookie policy page
│   │   │   ├── CookiePopup.js       # Cookie consent popup
│   │   │   └── LinkNotFound.js      # 404 placeholder page
│   │   ├── Wishlist/
│   │   │   ├── Wishlist.js          # Main wishlist component
│   │   │   ├── WishlistItemModal.js # Item create/edit modal
│   │   │   ├── ReservationModal.js  # Reservation modal
│   │   │   ├── WishlistShareModal.js # Share link modal
│   │   │   └── PublicWishlistItem.js # Public item view
│   │   ├── Wiki/
│   │   │   ├── WikiList.js          # Wiki list component
│   │   │   ├── WikiView.js          # Wiki viewer component
│   │   │   ├── WikiPageView.js      # Wiki page viewer
│   │   │   ├── WikiPageEditor.js    # Wiki page editor
│   │   │   ├── WikiPageHistory.js   # Wiki page history
│   │   │   ├── WikiSettings.js      # Wiki settings
│   │   │   └── WikiRecentChanges.js # Wiki recent changes
│   │   ├── Math/
│   │   │   ├── GeoGebraCalculator.js  # Interactive graphing calculator
│   │   │   └── GeoGebraCalculator.css # Calculator styles
│   │   ├── CalendarHeader.js      # Calendar header component
│   │   ├── CalendarSidebar.js     # Calendar sidebar component
│   │   ├── EventForm.js           # Event creation form
│   │   └── EventDetails.js        # Event details display
│   ├── contexts/
│   │   ├── AuthContext.js         # Authentication state management
│   │   ├── SettingsContext.js     # Settings state management
│   │   ├── CalendarActionsContext.js  # Calendar actions
│   │   ├── PageActionsContext.js  # Page actions
│   │   ├── NotificationContext.js # Notification state management
│   │   └── WikiContext.js         # Wiki state management
│   ├── services/
│   │   ├── calendarAPI.js         # Calendar API client
│   │   ├── categoryAPI.js         # Category API client
│   │   ├── fileService.js         # File API client
│   │   ├── passwordAPI.js         # Password API client
│   │   ├── settingsAPI.js         # Settings API client
│   │   ├── wishlistAPI.js         # Wishlist API client
│   │   ├── wishlistCategoryAPI.js   # Wishlist category API client
│   │   └── wikiAPI.js             # Wiki API client
│   ├── utils/
│   │   ├── GraphingEngine.js      # Canvas-based graphing engine
│   │   └── MathParser.js          # Mathematical expression parser
│   ├── config/
│   │   └── api.js                 # API endpoint configuration
│   ├── types/
│   │   └── auth.ts                # TypeScript type definitions
│   └── App.js                       # Main routing and app structure
```

## 📅 Calendar System Architecture

### Calendar Components

#### Calendar.js
The main calendar component providing a comprehensive event management system:

**Key Features:**
- **Multiple View Modes**: Month, week, and day views
- **Event Management**: Create, read, update, delete operations
- **Category System**: Color-coded event categories
- **Search & Filter**: Real-time event filtering
- **Statistics Dashboard**: Event analytics and tracking
- **Export Functionality**: JSON export of calendar data
- **Backend Integration**: Full API integration for data persistence

**State Management:**
```javascript
const [currentDate, setCurrentDate] = useState(new Date());
const [selectedDate, setSelectedDate] = useState(null);
const [events, setEvents] = useState([]);
const [showEventForm, setShowEventForm] = useState(false);
const [viewMode, setViewMode] = useState('month');
const [searchTerm, setSearchTerm] = useState('');
const [selectedCategory, setSelectedCategory] = useState('all');
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

**API Integration:**
- Fetches events from `/api/calendar/events`
- Creates events via POST to `/api/calendar/events`
- Updates events via PUT to `/api/calendar/events/:id`
- Deletes events via DELETE to `/api/calendar/events/:id`
- Handles authentication tokens automatically

**Event Categories:**
- **Work** (💼): Professional events and meetings
- **Personal** (👤): Personal appointments and tasks
- **Social** (🎉): Social gatherings and events
- **Health** (🏥): Medical appointments and fitness
- **Education** (📚): Learning and training events
- **Travel** (✈️): Travel plans and accommodations

**Data Structure:**
```javascript
{
  id: Number,
  title: String,
  description: String,
  date: String (ISO),
  time: String,
  location: String,
  category: String,
  attendees: Array<String>,
  reminder: String,
  color: String,
  createdAt: String (ISO)
}
```

#### Event Management

**EventForm Component:**
- Modal form for creating/editing events
- Form validation and error handling
- Category selection with color coding
- Attendee management with email validation
- Reminder settings with multiple options

**EventDetails Component:**
- Modal display for event information
- Edit and delete functionality
- Attendee count display
- Location and time information

**Data Persistence:**
- Local storage for event data
- Automatic save on state changes
- JSON export functionality
- Data validation on load

### Calendar Features

**View Modes:**
- **Month View**: Traditional monthly calendar grid
- **Week View**: Weekly timeline view
- **Day View**: Daily schedule view

**Search & Filtering:**
- Real-time search by event title
- Category-based filtering
- Date range filtering
- Multi-criteria filtering

**Statistics:**
- Total events count
- Monthly event statistics
- Category-wise distribution
- Upcoming events tracking

**User Interactions:**
- Click-to-add events on calendar dates
- Click-to-view existing events
- Drag-and-drop event rescheduling (planned)
- Keyboard navigation support (planned)

## 📐 GeoGebra Calculator Architecture

### GraphingEngine Class

The `GraphingEngine` is a canvas-based mathematical graphing engine:

**Key Features:**
- **Coordinate System**: Configurable x/y axis ranges with auto-fit
- **Object Types Supported**:
  - Functions: `f(x) = x^2 + 3x - 2`
  - Parametric curves: `x(t) = cos(t), y(t) = sin(t)`
  - Points: `A = (3, 4)`
  - Circles: Center-radius and diameter definitions
  - Polygons: Triangle, quadrilateral, custom polygons
  - Implicit equations: `x^2 + y^2 = 25`
  - Inequalities: `y > x^2`, `x + y < 5`
- **Interactive Navigation**: Pan, zoom (mouse wheel), reset view
- **Visual Rendering**: Grid, axes, labels with light/dark theme support
- **Color Management**: Automatic color cycling for multiple objects

**Technical Implementation:**
```javascript
// Coordinate transformations
this.xMin, this.xMax, this.yMin, this.yMax  // View bounds
this.toCanvasX(x)  // Math to canvas coordinates
this.toCanvasY(y)  // Math to canvas coordinates
this.zoom(factor)  // Zoom around center point
this.pan(dx, dy)   // Pan the view
```

### MathParser Utility

The `MathParser` provides expression evaluation:

**Capabilities:**
- Arithmetic operations: `+`, `-`, `*`, `/`, `^`
- Mathematical functions: `sin`, `cos`, `tan`, `log`, `ln`, `sqrt`, `abs`
- Constants: `pi`, `e`
- Variables: `x`, `y`, `t`
- Inequality parsing: `<`, `>`, `<=`, `>=`

**Supported Commands:**
- `f(x) = expression` - Define functions
- `y = expression` - Explicit functions
- `A = (x, y)` - Define points
- `x(t) = ..., y(t) = ...` - Parametric equations
- `Circle(A, r)` or `Circle(A, B)` - Circles
- `Polygon(A, B, C, ...)` - Polygons
- `expression = 0` - Implicit equations
- `y > f(x)` - Inequalities

### GeoGebraCalculator Component

React component providing the user interface:

**Features:**
- **Command Input**: Text-based interface for creating objects
- **Object List**: Sidebar showing all objects with visibility toggle
- **Object Editing**: Click to edit, delete, or modify objects
- **State Management**: Save/restore calculator states
- **Theme Support**: Light/dark mode with automatic switching
- **Mouse Interactions**: Wheel zoom, drag pan, click selection

**State Structure:**
```javascript
{
  objects: [],           // Array of mathematical objects
  showGrid: true,        // Grid visibility
  showAxes: true,        // Axes visibility
  panMode: true,         // Pan vs selection mode
  isDarkTheme: false,    // Theme state
  savedStates: []        // Saved calculator states
}
```

## 📊 Application Architecture

### System Overview

The Comprehensive Local Ecosystem consists of two main components:

1. **Backend API Server** (Node.js/Express)
2. **Frontend Web Application** (React)

### Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │    │   (Express)     │    │   (MongoDB)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│                 │    │                 │    │                 │
│ • UI Components │◄──►│ • API Routes    │◄──►│ • User Data     │
│ • State Mgmt    │    │ • Middleware    │    │ • Refresh Tokens│
│ • Calendar      │    │ • Auth Logic    │    │                 │
│ • Forms         │    │ • Validation    │    │                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Authentication Flow

```
1. User Login Request
   ↓
2. Frontend → Backend (POST /api/auth/login)
   ↓
3. Backend validates credentials
   ↓
4. Generate JWT tokens (access + refresh)
   ↓
5. Set HttpOnly cookies
   ↓
6. Redirect to protected route
   ↓
7. Subsequent requests include cookies
   ↓
8. Backend validates tokens
   ↓
9. Grant access to protected resources
```

### Calendar Data Flow

```
1. User interacts with calendar UI
   ↓
2. State updates in React components
   ↓
3. API calls to backend (/api/calendar/*)
   ↓
4. Backend processes requests with authentication
   ↓
5. MongoDB operations (CRUD)
   ↓
6. Response sent to frontend
   ↓
7. UI re-renders with new state
   ↓
8. Local backup for offline functionality
```

### Security Architecture

**Token Management:**
- Access tokens: 15 minutes, stored in HttpOnly cookies
- Refresh tokens: 7 days, database-tracked with rotation
- Device tracking: User agent and IP logging

**Rate Limiting:**
- General API: 100 requests/15min per IP
- Authentication: 5 attempts/15min per IP
- Token refresh: 10 attempts/15min per IP

**Data Protection:**
- Input validation with express-validator
- XSS protection via HttpOnly cookies
- CSRF protection via SameSite cookies
- SQL injection prevention via Mongoose ODM

## 📊 Component Architecture

### Frontend Component Hierarchy

```
App.js
├── Router
├── AuthProvider
│   └── AuthContext
├── Routes
│   ├── /login → AuthPage
│   │   ├── Login
│   │   └── Register
│   ├── /home → ProtectedRoute
│   │   ├── Header
│   │   ├── Hero
│   │   ├── ProductGrid
│   │   ├── Features
│   │   └── Footer
│   └── /calendar-system → ProtectedRoute
│       ├── Header
│       ├── CalendarSystem
│       │   ├── EventForm
│       │   └── EventDetails
│       └── Footer
```

### Backend Module Structure

```
server.js
├── Middleware
│   ├── Helmet (Security)
│   ├── CORS
│   ├── Morgan (Logging)
│   ├── Express Parser
│   ├── Cookie Parser
│   └── Rate Limiter
├── Routes
│   ├── /api/auth
│   │   ├── POST /register
│   │   ├── POST /login
│   │   ├── POST /refresh
│   │   ├── GET /me
│   │   ├── POST /logout
│   │   └── POST /logout-all
│   └── /api/calendar
│       ├── GET /events
│       ├── POST /events
│       ├── PUT /events/:id
│       ├── DELETE /events/:id
│       └── GET /events/:id
├── Controllers
│   └── calendarController.js
│       ├── getAllEvents
│       ├── createEvent
│       ├── updateEvent
│       ├── deleteEvent
│       └── getEventById
├── Models
│   ├── User.js
│   ├── RefreshToken.js
│   └── CalendarEvent.js
└── Config
    ├── database.js
    ├── logger.js
    └── rateLimiter.js
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
| `PASSWORD_MASTER_KEY` | Master key for password encryption | - | Yes |
| `UPLOAD_DIR` | Directory for file uploads | ./uploads/files | No |
| `MAX_FILE_SIZE` | Maximum file upload size (bytes) | 524288000 (500MB) | No |
| `MAX_STORAGE_BYTES` | Maximum storage per user (bytes) | 10737418240 (10GB) | No |
| `USE_HTTPS` | Enable HTTPS server | false | No |
| `HTTPS_PORT` | HTTPS server port | 3443 | No |
| `SSL_CERT_PATH` | Path to SSL certificate | - | No |
| `SSL_KEY_PATH` | Path to SSL private key | - | No |

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
  avatar: String,  // URL to avatar image
  timestamps: true
}
```

#### PasswordEntry Model
```javascript
{
  title: String (required),
  username: String,
  encryptedPassword: String (required),
  website: String,
  notes: String,
  category: ObjectId (ref: PasswordCategory),
  isFavorite: Boolean (default: false),
  user: ObjectId (ref: User, required),
  timestamps: true
}
```

#### PasswordCategory Model
```javascript
{
  name: String (required),
  color: String,
  icon: String,
  user: ObjectId (ref: User, required),
  timestamps: true
}
```

#### WishlistItem Model
```javascript
{
  title: String (required),
  description: String,
  url: String,
  price: Number,
  currency: String (enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NOK', 'SEK', 'DKK']),
  priority: String (enum: ['low', 'medium', 'high', 'must-have']),
  category: String (required),
  imageUrl: String,
  isPublic: Boolean (default: false),
  shareToken: String (unique, sparse),
  status: String (enum: ['active', 'purchased', 'archived']),
  reservations: [ObjectId (ref: WishlistReservation)],
  user: ObjectId (ref: User, required),
  timestamps: true
}
```

#### WishlistReservation Model
```javascript
{
  wishlistItem: ObjectId (ref: WishlistItem, required),
  reservedBy: {
    name: String (required),
    email: String
  },
  message: String,
  status: String (enum: ['reserved', 'purchased'], default: 'reserved'),
  reservedAt: Date (default: now),
  timestamps: true
}
```

#### WishlistCategory Model
```javascript
{
  name: String (required),
  color: String,
  icon: String,
  user: ObjectId (ref: User, required),
  timestamps: true
}
```

#### UserFollow Model
```javascript
{
  follower: ObjectId (ref: User, required),
  following: ObjectId (ref: User, required),
  followedAt: Date (default: now),
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

#### CalendarEvent Model
```javascript
{
  title: String (required),
  description: String,
  date: Date (required),
  time: String,
  location: String,
  category: String (enum: ['Work', 'Personal', 'Social', 'Health', 'Education', 'Travel']),
  attendees: [String],
  reminder: String,
  color: String,
  user: ObjectId (ref: User, required),
  timestamps: true
}
```

#### Category Model
```javascript
{
  name: String (required),
  color: String (required),
  user: ObjectId (ref: User, required),
  timestamps: true
}
```

#### File Model
```javascript
{
  userId: ObjectId (ref: User, required),
  filename: String (required),
  originalName: String (required),
  mimeType: String (required),
  size: Number (required),
  path: String (required),
  folderId: ObjectId (ref: FileFolder),
  isPublic: Boolean (default: false),
  shareToken: String (unique, sparse),
  description: String (maxlength: 500),
  tags: [String],
  isFavorite: Boolean (default: false),
  isDeleted: Boolean (default: false),
  deletedAt: Date,
  timestamps: true
}
```

#### FileFolder Model
```javascript
{
  userId: ObjectId (ref: User, required),
  name: String (required),
  parentId: ObjectId (ref: FileFolder),
  isDeleted: Boolean (default: false),
  deletedAt: Date,
  timestamps: true
}
```

#### Settings Model
```javascript
{
  user: ObjectId (ref: User, required),
  theme: String (enum: ['light', 'dark'], default: 'light'),
  language: String (default: 'en'),
  notifications: {
    email: Boolean,
    push: Boolean
  },
  preferences: {
    defaultView: String (enum: ['month', 'week', 'day']),
    weekStart: String (enum: ['sunday', 'monday'])
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

**Version**: 1.0.0
**Last Updated**: 2026-04-26
**Status**: Production Ready
**Features**: Authentication, Calendar Management, Password Manager, Wishlist System, Social Features, User Settings, File Manager, Document Viewer, GeoGebra Calculator, Recurring Events, Wiki System
