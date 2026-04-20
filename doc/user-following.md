# User Following Module

## Overview
Social feature allowing users to follow each other and manage follower relationships.

## Data Model
```javascript
{
  follower: ObjectId (User, required),
  following: ObjectId (User, required),
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- Unique index on [follower, following]
- Index on [following, createdAt] for followers query

### Static Methods
- `follow(followerId, followingId)` - Create follow relationship
- `unfollow(followerId, followingId)` - Remove follow relationship
- `getFollowers(userId, page, limit)` - Get user's followers with pagination
- `getFollowing(userId, page, limit)` - Get who user is following with pagination

### Features
- Self-follow prevention (returns error `SELF_FOLLOW`)
- Duplicate follow returns existing record silently

## API Endpoints
Base: `/api/follow`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/follow/:userId` | Follow user |
| DELETE | `/follow/:userId` | Unfollow user |
| GET | `/:userId/followers` | List followers |
| GET | `/:userId/following` | List following |
| GET | `/following/:userId` | Check if following (returns `{isFollowing: boolean}`) |
| GET | `/public/:userId` | Get public profile with public wishlists |
| GET | `/search?q=query` | Search users (min 2 chars) |

### Query Parameters
- `page` - Pagination page (default: 1)
- `limit` - Items per page (default: 20)

## Frontend
- **File**: `frontend/src/components/Pages/UserFollowing.js`
- Tabs: Search / Following / Followers
- Pagination support

## Backend
- **Model**: `backend/models/UserFollow.js`
- Static methods: follow(), unfollow(), getFollowers(), getFollowing()
- **Routes**: `backend/routes/follow.js`

## Features
- Search users by name/email
- Follow/unfollow with one click
- Pagination for large lists
- Real-time counts
