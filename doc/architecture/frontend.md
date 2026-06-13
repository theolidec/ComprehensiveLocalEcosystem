# Frontend Architecture

## Music Module
- Routes:
  - `/music` → redirects to `/music/library`
  - `/music/library` → My Library tab
  - `/music/artists` → Artists tab
  - `/music/discover` → Discover tab (public music)
  - `/music/upload` → Upload tab
- `MusicPage` component: main UI for music
- `FloatingMusicPlayer`: floating player, globally visible on all pages
- `components/music/MusicUpload.js`: Upload form (audio validation)
- `components/music/MusicPlayer.js`: Main player UI (play/pause, progress, metadata)
- `components/music/Playlist.js`: Playlist management (create, add/remove, public/private)
- `components/FloatingMusicPlayer.js`: Floating player visible across site (bottom right)
- Integrates with backend `/api/music` endpoints
- Maintains current theme and style


## Mobile Compliance

All pages use a responsive layout system implemented across the following files:

### Responsive Layout (`Row.js` + `index.css`)

`Row` renders a `div.layout-row`. The `.layout-row` class is defined in `src/index.css`:

```css
.layout-row {
  display: flex;
  flex-direction: row; /* side-by-side on desktop */
  width: 100%;
}

@media (max-width: 768px) {
  .layout-row {
    flex-direction: column; /* stacked on mobile */
  }
}
```

This means on mobile (≤768px) the sidebar and main content stack vertically. `overflow-x: hidden` is also applied globally on `html, body` to prevent horizontal scroll from any content that overflows.

### Inline Sidebar on Mobile (`Sidebar.css`)

`.sidebar-inline` is hidden on mobile (≤768px). Its CSS `display: none` media query is placed **after** the base `display: flex` rule to ensure correct cascade override.

### Mobile Header Menu (`Header.js`)

The hamburger menu (`md:hidden`) exposes all navigation on small screens:
- **Calendar actions** section (Import, Export, Add Event, Create/Remove Test Events) — shown only on `/calendar` routes.
- **Actions** section — the current page's sidebar items from `PageActionsContext` (e.g. "New File", "Add Password").
- **Apps** section — app navigation links split into two groups:
  - **Primary**: Home, Calendar, Password Manager, Files, Finance
  - **Secondary**: Wishlist, Music, Calculator, Following, Daily Tracker, Wiki, Radiation Monitor
- **Account** section — avatar, Settings link, Logout.

The home-page welcome greeting (`Welcome, {name}!`) is hidden on mobile (`hidden sm:block`) to prevent header overflow.

### Floating Music Player (`FloatingMusicPlayer.js`)

Responsive positioning and sizing:
- Desktop: `bottom-6 right-6`, `w-80` (320px), `p-4`
- Mobile: `bottom-4 right-2`, `w-72` (288px), `p-3`, capped at `max-w-[calc(100vw-1rem)]`

---

## Overview

