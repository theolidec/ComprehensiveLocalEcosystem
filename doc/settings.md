# Settings Module

## Overview
The Settings module provides comprehensive user preference management including profile settings, calendar preferences, notification settings, display options, privacy controls, and active session management.

## Features
- **Profile Management**: Name, bio, avatar
- **Calendar Settings**: Default view, timezone, working hours
- **Notifications**: Email reminders, event updates, digest
- **Display**: Theme, language, compact mode
- **Privacy**: Sharing controls, theme cookies
- **Session Management**: View and revoke active sessions
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
    showCompletedEvents: Boolean (default: true)
  },
  privacy: {
    shareCalendar: Boolean,
    showBusyStatus: Boolean,
    allowThemeCookie: Boolean
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
| privacy.shareCalendar | false |
| privacy.showBusyStatus | true |
| privacy.allowThemeCookie | true |

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
| DELETE | `/reset` | Reset all to defaults |

### Sessions (`/api/settings/sessions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List active sessions |
| DELETE | `/:sessionId` | Revoke session |

## Frontend Components

### Settings Page
- **File**: `frontend/src/components/Pages/Settings.js`
- **Size**: ~650 lines
- **Features**:
  - Tabbed interface (Profile, Calendar, Notifications, Display, Privacy, Sessions)
  - Real-time form validation
  - Avatar upload
  - Theme preview
  - Session list with revoke action
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
  - `getActiveSessions()` - List sessions
  - `revokeSession()` - Invalidate session
  - `resetSettings()` - Restore defaults

### Model
- **File**: `backend/models/Settings.js`
- Static method `getOrCreateForUser()` ensures settings exist

### Routes
- **File**: `backend/routes/settings.js`

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
