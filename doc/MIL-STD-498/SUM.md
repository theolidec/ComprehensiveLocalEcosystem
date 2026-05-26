# Software User Manual (SUM)
## Comprehensive Local Ecosystem

**Document Number**: SUM-001  
**Revision**: 1.1  
**Date**: May 26, 2026  
**Standard**: MIL-STD-498  

---

## 1. Scope

### 1.1 Identification

This document is the Software User Manual (SUM) for the Comprehensive Local Ecosystem web application.

### 1.2 Purpose

The purpose of this manual is to provide end users with instructions for operating the Comprehensive Local Ecosystem application.

---

## 2. Referenced Documents

| Document | Description |
|----------|-------------|
| SRS.md | Software Requirements Specification |
| OCD.md | Operational Concept Description |

---

## 3. Getting Started

### 3.1 System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Browser | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ | Latest version |
| JavaScript | Enabled | Enabled |
| Network | Internet connection | Broadband |
| Display | 1024x768 | 1920x1080 |

### 3.2 Accessing the Application

1. Open your web browser
2. Navigate to the application URL
3. You will be directed to the login page

### 3.3 Creating an Account

1. Click **"Register"** on the login page
2. Enter your email address
3. Create a password (12-128 characters)
4. Enter your display name
5. Accept the current Privacy Policy
6. Click **"Create Account"**
7. You will be automatically logged in

### 3.4 Logging In

1. Enter your email address
2. Enter your password
3. Click **"Login"**
4. You will be redirected to the Home dashboard

---

## 4. Application Navigation

### 4.1 Layout Overview

