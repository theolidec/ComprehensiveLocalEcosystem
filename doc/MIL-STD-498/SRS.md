# Software Requirements Specification (SRS)
## Comprehensive Local Ecosystem

**Document Number**: SRS-001  
**Revision**: 1.1  
**Date**: May 26, 2026  
**Standard**: MIL-STD-498  

---

## 1. Scope

### 1.1 Identification

This document defines the Software Requirements Specification (SRS) for the Comprehensive Local Ecosystem, a full-stack web application providing personal productivity and content management tools.

### 1.2 Purpose

The purpose of this system is to provide users with an integrated suite of tools for managing personal data including calendars, passwords, payment cards, files, rich-text documents, wikis, wishlists, daily tracking, music libraries, radiation measurements, and a graphing calculator. The system operates as a self-hosted web application with a React frontend and Node.js/Express backend.

### 3.1 Product Perspective

The Comprehensive Local Ecosystem is a standalone web application consisting of:

- **Frontend**: React 19.2.4 SPA with Tailwind CSS styling
- **Backend**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with refresh token rotation

### 3.2 User Characteristics

End users are individuals seeking a personal productivity platform with the following characteristics:

- Technical proficiency: Basic to intermediate computer skills
- Usage frequency: Daily active users
- Security awareness: Users requiring encrypted storage for sensitive data

---

## 2. Referenced Documents

| Document | Description |
|----------|-------------|
| MIL-STD-498 | Military Standard: Software Development and Documentation |
| backend-architecture.md | Backend system architecture and design |
| frontend-architecture.md | Frontend system architecture and design |
| api-overview.md | Complete REST API reference |
| security.md | Security implementation details |
| database-models.md | MongoDB schema definitions |

---

## 3. Requirements

### 3.1 Functional Requirements

#### 3.1.1 Authentication and Authorization

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-AUTH-001 | User Registration | System shall allow users to create accounts with email, password (12-128 chars), and display name |
| FR-AUTH-002 | User Login | System shall authenticate users using email and password credentials |
| FR-AUTH-003 | JWT Authentication | System shall use JSON Web Tokens for API authentication with 15-minute expiration |
| FR-AUTH-004 | Token Refresh | System shall support refresh token rotation with 7-day expiration |
| FR-AUTH-005 | Multi-Session Support | System shall allow users to maintain multiple active sessions |
| FR-AUTH-006 | Session Revocation | System shall allow users to logout from individual or all devices |
| FR-AUTH-007 | Password Reset | System shall support password reset via single-use token |
| FR-AUTH-008 | Account Lockout | System shall temporarily lock accounts after 5 failed login attempts |
| FR-AUTH-009 | Privacy Versioning | System shall record acceptance of the current privacy policy version on registration |

#### 3.1.2 Calendar Management

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-CAL-001 | Event Creation | Users shall be able to create calendar events with title, description, date, time, and location |
| FR-CAL-002 | Event Modification | Users shall be able to edit existing calendar events |
| FR-CAL-003 | Event Deletion | Users shall be able to delete calendar events |
| FR-CAL-004 | Recurring Events | System shall support daily, weekly, monthly, and yearly recurring events |
| FR-CAL-005 | Event Categories | Users shall be able to organize events into color-coded categories |
| FR-CAL-006 | Event Search | Users shall be able to search events by title and description |
| FR-CAL-007 | Event Export | Users shall be able to export events as JSON |
| FR-CAL-008 | Event Import | Users shall be able to import events from JSON |
| FR-CAL-009 | Event Statistics | System shall provide statistics on event counts by category |

#### 3.1.3.1 Password Manager

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-PWD-001 | Password Storage | Users shall be able to store password entries with title, username, password, website, and notes |
| FR-PWD-002 | Password Encryption | System shall encrypt all stored passwords using AES-256-GCM |
| FR-PWD-003 | Password Decryption | Users shall be able to view decrypted passwords |
| FR-PWD-004 | Password Categories | Users shall be able to organize passwords into categories |
| FR-PWD-005 | Password Favorites | Users shall be able to mark passwords as favorites |
| FR-PWD-006 | Password Generation | System shall provide secure random password generation |
| FR-PWD-007 | Password Export | Users shall be able to export encrypted passwords |
| FR-PWD-008 | Password Import | Users shall be able to import password data |

