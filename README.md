# Comprehensive Local Ecosystem

##### Written using Windsurf (https://windsurf.com/)

A full-featured web application ecosystem combining robust authentication, dynamic calendar management, secure password storage, wishlist management with social features, and modern user interface design. Built with React (frontend) and Node.js/Express (backend) implementing industry best practices for security, scalability, and user experience.

---

## MIL-STD-498 Compliance (Not fully implemented yet)

This project follows **MIL-STD-498** (Military Standard: Software Development and Documentation) for software documentation and development practices.

### Completed Documentation (DIDs)

| Document | Abbreviation | Description |
|----------|--------------|-------------|
| [Software Development Plan](doc/MIL-STD-498/SDP.md) | SDP | Plan for performing software development |
| [Operational Concept Description](doc/MIL-STD-498/OCD.md) | OCD | Operational concept for the system |
| [Software Requirements Specification](doc/MIL-STD-498/SRS.md) | SRS | Requirements to be met by each CSCI |
| [Software User Manual](doc/MIL-STD-498/SUM.md) | SUM | Instructions for hands-on users |

### Document Hierarchy

```
OCD (Operational Concept)
    │
    ▼
SSS/SRS (Requirements)
    │
    ▼
SSDD/SDD/DBDD/IDD (Design)
    │
    ▼
STP/STD (Test Planning)
    │
    ▼
STR (Test Results)
    │
    ▼
SUM/SIOM (User Manuals)
```

### Quick Reference

- **Full MIL-STD-498 Documentation**: [doc/MIL-STD-498/MIL-STD-498.md](doc/MIL-STD-498/MIL-STD-498.md)
- **Project SRS**: [doc/MIL-STD-498/SRS.md](doc/MIL-STD-498/SRS.md) - Detailed software requirements
- **Project OCD**: [doc/MIL-STD-498/OCD.md](doc/MIL-STD-498/OCD.md) - Operational concept
- **Project SDP**: [doc/MIL-STD-498/SDP.md](doc/MIL-STD-498/SDP.md) - Development plan
- **Project SUM**: [doc/MIL-STD-498/SUM.md](doc/MIL-STD-498/SUM.md) - User manual

---

## Documentation Structure

### For Everyone
- **[README.md](README.md)** - This file: Project overview and quick start
- **[doc/architecture/api-overview.md](doc/architecture/api-overview.md)** - Complete API reference

### For Developers
- **[doc/README.md](doc/README.md)** - Documentation index
- **[doc/ops/development.md](doc/ops/development.md)** - Development setup and workflows
- **[doc/architecture/backend.md](doc/architecture/backend.md)** - Backend structure and patterns
- **[doc/architecture/frontend.md](doc/architecture/frontend.md)** - Frontend structure and patterns
- **[doc/architecture/database.md](doc/architecture/database.md)** - All MongoDB schemas

### For API Consumers
- **[doc/architecture/api-overview.md](doc/architecture/api-overview.md)** - Complete API reference
- **[doc/architecture/authentication.md](doc/architecture/authentication.md)** - Authentication flow

### For Security Review
- **[SECURITY.md](SECURITY.md)** - Security policy
- **[doc/ops/security.md](doc/ops/security.md)** - Security implementation details

### For Operations
- **[doc/ops/deployment.md](doc/ops/deployment.md)** - Production deployment guide
- **[GITHUB_WORKFLOW.md](GITHUB_WORKFLOW.md)** - CI/CD workflow

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
- **Home Page Integration**: Quick event creation and today's events on Home

### Password Manager
- **AES-256-GCM Encryption**: Military-grade encryption for stored passwords
- **Master Key Protection**: Environment-based encryption key
- **Password Categories**: Organize passwords into custom categories
- **Search & Filter**: Quick password lookup
- **Favorite System**: Mark frequently used passwords
- **Import/Export**: Secure backup and restore functionality
- **One-Click Copy**: Copy passwords to clipboard
- **Password Generator**: Built-in secure password generation
- **Payment Cards**: Securely store credit/debit card details
  - Visual card display with gradient backgrounds
  - Card type color coding (Visa, Mastercard, Amex, Discover)
  - Magnetic strip visual
  - Show/hide card details with masking
  - View mode toggle (visual card view vs list view)
  - Default card selection