The frontend is built with **React 19.2.4** using modern hooks and functional components. It uses **Tailwind CSS** for styling, **Lucide React** for icons, and a custom `fetchClient` (native `fetch` wrapper) for API communication.

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 19.2.x |
| Build Tool | Create React App (`react-scripts`) | 5.0.x |
| Styling | Tailwind CSS | 3.4.x |
| Tailwind Plugins | `@tailwindcss/typography` | 0.5.x |
| Icons | Lucide React | 0.577.x |
| HTTP Client | Custom `fetchClient` (native `fetch`) | `src/utils/fetchClient.js` |
| Routing | React Router DOM | 7.13.x |
| State | Context API + useReducer | Built-in |
| Rich Text Editor | TipTap (`@tiptap/react`, `@tiptap/starter-kit` + extensions: color, font-family, highlight, image, link, placeholder, table, table-cell, table-header, table-row, text-align, text-style, underline, `@tiptap/pm`) | 3.23.x |
| HTML Sanitization | DOMPurify | 3.4.x |
| Markdown | `react-markdown` + `remark-gfm` | 10.1.x / 4.0.x |
| PDF Viewer | `pdfjs-dist`, `react-pdf` | 5.7.x / 10.4.x |
| TypeScript | typescript | 5.3.x |

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
├── Auth/                       # Authentication
│   ├── AuthPage.js              # Login/register container
│   ├── Login.js                 # Login form
│   ├── Register.js              # Registration form
│   └── ProtectedRoute.js        # Auth guard
├── Layout/                     # Layout components
│   ├── Header.js                # Navigation header
│   ├── Footer.js                # Page footer
│   ├── Sidebar.js + Sidebar.css # Navigation sidebar
│   ├── Row.js                   # Flexbox layout helper
│   └── Toast.js                 # Notification toast
├── Pages/                      # Main pages
│   ├── Home.js                  # Dashboard (~46KB)
│   ├── HomeLayoutEditor.js      # Home layout editor (/home/edit) for toggling/reordering homepage widgets and Quick Access shortcuts
│   ├── Settings.js + Settings.css   # User settings (~36KB)
│   ├── PasswordManager.js       # Password + payment cards vault (~58KB)
│   ├── FileManager.js           # File explorer (~41KB)
│   ├── DocumentViewer.js        # File preview / lightweight editor (~21KB)
│   ├── DocumentEditor.js        # TipTap rich-text editor (~43KB)
│   ├── DocumentEditor_old.js    # Pre-TipTap legacy editor (kept for reference; not routed)
│   ├── UserFollowing.js + .css  # Social/follow page
│   ├── LandingPage.js           # Marketing page container
│   ├── Hero.js                  # Landing page hero section
│   ├── ProductGrid.js           # Product showcase grid
│   ├── Features.js              # Features display section
│   ├── Privacy.js               # Privacy policy
│   ├── Terms.js                 # Terms of service
│   ├── Cookies.js               # Cookie policy
│   ├── CookiePopup.js + .css    # Cookie consent
│   ├── LinkNotFound.js + .css   # 404 page
│   ├── Music.js                 # Music page shell (/music/*) — renders MusicPage with MusicProvider layout
│   ├── Radiation.js             # Radiation monitor with measurements, analytics, locations
│   ├── Finance.js               # Finance module — 4 tabs: Flow Map, Rules, Transactions, Analytics (~115KB)
│   └── CategoryManager.js       # Event category management
├── (root)                      # Shared/loose components
│   ├── FloatingMusicPlayer.js   # Persistent floating music player (bottom-right, all pages)
│   ├── CalendarHeader.js        # Calendar navigation
│   ├── CalendarSidebar.js       # Calendar filters
│   ├── EventForm.js             # Event editor
│   └── EventDetails.js          # Event display
├── Wiki/                       # Wiki system
│   ├── WikiList.js              # Wiki directory
│   ├── WikiView.js              # Wiki home
│   ├── WikiPageView.js          # Page viewer
│   ├── WikiPageEditor.js        # Page editor
│   ├── WikiPageHistory.js       # Version history
│   ├── WikiSettings.js          # Wiki config
│   └── WikiRecentChanges.js     # Activity feed
├── Wishlist/                   # Wishlist system
│   ├── Wishlist.js + Wishlist.css   # Main wishlist (~39KB JS / ~65KB CSS)
│   ├── WishlistItemModal.js     # Item editor
│   ├── ReservationModal.js      # Reservation UI
│   ├── WishlistShareModal.js    # Sharing dialog
│   └── PublicWishlistItem.js    # Public view
├── Math/                       # Calculator
│   ├── GeoGebraCalculator.js    # Main calculator (custom implementation; file name historical — no GeoGebra code or assets are used)
│   └── GeoGebraCalculator.css   # Styles (custom; file name historical)
├── Tracker/                    # Daily Tracker
│   └── DailyTracker.js          # Habit & task tracker (~66KB) with 4 tabs (Today, Tasks, Questions, Statistics)
├── Editor/                     # Custom TipTap extensions
│   └── FontSize.js              # Font-size mark for DocumentEditor
├── FileManager/                # File-manager sub-widgets
│   ├── FileTree.js              # Folder tree sidebar
│   └── FileTree.css
└── music/                      # Music module sub-components
    ├── MusicUpload.js           # Audio file upload form (audio MIME validation)
    ├── MusicPlayer.js           # Per-track player UI (play/pause, progress, metadata)
    └── Playlist.js              # Playlist management (create, add/remove songs, public/private)
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
updateWishlistSettings(data)
updateRadiationSettings(data) // Radiation unit, CPM factor, default location
updateFinanceSettings(data) // Finance currency preference
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

