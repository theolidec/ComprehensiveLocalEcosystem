# Wishlist Module

## Overview
Gift registry and wishlist management system with templates, categories, items, and reservation tracking for collaborative gift giving.

## Features
- **Templates**: Birthday, Christmas, Wedding, Baby Shower, Housewarming
- **Categories**: Organize items by category
- **Item Management**: Add/edit/delete items with links, prices, priorities
- **Reservations**: Others can reserve items without owner seeing
- **Public Sharing**: Share wishlists via link
- **Collaborative**: Multiple people can view and reserve

## Data Models

### Wishlist
```javascript
{
  name: String,
  description: String,
  user: ObjectId,
  isDefault: Boolean,
  template: String (birthday/christmas/wedding/baby_shower/housewarming),
  coverImage: String,
  color: String (hex)
}
```

### WishlistCategory
```javascript
{
  name: String,
  wishlist: ObjectId,
  color: String,
  order: Number
}
```

### WishlistItem
```javascript
{
  title: String (required, trim, max 100),
  description: String (trim, max 500),
  url: String (trim, must be valid URL),
  price: Number (min: 0),
  currency: String (enum: USD, EUR, GBP, CAD, AUD, NOK, SEK, DKK, default: 'USD'),
  priority: String (enum: low/medium/high/must-have, default: 'medium'),
  wishlist: ObjectId (ref: 'Wishlist', default: null),
  category: String (default: 'Birthday'),
  imageUrl: String (trim),
  user: ObjectId (required, ref: 'User'),
  isPublic: Boolean (default: false),
  shareToken: String (unique, sparse),
  status: String (enum: active/purchased/archived, default: 'active'),
  reservations: [ObjectId] (ref: 'WishlistReservation')
}
```

### Indexes
- user + category
- user + status
- category + isPublic
- shareToken
- user + wishlist

### WishlistReservation
```javascript
{
  item: ObjectId (ref: 'WishlistItem', required),
  reservedBy: ObjectId (ref: 'User', required),
  wishlist: ObjectId (ref: 'Wishlist', required),
  message: String,
  status: String (enum: reserved/purchased/cancelled, default: 'reserved'),
  isAnonymous: Boolean (default: false),
  reservedAt: Date (default: now),
  createdAt: Date,
  updatedAt: Date
}
```

## Templates

| Template | Color | Icon | Default Categories |
|----------|-------|------|-------------------|
| Birthday | Purple | 🎁 | Gifts, Experience, Decorations, Food |
| Christmas | Green | 🎁 | Gifts, Decorations, Food, Traditions |
| Wedding | Pink | ❤️ | Registry, Honeymoon, Decorations, Guest List |
| Baby Shower | Orange | 👶 | Gifts, Decorations, Food, Games |
| Housewarming | Blue | 🏠 | Appliances, Decor, Furniture, Essentials |

## API Endpoints

### Wishlists
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wishlists` | Create |
| GET | `/api/wishlists` | List my wishlists |
| GET | `/api/wishlists/templates` | Get templates |
| GET | `/api/wishlists/:id` | Get wishlist |
| PUT | `/api/wishlists/:id` | Update |
| DELETE | `/api/wishlists/:id` | Delete |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wishlists/:id/categories` | Create category |
| GET | `/api/wishlists/:id/categories` | List categories |
| PUT | `/api/wishlist-categories/:id` | Update category |
| DELETE | `/api/wishlist-categories/:id` | Delete category |

### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wishlist` | List my items |
| GET | `/api/wishlist/stats` | Get item stats |
| GET | `/api/wishlist/analytics` | Get detailed analytics |
| GET | `/api/wishlist/:id` | Get single item |
| POST | `/api/wishlist` | Create item |
| PUT | `/api/wishlist/:id` | Update item |
| DELETE | `/api/wishlist/:id` | Delete item |
| POST | `/api/wishlist/:id/share` | Share/unshare item |

### Reservations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wishlist/:id/reserve` | Reserve item |
| GET | `/api/wishlist/:id/reservations` | View reservations (owner) |
| DELETE | `/api/wishlist/reservations/:reservationId` | Cancel reservation |
| GET | `/api/wishlist/public/:token` | Get public item by share token |

## Frontend
- **File**: `frontend/src/components/Pages/Wishlist/` - Wishlist management
- **File**: `frontend/src/components/Pages/WishlistPublic.js` - Public view

## Backend
- **Models**: `backend/models/Wishlist.js`, `WishlistCategory.js`, `WishlistItem.js`, `WishlistReservation.js`
- **Routes**: `backend/routes/wishlists.js`, `wishlist.js`, `wishlistCategories.js`

## Privacy
- Owners see all items but not reserver identities
- Public view hides reservation details
- Reservations marked as anonymous hide reserver name

## Error Codes
| Code | Description |
|------|-------------|
| `WISHLISTS_FETCH_ERROR` | Failed to fetch wishlists |
| `WISHLIST_NOT_FOUND` | Wishlist doesn't exist |
| `WISHLIST_CREATE_ERROR` | Failed to create wishlist |
| `WISHLIST_UPDATE_ERROR` | Failed to update wishlist |
| `WISHLIST_DELETE_ERROR` | Failed to delete wishlist |
| `DUPLICATE_NAME` | Wishlist name already exists |
| `DEFAULT_PROTECTED` | Cannot modify/delete default wishlist |
| `ITEMS_FETCH_ERROR` | Failed to fetch wishlist items |
| `ITEM_NOT_FOUND` | Item doesn't exist |
| `ITEM_CREATE_ERROR` | Failed to create item |
| `ITEM_UPDATE_ERROR` | Failed to update item |
| `ITEM_DELETE_ERROR` | Failed to delete item |
| `SHARE_ERROR` | Failed to toggle sharing |
| `RESERVE_ERROR` | Failed to reserve item |
| `RESERVATION_NOT_FOUND` | Reservation doesn't exist |
| `CANCEL_RESERVATION_ERROR` | Failed to cancel reservation |
| `ALREADY_PURCHASED` | Item already purchased |
| `ACCESS_DENIED` | Insufficient permissions |
| `STATS_ERROR` | Failed to get statistics |
| `ANALYTICS_ERROR` | Failed to get analytics |
| `CATEGORY_CREATE_ERROR` | Failed to create category |
| `CATEGORY_NOT_FOUND` | Category doesn't exist |
| `CATEGORY_UPDATE_ERROR` | Failed to update category |
| `CATEGORY_DELETE_ERROR` | Failed to delete category |
| `DUPLICATE_CATEGORY_NAME` | Category name already exists |
| `DEFAULT_CATEGORY_PROTECTED` | Cannot delete default category |
| `VALIDATION_ERROR` | Input validation failed |
| `SERVER_ERROR` | Internal server error |
