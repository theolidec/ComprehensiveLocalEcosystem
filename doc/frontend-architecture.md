# Frontend Architecture

## Overview

The frontend is built with **React 19.2.4** using modern hooks and functional components. It uses **Tailwind CSS** for styling, **Lucide React** for icons, and **Axios** for API communication.

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 19.2.4 |
| Build Tool | Create React App | 5.x |
| Styling | Tailwind CSS | 3.x |
| Icons | Lucide React | 0.x |
| HTTP Client | Axios | 1.x |
| Routing | React Router DOM | 6.x |
| State | Context API + useReducer | Built-in |

## Project Structure

```
frontend/
├── public/
│   ├── index.html           # Main HTML template
│   ├── favicon.ico          # Site icon
│   ├── manifest.json        # PWA manifest
│   └── *.png                # App icons
├── src/
│   ├── components/          # React components
│   │   ├── Auth/            # Authentication components
│   │   ├── Layout/          # Layout components
│   │   ├── Pages/           # Page-level components
│   │   ├── Wiki/            # Wiki components
│   │   ├── Wishlist/        # Wishlist components
│   │   ├── Math/            # Calculator components
│   │   └── *.js             # Shared components
│   ├── contexts/            # React Context providers
│   ├── services/            # API service functions
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration files
│   ├── types/               # TypeScript definitions
│   ├── App.js               # Main application component
│   ├── App.css              # Global styles
│   ├── index.js             # Application entry
│   └── index.css            # Base styles
├── .env.example             # Environment template
├── package.json             # Dependencies
└── tailwind.config.js       # Tailwind configuration
```

## Component Architecture

### Component Organization

Components are organized by feature/domain:

```
components/
├── Auth/                    # Authentication
│   ├── AuthPage.js          # Login/register container
│   ├── Login.js             # Login form
│   ├── Register.js          # Registration form
│   └── ProtectedRoute.js    # Auth guard
├── Layout/                  # Layout components
│   ├── Header.js            # Navigation header
│   ├── Footer.js            # Page footer
│   ├── Sidebar.js           # Navigation sidebar
│   ├── Row.js               # Flexbox layout helper
│   └── Toast.js             # Notification toast
├── Pages/                   # Main pages
│   ├── Home.js              # Dashboard
│   ├── Calendar.js          # Full calendar (~1700 lines)
│   ├── Settings.js          # User settings
│   ├── PasswordManager.js   # Password vault
│   ├── FileManager.js       # File explorer
│   ├── DocumentViewer.js    # File preview
│   ├── DocumentEditor.js    # Text editor
│   ├── UserFollowing.js     # Social/follow page
│   ├── LandingPage.js       # Marketing page container
│   ├── Hero.js              # Landing page hero section
│   ├── ProductGrid.js       # Product showcase grid
│   ├── Features.js          # Features display section
│   ├── Privacy.js           # Privacy policy
│   ├── Terms.js             # Terms of service
│   ├── Cookies.js           # Cookie policy
│   ├── CookiePopup.js       # Cookie consent
│   ├── LinkNotFound.js      # 404 page
│   ├── CalendarHeader.js    # Calendar navigation
│   ├── CalendarSidebar.js   # Calendar filters
│   ├── EventForm.js         # Event editor
│   ├── EventDetails.js      # Event display
│   └── CategoryManager.js   # Event category management
├── Wiki/                    # Wiki system
│   ├── WikiList.js          # Wiki directory
│   ├── WikiView.js          # Wiki home
│   ├── WikiPageView.js      # Page viewer
│   ├── WikiPageEditor.js    # Page editor
│   ├── WikiPageHistory.js   # Version history
│   ├── WikiSettings.js      # Wiki config
│   └── WikiRecentChanges.js # Activity feed
├── Wishlist/                # Wishlist system
│   ├── Wishlist.js          # Main wishlist
│   ├── WishlistItemModal.js # Item editor
│   ├── ReservationModal.js  # Reservation UI
│   ├── WishlistShareModal.js # Sharing dialog
│   └── PublicWishlistItem.js # Public view
└── Math/                    # Calculator
    ├── GeoGebraCalculator.js # Main calculator
    └── GeoGebraCalculator.css # Styles
├── Tracker/                  # Daily Tracker
    └── DailyTracker.js       # Habit & task tracker with 4 tabs (Today, Tasks, Questions, Statistics)
```

