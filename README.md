# Comprehensive Local Ecosystem

A full-featured web application ecosystem combining robust authentication, dynamic calendar management, secure password storage, wishlist management with social features, and modern user interface design. Built with React (frontend) and Node.js/Express (backend) implementing industry best practices for security, scalability, and user experience.

## Key Features

### Authentication System
- **JWT-based Authentication**: Short-lived access tokens (15 minutes) with refresh tokens (7 days)
- **HttpOnly Cookies**: Secure token storage preventing XSS attacks
- **Rate Limiting**: Protection against brute force attacks
- **Account Locking**: Automatic account lock after 5 failed login attempts
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Session Management**: Individual and bulk logout capabilities
- **Device Tracking**: Monitor and manage login sessions across devices
- **Password Reset**: Email-based password reset functionality

### Calendar System
- **Full Calendar Management**: Create, edit, delete events with rich details
- **Multiple View Modes**: Month, week, and day views
- **Event Categories**: Work, Personal, Social, Health, Education, Travel
- **Advanced Features**: Event search, filtering, attendees, reminders
- **Data Persistence**: MongoDB storage with local backup
- **Statistics Dashboard**: Event tracking and analytics
- **Backend Integration**: RESTful API for calendar data management
- **Category Manager**: Custom category creation and management
- **Settings Page**: User preferences and account settings
- **Import/Export**: JSON export and import functionality

### Password Manager
- **AES-256-GCM Encryption**: Military-grade encryption for stored passwords
- **Master Key Protection**: Environment-based encryption key
- **Password Categories**: Organize passwords into custom categories
- **Search & Filter**: Quick password lookup
- **Favorite System**: Mark frequently used passwords
- **Import/Export**: Secure backup and restore functionality
- **One-Click Copy**: Copy passwords to clipboard
- **Password Generator**: Built-in secure password generation

### Wishlist System
- **Item Management**: Create, edit, delete wishlist items with rich details
- **Public/Private Items**: Share items via unique shareable links
- **Reservation System**: Allow others to reserve or purchase items
- **Categories**: Birthday, Christmas, Wedding, Baby Shower, Housewarming templates
- **Priority Levels**: low, medium, high, must-have
- **Price Tracking**: Multi-currency support (USD, EUR, GBP, CAD, AUD, NOK, SEK, DKK)
- **Image Support**: Add product images to wishlist items
- **Analytics Dashboard**: Track wishlist statistics and trends
- **Follow System**: Follow other users and view their public wishlists

### Social Features
- **User Following**: Follow/unfollow other users
- **Public Profiles**: View user profiles with their public wishlists
- **User Search**: Find users by name or email
- **Share Links**: Generate unique tokens for sharing wishlist items
- **Guest Reservations**: Allow non-authenticated users to reserve items

### Frontend Features
- **React 19.2.4**: Latest React version with modern hooks
- **TypeScript Support**: Type definitions for authentication and API interfaces
- **Tailwind CSS**: Utility-first CSS framework for modern styling
- **Lucide React**: Beautiful icon library
- **Responsive Design**: Mobile-first responsive UI
- **Component Architecture**: Modular, reusable components
- **Real-time Updates**: Dynamic UI updates with state management
- **Theme Support**: Light/dark mode with system preference detection
- **Cookie Consent**: GDPR-compliant cookie consent popup
- **Legal Pages**: Privacy Policy, Terms of Service, Cookie Policy

### Backend Features
- **MongoDB Integration**: Scalable database with Mongoose ODM
- **Refresh Token System**: Automatic token rotation with device tracking
- **Comprehensive Logging**: Winston-based structured logging
- **Error Handling**: Detailed error codes and messages
- **Health Monitoring**: Built-in health check endpoints
- **Security Middleware**: Helmet, CORS, rate limiting
- **Input Validation**: Express-validator for all routes
- **File Uploads**: Multer for image handling
- **Caching**: In-memory caching for public wishlist items

## Quick Start

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

# Token Expiration Configuration
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/full-system-architecture

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Security Configuration
BCRYPT_SALT_ROUNDS=12
PASSWORD_MASTER_KEY=your_secure_master_key_for_password_encryption

# Logging Configuration
LOG_LEVEL=debug
```

4. **Start the application:**
```bash
# From root directory - starts both frontend and backend
npm run dev

