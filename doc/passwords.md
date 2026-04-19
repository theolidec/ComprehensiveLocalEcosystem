# Passwords Module

## Overview
The Passwords module provides secure password management with AES-256-GCM encryption, custom categories, password generation, and import/export functionality. Each user's passwords are encrypted with a unique per-user salt.

## Features
- **Secure Storage**: AES-256-GCM encryption with unique user salt
- **Password Generator**: Configurable length and character sets
- **Strength Meter**: Entropy-based password strength calculation
- **Categories**: Custom password categories with colors/icons
- **Favorites**: Quick access to frequently used passwords
- **Search**: Search by title, website, or username
- **Auto-lock**: Automatic vault locking after inactivity
- **Import/Export**: JSON backup and restore
- **Copy to Clipboard**: One-click password copying
- **Website Detection**: Auto-extract website from URL

## Data Models

### Password Schema
- `userId`: ObjectId (required, indexed) - Owner
- `title`: String (required, trim, max 100 chars) - Display name
- `username`: String (trim, max 100 chars) - Login username
- `encryptedPassword`: String (required) - AES encrypted
- `website`: String (trim, max 200 chars) - Associated URL
- `category`: String (enum: ['social','finance','work','shopping','entertainment','other'], default: 'other')
- `notes`: String (trim, max 1000 chars) - Additional notes
- `isFavorite`: Boolean (default: false)
- `createdAt`: Date
- `updatedAt`: Date

### PasswordCategory Schema
- `userId`: ObjectId (required, indexed)
- `name`: String (required, trim, max 50 chars)
- `icon`: String (emoji, default: '📁')
- `color`: String (hex, default: '#6B7280')
- `isDefault`: Boolean (default: false)

## Default Categories
- Social (Blue, 👥)
- Finance (Green, 💳)
- Work (Orange, 💼)
- Shopping (Red, 🛒)
- Entertainment (Purple, 🎮)
- Other (Gray, 📁)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/passwords` | List all passwords |
| GET | `/api/passwords/:id` | Get single password |
| POST | `/api/passwords` | Create password |
| PUT | `/api/passwords/:id` | Update password |
| DELETE | `/api/passwords/:id` | Delete password |
| GET | `/api/passwords/:id/decrypt` | Decrypt and return |
| POST | `/api/passwords/:id/favorite` | Toggle favorite |
| GET | `/api/passwords/export` | Export all passwords |
| POST | `/api/passwords/import` | Import passwords |
| GET | `/api/password-categories` | List categories |
| POST | `/api/password-categories` | Create category |
| PUT | `/api/password-categories/:id` | Update category |
| DELETE | `/api/password-categories/:id` | Delete category |

## Frontend Components

### Password Manager
- **File**: `frontend/src/components/Pages/PasswordManager.js`
- **Size**: ~900 lines
- Features:
  - Password vault with lock screen
  - Add/Edit/Delete passwords
  - Password generator with options
  - Strength indicator (Very Weak to Very Strong)
  - Category filtering
  - Search functionality
  - Favorites toggle
  - Import/Export modal
  - Copy to clipboard with feedback
  - Auto-lock after 5 minutes inactivity

### Service
- **File**: `frontend/src/services/passwordAPI.js`

## Backend Structure

### Controller
- **File**: `backend/controllers/passwordController.js`
- Key functions:
  - `getAllPasswords()` - List with filtering
  - `createPassword()` - Encrypt and store
  - `updatePassword()` - Modify existing
  - `deletePassword()` - Remove entry
  - `decryptPassword()` - Return plaintext
  - `toggleFavorite()` - Favorite flag
  - `exportPasswords()` - JSON backup
  - `importPasswords()` - Restore from backup

### Encryption Service
- **File**: `backend/services/passwordService.js`
- Uses AES-256-GCM encryption
- Per-user salt stored in User model

### Routes
- **Passwords**: `backend/routes/passwords.js`
- **Categories**: `backend/routes/passwordCategories.js`

## Password Strength Calculation
Based on Shannon entropy:
- **Very Weak** (< 28 bits) - Red
- **Weak** (28-36 bits) - Orange
- **Fair** (36-60 bits) - Yellow
- **Strong** (60-80 bits) - Green
- **Very Strong** (> 80 bits) - Emerald

## Security
- Master encryption key derived from user password
- Unique 32-byte salt per user
- AES-256-GCM authenticated encryption
- Passwords never stored in plaintext
- Decryption only on explicit request