```
┌─────────────────────────────────────────────────────────┐
│  Header (Logo, Apps Menu, User Menu)                    │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │           Main Content Area                  │
│ (Context │                                              │
│  based)  │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

**Navigation Structure:**
- **Main navigation** is accessed via the **Apps menu** (AL icon) in the Header
- **Contextual sidebar** appears on specific pages with page-specific actions
- **User menu** contains Settings, Passwords, and Logout

### 4.2 Apps Menu Navigation

The Apps menu (accessed via the AL icon in the Header) provides access to all modules:

| Icon | Section | Description |
|------|---------|-------------|
| 🏠 | Home | Dashboard with overview and quick actions |
| 📅 | Calendar | Event management and scheduling |
| 🔑 | Password Manager | Secure password and payment-card storage |
| 🎁 | Wishlist | Gift wishlists and reservations |
| 📁 | Files | File storage, rich-text documents, and sharing |
| 🧮 | Calculator | Graphing Calculator (custom implementation) |
| 👥 | Following | Social connections and user following |
| ✅ | Daily Tracker | Habit tracking and daily check-ins |
| 📚 | Wiki | Knowledge base and documentation |
| 🎵 | Music | Music library, playlists, and floating player |
| ☢️ | Radiation | Radiation measurement logging and analytics |

### 4.3 User Menu

The User menu (profile icon in the Header) contains account-related options:

| Icon | Section | Description |
|------|---------|-------------|
| 🔑 | Passwords | Quick access to password manager |
| ⚙️ | Settings | User preferences and account settings |
| 🚪 | Logout | Sign out of the application |

---

## 5. Feature Instructions

### 5.1 Home Dashboard

The Home page provides a personalized overview of your data with the following sections:

#### Daily Tracker Card
A comprehensive daily overview at the top of the page:
- **Progress Bar**: Visual indicator of completed vs total tasks
- **Stats Row**: Day streak, 30-day completion rate, and active task count
- **Today's Tasks**: Interactive checklist of daily tasks with priority indicators
- **Daily Check-in**: Quick-response questions (Yes/No/Maybe, Scale ratings)
- **Add Task**: Inline form to create new recurring or one-time tasks

#### End of Day Mood Selector
Appears after 5:00 PM for daily reflection:
- 5-level mood scale (Awful to Great)
- Saves mood to Daily Tracker history

#### Today's Events
Calendar overview for the current day:
- Lists all scheduled events with time and location
- Color-coded by category (Work, Personal, Health, etc.)
- Quick-add button to create new events inline
- Shows next upcoming event when no events today

#### Quick Access Grid
Navigation shortcuts to all application modules:
- Calendar, Passwords, Wishlist, Files
- Calculator, Following, Wikis, Daily Tracker

### 5.2 Calendar

#### Creating an Event

1. Navigate to **Calendar**
2. Click on a date or click **"+ New Event"**
3. Fill in event details:
   - **Title**: Event name
   - **Description**: Optional details
   - **Date**: Select date
   - **Time**: Set start time (optional)
   - **Location**: Add location (optional)
   - **Category**: Choose category (Work, Personal, etc.)
   - **Reminder**: Set reminder time
4. Click **"Add Event"**

#### Recurring Events

To create a recurring event:
1. Create a new event
2. Enable **"Recurring"**
3. Select pattern: Daily, Weekly, Monthly, or Yearly
4. Set end date or number of occurrences (optional)

#### Managing Categories

1. In the **Calendar** page, find the **Categories** section on the right side
2. Click **"Manage"** next to the Categories heading
3. In the modal dialog:
   - Click **"+ Add Category"** to create new categories with name, color, and icon
   - Click the **edit icon** on existing categories to modify them
   - Click the **trash icon** to delete categories

### 5.3 Password Manager

#### Adding a Password

1. Navigate to **Passwords**
2. Click **"+ Add Password"**
3. Fill in details:
   - **Title**: Service name (e.g., "Gmail")
   - **Username**: Your username or email
   - **Password**: Enter password or use generator
   - **Website**: URL of the service
   - **Category**: Select category
   - **Notes**: Additional notes
4. Click **"Save"**

#### Using the Password Generator

1. In password form, click **"Generate"**
2. Configure options:
   - Length (default: 16)
   - Include uppercase letters
   - Include lowercase letters
   - Include numbers
   - Include symbols
3. Click **"Generate"** to create password
4. Click **"Use Password"** to fill the field

#### Viewing a Password

1. Find password in list
2. Click **"Show"** icon
3. Password is decrypted and displayed
4. Click **"Copy"** to copy to clipboard

#### Managing Payment Cards

1. Navigate to **Passwords**
2. Click **"Payment Cards"** tab
3. Click **"+ Add Card"**
4. Enter card details:
   - Card name (e.g., "Personal Visa")
   - Cardholder name
   - Card number
   - Expiry date
   - CVV
   - Billing address
5. Click **"Save"**

### 5.4 File Manager

#### Uploading Files

1. Navigate to **Files**
2. Click **"Upload"** or drag files to the window
3. Files are uploaded to your storage

#### Creating Folders

1. Click **"+ New Folder"**
2. Enter folder name
3. Click **"Create"**

#### Organizing Files

- **Move**: Select files → Click move icon → Choose destination
- **Rename**: Right-click → Rename
- **Delete**: Select → Click delete → Moves to trash
- **Restore**: Go to Trash → Select → Restore

#### Sharing Files

1. Select file
2. Click **"Share"** icon
3. Copy the generated link
4. Share link with others

#### Rich-Text Documents

The File Manager supports creating and editing rich-text documents using the TipTap editor.

1. From the Files page, choose **"New Document"**
2. The Document Editor opens with formatting tools (headings, bold/italic/underline, lists, tables, links, images, colors, highlights, text alignment)
3. Saving the document creates a new version; previous versions can be viewed and restored from the Document Viewer history

### 5.5 Wiki System

#### Creating a Wiki

1. Navigate to **Wiki**
2. Click **"+ New Wiki"**
3. Enter wiki name and description
4. Choose visibility: Public or Private
5. Click **"Create"**

#### Adding Pages

1. Open a wiki
2. Click **"+ New Page"**
3. Enter page title
4. Write content using Markdown
5. Click **"Save"**

#### Wiki Features

- **WikiLinks**: Use `[[Page Name]]` to link to other pages
- **Categories**: Add categories to organize pages
- **History**: View and restore previous versions
- **Permissions**: Set access levels for users

### 5.6 Wishlist System

#### Creating a Wishlist

1. Navigate to **Wishlist**
2. Click **"+ New Wishlist"**
3. Enter wishlist name (e.g., "Birthday 2026")
4. Select category template (optional)
5. Click **"Create"**

#### Adding Items

1. Open a wishlist
2. Click **"+ Add Item"**
3. Enter item details:
   - Name
   - Description
   - Price (optional)
   - URL (link to product)
   - Priority (low, medium, high, must-have)
   - Category
4. Click **"Save"**

#### Sharing a Wishlist

1. Open wishlist
2. Click **"Share"** button
3. Copy public link
4. Share with friends and family

#### Managing Reservations

When someone reserves an item:
- Item shows as "Reserved"
- Reserver's name is displayed
- Other users see the reservation

### 5.7 Daily Tracker

#### Daily Check-in

1. Navigate to **Tracker**
2. Click **"Today"** tab
3. Complete your daily check-in:
   - Mark tasks as done
   - Answer daily questions
   - Add notes

#### Creating Tasks

1. Go to **Tasks** tab
2. Click **"+ Add Task"**
3. Enter task details:
   - Task name
   - Category
   - Priority
   - Due date
   - Recurrence (optional)
4. Click **"Save"**

#### Viewing Statistics

1. Go to **Statistics** tab
2. View:
   - Completion rates
   - Streak information
   - Activity heatmap
   - Category breakdowns

### 5.8 Music

#### Uploading Music

1. Navigate to **Music → Upload** (or `/music/upload`)
2. Select an audio file
3. Enter Song Name, Artist, and optionally add to a playlist
4. Check **"Make this song public"** to share it on the Discover feed (default is private)

#### Library and Playback

- **My Library** lists all your songs with 🔓 Public / 🔒 Private badges
- Click any song to play; the **Floating Player** appears at the bottom-right and stays visible on every page
- Use ⏮/⏭ to skip, ⇌ for shuffle, ↻ for single-track loop
- Playlists auto-advance and loop back to the first track at the end

#### Playlists

1. Click **"New Playlist"** to create one (name + description)
2. Click **"Add to Playlist"** on any song to add it
3. Click **"Play All"** to play a playlist from the start
4. Click a track in the playlist to start from that song

#### Song Management

- ✏️ Edit song title or artist
- 🔒/🔓 Toggle public/private visibility
- ↪️ Transfer ownership to another user (by email)
- 🗑 Delete a song (confirmation required)

#### Discover

- Navigate to **Music → Discover** to browse songs other users have made public
- Public songs may be added to your playlists; only the owner can delete them

---

### 5.9 Radiation Monitor

#### Logging a Measurement

1. Navigate to **Radiation** → **Measurements**
2. Click **"+ New Measurement"**
3. Enter date, optional time start/end, location, average level, and optional peak level
4. Add comments, notes, tags, and a status (Draft / Verified / Flagged / Archived)
5. Click **"Save"**

#### Managing Locations

1. Open the **Locations** tab
2. Add named locations with optional GPS coordinates (lat/lng)
3. Edit or delete existing locations

#### Unit Preferences

1. Open the **Settings** tab inside Radiation
2. Select your preferred display unit (µSv/h, mSv/h, nSv/h, µGy/h, mGy/h, mR/h, or CPM)
3. If using CPM, set the CPM conversion factor (default 151 for SBM-20)
4. All values are stored internally as µSv/h and displayed converted

#### Analytics

Open the **Analytics** tab to view:
- **Time-series** chart of average and peak levels
- **Per-location** bar chart
- **Heatmap calendar** (GitHub-style daily grid)

#### Public Feed and Trash

- Toggle a measurement public to expose it on the **Public** tab
- Soft-deleted measurements appear in **Trash** and can be restored or hard-deleted

---

### 5.10 Settings

#### Profile Settings

1. Navigate to **Settings**
2. Click **"Profile"** tab
3. Update:
   - Display name
   - Email address
   - Avatar image
4. Click **"Save Changes"**

#### Display Settings

1. Navigate to **Settings**
2. Click **"Display"** tab
3. Configure:
   - Theme: Light, Dark, or System
   - Language (future feature)
4. Changes apply immediately

#### Privacy Settings

1. Navigate to **Settings**
2. Click **"Privacy"** tab
3. Configure privacy preferences

#### Managing Sessions

1. Navigate to **Settings**
2. Click **"Account"** tab
3. View active sessions under "Active Sessions"
4. Click **"Revoke"** to logout from a device

#### GDPR / User Rights

Under the **"Account"** tab:

- **View My Data**: See all your stored data
- **Download My Data**: Export all data as JSON
- **Update Email**: Change your email address
- **Delete Account**: Permanently delete your account and all data

---

## 6. Security Features

### 6.1 Password Security

- All passwords are encrypted with AES-256-GCM
- Master key stored in server environment variables
- Each user has unique encryption salt

### 6.2 Session Management

- Access tokens expire after 15 minutes
- Refresh tokens last 7 days
- View and revoke sessions from Settings

### 6.3 Account Protection

- Account locks after 5 failed login attempts
- Lockout lasts for 2 hours
- Use "Forgot Password" to reset

---

## 7. Troubleshooting

### 7.1 Common Issues

| Issue | Solution |
|-------|----------|
| Can't login | Check credentials, verify account exists |
| Password not working | Use "Forgot Password" to reset |
| Files not uploading | Check file size (max 500MB) |
| Calendar events not showing | Check date range filter |
| Wiki pages not loading | Refresh the page |
| Music doesn't play | Check browser audio permissions; verify the file is a supported audio format |
| Radiation values look wrong | Verify the preferred unit and CPM factor in Radiation → Settings |

### 7.2 Getting Help

- Check in-app error messages for details
- Review documentation in Wiki module
- Check browser console for technical errors

---

## 8. Appendix

### A. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New event/item (context-dependent) |
| Escape | Close modals/dialogs |

### B. Acronyms

| Acronym | Definition |
|---------|------------|
| AES | Advanced Encryption Standard |
| GDPR | General Data Protection Ratio |
| JWT | JSON Web Token |
| MIL-STD | Military Standard |
| SUM | Software User Manual |

### C. Revision History

| Revision | Date | Author | Description |
|----------|------|--------|-------------|
| 1.0 | May 10, 2026 | System | Initial SUM creation |
| 1.1 | May 26, 2026 | System | Added Music, Radiation, and Rich-Text Document sections; corrected password length to 12-128 chars; added Music/Radiation entries to the Apps menu |

---

**END OF DOCUMENT**