# Or start individually
cd backend && npm run dev    # Backend on http://localhost:3001
cd frontend && npm start     # Frontend on http://localhost:3000
```

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `POST` | `/register` | Register a new user | No |
| `POST` | `/login` | User authentication | No |
| `POST` | `/refresh` | Refresh access token | No (uses refresh token) |
| `GET` | `/me` | Get current user info | Yes |
| `POST` | `/logout` | Logout current session | Yes |
| `POST` | `/logout-all` | Logout from all devices | Yes |
| `POST` | `/forgot-password` | Request password reset | No |
| `POST` | `/reset-password/:token` | Reset password with token | No |

### Calendar Routes (`/api/calendar`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/events` | Get all calendar events | Yes |
| `POST` | `/events` | Create new event | Yes |
| `PUT` | `/events/:id` | Update existing event | Yes |
| `DELETE` | `/events/:id` | Delete event | Yes |
| `GET` | `/events/:id` | Get specific event | Yes |
| `GET` | `/events/export` | Export events as JSON | Yes |
| `POST` | `/events/import` | Import events from JSON | Yes |

### Event Category Routes (`/api/categories`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/` | Get all categories | Yes |
| `POST` | `/` | Create new category | Yes |
| `PUT` | `/:id` | Update category | Yes |
| `DELETE` | `/:id` | Delete category | Yes |

### Password Routes (`/api/passwords`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/` | Get all passwords | Yes |
| `POST` | `/` | Create new password entry | Yes |
| `GET` | `/:id` | Get specific password | Yes |
| `PUT` | `/:id` | Update password entry | Yes |
| `DELETE` | `/:id` | Delete password | Yes |
| `GET` | `/:id/decrypt` | Decrypt and view password | Yes |
| `POST` | `/:id/favorite` | Toggle favorite status | Yes |
| `GET` | `/export` | Export passwords (encrypted) | Yes |
| `POST` | `/import` | Import passwords | Yes |

### Password Category Routes (`/api/password-categories`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/` | Get all password categories | Yes |
| `POST` | `/` | Create new category | Yes |
| `PUT` | `/:id` | Update category | Yes |
| `DELETE` | `/:id` | Delete category | Yes |

### Wishlist Routes (`/api/wishlist`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/` | Get all wishlist items | Yes |
| `POST` | `/` | Create new wishlist item | Yes |
| `GET` | `/:id` | Get specific item | Yes |
| `PUT` | `/:id` | Update wishlist item | Yes |
| `DELETE` | `/:id` | Delete wishlist item | Yes |
| `GET` | `/stats` | Get wishlist statistics | Yes |
| `GET` | `/analytics` | Get detailed analytics | Yes |
| `POST` | `/:id/share` | Toggle public sharing | Yes |
| `GET` | `/public/:token` | Get public item (no auth) | No |
| `POST` | `/:id/reserve` | Reserve/purchase item | Optional |
| `GET` | `/:id/reservations` | Get item reservations | Yes |
| `DELETE` | `/reservations/:id` | Cancel reservation | Optional |

### Wishlist Category Routes (`/api/wishlist-categories`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/` | Get all wishlist categories | Yes |
| `GET` | `/templates` | Get available templates | Yes |
| `POST` | `/` | Create new category | Yes |
| `PUT` | `/:id` | Update category | Yes |
| `DELETE` | `/:id` | Delete category | Yes |

### Follow Routes (`/api/follow`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/:userId/followers` | Get user's followers | Yes |
| `GET` | `/:userId/following` | Get users being followed | Yes |
| `POST` | `/follow/:userId` | Follow a user | Yes |
| `DELETE` | `/follow/:userId` | Unfollow a user | Yes |
| `GET` | `/following/:userId` | Check if following | Yes |
| `GET` | `/public/:userId` | Get public profile | Yes |
| `GET` | `/search` | Search users | Yes |

### Settings Routes (`/api/settings`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/` | Get user settings | Yes |
| `PUT` | `/` | Update user settings | Yes |
| `POST` | `/avatar` | Upload avatar | Yes |
| `DELETE` | `/avatar` | Remove avatar | Yes |

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

## Application Flow

### Authentication Flow
1. **Visit the application:** Open `http://localhost:3000` in your browser
2. **Authentication:** Navigate to `/login` to access the authentication page
3. **Register/Login:** Create a new account or login with existing credentials
4. **Protected Access:** After successful login, you'll be redirected to the home page

### Calendar Navigation
1. **Home Dashboard:** Overview of events and quick access to calendar
2. **Calendar System:** Full-featured calendar at `/calendar/month`
3. **Event Management:** Click on any date to add events, or click existing events to edit/delete
4. **Multiple Views:** Switch between month, week, and day views
5. **Search & Filter:** Find events quickly using search and category filters

### Password Manager
1. **Access:** Navigate to `/passwords` from the sidebar
2. **Add Password:** Click "Add Password" to create new entries
3. **Categories:** Organize passwords into custom categories
4. **Encryption:** All passwords are encrypted with AES-256-GCM
5. **Quick Access:** Use favorites and search for quick password lookup

### Wishlist Management
1. **Access:** Navigate to `/wishlist` from the sidebar
2. **Add Items:** Create wishlist items with title, description, price, URL
3. **Categories:** Choose from Birthday, Christmas, Wedding, Baby Shower, Housewarming
4. **Sharing:** Toggle public sharing to generate shareable links
5. **Reservations:** Others can reserve or mark items as purchased
6. **Following:** Follow other users to see their public wishlists