##### 3.1.3.2 Payment Card Management

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-PCD-001 | Card Storage | Users shall be able to store payment card information |
| FR-PCD-002 | Card Encryption | System shall encrypt card numbers, expiry dates, and CVV using AES-256-GCM |
| FR-PCD-003 | Card Decryption | Users shall be able to view decrypted card details |
| FR-PCD-004 | Card Type Detection | System shall automatically detect card type (Visa, Mastercard, Amex, Discover) |
| FR-PCD-005 | Default Card | Users shall be able to set a default payment card |
| FR-PCD-006 | Card Favorites | Users shall be able to mark cards as favorites |

#### 3.1.4 File Management

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-FIL-001 | File Upload | Users shall be able to upload files up to 500MB |
| FR-FIL-002 | File Download | Users shall be able to download their uploaded files |
| FR-FIL-003 | File Streaming | System shall support streaming large files |
| FR-FIL-004 | File Organization | Users shall be able to organize files into folders |
| FR-FIL-005 | File Sharing | Users shall be able to generate shareable links for files |
| FR-FIL-006 | File Preview | System shall support preview for common file types (incl. PDF via react-pdf) |
| FR-FIL-007 | File Deletion | Users shall be able to delete files and folders (with trash/restore) |
| FR-FIL-008 | Rich-Text Documents | Users shall be able to create and edit rich-text documents using the TipTap editor |
| FR-FIL-009 | Document Versioning | System shall maintain version history for rich-text documents |

#### 3.1.5 Wiki System

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-WIK-001 | Wiki Creation | Users shall be able to create multiple wiki spaces |
| FR-WIK-002 | Wiki Pages | Users shall be able to create and edit pages within wikis |
| FR-WIK-003 | Page Versioning | System shall maintain version history for all page edits |
| FR-WIK-004 | Version Restore | Users shall be able to restore previous page versions |
| FR-WIK-005 | Wiki Permissions | System shall support role-based access (Owner, Admin, Editor, Viewer) |
| FR-WIK-006 | Wiki Categories | Users shall be able to categorize wiki pages |
| FR-WIK-007 | Page Watch | Users shall be able to watch pages for changes |
| FR-WIK-008 | Backlinks | System shall display backlinks between wiki pages |
| FR-WIK-009 | Wiki Search | Users shall be able to search within wikis |

#### 3.1.6 Wishlist System

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-WSH-001 | Wishlist Creation | Users shall be able to create multiple wishlists |
| FR-WSH-002 | Wishlist Items | Users shall be able to add items with name, description, price, URL, priority |
| FR-WSH-003 | Item Reservations | Users shall be able to reserve items to prevent duplicate gifting |
| FR-WSH-004 | Public Sharing | Users shall be able to share wishlists via public links |
| FR-WSH-005 | Wishlist Analytics | System shall provide statistics on wishlist items and reservations |
| FR-WSH-006 | Item Categories | Users shall be able to organize items into categories |

#### 3.1.7 Daily Tracker

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-TRK-001 | Task Management | Users shall be able to create and track tasks |
| FR-TRK-002 | Task Recurrence | System shall support recurring tasks |
| FR-TRK-003 | Daily Questions | Users shall be able to answer daily questions |
| FR-TRK-004 | Statistics | System shall provide tracking statistics and analytics |
| FR-TRK-005 | Task Categories | Users shall be able to organize tasks by category |

#### 3.1.8 User Settings

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-SET-001 | Profile Management | Users shall be able to update their profile information |
| FR-SET-002 | Avatar Upload | Users shall be able to upload profile pictures |
| FR-SET-003 | Calendar Settings | Users shall be able to configure calendar preferences |
| FR-SET-004 | Notification Settings | Users shall be able to configure notification preferences |
| FR-SET-005 | Display Settings | Users shall be able to configure theme (light/dark/system) |
| FR-SET-006 | Privacy Settings | Users shall be able to configure privacy preferences |
| FR-SET-007 | Active Sessions | Users shall be able to view and revoke active sessions |

