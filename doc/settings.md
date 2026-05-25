# Settings Module

## Overview
The Settings module provides comprehensive user preference management including profile settings, calendar preferences, notification settings, display options, privacy controls, and active session management.

## Features
- **Profile Management**: Name, bio, avatar
- **Calendar Settings**: Default view, timezone, working hours
- **Notifications**: Email reminders, event updates, digest
- **Display**: Theme, language, compact mode, **homepage layout** (per-user control of Home widgets)
- **Privacy**: Sharing controls, theme cookies (login page and Graphing Calculator)
- **Session Management**: View and revoke active sessions
- **Account & Data**: User rights (GDPR) - view, export, correct, delete data
- **Reset to Defaults**: One-click settings reset

## Data Model

### Settings Schema
```javascript
{
  userId: ObjectId (ref: 'User', required, unique),
  profile: {
    name: String,
    bio: String,
    avatar: String (URL)
  },
  calendar: {
    defaultView: String (enum: month/week/day/agenda),
    weekStartsOn: Number (0-6),
    timezone: String (default: 'UTC'),
    showWeekNumbers: Boolean,
    defaultEventDuration: Number (15-480 min),
    workingHours: {
      start: String (HH:MM, default: '09:00'),
      end: String (HH:MM, default: '17:00')
    }
  },
  notifications: {
    emailReminders: Boolean (default: true),
    reminderTime: Number (0-10080 min, default: 15),
    eventUpdates: Boolean (default: true),
    weeklyDigest: Boolean (default: false)
  },
  display: {
    theme: String (enum: light/dark/system, default: 'system'),
    language: String (default: 'en'),
    compactMode: Boolean (default: false),
    showCompletedEvents: Boolean (default: true),
    homepageLayout: {
      showDailyTracker: Boolean (default: true),
      showEvents: Boolean (default: true),
      showQuickAccess: Boolean (default: true),
      showProTips: Boolean (default: true),
      order: [String] (default: ['dailyTracker', 'events', 'quickAccess', 'proTips']),
      quickActions: [String] (default: ['calendar', 'passwords', 'wishlist', 'files', 'music', 'calculator', 'following', 'wikis', 'tracker', 'radiation'])
    }
  },
  privacy: {
    shareCalendar: Boolean,
    showBusyStatus: Boolean,
    allowThemeCookie: {
      type: Boolean,
      default: true
      // Controls both 'theme' cookie (login page) and 'geogebraTheme' cookie (legacy name; used by Graphing Calculator)
    },
  },
  wishlist: {
    defaultItemsPerPage: Number (default: 20, min: 10, max: 200)
  },
  radiation: {
    preferredUnit: String (enum: µSv/h|mSv/h|nSv/h|µGy/h|mGy/h|mR/h|CPM, default: 'µSv/h'),
    defaultLocationId: ObjectId (ref: 'RadiationLocation', default: null),
    cpmConversionFactor: Number (min: 1, max: 10000, default: 151)
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Default Values
| Setting | Default |
|---------|---------|
| calendar.defaultView | 'month' (enum: month, week, day, agenda) |
| calendar.weekStartsOn | 0 (0-6, Sunday=0) |
| calendar.timezone | 'UTC' |
| calendar.showWeekNumbers | false |
| calendar.defaultEventDuration | 60 (15-480 min) |
| calendar.workingHours.start | '09:00' |
| calendar.workingHours.end | '17:00' |
| notifications.emailReminders | true |
| notifications.reminderTime | 15 (0-10080 min) |
| notifications.eventUpdates | true |
| notifications.weeklyDigest | false |
| display.theme | 'system' (enum: light, dark, system) |
| display.language | 'en' |
| display.compactMode | false |
| display.showCompletedEvents | true |
| display.homepageLayout.showDailyTracker | true |
| display.homepageLayout.showEvents | true |
| display.homepageLayout.showQuickAccess | true |
| display.homepageLayout.showProTips | true |
| display.homepageLayout.order | ['dailyTracker', 'events', 'quickAccess', 'proTips'] | Controls the visual order of sections in the home layout editor and on the /home page |
| display.homepageLayout.quickActions | ['calendar', 'passwords', 'wishlist', 'files', 'music', 'calculator', 'following', 'wikis', 'tracker', 'radiation'] | Controls which shortcuts appear in the Quick Access section and their order |
| radiation.preferredUnit | 'µSv/h' (enum: µSv/h, mSv/h, nSv/h, µGy/h, mGy/h, mR/h, CPM) | |
| radiation.defaultLocationId | null | ObjectId ref to RadiationLocation |
| radiation.cpmConversionFactor | 151 (min: 1, max: 10000) | CPM per µSv/h; SBM-20 default |
| privacy.shareCalendar | false |
| privacy.showBusyStatus | true |
| privacy.allowThemeCookie | true | Controls both login page and Graphing Calculator theme cookies |
| wishlist.defaultItemsPerPage | 20 (10-200) |

## API Endpoints

### Settings (`/api/settings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all settings |
| PUT | `/` | Update settings (bulk) |
| PUT | `/profile` | Update profile only |
| PUT | `/calendar` | Update calendar prefs |
| PUT | `/notifications` | Update notification prefs |
| PUT | `/display` | Update display prefs |
| PUT | `/privacy` | Update privacy prefs |
| PUT | `/wishlist` | Update wishlist prefs |
| PUT | `/radiation` | Update radiation prefs |
| DELETE | `/reset` | Reset all to defaults |

