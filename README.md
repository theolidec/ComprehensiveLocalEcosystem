# 🌟 Comprehensive Local Ecosystem

A full-featured web application ecosystem combining robust authentication, dynamic calendar management, and modern user interface design. Built with React (frontend) and Node.js/Express (backend) implementing industry best practices for security, scalability, and user experience.

## ✨ Key Features

### 🔒 Authentication System
- **JWT-based Authentication**: Short-lived access tokens (15 minutes) with refresh tokens (7 days)
- **HttpOnly Cookies**: Secure token storage preventing XSS attacks
- **Rate Limiting**: Protection against brute force attacks
- **Account Locking**: Automatic account lock after 5 failed login attempts
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Session Management**: Individual and bulk logout capabilities
- **Device Tracking**: Monitor and manage login sessions across devices

### 📅 Calendar System
- **Full Calendar Management**: Create, edit, delete events with rich details
- **Multiple View Modes**: Month, week, and day views
- **Event Categories**: Work, Personal, Social, Health, Education, Travel
- **Advanced Features**: Event search, filtering, attendees, reminders
- **Data Persistence**: Local storage with export functionality
- **Statistics Dashboard**: Event tracking and analytics
- **Backend Integration**: RESTful API for calendar data management

### 🎨 Frontend Features
- **React 19.2.4**: Latest React version with modern hooks
- **TypeScript Support**: Type definitions for authentication interfaces
- **Tailwind CSS**: Utility-first CSS framework for modern styling
- **Lucide React**: Beautiful icon library
- **Responsive Design**: Mobile-first responsive UI
- **Component Architecture**: Modular, reusable components
- **Real-time Updates**: Dynamic UI updates with state management

### ⚙️ Backend Features
- **MongoDB Integration**: Scalable database with Mongoose ODM
- **Refresh Token System**: Automatic token rotation with device tracking
- **Comprehensive Logging**: Winston-based structured logging
- **Error Handling**: Detailed error codes and messages
- **Health Monitoring**: Built-in health check endpoints
- **Security Middleware**: Helmet, CORS, rate limiting
- **Calendar API**: RESTful endpoints for calendar operations
- **Real-time Communication**: Socket.io integration for live updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 5.0+
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/ComprehensiveLocalEcosystem.git
cd ComprehensiveLocalEcosystem
```

2. **Install dependencies:**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

3. **Environment Configuration:**
```bash
cd backend
cp .env.example .env
```

Update the `.env` file with your configuration:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secrets (Generate strong secrets for production)
JWT_SECRET=your_super_secret_jwt_key_here_replace_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_replace_in_production

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/full-system-architecture

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

4. **Start the application:**
```bash
# From root directory - starts both frontend and backend
npm run dev

# Or start individually
cd backend && npm run dev    # Backend on http://localhost:3001
cd frontend && npm start     # Frontend on http://localhost:3000
```

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `POST` | `/register` | Register a new user | No |
| `POST` | `/login` | User authentication | No |
| `POST` | `/refresh` | Refresh access token | No (uses refresh token) |
| `GET` | `/me` | Get current user info | Yes |
| `POST` | `/logout` | Logout current session | Yes |
| `POST` | `/logout-all` | Logout from all devices | Yes |

### Calendar Routes (`/api/calendar`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/events` | Get all calendar events | Yes |
| `POST` | `/events` | Create new event | Yes |
| `PUT` | `/events/:id` | Update existing event | Yes |
| `DELETE` | `/events/:id` | Delete event | Yes |
| `GET` | `/events/:id` | Get specific event | Yes |

### System Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | System health check |
| `GET` | `/` | Server information |

### Request/Response Examples

**Register User:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login User:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Get User Info:**
```bash
GET /api/auth/me
Authorization: Bearer <access_token>
```

## 🎯 Application Flow

### Authentication Flow
1. **Visit the application:** Open `http://localhost:3000` in your browser
2. **Authentication:** Navigate to `/login` to access the authentication page
3. **Register/Login:** Create a new account or login with existing credentials
4. **Protected Access:** After successful login, you'll be redirected to the home page

### Calendar Navigation
1. **Home Dashboard:** Overview of events and quick access to calendar
2. **Calendar System:** Full-featured calendar at `/calendar-system`
3. **Event Management:** Click on any date to add events, or click existing events to edit/delete
4. **Multiple Views:** Switch between month, week, and day views
5. **Search & Filter:** Find events quickly using search and category filters

### Form Validation Requirements
- **Email:** Valid email format required
- **Password:** Minimum 6 characters
- **Name:** Minimum 2 characters required
- **Real-time Feedback:** Validation messages appear as you type

## 🔒 Security Implementation

### Token Management
- **Access Tokens:** 15-minute expiration, stored in HttpOnly cookies
- **Refresh Tokens:** 7-day expiration, database-tracked with rotation
- **Device Tracking:** User agent and IP address logged for security

### Rate Limiting
- **General API:** 100 requests per 15 minutes per IP
- **Authentication:** 5 attempts per 15 minutes per IP
- **Token Refresh:** 10 attempts per 15 minutes per IP
- **Password Reset:** 3 attempts per hour per IP