#### 3.1.9 GDPR/User Rights

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-GDPR-001 | Data Export | Users shall be able to export all their data as JSON |
| FR-GDPR-002 | Data Access | Users shall be able to view all stored personal data |
| FR-GDPR-003 | Data Correction | Users shall be able to correct name and email |
| FR-GDPR-004 | Account Deletion | Users shall be able to delete their account |

#### 3.1.10 Social Features

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-SOC-001 | User Following | Users shall be able to follow other users |
| FR-SOC-002 | Follow Notifications | Users shall receive notifications about followed user activity |

#### 3.1.11 Music Library

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-MUS-001 | Music Upload | Users shall be able to upload audio files with metadata (title, artist) |
| FR-MUS-002 | Playback | System shall provide audio playback via a floating player visible on all pages |
| FR-MUS-003 | Playlists | Users shall be able to create, manage, and play playlists |
| FR-MUS-004 | Shuffle/Loop | System shall support shuffle and loop playback modes |
| FR-MUS-005 | Public/Private Visibility | Users shall be able to mark songs public (discoverable) or private |
| FR-MUS-006 | Discover Feed | System shall expose a public discovery feed of public songs |
| FR-MUS-007 | Ownership Transfer | Users shall be able to transfer song ownership to another user by email |
| FR-MUS-008 | Metadata Editing | Users shall be able to edit song title and artist after upload |

#### 3.1.12 Radiation Monitor

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-RAD-001 | Measurement Logging | Users shall be able to log radiation measurements (date, time window, location, avg/peak level, notes, tags, status) |
| FR-RAD-002 | Locations | Users shall be able to manage named locations with optional GPS coordinates |
| FR-RAD-003 | Unit Conversion | System shall store all levels in µSv/h and convert client-side to the user's preferred unit (µSv/h, mSv/h, nSv/h, µGy/h, mGy/h, mR/h, CPM) |
| FR-RAD-004 | CPM Configuration | Users shall be able to configure the CPM conversion factor (default 151 for SBM-20) |
| FR-RAD-005 | Status Workflow | System shall support Draft / Verified / Flagged / Archived statuses |
| FR-RAD-006 | Public Sharing | Users shall be able to mark individual measurements public; a public feed shall be exposed |
| FR-RAD-007 | Soft Delete & Restore | System shall support soft delete with audit trail, hard delete, and restore |
| FR-RAD-008 | Analytics | System shall provide time-series, per-location bar chart, and heatmap calendar analytics |

#### 3.1.13 Graphing Calculator

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-CALC-001 | Graphing | System shall provide an in-app graphing calculator (custom implementation, no external GeoGebra code) |

#### 3.1.14 Home Dashboard

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-HOME-001 | Personalized Home | System shall present a personalized dashboard with daily tracker, today's events, and quick access tiles |
| FR-HOME-002 | Layout Editor | Users shall be able to customize Home dashboard layout (Home Layout Editor) |

---

### 3.2 Performance Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| PR-001 | API Response Time | < 200ms for standard queries |
| PR-002 | File Upload | Support files up to 500MB |
| PR-003 | Concurrent Users | Support multiple simultaneous sessions per user |
| PR-004 | Database Queries | Optimize with proper indexing |
| PR-005 | Rate Limiting | Prevent abuse with configurable limits |

---

### 3.3 Security Requirements

| ID | Requirement | Description |
|----|-------------|-------------|
| SR-001 | Password Hashing | Use bcrypt with 12 salt rounds |
| SR-002 | Sensitive Data Encryption | AES-256-GCM for passwords and payment cards |
| SR-003 | Token Security | JWT with HttpOnly, Secure, SameSite cookies |
| SR-004 | Account Lockout | Lock after 5 failed attempts for 2 hours |
| SR-005 | HTTPS Support | Optional SSL/TLS support |
| SR-006 | Security Headers | Helmet.js for HTTP security headers |
| SR-007 | CORS Configuration | Restrict cross-origin requests |
| SR-008 | Input Validation | express-validator for all inputs |
| SR-009 | Rate Limiting | Multiple tiers for different endpoints |

---