### Form Validation Requirements
- **Email:** Valid email format required
- **Password:** Minimum 6 characters
- **Name:** Minimum 2 characters required
- **Real-time Feedback:** Validation messages appear as you type

## Security Implementation

### Token Management
- **Access Tokens:** 15-minute expiration, stored in HttpOnly cookies
- **Refresh Tokens:** 7-day expiration, database-tracked with rotation
- **Device Tracking:** User agent and IP address logged for security

### Rate Limiting
- **General API:** 100 requests per 15 minutes per IP
- **Authentication:** 5 attempts per 15 minutes per IP
- **Token Refresh:** 10 attempts per 15 minutes per IP
- **Password Reset:** 3 attempts per hour per IP
- **Public Reservations:** 5 attempts per 15 minutes per IP

### Account Protection
- **Password Hashing:** bcrypt with 12 salt rounds
- **Account Locking:** 2-hour lock after 5 failed attempts
- **Session Management:** Individual and bulk logout capabilities
- **Input Validation:** Comprehensive validation using express-validator
- **Encryption:** AES-256-GCM for password storage

## Project Structure

```
ComprehensiveLocalEcosystem/
├── backend/
│   ├── config/
│   │   ├── database.js          # MongoDB connection setup
│   │   ├── logger.js            # Winston logging configuration
│   │   └── rateLimiter.js       # Rate limiting configuration
│   ├── controllers/
│   │   ├── calendarController.js    # Calendar API logic
│   │   ├── categoryController.js    # Category management
│   │   ├── passwordController.js    # Password management
│   │   ├── passwordCategoryController.js # Password categories
│   │   └── settingsController.js    # User settings management
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── models/
│   │   ├── User.js              # User model with security features
│   │   ├── Password.js          # Password reset token model
│   │   ├── RefreshToken.js      # Refresh token model
│   │   ├── Event.js             # Calendar event model
│   │   ├── Category.js          # Event category model
│   │   ├── Settings.js          # User settings model
│   │   ├── Wishlist.js          # Wishlist model
│   │   ├── WishlistItem.js      # Wishlist item model
│   │   ├── WishlistCategory.js  # Wishlist category model
│   │   ├── WishlistReservation.js # Reservation model
│   │   ├── UserFollow.js        # User following model
│   │   └── PasswordCategory.js  # Password category model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── calendar.js          # Calendar API routes
│   │   ├── categories.js        # Category routes
│   │   ├── passwords.js         # Password routes
│   │   ├── passwordCategories.js # Password category routes
│   │   ├── wishlist.js          # Wishlist routes
│   │   ├── wishlistCategories.js # Wishlist category routes
│   │   ├── wishlists.js         # Wishlist management routes
│   │   ├── follow.js            # User following routes
│   │   └── settings.js          # Settings routes
│   ├── services/                # Business logic services
│   ├── logs/                    # Log files directory
│   ├── uploads/                 # File uploads directory
│   ├── .env.example             # Environment variables template
│   ├── package.json
│   ├── server.js                # Express server setup
│   └── tsconfig.json            # TypeScript configuration
├── frontend/
│   ├── public/
│   │   ├── index.html           # Main HTML file
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── AuthPage.js        # Login/Register container
│   │   │   │   ├── Login.js           # Login form with validation
│   │   │   │   ├── Register.js        # Registration form
│   │   │   │   └── ProtectedRoute.js  # Route protection wrapper
│   │   │   ├── Layout/
│   │   │   │   ├── Header.js          # Navigation header
│   │   │   │   ├── Footer.js          # Page footer
│   │   │   │   ├── Sidebar.js         # Navigation sidebar
│   │   │   │   └── Row.js             # Layout row component
│   │   │   ├── Pages/
│   │   │   │   ├── Calendar.js        # Full calendar system
│   │   │   │   ├── CategoryManager.js # Category management UI
│   │   │   │   ├── PasswordManager.js # Password management UI
│   │   │   │   ├── Settings.js        # User settings page
│   │   │   │   ├── Hero.js            # Landing page hero
│   │   │   │   ├── ProductGrid.js     # Product showcase
│   │   │   │   ├── Features.js        # Features display
│   │   │   │   ├── Privacy.js         # Privacy policy page
│   │   │   │   ├── Terms.js           # Terms of service page
│   │   │   │   ├── Cookies.js         # Cookie policy page
│   │   │   │   ├── CookiePopup.js     # Cookie consent popup
│   │   │   │   └── LinkNotFound.js    # 404 placeholder page
│   │   │   ├── Wishlist/
│   │   │   │   ├── Wishlist.js        # Main wishlist component
│   │   │   │   ├── WishlistItemModal.js    # Item create/edit modal
│   │   │   │   ├── ReservationModal.js     # Reservation modal
│   │   │   │   ├── WishlistShareModal.js   # Share link modal
│   │   │   │   └── PublicWishlistItem.js   # Public item view
│   │   │   ├── CalendarHeader.js      # Calendar header component
│   │   │   ├── CalendarSidebar.js     # Calendar sidebar component
│   │   │   ├── EventForm.js           # Event creation form
│   │   │   └── EventDetails.js        # Event details display
│   │   ├── contexts/
│   │   │   ├── AuthContext.js         # Authentication state management
│   │   │   ├── SettingsContext.js     # Settings state management
│   │   │   ├── CalendarActionsContext.js  # Calendar actions
│   │   │   └── PageActionsContext.js  # Page actions
│   │   ├── services/
│   │   │   ├── calendarAPI.js         # Calendar API client
│   │   │   ├── categoryAPI.js         # Category API client
│   │   │   ├── passwordAPI.js         # Password API client
│   │   │   ├── settingsAPI.js         # Settings API client
│   │   │   ├── wishlistAPI.js         # Wishlist API client
│   │   │   └── wishlistCategoryAPI.js # Wishlist category API client
│   │   ├── config/
│   │   │   └── api.js                 # API endpoint configuration
│   │   ├── types/
│   │   │   └── auth.ts                # TypeScript type definitions
│   │   ├── App.js                     # Main routing and app structure
│   │   ├── App.css                    # Application styles
│   │   ├── index.js                   # Application entry point
│   │   └── index.css                  # Global styles
│   ├── package.json
│   ├── tailwind.config.js             # Tailwind CSS configuration
│   └── .env.example                   # Frontend environment template
├── DOCUMENTATION.md                   # Comprehensive technical documentation
├── NEXT_STEPS.md                      # Security recommendations and roadmap
├── GITHUB_WORKFLOW.md                 # GitHub workflow documentation
├── SECURITY.md                        # Security policy
├── PRIVACY.md                         # Privacy policy
├── TERMS.md                           # Terms of service
├── COOKIE_POLICY.md                   # Cookie policy
├── LICENSE                            # MIT License
├── package.json                       # Root package configuration
└── setup.sh                           # Setup script
```

