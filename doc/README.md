# Documentation Index

Welcome to the Comprehensive Local Ecosystem documentation. This directory contains detailed documentation for every major component of the system.

## Quick Navigation

### Getting Started

| Document | Description | Audience |
|----------|-------------|----------|
| [`../README.md`](../README.md) | Project overview and quick start | Everyone |
| [`development.md`](development.md) | Development setup and workflows | Developers |
| [`deployment.md`](deployment.md) | Production deployment guide | DevOps |

### Architecture & Technical Documentation

| Document | Description | Key Topics |
|----------|-------------|------------|
| [`backend-architecture.md`](backend-architecture.md) | Backend structure and patterns | Express, middleware, controllers, services |
| [`frontend-architecture.md`](frontend-architecture.md) | Frontend structure and patterns | React, contexts, components, hooks |
| [`database-models.md`](database-models.md) | All MongoDB schemas | Models, indexes, relationships |
| [`authentication.md`](authentication.md) | Auth system deep dive | JWT, sessions, security |

### API & Module Documentation

| Document | Description | Endpoints |
|----------|-------------|-----------|
| [`api-overview.md`](api-overview.md) | Complete API reference | All endpoints |
| [`calendar.md`](calendar.md) | Calendar module | `/api/calendar/*` |
| [`categories.md`](categories.md) | Category management | `/api/categories/*` |
| [`files.md`](files.md) | File management | `/api/files/*`, `/api/file-folders/*` |
| [`passwords.md`](passwords.md) | Password manager | `/api/passwords/*` |
| [`settings.md`](settings.md) | User settings & GDPR rights | `/api/settings/*`, `/api/user/*` |
| [`wishlist.md`](wishlist.md) | Wishlist system | `/api/wishlist/*`, `/api/wishlists/*` |
| [`wiki.md`](wiki.md) | Wiki/knowledge base | `/api/wikis/*`, `/api/wikis/:slug/pages/*` |
| [`user-following.md`](user-following.md) | Social features | `/api/follow/*` |
| [`geogebra-calculator.md`](geogebra-calculator.md) | Math graphing | Frontend component |

### Security & Operations

| Document | Description | Topics |
|----------|-------------|--------|
| [`security.md`](security.md) | Security implementation | JWT, encryption, headers, CORS |
| [`deployment.md`](deployment.md) | Deployment guide | Docker, Nginx, SSL |

## Documentation by Role

### For Developers

Start here if you're contributing code:

1. [`development.md`](development.md) - Setup your environment
2. [`backend-architecture.md`](backend-architecture.md) - Understand backend patterns
3. [`frontend-architecture.md`](frontend-architecture.md) - Understand frontend patterns
4. [`database-models.md`](database-models.md) - Review data structures
5. [`api-overview.md`](api-overview.md) - API reference

### For DevOps/SRE

Start here if you're deploying or maintaining:

1. [`deployment.md`](deployment.md) - Deployment options
2. [`security.md`](security.md) - Security configuration
3. [`backend-architecture.md`](backend-architecture.md) - Server structure

### For API Consumers

Start here if you're integrating with the API:

1. [`api-overview.md`](api-overview.md) - Complete API reference
2. [`authentication.md`](authentication.md) - Authentication flow

### For Security Review

1. [`security.md`](security.md) - Security measures
2. [`authentication.md`](authentication.md) - Auth implementation
3. [`backend-architecture.md`](backend-architecture.md) - Middleware and validation

## Module Quick Reference

### Authentication & Users
- [`authentication.md`](authentication.md) - JWT, sessions, cookies
- [`settings.md`](settings.md) - User preferences, GDPR user rights (view/export/correct/delete data)
- [`user-following.md`](user-following.md) - Social features

### Content Management
- [`calendar.md`](calendar.md) - Events and scheduling
- [`files.md`](files.md) - File storage and management
- [`wiki.md`](wiki.md) - Knowledge base

### Personal Tools
- [`passwords.md`](passwords.md) - Password vault
- [`wishlist.md`](wishlist.md) - Gift registry
- [`geogebra-calculator.md`](geogebra-calculator.md) - Math graphing

### Organization
- [`categories.md`](categories.md) - Event categories

## Search Tips

- Use `grep` to search across docs: `grep -r "JWT" doc/`
- Each doc has a table of contents for easy navigation
- Code examples use syntax highlighting
- Error codes and API endpoints are documented

## Contributing to Documentation

When adding features:

1. Update relevant module docs (e.g., `calendar.md`)
2. Update `api-overview.md` if adding endpoints
3. Update `database-models.md` if adding models
4. Add architecture notes to `backend-architecture.md` or `frontend-architecture.md`

## Documentation Standards

- Markdown format
- Code blocks with language tags
- Tables for structured data
- Links between related docs
- Error codes documented

## Missing Documentation?

If you find gaps in documentation:

1. Check the main [`../README.md`](../README.md)
2. Review source code comments
3. Check this index for related topics
4. Create an issue for documentation requests

---

**Last Updated**: April 27, 2026  
**Version**: 1.0.0

## Recent Changes

### User Rights / GDPR Implementation (v2.4.0)
- **Backend**: Added `/api/user/*` endpoints for GDPR compliance
  - `GET /api/user/data` - Access all user data
  - `PUT /api/user/data` - Correct name/email
  - `DELETE /api/user/account` - Delete account (requires password)
  - `GET /api/user/export` - Export all data as JSON
- **Frontend**: Added Account tab to Settings page
  - View My Data section
  - Download My Data (JSON export)
  - Update Email form
  - Delete Account with password confirmation
- **Rate Limiting**: Added `userDataLimiter` (10 req/hour)
- **Documentation**: Updated settings.md and api-overview.md

### Payment Cards Feature (v2.5.0)
- **Backend**: Added complete payment card management system
  - New model: `PaymentCard` with AES-256-GCM encryption for card details
  - New controller: `paymentCardController.js` with CRUD operations
  - New routes: `/api/payment-cards/*` endpoints
  - Card type auto-detection (Visa, Mastercard, Amex, Discover)
  - Default card selection and favorite support
- **Frontend**: Added payment card UI to Password Manager
  - New tab for Payment Cards with visual card display
  - Visual card view with gradient backgrounds and magnetic strip
  - List view for compact card details
  - View mode toggle (visual vs list)
  - Card type color coding
  - Show/hide card details with masking
  - Set default card functionality
- **API Service**: New `paymentCardAPI.js` for frontend API calls
- **Styles**: Added payment card CSS styles to App.css
- **Documentation**: Updated passwords.md with payment card details

### Wiki System Updates (v2.3.1)
- **WikiContext**: Added `permissions` state for role-based UI controls
- **Routing**: Fixed `/wiki/:slug/new` route order to prevent path conflicts
- **Permission Methods**: Documented async `canView()` and `canEdit()` methods in Wiki model
- **Frontend Integration**: WikiView component now uses `permissions.canEdit` to show/hide "New Page" button