### File Manager
- **Complete File Management**: Upload, download, organize files with folder structure
- **Rich Document Editor**: TipTap WYSIWYG editor with active toolbar state (heading/font/size reflect current selection), blockquote, inline code, word count status bar, and working download dropdown
- **Document Viewer**: Built-in text and markdown file editor with live preview
- **Audio Player**: Native HTML5 audio player for audio files (MP3, WAV, OGG, etc.)
- **Responsive PDF Viewer**: PDF page width adapts to container via ResizeObserver
- **File Organization**: Create folders, move files, favorite files
- **File Types Supported**: Images, documents (PDF, Word, Excel, PowerPoint), spreadsheets, code files, archives, audio, video
- **Trash System**: Soft delete with restore functionality
- **File Sharing**: Generate shareable links for files
- **Storage Stats**: Track storage usage with 10GB default limit
- **Search & Filter**: Find files by name, type, or tags
- **Large File Support**: Up to 500MB per file
- **Secure Storage**: Files stored with unique hashed filenames

### Graphing Calculator
- **Interactive Graphing**: Plot functions, equations, and inequalities
- **Multiple Object Types**: Functions, parametric curves, points, circles, polygons, implicit equations
- **Advanced Mathematics**: Support for inequalities, conic sections, geometric shapes
- **Interactive Controls**: Pan, zoom, and navigate the coordinate system
- **Visual Customization**: Light/dark themes, grid toggle, axis controls
- **State Management**: Save and restore calculator states
- **Object Management**: Add, edit, delete, and label mathematical objects
- **Command Interface**: Text-based input for rapid object creation

### Music System
- **Audio Upload**: Upload and stream audio files with HTTP range request support
- **Playlist Management**: Create and manage playlists, add/remove tracks, reorder
- **Shuffle & Loop**: Shuffle mode for randomised playback, single-track loop mode
- **Auto-Advance**: Playlist auto-advances to the next track; loops back at the end
- **Floating Player**: Spotify-style persistent floating player (bottom-right) visible on all pages
- **Public/Private Tracks**: Control visibility of individual songs
- **Metadata**: Store title, artist, album, cover URL, duration per track
- **Volume Control**: Adjustable playback volume (0–100%) via slider; persisted across navigations in a cookie
- **Visual Indicators**: Currently-playing track highlighted; active playlist shown with green border and ▶ icon

### Daily Tracker System
- **Recurring Tasks**: Daily, weekly, monthly, custom recurrence with day selection
- **Custom Daily Questions**: Yes/No, scale (1-5), text, and number response types
- **Daily Check-in**: Progress bar, mood tracker, task checklist, question answers, daily notes
- **Streak Tracking**: Current and longest activity streak calculations
- **Completion Analytics**: 30-day completion rate, priority/category breakdowns
- **Activity Heatmap**: GitHub-style yearly activity visualization
- **Mood Trends**: Color-coded mood visualization over time
- **Data Export/Import**: Full JSON export and import of tracker data

### Radiation Monitor
- **Measurement Logging**: Log radiation readings with date, time window, location, average/peak levels
- **Location Management**: Named measurement locations with optional GPS coordinates
- **Unit Conversion**: Display in µSv/h, mSv/h, nSv/h, µGy/h, mGy/h, mR/h, or CPM
- **CPM Support**: User-configurable conversion factor (default 151 CPM/µSv/h for SBM-20)
- **Status Workflow**: Draft → Verified / Flagged / Archived
- **Public Sharing**: Make measurements public for community sharing
- **Soft Delete**: Audit trail with deletion reason and state snapshot
- **Analytics**: Time-series charts, per-location averages, GitHub-style heatmap calendar

### Wiki System
- **Wiki Spaces**: Create multiple wiki workspaces for different projects
- **Hierarchical Pages**: Parent-child page relationships for organized structure
- **Version Control**: Full page history with diff viewing and restore capability
- **Access Control**: Owner, Admin, Editor, Viewer role-based permissions
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
- Docker & Docker Compose (for MongoDB container)
- npm or yarn