### Account Protection
- **Password Hashing:** bcrypt with 12 salt rounds
- **Account Locking:** 2-hour lock after 5 failed attempts
- **Session Management:** Individual and bulk logout capabilities
- **Input Validation:** Comprehensive validation using express-validator

## 📁 Project Structure

```
ComprehensiveLocalEcosystem/
├── backend/
│   ├── config/
│   │   ├── database.js      # MongoDB connection setup
│   │   ├── logger.js        # Winston logging configuration
│   │   └── rateLimiter.js   # Rate limiting configuration
│   ├── controllers/
│   │   └── calendarController.js  # Calendar API logic
│   ├── middleware/
│   │   └── auth.js          # Authentication middleware
│   ├── models/
│   │   ├── User.js          # User model with security features
│   │   ├── RefreshToken.js  # Refresh token model
│   │   └── CalendarEvent.js # Calendar event model
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   └── calendar.js       # Calendar API routes
│   ├── src/
│   │   └── types/           # TypeScript type definitions
│   ├── logs/                # Log files directory
│   ├── data/                # Data storage directory
│   ├── .env.example         # Environment variables template
│   ├── package.json
│   ├── server.js            # Express server setup
│   └── tsconfig.json        # TypeScript configuration
├── frontend/
│   ├── public/
│   │   └── index.html       # Main HTML file
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.js    # Route protection wrapper
│   │   │   ├── AuthPage.js          # Login/Register container
│   │   │   ├── Login.js             # Login form with validation
│   │   │   ├── Register.js          # Registration form with validation
│   │   │   ├── Header.js            # Navigation header
│   │   │   ├── Hero.js              # Landing page hero section
│   │   │   ├── ProductGrid.js       # Product showcase component
│   │   │   ├── Features.js          # Features display component
│   │   │   ├── Footer.js            # Page footer
│   │   │   └── Calendar.js          # Full calendar system
│   │   ├── contexts/
│   │   │   └── AuthContext.js       # Authentication state management
│   │   ├── config/
│   │   │   └── api.js               # API endpoint configuration
│   │   ├── types/
│   │   │   └── auth.ts              # TypeScript type definitions
│   │   ├── App.js                   # Main routing and app structure
│   │   └── index.js                 # Application entry point
│   ├── package.json
│   └── tailwind.config.js           # Tailwind CSS configuration
├── DOCUMENTATION.md                  # Comprehensive technical documentation
├── README.md                         # This file
├── GITHUB_WORKFLOW.md                # GitHub workflow documentation
├── IMPROVEMENTS.md                   # Future improvements and enhancements
├── MIGRATION_GUIDE.md                # Migration guide documentation
├── LICENSE                           # MIT License
├── package.json                      # Root package configuration
└── setup.sh                          # Setup script
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

### API Testing Examples

```bash
# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123","name":"Test User"}'

# Login user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}' \
  -c cookies.txt

# Get user info
curl -X GET http://localhost:3001/api/auth/me \
  -b cookies.txt
```

## 🚀 Development & Extensions

### Current Implementation Status

**✅ Completed Features:**
- Full JWT authentication system with refresh tokens
- Secure user registration and login
- Rate limiting and account protection
- Comprehensive calendar management system
- Event CRUD operations with categories
- Search and filtering capabilities
- Statistics dashboard
- Responsive UI with modern design
- Backend API for calendar operations
- Real-time socket.io integration
- TypeScript support

**🚧 In Development:**
- Advanced calendar views (week/day)
- Event reminders and notifications
- File attachments for events
- Recurring events
- Calendar sharing capabilities

**📋 Planned Enhancements:**

**User Management:**
- User profile management
- Avatar upload functionality
- User preferences and settings

**Access Control:**
- Role-based access control (RBAC)
- Permission management
- Admin dashboard

**Security Enhancements:**
- Email verification system
- Password reset functionality
- Two-factor authentication (2FA)
- Social authentication integration

**Monitoring & Analytics:**
- User activity tracking
- Security audit logs
- Performance monitoring
- Analytics dashboard

**Calendar Advanced Features:**
- Multiple calendar support
- Calendar synchronization
- Import/export calendar data
- Team collaboration features

### Development Guidelines
- Follow existing code patterns and conventions
- Use TypeScript for type safety
- Implement comprehensive error handling
- Add tests for new features
- Update documentation for API changes

## 🛠️ Troubleshooting

### Common Issues

**Database Connection:**
- Ensure MongoDB is running on the specified port
- Check connection string in `.env` file
- Verify database user permissions

**Authentication Issues:**
- Verify JWT secrets are set correctly
- Check cookie settings in browser
- Ensure CORS configuration matches frontend URL

**Environment Issues:**
- Copy `.env.example` to `.env` in backend directory
- Generate strong JWT secrets for production
- Set correct frontend URL in CORS configuration

### Health Check
Monitor system status:
```bash
curl http://localhost:3001/health
```

## 📚 Additional Documentation

For comprehensive technical details, see [DOCUMENTATION.md](./DOCUMENTATION.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Version**: 2.0.0  
**Last Updated**: 2025-03-21  
**Status**: Production Ready  
**Repository**: https://github.com/yourusername/ComprehensiveLocalEcosystem
