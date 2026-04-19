# Categories Module

## Overview
Manages custom event categories for the Calendar with color coding and icons.

## Data Model
```javascript
{
  name: String (required, trim, max 50),
  color: String (required, hex, default: '#3B82F6'),
  icon: String (required, default: '📅'),
  user: ObjectId (required, ref: 'User'),
  isDefault: Boolean (default: false)
}
```

### Indexes
- Unique index on [user, name]

## Default Categories

| Name | Color | Icon |
|------|-------|------|
| Work | #3B82F6 (Blue) | � |
| Personal | #10B981 (Green) | 👤 |
| Social | #F59E0B (Orange) | � |
| Health | #EF4444 (Red) | 🏥 |
| Education | #8B5CF6 (Purple) | 📚 |
| Travel | #06B6D4 (Cyan) | ✈️ |

### Category Colors (from Event model)
- work: #3B82F6 (Blue)
- personal: #10B981 (Green)
- social: #F59E0B (Orange)
- health: #EF4444 (Red)
- education: #8B5CF6 (Purple)
- travel: #06B6D4 (Cyan)
- other: #6B7280 (Gray)

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/categories` | Create |
| GET | `/api/categories` | List |
| PUT | `/api/categories/:id` | Update |
| DELETE | `/api/categories/:id` | Delete |

## Frontend
- **File**: `frontend/src/components/Pages/CategoryManager.js`
- Color picker, icon selector, usage tracking

## Backend
- **Controller**: `backend/controllers/categoryController.js`
- **Model**: `backend/models/Category.js`
- **Routes**: `backend/routes/categories.js`

## Features
- Protected defaults (cannot delete/modify)
- Usage check before deletion
- Auto-create defaults for new users