### MusicContext

**File**: `src/context/MusicContext.js`

> **Note**: `MusicContext` lives in `src/context/` (singular), which is separate from the main `src/contexts/` folder. This is intentional — it was added with the Music module and co-located for clarity.

Manages music playback state, playlist queue, and shuffle mode globally so the floating player persists across all pages.

```javascript
// State
{
  currentTrack: Music | null,
  isPlaying: boolean,
  progress: number,           // Current playback position (seconds)
  duration: number,           // Track duration (seconds)
  playlistQueue: Music[],     // Active playlist track list
  currentIndex: number,
  shuffle: boolean,
  loop: boolean,
  volume: number,             // 0–1, persisted via cookie
  currentPlaylist: Playlist | null,
  userQueue: Music[]          // Manually queued tracks; drain before advancing context
}

// Key methods
playTrack(track, playlist?, queue?)
playPlaylist(playlist)        // Play all tracks in a playlist from the first
togglePlay()
playNext()
playPrevious()
toggleShuffle()
toggleLoop()
stop()
seek(time)                   // Seek to position in seconds
changeVolume(val)             // Set volume 0–1
dismissPlayer()              // Stop audio, clear track/playlist/queue state, persist volume to cookie
refreshPlaylists()            // Trigger playlist component refresh
addToQueue(track)            // Append a track to the user queue
removeFromQueue(index)       // Remove a track from the user queue by index
clearQueue()                 // Empty the entire user queue
```

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

API service functions wrap the custom `fetchClient` (`src/utils/fetchClient.js`), which uses the native `fetch` API with `credentials: 'include'` and a built-in token-refresh interceptor.

### Pattern

```javascript
import api from '../utils/fetchClient';
import { API_URLS } from '../config/api';

export const fetchData = async () => {
  const response = await api.get(API_URLS.ENDPOINT);
  return response.data;
};

export const createData = async (data) => {
  const response = await api.post(API_URLS.ENDPOINT, data);
  return response.data;
};
```

### Service Files (`frontend/src/services/`)

| File | Purpose |
|------|---------|
| `calendarAPI.js` | Calendar event CRUD, upcoming, stats, import/export |
| `categoryAPI.js` | Calendar event category CRUD |
| `fileService.js` | File upload/download, folders, sharing, document content |
| `passwordAPI.js` | Password vault (passwords + categories), CSV/JSON import/export |
| `paymentCardAPI.js` | Payment card CRUD + decrypt + favorite/default |
| `radiationAPI.js` | Radiation measurements, locations, analytics, settings |
| `settingsAPI.js` | User settings, sessions, avatar |
| `userRightsAPI.js` | GDPR endpoints (`/api/user/*`): access, update, delete, export |
| `wishlistAPI.js` | Wishlists, items, reservations, public links |
| `wishlistCategoryAPI.js` | Wishlist category CRUD |
| `trackerAPI.js` | Daily tracker (tasks, questions, responses, stats, heatmap, export/import) |
| `financeAPI.js` | Finance accounts, groups, rules, transactions, budgets, analytics, settings |

> Wiki API calls are made directly from `WikiContext` rather than via a dedicated `wikiAPI.js` service.

## Routing

**File**: `src/App.js`

React Router DOM v7 configuration (using `BrowserRouter` + `Routes`). All routes are defined in `AppContent`. Protected routes render inside `<ProtectedRoute>` which redirects unauthenticated users to `/login`.

### Complete Route Reference

