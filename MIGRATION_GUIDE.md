# Migration Guide: From File Storage to MongoDB

This guide helps you migrate from the file-based authentication system to the enhanced MongoDB-based system.

## 🔄 Overview of Changes

### Backend Changes
- **Database**: JSON file storage → MongoDB with Mongoose
- **Authentication**: Single JWT → Access + Refresh tokens
- **Token Storage**: localStorage → HttpOnly cookies
- **Security**: Basic → Advanced (rate limiting, account locking, etc.)
- **Logging**: Console → Winston structured logging

### Frontend Changes
- **Auth Context**: Updated for cookie-based authentication
- **API Calls**: Modified to work with new token system
- **Error Handling**: Enhanced error codes and messages

## 📋 Migration Checklist

### Prerequisites
- [ ] MongoDB installed and running
- [ ] Node.js 18+ installed
- [ ] Backup existing user data
- [ ] New environment variables configured

### Migration Steps

#### 1. Backup Existing Users

Before migrating, backup your existing user data:

```bash
# Backup the users.json file
cp backend/data/users.json backend/data/users.json.backup
```

#### 2. Install New Dependencies

```bash
cd backend
npm install mongoose express-rate-limit winston cookie-parser
```

#### 3. Update Environment Configuration

Update your `.env` file with new variables:

```env
# Add these new variables
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_replace_in_production
MONGODB_URI=mongodb://localhost:27017/full-system-architecture
NODE_ENV=development
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

#### 4. Database Migration Script

Create a migration script to transfer existing users:

```javascript
// scripts/migrateUsers.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const User = require('../backend/models/User');