**Note:** MongoDB runs in a Docker container when using `npm run dev:all`. No local MongoDB installation required.

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

3. **Quick Setup (Recommended):**
```bash
# Run the automated setup script
bash setup.sh
```

Or manually configure:
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

**Option A: Quick Start with Docker (Recommended)**
```bash
# Starts MongoDB container, then frontend + backend
npm run dev:all
```

**Option B: Manual Start**
```bash
# Start MongoDB container first
npm run dev:services

# Then in another terminal, start both servers
npm run dev
```

**Option C: Start Individually**
```bash
# Terminal 1 - MongoDB (if not using docker-compose)
docker-compose up -d mongodb

# Terminal 2 - Backend
cd backend && npm run dev    # Backend on http://localhost:3001

# Terminal 3 - Frontend
cd frontend && npm start     # Frontend on http://localhost:3000
```

## API Endpoints

For detailed API documentation including request/response examples, see [doc/architecture/api-overview.md](doc/architecture/api-overview.md).

**Quick API Reference:**
- Authentication: `/api/auth/*` - Register, login, logout, password reset
- Calendar: `/api/calendar/*` - Event management, categories
- Passwords: `/api/passwords/*` - Secure password storage
- Wishlist: `/api/wishlist/*` - Gift registry with sharing
- Files: `/api/files/*` - File management and storage
- Folders: `/api/file-folders/*` - Folder organization
- Wiki: `/api/wikis/*` - Knowledge base system
- Tracker: `/api/tracker/*` - Daily habit & task tracker
- Music: `/api/music/*` - Music library and playlist streaming
- Radiation: `/api/radiation/*` - Radiation measurements and analytics
- Finance: `/api/finance/*` - Accounts, rules, transactions, and analytics
- Settings: `/api/settings/*` - User preferences
- Follow: `/api/follow/*` - Social features

## Application Flow

For detailed application flow and usage instructions, see [doc/README.md](doc/README.md).

**Quick Navigation:**

