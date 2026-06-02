# Operational Concept Description (OCD)
## Comprehensive Local Ecosystem

**Document Number**: OCD-001  
**Revision**: 1.2  
**Date**: June 2, 2026  
**Standard**: MIL-STD-498  

---

## 1. Scope

### 1.1 Identification

This document describes the Operational Concept for the Comprehensive Local Ecosystem, a full-stack personal productivity web application.

### 1.2 Purpose

The purpose of this document is to describe the operational concept from the user's perspective, including the operational environment, user characteristics, and how the system supports user tasks.

---

## 2. Referenced Documents

| Document | Description |
|----------|-------------|
| SRS.md | Software Requirements Specification |
| MIL-STD-498.md | Documentation Requirements Overview |

---

## 3. Operational Concept

### 3.1 Background

The Comprehensive Local Ecosystem was developed to provide individuals with a unified, self-hosted platform for managing their personal digital life. The system consolidates multiple productivity tools into a single, secure web application.

### 3.2 Operational Environment

| Parameter | Description |
|-----------|-------------|
| **Platform** | Web browser (Chrome, Firefox, Safari, Edge) |
| **Backend** | Node.js/Express server |
| **Database** | MongoDB |
| **Deployment** | Self-hosted or cloud deployment |
| **Users per Instance** | Single-user with multi-session support |

### 3.3 User Characteristics

**Target Users**:
- Individuals seeking personal productivity tools
- Privacy-conscious users who prefer self-hosted solutions
- Users requiring secure storage for sensitive data (passwords, payment cards)

**User Proficiency**:
- Basic computer literacy
- Familiarity with web applications
- No programming knowledge required for end users

### 3.4 Operational Scenarios

#### 3.4.1 New User Registration

1. User navigates to application URL
2. User clicks "Register" button
3. User enters email, password, and display name
4. System validates input and creates account
5. User automatically logged in and redirected to Home

#### 3.4.2 Daily Calendar Usage

1. User logs into application
2. User navigates to Calendar via sidebar
3. User creates event with title, date, time, category
4. System saves event to database
5. User can view in month/week/day views

#### 3.4.3 Password Management

1. User navigates to Password Manager
2. User adds new password entry (title, username, password, website)
3. System encrypts password using AES-256-GCM
4. User can view decrypted password on demand
5. User can copy password to clipboard

#### 3.4.4 Wiki Collaboration

1. User creates new wiki space
2. User adds pages with markdown content
3. User sets permissions for other users (if sharing)
4. Other users can view/edit based on role
5. Version history tracks all changes

#### 3.4.5 Wishlist Sharing

1. User creates wishlist for event (birthday, wedding)
2. User adds items with details and links
3. User generates public share link
4. Friends view wishlist and reserve items
5. User sees reservation status on items

#### 3.4.6 Music Library and Playback

1. User uploads audio file and enters title/artist
2. User marks song public or keeps it private
3. User creates playlists and adds songs
4. User plays music; the floating player remains visible across all pages
5. User can shuffle, loop, transfer ownership, edit metadata, or browse the Discover feed for public songs

#### 3.4.7 Radiation Measurement Logging

1. User creates named locations (with optional GPS coordinates)
2. User logs measurements (date, time window, average/peak level, status, tags)
3. System stores values in µSv/h and converts to the user's preferred unit on display
4. User reviews analytics (time-series, per-location bar chart, heatmap calendar)
5. User can mark measurements public, soft-delete with audit trail, and restore later

#### 3.4.8 Finance Tracking

1. User creates financial accounts (checking, savings, investment, income, expense, cash, credit, bridge) on the Flow Map
2. User defines money flow rules (percentage, fixed, threshold, recurring) between accounts
3. User logs deposits, withdrawals, and transfers; completed transactions update balances and trigger eligible rules
4. System cascades inflow rules automatically for bridge (routing hub) accounts
5. User reviews Analytics (net-worth history, inflow/outflow bar chart, daily flow, budget progress)
6. System takes a daily balance snapshot at 03:30 for net-worth history

---

## 4. User Classes and Characteristics

### 4.1 Primary User Class: End User

| Characteristic | Description |
|----------------|-------------|
| **Role** | Primary system user |
| **Privileges** | Full access to own data |
| **Authentication** | Email/password with JWT |
| **Session Management** | Multiple concurrent sessions |

### 4.2 Secondary User Class: Guest (Public Resources)

| Characteristic | Description |
|----------------|-------------|
| **Role** | Read-only consumer of public resources (shared wishlists, public files via share token, public music feed, public radiation feed) |
| **Privileges** | Limited to the specific shared resource |
| **Authentication** | None required for public share links; wiki access uses wiki permissions |

---

## 5. Operational Constraints

| Constraint | Description |
|------------|-------------|
| **Network** | Requires HTTP/HTTPS connectivity |
| **Browser** | Modern browser with JavaScript enabled |
| **Storage** | MongoDB for data, local filesystem for files |
| **Security** | All sensitive data encrypted at rest |

---

## 6. User Support

### 6.1 Help Resources

- In-app tooltips and guidance
- Wiki system for self-hosted documentation
- Contextual help in each module

### 6.2 Problem Reporting

- Error messages displayed in-app
- Console logs for technical issues
- Support via project issue tracker

---

## 7. Appendix

### A. Acronyms

| Acronym | Definition |
|---------|------------|
| AES | Advanced Encryption Standard |
| CSCI | Computer Software Configuration Item |
| GCM | Galois/Counter Mode |
| JWT | JSON Web Token |
| MIL-STD | Military Standard |
| MongoDB | Mongo Database |
| OCD | Operational Concept Description |

### B. Revision History

| Revision | Date | Author | Description |
|----------|------|--------|-------------|
| 1.0 | May 10, 2026 | System | Initial OCD creation |
| 1.1 | May 26, 2026 | System | Added Music and Radiation scenarios; clarified guest user class |
| 1.2 | June 2, 2026 | System | Added Finance operational scenario (3.4.8) |

---

**END OF DOCUMENT**
