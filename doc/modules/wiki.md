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

### Wiki Components (src/components/Wiki/)
| Component | File | Description |
|-----------|------|-------------|
| WikiList | `WikiList.js` | Wiki directory listing |
| WikiView | `WikiView.js` | Wiki home with page tree |
| WikiPageView | `WikiPageView.js` | Page viewer with markdown rendering |
| WikiPageEditor | `WikiPageEditor.js` | Create/edit pages |
| WikiPageHistory | `WikiPageHistory.js` | Version history viewer |
| WikiSettings | `WikiSettings.js` | Wiki configuration |
| WikiRecentChanges | `WikiRecentChanges.js` | Activity feed |

### Wiki Context (src/contexts/WikiContext.js)
Centralized state management for wiki operations:

```javascript
const { 
  wikis,           // List of all wikis (owned, team, public)
  currentWiki,     // Currently selected wiki
  currentPage,     // Currently viewed page
  pages,           // Page tree for current wiki
  loading,         // Loading state
  error,           // Error message
  permissions,     // { canView, canEdit, role, isOwner }
  
  // Actions
  fetchWikis,
  getWiki,
  createWiki,
  updateWiki,
  deleteWiki,
  
  // Page operations
  fetchPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  movePage,
  
  // Wiki features
  getPageHistory,
  restoreVersion,
  searchWiki,
  getBacklinks,
  getCategories,
  addToWatchlist,
  removeFromWatchlist
} = useWiki();
```

**Note**: The `permissions` object is populated when `getWiki()` is called and determines UI actions like showing/hiding the "New Page" button.

### Services
- **File**: `frontend/src/services/wikiAPI.js`

## Frontend Routing

Wiki routes must be defined in a specific order to avoid path conflicts:

```javascript
// Route order matters - more specific routes first
<Route path="/wiki/:slug" element={<WikiView />} />
<Route path="/wiki/:slug/new" element={<WikiPageEditor />} />  // Create page
<Route path="/wiki/:slug/:pageSlug" element={<WikiPageView />} />  // View page
<Route path="/wiki/:slug/edit/:pageSlug" element={<WikiPageEditor />} />  // Edit page
```

**Important**: The `/wiki/:slug/new` route must be declared **before** `/wiki/:slug/:pageSlug` in React Router, otherwise the `:pageSlug` pattern will match "new" first. Additionally, the `/wiki/:slug/new` route does not define a `:pageSlug` param, so `WikiPageEditor` uses `useLocation().pathname.endsWith('/new')` to detect new-page mode instead of relying on route params.

### Backend Validation

The wiki page routes use `express-validator` with `optional({ nullable: true })` on fields that may be `null` (e.g. `parentId`, `infobox`). The `{ nullable: true }` option is required because `optional()` only skips `undefined` values by default — `null` values would otherwise fail validation (e.g. `isMongoId()` fails on `null`).

## Backend Structure

### Controllers
- **Wiki**: `backend/controllers/wikiController.js` - Wiki CRUD, members
- **Wiki Pages**: `backend/controllers/wikiPageController.js` - Page operations, versions

### Routes
- **Wikis**: `backend/routes/wikis.js`
- **Wiki Pages**: `backend/routes/wikiPages.js`

### Permission Methods (Wiki Model)
Both `canView()` and `canEdit()` methods are async and check user permissions:

```javascript
// Check if user can view wiki
const canView = await wiki.canView(user);

// Check if user can edit/create pages
const canEdit = await wiki.canEdit(user);
```

These methods handle:
- Owner check (automatically allowed)
- Public wiki visibility
- WikiPermission records (admin/editor roles)

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
