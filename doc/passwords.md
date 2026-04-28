# Passwords Module

## Overview
The Passwords module provides secure password and payment card management with AES-256-GCM encryption, custom categories, password generation, and import/export functionality. Each user's data is encrypted with a unique per-user salt.

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
- **Payment Cards**: Securely store credit/debit card details
  - Visual card display with gradient backgrounds
  - Card type color coding (Visa=blue, Mastercard=red, Amex=blue, Discover=orange)
  - Magnetic strip visual
  - Card number, cardholder name, expiry date, and CVV display
  - View mode toggle (visual card view vs list view)
  - Show/hide card details with masking
  - Default card selection
  - Favorites support

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

### PaymentCard Schema
- `userId`: ObjectId (required, indexed) - Owner
- `cardName`: String (required, trim, max 100 chars) - Display name
- `cardholderName`: String (trim, max 100 chars) - Name on card
- `encryptedCardNumber`: String (required) - AES encrypted
- `encryptedExpiryDate`: String (required) - AES encrypted
- `encryptedCVV`: String (required) - AES encrypted
- `cardType`: String (enum: ['visa','mastercard','amex','discover','other'], default: 'other')
- `lastFourDigits`: String (4 digits) - For display
- `billingAddress`: String (trim, max 500 chars)
- `isDefault`: Boolean (default: false)
- `isFavorite`: Boolean (default: false)
- `createdAt`: Date
- `updatedAt`: Date

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

### Payment Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payment-cards` | List all cards |
| GET | `/api/payment-cards/:id` | Get single card |
| POST | `/api/payment-cards` | Create card |
| PUT | `/api/payment-cards/:id` | Update card |
| DELETE | `/api/payment-cards/:id` | Delete card |
| GET | `/api/payment-cards/:id/decrypt` | Decrypt and return card details |
| POST | `/api/payment-cards/:id/favorite` | Toggle favorite |
| POST | `/api/payment-cards/:id/default` | Set as default card |

## Frontend Components

### Password Manager
- **File**: `frontend/src/components/Pages/PasswordManager.js`
- **Size**: ~1450 lines
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
  - **Payment Cards tab** - Securely store credit/debit cards
  - Card type detection (Visa, Mastercard, Amex, Discover)
  - Default card selection
  - Show/hide card details
  - **Visual card display** - Cards shown as realistic credit cards with:
    - Gradient backgrounds based on card type
    - Magnetic strip visual
    - Card number (masked by default, shows last 4 digits)
    - Cardholder name (uppercase)
    - Expiry date (MM/YY format)
    - CVV (masked as ••• by default)
  - **View mode toggle** - Switch between:
    - Visual card view (grid of credit card visuals)
    - List view (compact card details)
  - Card type color coding:
    - Visa: #1A1F71 (dark blue)
    - Mastercard: #EB001B (red)
    - Amex: #006FCF (blue)
    - Discover: #FF6000 (orange)
    - Other: #6B7280 (gray)

### Services
- **File**: `frontend/src/services/passwordAPI.js`
- **File**: `frontend/src/services/paymentCardAPI.js`

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
- **Payment Cards**: `backend/routes/paymentCards.js`

### Payment Card Controller
- **File**: `backend/controllers/paymentCardController.js`
- Key functions:
  - `getAllCards()` - List with filtering
  - `createCard()` - Encrypt and store card details
  - `updateCard()` - Modify existing card
  - `deleteCard()` - Remove card
  - `decryptCard()` - Return plaintext card details
  - `toggleFavorite()` - Favorite flag
  - `setDefaultCard()` - Set as default payment method

### Payment Card Model
- **File**: `backend/models/PaymentCard.js`
- Uses same encryption as passwords
- Auto-detects card type from card number

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
- Passwords and payment cards never stored in plaintext
- Decryption only on explicit request
- Card numbers masked in list view, only last 4 digits shown

## Error Codes
| Code | Description |
|------|-------------|
| `PASSWORDS_FETCH_ERROR` | Failed to fetch passwords |
| `PASSWORD_NOT_FOUND` | Password doesn't exist |
| `PASSWORD_CREATE_ERROR` | Failed to create password |
| `PASSWORD_UPDATE_ERROR` | Failed to update password |
| `PASSWORD_DELETE_ERROR` | Failed to delete password |
| `DECRYPT_ERROR` | Failed to decrypt password |
| `ENCRYPT_ERROR` | Failed to encrypt password |
| `FAVORITE_ERROR` | Failed to toggle favorite |
| `EXPORT_ERROR` | Failed to export passwords |
| `IMPORT_ERROR` | Failed to import passwords |
| `INVALID_IMPORT_DATA` | Invalid import data format |
| `CATEGORIES_FETCH_ERROR` | Failed to fetch categories |
| `CATEGORY_CREATE_ERROR` | Failed to create category |
| `CATEGORY_NOT_FOUND` | Category doesn't exist |
| `CATEGORY_UPDATE_ERROR` | Failed to update category |
| `CATEGORY_DELETE_ERROR` | Failed to delete category |
| `DEFAULT_CATEGORY_PROTECTED` | Cannot delete default category |
| `CARDS_FETCH_ERROR` | Failed to fetch payment cards |
| `CARD_NOT_FOUND` | Payment card doesn't exist |
| `CARD_CREATE_ERROR` | Failed to create payment card |
| `CARD_UPDATE_ERROR` | Failed to update payment card |
| `CARD_DELETE_ERROR` | Failed to delete payment card |
| `CARD_DECRYPT_ERROR` | Failed to decrypt payment card |
| `DEFAULT_CARD_ERROR` | Failed to set default card |
| `VALIDATION_ERROR` | Input validation failed |
| `SERVER_ERROR` | Internal server error |