### Component Patterns

#### Functional Component with Hooks

```javascript
import React, { useState, useEffect } from 'react';

const MyComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.getData();
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{data}</div>;
};

export default MyComponent;
```

#### Component with Context

```javascript
import { useAuth } from '../contexts/AuthContext';

const ProtectedComponent = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginRedirect />;

  return <div>Welcome, {user.name}</div>;
};
```

## Context API Architecture

### AuthContext

**File**: `src/contexts/AuthContext.js`

Manages authentication state and provides auth methods.

```javascript
// State
{
  user: null | User,
  isAuthenticated: boolean,
  loading: boolean,
  error: string | null
}

// Methods
login(email, password)      // Authenticate
register(email, password, name) // Create account
logout()                    // Clear session
logoutAll()                 // Revoke all sessions
refreshToken()              // Renew tokens
verifyAuth()                // Check existing session
clearError()                // Reset error state
```

**Usage**:
```javascript
const { user, login, logout } = useAuth();
```

### SettingsContext

**File**: `src/contexts/SettingsContext.js`

Manages user preferences and settings.

```javascript
// State
{
  settings: Settings | null,
  loading: boolean,
  error: string | null
}

// Methods
loadSettings()              // Fetch settings
updateSettings(data)        // Update all settings
updateProfile(profile)      // Update profile only
updateCalendarSettings(data)
updateNotificationSettings(data)
updateDisplaySettings(data)
updatePrivacySettings(data)
resetSettings()             // Restore defaults
uploadAvatar(file)          // Upload profile picture
removeAvatar()              // Delete avatar
getActiveSessions()         // List sessions
revokeSession(sessionId)    // Logout session
```

### NotificationContext

**File**: `src/contexts/NotificationContext.js`

Manages toast notifications.

```javascript
// Methods
showToast(message, type = 'info', duration = 3000)
success(message)            // Green toast
error(message)              // Red toast
warning(message)            // Yellow toast
info(message)               // Blue toast
```

### CalendarActionsContext

**File**: `src/contexts/CalendarActionsContext.js`

Provides calendar action handlers to child components.

```javascript
// Methods
onEventCreate(event)
onEventUpdate(event)
onEventDelete(eventId)
onDateSelect(date)
```

### PageActionsContext

**File**: `src/contexts/PageActionsContext.js`

Similar pattern for page-level actions.

### WikiContext

**File**: `src/contexts/WikiContext.js`

Manages wiki state with comprehensive wiki operations.

```javascript
// State
{
  wikis: Wiki[],
  currentWiki: Wiki | null,
  currentPage: Page | null,
  pages: Page[],
  recentChanges: Change[],
  loading: boolean,
  error: string | null,
  permissions: {
    canView: boolean,
    canEdit: boolean,
    role: string,
    isOwner: boolean
  } | null
}

// Methods (partial list)
fetchWikis()
fetchPublicWikis()
getWiki(slug)              // Also populates permissions
createWiki(data)
updateWiki(slug, data)
deleteWiki(slug)
fetchPages(slug)
getPage(wikiSlug, pageSlug)
createPage(wikiSlug, data)
updatePage(wikiSlug, pageSlug, data)
deletePage(wikiSlug, pageSlug)
getPageHistory(wikiSlug, pageSlug)
restoreVersion(wikiSlug, pageSlug, versionId)
searchWiki(wikiSlug, query)
getBacklinks(wikiSlug, pageSlug)
getCategories(wikiSlug)
movePage(wikiSlug, pageSlug, newTitle)
addToWatchlist(wikiSlug, pageSlug)
removeFromWatchlist(wikiSlug, pageSlug)
```