*Primary Modules:*
- **Home**: `/home` personal dashboard
- **Home Layout Editor**: `/home/edit` toggle homepage widgets (Daily Tracker, Today\'s Events)
- **Calendar**: `/calendar/month` with multiple views
- **Passwords**: `/passwords` for secure password management
- **Files**: `/files` or `/drive` for file management
- **Finance**: `/finance` for money flow visualisation, rules, transactions, and analytics

*Secondary Modules:*
- **Wishlist**: `/wishlist` for gift registry
- **Music**: `/music` for music library and playlist management
- **Calculator**: `/calculator` for interactive function graphing
- **Tracker**: `/tracker` for daily habit & task tracking
- **Wiki**: `/wikis` for knowledge base system
- **Radiation**: `/radiation` for radiation monitoring and analytics

*Account:*
- **Authentication**: `/login` and `/register` pages
- **Settings**: `/settings` for user preferences

## Security

For detailed security implementation, see [SECURITY.md](SECURITY.md) and [doc/ops/security.md](doc/ops/security.md).

**Key Security Features:**
- JWT-based authentication with HttpOnly cookies
- Rate limiting and account lockout protection
- AES-256-GCM encryption for passwords
- bcrypt password hashing with 12 salt rounds
- Comprehensive input validation

## Project Structure

For detailed project structure and architecture documentation, see [doc/architecture/backend.md](doc/architecture/backend.md) and [doc/architecture/frontend.md](doc/architecture/frontend.md).

**High-Level Structure:**
```
ComprehensiveLocalEcosystem/
├── backend/          # Node.js/Express API server
│   ├── config/       # Database, logging, rate limiting
│   ├── controllers/  # Business logic handlers
│   ├── middleware/   # Authentication & validation
│   ├── models/       # MongoDB/Mongoose schemas
│   ├── routes/       # API route definitions
│   ├── services/     # Business logic services
│   └── server.js     # Express app entry point
├── frontend/         # React client application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/     # React Context providers
│   │   ├── services/     # API client services
│   │   ├── utils/        # Utility functions
│   │   └── config/       # Configuration files
│   └── public/          # Static assets
├── doc/               # Detailed documentation
└── *.md              # Root documentation files
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
- File Manager with folder organization
- Document Viewer with markdown support
- File upload/download/streaming (up to 500MB)
- File trash and restore functionality
- File sharing with public tokens
- Graphing Calculator with interactive graphing
- GraphingEngine with multiple object types support
- MathParser for expression evaluation
- Wiki System with hierarchical pages and version control
- Wiki access control with role-based permissions
- Wiki full-text search and watchlist features
- Daily Tracker with recurring tasks and custom check-in questions
- Activity heatmap, streak tracking, and mood trends
- Task completion analytics and question statistics
- Music System with audio upload, streaming, and playlist management
- Floating music player persisting across all pages
- Shuffle, loop, auto-advance playlist playback, and volume control
- Radiation Monitor with measurements, locations, analytics, and public sharing
- Finance module with draggable SVG flowchart, rule engine (percentage/fixed/threshold/recurring), transaction log, and analytics

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
- When using `npm run dev:all`, MongoDB runs automatically in Docker
- For manual setup, ensure MongoDB container is running: `docker-compose ps`
- Check connection string in `.env` file (default: `mongodb://localhost:27017/full-system-architecture`)
- Verify database user permissions

**Authentication Issues:**
- Verify JWT secrets are set correctly
- Check cookie settings in browser
- Ensure CORS configuration matches frontend URL

**Accessing from a Phone / Device on the Local Network:**
- The frontend automatically derives the API URL from `window.location.hostname`, so accessing `https://192.168.1.128:3000` will call `https://192.168.1.128:3443` — no extra config needed.
- CORS allows any RFC 1918 private-network origin in `development` mode.
- The SSL cert (`backend/certs/server.crt`) must include the machine's LAN IP as a Subject Alternative Name (SAN). Regenerate if your LAN IP changes:
  ```bash
  openssl req -x509 -newkey rsa:2048 \
    -keyout backend/certs/server.key -out backend/certs/server.crt \
    -days 365 -nodes \
    -subj "/C=US/ST=State/L=City/O=Development/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:<YOUR_LAN_IP>"
  ```
- On the phone, navigate to `https://<machine-ip>:3443` once and accept the self-signed certificate warning. The browser will then trust it for API calls.

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

### Technical & Development
- **Documentation Index:** [doc/README.md](./doc/README.md)
- **Backend Architecture:** [doc/architecture/backend.md](./doc/architecture/backend.md)
- **Frontend Architecture:** [doc/architecture/frontend.md](./doc/architecture/frontend.md)
- **Database Models:** [doc/architecture/database.md](./doc/architecture/database.md)
- **API Overview:** [doc/architecture/api-overview.md](./doc/architecture/api-overview.md)

### MIL-STD-498 Documentation
- **MIL-STD-498 Overview:** [doc/MIL-STD-498/MIL-STD-498.md](./doc/MIL-STD-498/MIL-STD-498.md)
- **Software Requirements:** [doc/MIL-STD-498/SRS.md](./doc/MIL-STD-498/SRS.md)
- **Operational Concept:** [doc/MIL-STD-498/OCD.md](./doc/MIL-STD-498/OCD.md)
- **Development Plan:** [doc/MIL-STD-498/SDP.md](./doc/MIL-STD-498/SDP.md)
- **User Manual:** [doc/MIL-STD-498/SUM.md](./doc/MIL-STD-498/SUM.md)

### Security & Legal
- **Security Policy:** [SECURITY.md](./SECURITY.md)
- **Security Implementation:** [doc/ops/security.md](./doc/ops/security.md)
- **Privacy Policy:** [PRIVACY.md](./PRIVACY.md)
- **Terms of Service:** [TERMS.md](./TERMS.md)
- **Cookie Policy:** [COOKIE_POLICY.md](./COOKIE_POLICY.md)
- **GitHub Workflow:** [GITHUB_WORKFLOW.md](./GITHUB_WORKFLOW.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Version**: 2.9.0
**Last Updated**: 2026-06-09
**Status**: Production Ready
**Repository**: https://github.com/theolidec/ComprehensiveLocalEcosystem
