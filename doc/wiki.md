# Wiki Module

## Overview
The Wiki module provides a comprehensive wiki/knowledge base system with hierarchical pages, version control, access permissions, categories, and collaborative editing features. Supports both private team wikis and public documentation.

## Features
- **Wiki Spaces**: Create multiple wiki workspaces
- **Hierarchical Pages**: Parent-child page relationships
- **Version Control**: Full page history with diff viewing
- **Access Control**: Owner, Admin, Editor, Viewer roles
- **Public Wikis**: Share wikis publicly or keep private
- **Categories**: Organize pages with custom categories
- **Search**: Full-text search within wiki
- **Backlinks**: Track pages linking to current page
- **Watchlist**: Monitor pages for changes
- **Infoboxes**: Structured data templates
- **Redirects**: Page aliases and redirects
- **Recent Changes**: Activity feed

## Data Models

### Wiki Schema
- `name`: String (required)
- `slug`: String (unique, required)
- `description`: String
- `owner`: ObjectId (User, required)
- `visibility`: String (enum: private/public)
- `icon`: String
- `color`: String (hex)
- `allowPublicRead`: Boolean
- `allowPublicEdit`: Boolean

### WikiPage Schema
- `wiki`: ObjectId (Wiki, required)
- `title`: String (required, trim, max 200)
- `slug`: String (required, lowercase, trim)
- `content`: String (markdown, default: '')
- `excerpt`: String (max 500, default: '')
- `parent`: ObjectId (WikiPage, default: null)
- `order`: Number (default: 0)
- `isHomePage`: Boolean (default: false)
- `redirectTo`: ObjectId (WikiPage, default: null)
- `isRedirect`: Boolean (default: false)
- `infobox`: Object (mixed, default: null)
- `tags`: [String] (lowercase, trim)
- `categories`: [ObjectId] (ref: 'WikiCategory')
- `viewCount`: Number (default: 0)
- `lastEditedBy`: ObjectId (User)
- `lastEditedAt`: Date (default: now)

### Indexes
- Unique: [wiki, slug]
- wiki + parent
- Text: title + content
- tags
- categories
- lastEditedAt

### Methods
- `generateSlug(wikiId, title)` - Create unique slug
- `getPageTree(wikiId)` - Get hierarchical tree
- `extractHeadings()` - Parse markdown headers
- `extractLinks()` - Parse [[WikiLinks]]

### WikiVersion Schema
- `page`: ObjectId (WikiPage, required)
- `wiki`: ObjectId (Wiki, required)
- `title`: String
- `content`: String
- `version`: Number
- `editSummary`: String
- `editedBy`: ObjectId (User)

### WikiPermission Schema
- `wiki`: ObjectId (Wiki, required)
- `user`: ObjectId (User, required)
- `role`: String (enum: admin/editor/viewer)
- `grantedBy`: ObjectId (User)

### WikiCategory Schema
- `wiki`: ObjectId (Wiki, required)
- `name`: String (required)
- `slug`: String (required)
- `description`: String
- `color`: String (hex)

### WikiWatch Schema
- `user`: ObjectId (User, required)
- `page`: ObjectId (WikiPage, required)
- `wiki`: ObjectId (Wiki, required)

## API Endpoints

### Wikis (`/api/wikis`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create wiki |
| GET | `/` | List my wikis |
| GET | `/public` | List public wikis |
| GET | `/:slug` | Get wiki details |
| PUT | `/:slug` | Update wiki |
| DELETE | `/:slug` | Delete wiki |
| GET | `/:slug/members` | List members |
| POST | `/:slug/members` | Add member |
| DELETE | `/:slug/members/:userId` | Remove member |

### Wiki Pages (`/api/wikis/:slug/pages`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create page |
| GET | `/` | Get page tree |
| GET | `/all` | List all pages |
| GET | `/:pageSlug` | Get page |
| PUT | `/:pageSlug` | Update page |
| DELETE | `/:pageSlug` | Delete page |
| GET | `/:pageSlug/history` | Page history |
| GET | `/:pageSlug/history/:versionId` | Specific version |
| POST | `/:pageSlug/restore/:versionId` | Restore version |
| GET | `/:pageSlug/diff` | Compare versions |
| GET | `/:pageSlug/backlinks` | Linking pages |
| POST | `/:pageSlug/move` | Move/rename page |
| POST | `/:pageSlug/redirect` | Create redirect |
| POST | `/:pageSlug/watch` | Add to watchlist |
| DELETE | `/:pageSlug/watch` | Remove from watchlist |

### Wiki Categories (`/api/wikis/:slug/categories`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List categories |
| POST | `/` | Create category |

### Watchlist (`/api/wikis/:slug/watchlist`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get watchlist |
| GET | `/` (global) | Get all watched pages |

### Recent Changes (`/api/wikis/:slug/recent-changes`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Recent edits |

### Search (`/api/wikis/:slug/search`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `?q=query` | Search pages |

## Frontend Components

### Wiki Pages
- **File**: `frontend/src/components/Pages/Wiki/` - Wiki space management
- **File**: `frontend/src/components/Pages/WikiPage.js` - Page editor/viewer
- **File**: `frontend/src/components/Pages/WikiEditor.js` - Markdown editor

### Services
- **File**: `frontend/src/services/wikiAPI.js`

## Backend Structure

### Controllers
- **Wiki**: `backend/controllers/wikiController.js` - Wiki CRUD, members
- **Wiki Pages**: `backend/controllers/wikiPageController.js` - Page operations, versions

### Routes
- **Wikis**: `backend/routes/wikis.js`
- **Wiki Pages**: `backend/routes/wikiPages.js`

## Permission Roles
| Role | Permissions |
|------|-------------|
| Owner | Full control, delete wiki |
| Admin | Manage members, edit all pages |
| Editor | Create/edit pages |
| Viewer | Read-only access |

## Markdown Features
- Headers (H1-H6)
- Bold/Italic/Strikethrough
- Links and WikiLinks `[[Page Name]]`
- Lists (ordered/unordered)
- Code blocks
- Tables
- Blockquotes
- Images
- Horizontal rules

## Error Codes
| Code | Description |
|------|-------------|
| `WIKI_EXISTS` | Wiki name already taken |
| `WIKI_NOT_FOUND` | Wiki doesn't exist |
| `WIKI_ACCESS_DENIED` | Insufficient permissions |
| `PAGE_EXISTS` | Page title already exists |
| `PAGE_NOT_FOUND` | Page doesn't exist |
| `CANNOT_DELETE_HOMEPAGE` | Home page protected |
| `PAGE_HAS_CHILDREN` | Delete children first |
| `VERSION_NOT_FOUND` | Version doesn't exist |
| `MEMBER_EXISTS` | User already member |