**Note**: The `permissions` object is populated by `getWiki()` and controls UI elements like the "New Page" button visibility based on `permissions.canEdit`.

## Services Layer

API service functions wrap Axios calls.

### Pattern

```javascript
import axios from 'axios';
import { API_URLS } from '../config/api';

// Axios defaults
axios.defaults.withCredentials = true;

export const fetchData = async () => {
  const response = await axios.get(API_URLS.ENDPOINT);
  return response.data;
};

export const createData = async (data) => {
  const response = await axios.post(API_URLS.ENDPOINT, data);
  return response.data;
};
```

### Service Files

| Service | File | Purpose |
|---------|------|---------|
| calendarAPI.js | Calendar operations | Events, recurring events |
| categoryAPI.js | Category CRUD | Event categories |
| fileService.js | File operations | Upload, download, folders |
| passwordAPI.js | Password manager | Passwords, categories |
| settingsAPI.js | User settings | Profile, preferences |
| wishlistAPI.js | Wishlist | Items, reservations |
| wishlistCategoryAPI.js | Categories | Wishlist categories |

## Routing

**File**: `src/App.js`

React Router DOM v6 configuration:

```javascript
<Routes>
  {/* Public routes */}
  <Route path="/" element={<RootRoute />} />
  <Route path="/login" element={<AuthPage />} />
  <Route path="/privacy" element={<Privacy />} />
  
  {/* Protected routes */}
  <Route path="/home" element={
    <ProtectedRoute>
      <Layout><Home /></Layout>
    </ProtectedRoute>
  } />
  <Route path="/calendar/:view" element={
    <ProtectedRoute>
      <Layout><CalendarApp /></Layout>
    </ProtectedRoute>
  } />
  
  {/* Wiki routes - order matters! */}
  <Route path="/wiki/:slug" element={<ProtectedRoute><WikiView /></ProtectedRoute>} />
  <Route path="/wiki/:slug/new" element={<ProtectedRoute><WikiPageEditor /></ProtectedRoute>} />
  <Route path="/wiki/:slug/:pageSlug" element={<ProtectedRoute><WikiPageView /></ProtectedRoute>} />
  <Route path="/wiki/:slug/edit/:pageSlug" element={<ProtectedRoute><WikiPageEditor /></ProtectedRoute>} />
  
  {/* Redirects */}
  <Route path="/pass" element={<Navigate to="/passwords" />} />
</Routes>
```

### Route Order Importance

**Wiki Routes**: The `/wiki/:slug/new` route must be declared **before** `/wiki/:slug/:pageSlug`. React Router matches routes in order, and `:pageSlug` would otherwise match "new" as a page slug instead of the new page creation route.

**Important**: The `/wiki/:slug/new` route does not define a `:pageSlug` param, so `useParams()` returns only `{ slug }` with no `pageSlug`. `WikiPageEditor` uses `useLocation().pathname.endsWith('/new')` to detect new-page mode instead of relying on `pageSlug === 'new'` from route params. When on the new-page route, `pageSlug` is set to `'new'` locally so all downstream logic (save, back navigation, etc.) works correctly.

### ProtectedRoute Component

```javascript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
```

## Styling

### Tailwind CSS

**Config**: `tailwind.config.js`

```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Manual dark mode
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        // Custom colors
      }
    }
  },
  plugins: [],
}
```

### Usage Pattern

```javascript
// Component styling with Tailwind
<div className="
  flex flex-col items-center justify-center
  min-h-screen bg-gray-100 dark:bg-gray-900
  p-4 rounded-lg shadow-md
">
  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
    Title
  </h1>
</div>
```

### Dark Mode Support