| Path | Component | Auth | Notes |
|------|-----------|------|-------|
| `/` | `RootRoute` | No | Redirects to `/home` if authenticated, else renders `LandingPage` |
| `/login` | `AuthPage` | No | Login / Register |
| `/privacy` | `Privacy` | No | Privacy Policy page |
| `/terms` | `Terms` | No | Terms of Service page |
| `/cookies` | `Cookies` | No | Cookie Policy page |
| `/pass` | — | No | Redirect → `/passwords` |
| `/drive` | — | No | Redirect → `/files` |
| `/home` | `Home` | Yes | Personal dashboard |
| `/home/edit` | `HomeLayoutEditor` | Yes | Toggle/reorder homepage widgets and Quick Access shortcuts |
| `/calendar` | — | Yes | Redirect → `/calendar/month` |
| `/calendar/:view` | `CalendarApp` | Yes | `view` = `month` / `week` / `day` |
| `/passwords` | `PasswordManager` | Yes | Password vault + payment cards |
| `/settings` | `Settings` | Yes | User preferences and account management |
| `/wishlist` | `Wishlist` | Yes | Wishlist management |
| `/wishlist/shared/:token` | `PublicWishlistItem` | No | Public item view for reservations |
| `/files` | `FileManager` | Yes | File explorer with folder tree |
| `/files/document/:fileId` | `DocumentViewer` | Yes | File preview / lightweight text+markdown editor |
| `/files/document/new` | `DocumentViewer` | Yes | Create new markdown/text file |
| `/files/document/edit/:fileId` | `DocumentEditor` | Yes | TipTap rich-text editor for existing file |
| `/files/document/edit/new` | `DocumentEditor` | Yes | New TipTap rich-text document |
| `/files/shared/:token` | `FileManager` | No | Shared file access via public token |
| `/calculator` | `GeoGebraCalculator` | Yes | Interactive graphing calculator |
| `/following` | `UserFollowing` | Yes | Social follow management |
| `/tracker` | `DailyTracker` | Yes | Habit & task tracker |
| `/finance` | — | Yes | Redirect → `/finance/flowmap` |
| `/finance/:tab` | `Finance` | Yes | `tab` = `flowmap` / `rules` / `transactions` / `analytics` |
| `/radiation` | `RadiationPage` | Yes | Radiation measurement logging and analytics |
| `/music` | — | Yes | Redirect → `/music/library` |
| `/music/library` | `MusicPage` | Yes | My music library (`tab="library"`) |
| `/music/artists` | `MusicPage` | Yes | Artists browse (`tab="artists"`) |
| `/music/artists/:artistName` | `MusicPage` | Yes | Artist detail view |
| `/music/discover` | `MusicPage` | Yes | Public music feed (`tab="discover"`) |
| `/music/upload` | `MusicPage` | Yes | Audio upload form (`tab="upload"`) |
| `/wikis` | `WikiList` | Yes | Wiki directory (all user wikis) |
| `/wiki/:slug` | `WikiView` | Yes | Wiki home page |
| `/wiki/:slug/new` | `WikiPageEditor` | Yes | New page creation |
| `/wiki/:slug/:pageSlug` | `WikiPageView` | Yes | Page view |
| `/wiki/:slug/edit/:pageSlug` | `WikiPageEditor` | Yes | Page editor |
| `/wiki/:slug/history/:pageSlug` | `WikiPageHistory` | Yes | Version history for a page |
| `/wiki/:slug/settings` | `WikiSettings` | Yes | Wiki configuration and member management |
| `/wiki/:slug/recent-changes` | `WikiRecentChanges` | Yes | Activity feed for the wiki |

### Route Order Importance

**Wiki Routes**: The `/wiki/:slug/new` route must be declared **before** `/wiki/:slug/:pageSlug`. React Router matches routes in order, and `:pageSlug` would otherwise match "new" as a page slug instead of the new page creation route.

**Important**: The `/wiki/:slug/new` route does not define a `:pageSlug` param, so `useParams()` returns only `{ slug }` with no `pageSlug`. `WikiPageEditor` uses `useLocation().pathname.endsWith('/new')` to detect new-page mode instead of relying on `pageSlug === 'new'` from route params. When on the new-page route, `pageSlug` is set to `'new'` locally so all downstream logic (save, back navigation, etc.) works correctly.

### Scroll to Top on Route Change

`AppContent` listens to `location.pathname` via `useLocation()` and calls `window.scrollTo(0, 0)` on every route change. This ensures users always land at the top of the page when navigating between modules, even if they were previously scrolled down on the homepage.

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
    const response = await api.post(API_URLS.FILES_UPLOAD, formData);
    return response.data;
  } finally {
    setUploading(false);
  }
};
```

## Error Handling

### Global Error Pattern

```javascript
// Service layer
export const apiCall = async () => {
  try {
    const response = await api.get(url);
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