### Sessions (`/api/settings/sessions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List active sessions |
| DELETE | `/:sessionId` | Revoke session |

### User Rights / Data Management (`/api/user`)
These endpoints implement GDPR user rights for data access, correction, deletion, and portability.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/data` | Get all user data (access right) |
| PUT | `/data` | Update name/email (correction right) |
| DELETE | `/account` | Delete account and all data (deletion right) |
| GET | `/export` | Export all data as JSON (portability right) |

**Rate Limit**: 10 requests per hour per user

#### GET /api/user/data Response
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "isActive": true,
    "lastLogin": "2026-04-27T...",
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-04-27T..."
  },
  "settings": { ... },
  "activeSessions": [
    {
      "id": "...",
      "deviceInfo": { "userAgent": "...", "ip": "..." },
      "createdAt": "2026-04-27T...",
      "expiresAt": "2026-05-04T..."
    }
  ]
}
```

#### DELETE /api/user/account Request
```json
{
  "password": "your-current-password"
}
```

#### GET /api/user/export Response
Downloads a JSON file containing all user data:
- User account info
- Settings
- Calendar events and categories
- Passwords and categories
- Wishlists, items, and reservations
- Following/followers
- Files and folders
- Wikis

## Frontend Components

### Settings Page
- **File**: `frontend/src/components/Pages/Settings.js`
- **Size**: ~840 lines
- **Features**:
  - Tabbed interface (Profile, Calendar, Notifications, Display, Privacy, Wishlist, Sessions, **Account**)
  - Real-time form validation
  - Avatar upload
  - Theme preview
  - Session list with revoke action
  - **Account tab**: View data, export data, update email, delete account
  - Reset confirmation modal

### Context Provider
- **File**: `frontend/src/contexts/SettingsContext.js`
- Provides settings state throughout app
- Auto-fetches on auth

### Service
- **File**: `frontend/src/services/settingsAPI.js`

## Backend Structure

### Controller
- **File**: `backend/controllers/settingsController.js`
- Key methods:
  - `getSettings()` - Retrieve or create settings
  - `updateSettings()` - Bulk update
  - `updateProfile()` - Profile only
  - `updateCalendarSettings()` - Calendar prefs
  - `updateNotificationSettings()` - Notifications
  - `updateDisplaySettings()` - Display options
  - `updatePrivacySettings()` - Privacy controls
  - `updateWishlistSettings()` - Wishlist prefs
  - `updateRadiationSettings()` - Radiation preferences (unit, CPM factor, default location)
  - `getActiveSessions()` - List sessions
  - `revokeSession()` - Invalidate session
  - `resetSettings()` - Restore defaults

### Model
- **File**: `backend/models/Settings.js`
- Static method `getOrCreateForUser()` ensures settings exist

### Routes
- **File**: `backend/routes/settings.js`

### User Rights Controller
- **File**: `backend/controllers/userRightsController.js`
- Key methods:
  - `getUserData()` - Retrieve all user data (access right)
  - `updateUserData()` - Update name/email (correction right)
  - `deleteAccount()` - Delete account and all data (deletion right)
  - `exportUserData()` - Export all data as JSON (portability right)

### User Rights Routes
- **File**: `backend/routes/userRights.js`

## Session Management
Sessions are tracked via RefreshToken model:
- `user`: ObjectId reference
- `token`: Hashed token string
- `userAgent`: Client browser info
- `ip`: Client IP address
- `createdAt`: Session start
- `expiresAt`: Token expiration
- `isRevoked`: Boolean flag

Users can view all active sessions and revoke any session except current.

## Integration Points
- **Calendar Module**: Uses calendar settings (defaultView, weekStartsOn, timezone)
- **Auth Module**: Session management via refresh tokens
- **Frontend Theme**: Display.theme controls UI theme

## Error Codes
| Code | Description |
|------|-------------|
| `SETTINGS_FETCH_ERROR` | Failed to fetch settings |
| `SETTINGS_UPDATE_ERROR` | Failed to update settings |
| `PROFILE_UPDATE_ERROR` | Failed to update profile |
| `AVATAR_UPLOAD_ERROR` | Failed to upload avatar |
| `AVATAR_DELETE_ERROR` | Failed to delete avatar |
| `CALENDAR_SETTINGS_ERROR` | Failed to update calendar settings |
| `NOTIFICATION_SETTINGS_ERROR` | Failed to update notification settings |
| `DISPLAY_SETTINGS_ERROR` | Failed to update display settings |
| `PRIVACY_SETTINGS_ERROR` | Failed to update privacy settings |
| `SESSIONS_FETCH_ERROR` | Failed to fetch active sessions |
| `SESSION_NOT_FOUND` | Session doesn't exist |
| `SESSION_REVOKE_ERROR` | Failed to revoke session |
| `RESET_ERROR` | Failed to reset settings |
| `NOT_FOUND` | Settings not found |
| `VALIDATION_ERROR` | Input validation failed |
| `SERVER_ERROR` | Internal server error |
| `USER_DATA_FETCH_ERROR` | Failed to fetch user data |
| `USER_DATA_UPDATE_ERROR` | Failed to update user data |
| `EMAIL_EXISTS` | Email already in use |
| `ACCOUNT_DELETE_ERROR` | Failed to delete account |
| `INVALID_CREDENTIALS` | Invalid password for account deletion |
| `USER_DATA_RATE_LIMIT_EXCEEDED` | Too many data operations |