## Testing

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

# Create wishlist item
curl -X POST http://localhost:3001/api/wishlist \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"New Item","description":"Description","price":99.99,"category":"birthday"}'
```

## Development & Extensions

### Current Implementation Status

**Completed Features:**
- Full JWT authentication system with refresh tokens
- Secure user registration and login
- Rate limiting and account protection
- Comprehensive calendar management system
- Event CRUD operations with categories
- Search and filtering capabilities
- Statistics dashboard
- Responsive UI with modern design
- Backend API for calendar operations
- TypeScript support
- Password manager with AES-256-GCM encryption
- Password categories and favorites
- Wishlist management system
- Public wishlist sharing with unique tokens
- Reservation system for wishlist items
- User following system
- Analytics dashboard for wishlists
- Cookie consent and legal pages
- Theme support (light/dark mode)

### Development Guidelines
- Follow existing code patterns and conventions
- Use TypeScript for type safety
- Implement comprehensive error handling
- Add tests for new features
- Update documentation for API changes
- Ensure input validation on all routes
- Maintain security best practices

## Troubleshooting

### Common Issues

**Database Connection:**
- Ensure MongoDB is running on the specified port
- Check connection string in `.env` file
- Verify database user permissions

**Authentication Issues:**
- Verify JWT secrets are set correctly
- Check cookie settings in browser
- Ensure CORS configuration matches frontend URL

**Password Encryption:**
- Ensure `PASSWORD_MASTER_KEY` is set in `.env`
- Key should be at least 32 characters for security

**Environment Issues:**
- Copy `.env.example` to `.env` in backend directory
- Generate strong JWT secrets for production
- Set correct frontend URL in CORS configuration

### Health Check
Monitor system status:
```bash
curl http://localhost:3001/health
```

## Additional Documentation

- **Technical Documentation:** [DOCUMENTATION.md](./DOCUMENTATION.md)
- **Security Recommendations:** [NEXT_STEPS.md](./NEXT_STEPS.md)
- **GitHub Workflow:** [GITHUB_WORKFLOW.md](./GITHUB_WORKFLOW.md)
- **Security Policy:** [SECURITY.md](./SECURITY.md)
- **Privacy Policy:** [PRIVACY.md](./PRIVACY.md)
- **Terms of Service:** [TERMS.md](./TERMS.md)
- **Cookie Policy:** [COOKIE_POLICY.md](./COOKIE_POLICY.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Version**: 2.0.0
**Last Updated**: 2026-04-05
**Status**: Production Ready
**Repository**: https://github.com/theolidec/ComprehensiveLocalEcosystem