### 3.4 Interface Requirements

#### 3.4.1 User Interfaces

| ID | Requirement | Description |
|----|-------------|-------------|
| UI-001 | Responsive Design | Support desktop and mobile viewports |
| UI-002 | Dark Mode | Support light, dark, and system theme |
| UI-003 | Navigation | Sidebar navigation for main features |
| UI-004 | Toast Notifications | Display success/error messages |
| UI-005 | Loading States | Show loading indicators during operations |

#### 3.4.2 API Interfaces

| ID | Requirement | Description |
|----|-------------|-------------|
| API-001 | REST Architecture | Follow REST principles |
| API-002 | JSON Format | Use JSON for request/response bodies |
| API-003 | Authentication Header | Support Bearer token or cookie-based auth |
| API-004 | Error Responses | Consistent error format with codes |

---

### 3.5 Data Requirements

#### 3.5.1 Database

| ID | Requirement | Description |
|----|-------------|-------------|
| DB-001 | MongoDB | Use MongoDB as primary database |
| DB-002 | Mongoose ODM | Use Mongoose for schema modeling |
| DB-003 | Indexing | Define indexes for optimal query performance |
| DB-004 | Data Validation | Mongoose schema validation |

#### 3.5.2 Data Models

| Model | Description |
|-------|-------------|
| User | User accounts with authentication data |
| RefreshToken | Refresh token records for multi-session support |
| Settings | Per-user preferences (display, calendar, notifications, privacy, radiation) |
| Event | Calendar events |
| Category | Event categories |
| Password | Encrypted password entries |
| PasswordCategory | Password organization categories |
| PaymentCard | Encrypted payment card data |
| File | Uploaded file metadata |
| FileFolder | File organization folders |
| DocumentVersion | Rich-text document version history |
| Wiki | Wiki spaces |
| WikiPage | Wiki page content |
| WikiVersion | Page version history |
| WikiPermission | Wiki access control |
| WikiCategory | Wiki page categories |
| WikiWatch | Page watch subscriptions |
| Wishlist | User wishlists |
| WishlistItem | Wishlist items |
| WishlistCategory | Wishlist item categories |
| WishlistReservation | Item reservations |
| TrackerTask | Daily tracker tasks |
| TrackerQuestion | Daily questions |
| TrackerResponse | Question responses |
| UserFollow | Social follow relationships |
| Music | Uploaded audio tracks with metadata and visibility |
| Playlist | User-managed playlists referencing Music tracks |
| RadiationLocation | Named radiation measurement locations |
| RadiationMeasurement | Radiation measurement records (incl. soft-delete audit) |

---

### 3.6 Design Constraints

| ID | Constraint | Description |
|----|------------|-------------|
| DC-001 | Node.js 18+ | Backend requires Node.js version 18 or higher |
| DC-002 | MongoDB 5.0+ | Database requires MongoDB version 5.0 or higher |
| DC-003 | React 19 | Frontend uses React version 19.2.4 |
| DC-004 | Environment Variables | Configuration via .env files |
| DC-005 | Docker Support | Support Docker containerization |

---

## 4. Appendix

### A. Acronyms

| Acronym | Definition |
|---------|------------|
| AES | Advanced Encryption Standard |
| API | Application Programming Interface |
| CORS | Cross-Origin Resource Sharing |
| CSCI | Computer Software Configuration Item |
| GDPR | General Data Protection Regulation |
| GCM | Galois/Counter Mode |
| JWT | JSON Web Token |
| MIL-STD | Military Standard |
| MongoDB | Mongo Database |
| ODM | Object Document Mapper |
| REST | Representational State Transfer |
| SPA | Single Page Application |
| SRS | Software Requirements Specification |
| SSL | Secure Sockets Layer |
| TLS | Transport Layer Security |

### B. Revision History

| Revision | Date | Author | Description |
|----------|------|--------|-------------|
| 1.0 | May 10, 2026 | System | Initial SRS creation |
| 1.1 | May 26, 2026 | System | Added Music, Radiation, Graphing Calculator, Home dashboard, Document versioning; expanded data model list; corrected password policy |

---

**END OF DOCUMENT**
