# Frontend Documentation

A React-based frontend application for the Comprehensive Local Ecosystem, featuring authentication, calendar management, and user settings.

## 🚀 Features

- **Authentication**: Login/Register with JWT-based authentication
- **Calendar System**: Full-featured calendar with event management
- **Category Manager**: Custom event category creation and management
- **Settings**: User preferences and account management
- **Responsive Design**: Mobile-first UI built with Tailwind CSS

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running on http://localhost:3001

## 🛠️ Installation

```bash
cd frontend
npm install
```

## ⚙️ Configuration

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:3001
```

## 🏃‍♂️ Running the Application

```bash
# Development mode
npm start

# Production build
npm run build
```

The application runs on http://localhost:3000

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── AuthPage.js      # Login/Register container
│   │   ├── Login.js         # Login form
│   │   ├── Register.js      # Registration form
│   │   └── ProtectedRoute.js # Route protection
│   ├── Layout/
│   │   ├── Header.js        # Navigation header
│   │   └── Footer.js        # Page footer
│   └── Pages/
│       ├── Calendar.js      # Calendar system
│       ├── CategoryManager.js # Category management
│       ├── Features.js      # Landing page features
│       ├── Hero.js          # Landing page hero
│       ├── ProductGrid.js   # Product showcase
│       └── Settings.js      # User settings
├── contexts/
│   └── AuthContext.js       # Authentication state
├── services/
│   ├── calendarAPI.js       # Calendar API client
│   ├── categoryAPI.js       # Category API client
│   └── settingsAPI.js       # Settings API client
├── config/
│   └── api.js               # API configuration
├── types/
│   └── auth.ts              # TypeScript types
├── App.js                   # Main app component
└── index.js                 # Entry point
```

## 🔌 API Integration

The frontend communicates with the backend API at `REACT_APP_API_URL`:

- **Authentication**: `/api/auth/*`
- **Calendar**: `/api/calendar/*`
- **Categories**: `/api/categories/*`
- **Settings**: `/api/settings/*`

## 🧪 Testing

```bash
npm test
```

## 📦 Dependencies

- React 19.2.4
- Tailwind CSS
- Lucide React (icons)
- React Router DOM

---

**Version**: 1.0.0
**Last Updated**: 2026-04-23
