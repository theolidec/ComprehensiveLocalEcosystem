# Calendar Module

## Overview
The Calendar module provides comprehensive event management functionality with support for recurring events, reminders, categories, and multiple calendar views. It allows users to create, manage, and track events with rich metadata including time, location, attendees, and custom categories.

## Features
- **Event Management**: Create, read, update, and delete events
- **Recurring Events**: Support for daily, weekly, monthly, and yearly recurrence patterns
- **Multiple Views**: Month, week, and day view modes
- **Categories**: Custom color-coded event categories
- **Reminders**: Configurable reminder notifications
- **Search & Filter**: Search events by title, description, or location; filter by category
- **Import/Export**: JSON export and import functionality for event backup
- **Statistics**: Monthly event statistics and analytics
- **Timezones**: Full timezone support for events
- **All-day Events**: Support for full-day events without specific times
- **Attendees**: Track event participants

## Data Model

### Event Schema
```javascript
{
  title: String (required, max 100 chars),
  description: String (max 500 chars),
  date: Date (required),
  time: String,
  location: String (max 200 chars),
  category: String (default: 'work'),
  color: String (hex color),
  attendees: [String],
  reminder: Number (minutes, default: 15, enum: [0, 5, 15, 30, 60, 1440]),
  isRecurring: Boolean,
  recurringPattern: String (daily/weekly/monthly/yearly),
  recurringEndDate: Date,
  recurringOccurrences: Number (min: 1, max: 365),
  timezone: String,
  isAllDay: Boolean,
  duration: Number (minutes, min: 0, max: 1440),
  isCompleted: Boolean,
  user: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Base URL
`/api/calendar`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/events` | Create new event | Yes |
| GET | `/events` | Get events (with filters) | Yes |
| GET | `/events/:id` | Get single event | Yes |
| PUT | `/events/:id` | Update event | Yes |
| DELETE | `/events/:id` | Delete event | Yes |
| GET | `/events/upcoming` | Get upcoming events | Yes |
| GET | `/events/stats` | Get event statistics | Yes |
| GET | `/events/export` | Export all events | Yes |
| POST | `/events/import` | Import events from JSON | Yes |

### Query Parameters for GET /events
- `startDate` - Filter events from this date (ISO format)
- `endDate` - Filter events until this date (ISO format)
- `category` - Filter by category name
- `search` - Search in title, description, location
- `includeRecurring` - Include expanded recurring events (default: true)

## Frontend Components

### Main Component
- **File**: `frontend/src/components/Pages/Calendar.js`
- **Size**: ~1,739 lines
- **Features**:
  - Month/Week/Day view modes
  - Event creation modal
  - Drag-and-drop event editing
  - Category filtering sidebar
  - Search functionality
  - Recurring event indicator
  - Week numbers display
  - Working hours highlighting

### Category Manager
- **File**: `frontend/src/components/Pages/CategoryManager.js`
- Manages custom event categories with colors and icons

### Service API
- **File**: `frontend/src/services/calendarAPI.js`
- Handles all HTTP requests to calendar endpoints

## Backend Structure

### Controller
- **File**: `backend/controllers/calendarController.js`
- **Key Functions**:
  - `createEvent()` - Creates new event with validation
  - `getEvents()` - Retrieves events with filtering and recurring expansion
  - `getEventById()` - Gets single event details
  - `updateEvent()` - Updates event data
  - `deleteEvent()` - Removes event
  - `getUpcomingEvents()` - Gets next N upcoming events
  - `getEventStats()` - Monthly statistics
  - `exportEvents()` - JSON export
  - `importEvents()` - JSON import with validation

### Model
- **File**: `backend/models/Event.js`
- Features:
  - Static methods for finding upcoming events
  - Statistics aggregation
  - Recurring event expansion support

### Routes
- **File**: `backend/routes/calendar.js`
- All routes protected with `authenticateToken` middleware

### Service
- **File**: `backend/services/recurringEventService.js`
- Handles expansion of recurring events into individual instances

## Recurring Events
The system supports four recurrence patterns:
- **Daily** - Repeats every N days
- **Weekly** - Repeats on specific days of the week
- **Monthly** - Repeats on specific day of month
- **Yearly** - Repeats annually on same date

Recurring events are expanded on-the-fly when fetching events within a date range. Each instance gets a virtual ID combining the original event ID and date.

## Default Categories
The system auto-creates default categories for new users:

| Name | Color | Icon |
|------|-------|------|
| Work | #3B82F6 (Blue) | 💼 |
| Personal | #10B981 (Green) | 👤 |
| Social | #F59E0B (Orange) | 🎉 |
| Health | #EF4444 (Red) | 🏥 |
| Education | #8B5CF6 (Purple) | 📚 |
| Travel | #06B6D4 (Cyan) | ✈️ |

### Category Colors
Categories auto-assign colors:
- work: #3B82F6 (Blue)
- personal: #10B981 (Green)
- social: #F59E0B (Orange)
- health: #EF4444 (Red)
- education: #8B5CF6 (Purple)
- travel: #06B6D4 (Cyan)
- other: #6B7280 (Gray)

## Error Codes
| Code | Description |
|------|-------------|
| `EVENT_CREATE_ERROR` | Failed to create event |
| `EVENTS_FETCH_ERROR` | Failed to fetch events |
| `EVENT_NOT_FOUND` | Event doesn't exist |
| `INVALID_EVENT_ID` | Malformed event ID |
| `EVENT_UPDATE_ERROR` | Update operation failed |
| `EVENT_DELETE_ERROR` | Delete operation failed |
| `UPCOMING_EVENTS_ERROR` | Failed to get upcoming events |
| `EVENT_STATS_ERROR` | Statistics calculation failed |
| `EVENT_EXPORT_ERROR` | Export operation failed |
| `EVENT_IMPORT_ERROR` | Import operation failed |
| `IMPORT_NO_EVENTS` | No events found in import data |

## Integration Points
- **Settings Module**: Calendar preferences (default view, week start, timezone)
- **Notification Module**: Event reminders (planned)
- **Category Module**: Event categorization