async function migrateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Read existing users
    const usersData = await fs.readFile(
      path.join(__dirname, '../backend/data/users.json'),
      'utf8'
    );
    const users = JSON.parse(usersData);

    console.log(`Found ${users.length} users to migrate`);

    // Migrate each user
    for (const userData of users) {
      const user = new User({
        _id: new mongoose.Types.ObjectId(),
        email: userData.email,
        password: userData.password, // Already hashed
        name: userData.name,
        isActive: true,
        createdAt: new Date(userData.createdAt),
        updatedAt: new Date(userData.createdAt)
      });

      await user.save();
      console.log(`Migrated user: ${userData.email}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateUsers();
```

Run the migration:

```bash
# Set environment variables
export MONGODB_URI=mongodb://localhost:27017/full-system-architecture

# Run migration
node scripts/migrateUsers.js
```

#### 5. Update Frontend

Update the frontend AuthContext:

```bash
# The frontend has been updated to work with cookies
# No manual changes needed if using the provided files
```

#### 6. Test the Migration

1. **Start the new backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Test login with existing users:**
   - Try logging in with existing user credentials
   - Verify user data is preserved
   - Check that new sessions work correctly

## 🔧 Data Mapping

### User Data Mapping

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `id` | `_id` | Converted to MongoDB ObjectId |
| `email` | `email` | Unchanged |
| `password` | `password` | Unchanged (already hashed) |
| `name` | `name` | Unchanged |
| `createdAt` | `createdAt` | Unchanged |
| N/A | `isActive` | Default: true |
| N/A | `loginAttempts` | Default: 0 |
| N/A | `lockUntil` | Default: null |

### New Features

The migrated users will have access to:

1. **Enhanced Security**
   - Account locking after failed attempts
   - Login attempt tracking
   - Device-based session management

2. **Better Token Management**
   - Automatic token refresh
   - Secure cookie storage
   - Logout from all devices

3. **Improved Logging**
   - Structured logging with Winston
   - Security event tracking
   - Performance monitoring

## 🚨 Important Notes

### Breaking Changes

1. **API Response Format**
   - New error codes and response structure
   - Frontend must handle new error formats

2. **Cookie Requirements**
   - Frontend must support cookies
   - localStorage no longer used for tokens

3. **Database Dependency**
   - MongoDB must be running
   - Connection string must be configured

### Security Considerations

1. **JWT Secrets**
   - Generate new, strong secrets
   - Use different secrets for access and refresh tokens

2. **Database Security**
   - Configure MongoDB authentication
   - Use connection strings with credentials

3. **Environment Variables**
   - Keep secrets out of version control
   - Use different values for production

## 🔄 Rollback Plan

If you need to rollback to the file-based system:

### 1. Restore Backend Files

```bash
# Restore original User model
git checkout HEAD~1 -- backend/models/User.js

# Restore original auth routes
git checkout HEAD~1 -- backend/routes/auth.js

# Restore original middleware
git checkout HEAD~1 -- backend/middleware/auth.js

# Restore original server.js
git checkout HEAD~1 -- backend/server.js
```

### 2. Restore Frontend

```bash
# Restore original AuthContext
git checkout HEAD~1 -- frontend/src/contexts/AuthContext.js

# Restore original ProtectedRoute
git checkout HEAD~1 -- frontend/src/components/ProtectedRoute.js
```

### 3. Update Dependencies

```bash
cd backend
npm uninstall mongoose express-rate-limit winston cookie-parser
```

### 4. Restore Environment

Remove new environment variables from `.env`:

```env
# Remove these lines
JWT_REFRESH_SECRET=...
MONGODB_URI=...
NODE_ENV=...
ACCESS_TOKEN_EXPIRES_IN=...
REFRESH_TOKEN_EXPIRES_IN=...
```

## 🧪 Testing After Migration

### Functional Tests

1. **User Authentication**
   - [ ] Existing users can login
   - [ ] New users can register
   - [ ] Password validation works
   - [ ] Account locking functions

2. **Token Management**
   - [ ] Access tokens expire correctly
   - [ ] Refresh tokens work automatically
   - [ ] Logout clears cookies
   - [ ] Logout from all devices works

3. **Security Features**
   - [ ] Rate limiting prevents abuse
   - [ ] Failed login attempts are tracked
   - [ ] Security headers are present

### Performance Tests

1. **Database Performance**
   - [ ] User queries are fast
   - [ ] Indexes are working
   - [ ] Connection pooling is effective

2. **API Performance**
   - [ ] Response times are acceptable
   - [ ] Rate limiting doesn't impact legitimate users
   - [ ] Memory usage is stable

## 📞 Support

### Common Migration Issues

#### 1. MongoDB Connection Failed
**Problem**: Cannot connect to MongoDB
**Solution**: 
- Verify MongoDB is running
- Check connection string format
- Ensure network accessibility

#### 2. User Migration Fails
**Problem**: Script fails to migrate users
**Solution**:
- Check file permissions
- Verify JSON format
- Check MongoDB write permissions

#### 3. Login Doesn't Work After Migration
**Problem**: Existing users cannot login
**Solution**:
- Verify password hashes were migrated correctly
- Check email format validation
- Verify user activation status

#### 4. Frontend Authentication Issues
**Problem**: Frontend cannot authenticate
**Solution**:
- Check CORS configuration
- Verify cookie settings
- Ensure axios has `withCredentials: true`

### Getting Help

1. **Check Logs**: Review both backend and frontend logs
2. **Verify Configuration**: Ensure all environment variables are set
3. **Test Database**: Verify MongoDB is accessible and data is present
4. **Network Issues**: Check firewall and network connectivity

## ✅ Post-Migration Checklist

- [ ] All existing users can login
- [ ] New user registration works
- [ ] Token refresh functions automatically
- [ ] Rate limiting is active
- [ ] Logs are being generated
- [ ] Database backups are configured
- [ ] Monitoring is set up
- [ ] Security headers are verified
- [ ] Performance is acceptable
- [ ] Documentation is updated

---

**Migration Complexity**: Medium  
**Estimated Time**: 2-4 hours  
**Downtime**: Minimal (hot migration possible)  
**Risk Level**: Low (with proper backup)