```javascript
// Get theme from settings
const { settings } = useSettings();
const theme = settings?.display?.theme || 'system';

// Apply class to root
document.documentElement.classList.toggle('dark', theme === 'dark');
```

#### Checkbox Dark Mode Styling

All checkboxes throughout the application support dark mode through custom CSS styling. The implementation uses CSS custom properties (variables) for consistent theming:

**Global Styles** (`src/index.css`):
- All `input[type="checkbox"]` elements receive dark mode styling via `[data-theme="dark"]` selector
- Checkboxes use `appearance: none` for custom styling with CSS variables
- Background, border, and checked states adapt to dark theme colors

**Component-Specific Styles**:
- **Settings** (`src/components/Pages/Settings.css`): Custom checkbox styling for settings forms with `.form-group.checkbox-group` class
- **Wishlist** (`src/components/Wishlist/Wishlist.css`): Custom styled checkboxes for batch selection, table view, and card checkboxes
- **Password Manager** (`src/App.css`): Generator options checkboxes with purple accent color theming

**CSS Variable Usage**:
```css
[data-theme="dark"] input[type="checkbox"] {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

[data-theme="dark"] input[type="checkbox"]:hover {
  background: var(--bg-tertiary);
}
```

## State Management Flow

```
User Action
    │
    ▼
Component Event Handler
    │
    ▼
Context Method
    │
    ├─► Update Local State (optimistic)
    │
    ▼
Service API Call
    │
    ▼
Backend Response
    │
    ▼
Context Reducer
    │
    ▼
State Update
    │
    ▼
Component Re-render
```

## Form Handling

### Pattern with Validation

```javascript
const [formData, setFormData] = useState({
  email: '',
  password: ''
});
const [errors, setErrors] = useState({});

const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
  // Clear field error on change
  if (errors[e.target.name]) {
    setErrors({ ...errors, [e.target.name]: null });
  }
};

const validate = () => {
  const newErrors = {};
  if (!formData.email.includes('@')) {
    newErrors.email = 'Valid email required';
  }
  if (formData.password.length < 6) {
    newErrors.password = 'Minimum 6 characters';
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;
  
  try {
    await submitForm(formData);
  } catch (error) {
    setErrors({ form: error.message });
  }
};
```

## File Upload Pattern

```javascript
const [uploading, setUploading] = useState(false);
const [progress, setProgress] = useState(0);

const handleUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folderId', currentFolder);

  try {
    setUploading(true);
    const response = await axios.post(
      API_URLS.FILES_UPLOAD,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        }
      }
    );
    return response.data;
  } finally {
    setUploading(false);
    setProgress(0);
  }
};
```

## Error Handling

### Global Error Pattern

```javascript
// Service layer
export const apiCall = async () => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    // Transform error for UI
    throw new Error(
      error.response?.data?.error || 
      'An error occurred'
    );
  }
};

// Component layer
const loadData = async () => {
  try {
    setLoading(true);
    const data = await apiCall();
    setData(data);
  } catch (error) {
    setError(error.message);
    showToast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

## Environment Variables

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api

# Build
REACT_APP_VERSION=$npm_package_version
GENERATE_SOURCEMAP=false
```

## Build Configuration

### Development

```bash
npm start          # Start dev server (port 3000)
```

### Production

```bash
npm run build      # Create optimized build
# Output: build/
```

## Performance Optimizations

1. **Code Splitting**: Routes loaded on demand
2. **Memoization**: `useMemo`, `useCallback` for expensive operations
3. **Lazy Loading**: Images and non-critical components
4. **Debouncing**: Search inputs (300ms delay)
5. **Pagination**: Large lists (20 items per page)

## Testing

```bash
# Unit tests
npm test

# Coverage
npm test -- --coverage
```

Test pattern:
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders and handles click', () => {
  render(<MyComponent />);
  const button = screen.getByText('Click me');
  fireEvent.click(button);
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```
