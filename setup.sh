#!/bin/bash

# Enhanced Authentication System Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Enhanced Authentication System Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_status "Node.js $(node -v) detected ✓"
}

# Check if MongoDB is installed and running
check_mongodb() {
    if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
        print_warning "MongoDB CLI not found. Please ensure MongoDB is installed."
        echo "Visit: https://www.mongodb.com/try/download/community"
        return
    fi
    
    # Try to connect to MongoDB
    if command -v mongosh &> /dev/null; then
        if mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
            print_status "MongoDB is running ✓"
        else
            print_warning "MongoDB is not running. Please start MongoDB service."
        fi
    elif command -v mongo &> /dev/null; then
        if mongo --eval "db.adminCommand('ping')" &> /dev/null; then
            print_status "MongoDB is running ✓"
        else
            print_warning "MongoDB is not running. Please start MongoDB service."
        fi
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    # Root dependencies
    print_status "Installing root dependencies..."
    npm install
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    print_status "Dependencies installed successfully ✓"
}

# Setup environment files
setup_environment() {
    print_step "Setting up environment configuration..."
    
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_status "Created backend/.env from template ✓"
        
        # Generate random secrets
        JWT_SECRET=$(openssl rand -base64 32)
        JWT_REFRESH_SECRET=$(openssl rand -base64 32)
        
        # Update .env with generated secrets
        sed -i.bak "s/your_super_secret_jwt_key_here_replace_in_production/$JWT_SECRET/" backend/.env
        sed -i.bak "s/your_super_secret_refresh_key_here_replace_in_production/$JWT_REFRESH_SECRET/" backend/.env
        rm backend/.env.bak
        
        print_status "Generated secure JWT secrets ✓"
    else
        print_warning "backend/.env already exists. Skipping environment setup."
    fi
}

# Create logs directory
create_logs_dir() {
    print_step "Creating logs directory..."
    
    if [ ! -d "backend/logs" ]; then
        mkdir -p backend/logs
        print_status "Created backend/logs directory ✓"
    fi
}

# Check if migration is needed
check_migration() {
    if [ -f "backend/data/users.json" ] && [ -s "backend/data/users.json" ]; then
        print_warning "Existing users.json file detected."
        echo "You may need to migrate existing users to MongoDB."
        echo "See MIGRATION_GUIDE.md for detailed instructions."
        
        read -p "Do you want to run the migration script? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_step "Running user migration..."
            
            # Create migration script if it doesn't exist
            if [ ! -f "scripts/migrateUsers.js" ]; then
                mkdir -p scripts
                cat > scripts/migrateUsers.js << 'EOF'
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Simple User schema for migration
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  isActive: { type: Boolean, default: true },
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema);

async function migrateUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/full-system-architecture');
    console.log('Connected to MongoDB');

    const usersData = await fs.readFile(
      path.join(__dirname, '../backend/data/users.json'),
      'utf8'
    );
    const users = JSON.parse(usersData);

    console.log(`Found ${users.length} users to migrate`);

    for (const userData of users) {
      const user = new User({
        email: userData.email,
        password: userData.password,
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
EOF
                print_status "Created migration script ✓"
            fi
            
            # Run migration
            cd backend
            node ../scripts/migrateUsers.js
            cd ..
            
            print_status "Migration completed ✓"
        fi
    fi
}

# Final setup checks
final_checks() {
    print_step "Performing final checks..."
    
    # Check if all required files exist
    required_files=(
        "backend/.env"
        "backend/config/database.js"
        "backend/config/logger.js"
        "backend/config/rateLimiter.js"
        "backend/models/User.js"
        "backend/models/RefreshToken.js"
        "backend/logs"
    )
    
    for file in "${required_files[@]}"; do
        if [ -e "$file" ]; then
            print_status "$file exists ✓"
        else
            print_error "$file is missing ✗"
        fi
    done
}

# Print next steps
print_next_steps() {
    echo
    print_step "Setup completed! 🎉"
    echo
    echo "Next steps:"
    echo "1. Make sure MongoDB is running"
    echo "2. Start the development servers:"
    echo "   npm run dev"
    echo
    echo "Or start individually:"
    echo "   Backend:  cd backend && npm run dev"
    echo "   Frontend: cd frontend && npm start"
    echo
    echo "Application will be available at:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3001"
    echo "   Health:   http://localhost:3001/health"
    echo
    echo "For more information, see:"
    echo "   - DOCUMENTATION.md"
    echo "   - MIGRATION_GUIDE.md"
    echo
}

# Main execution
main() {
    print_status "Starting setup process..."
    
    check_node
    check_mongodb
    install_dependencies
    setup_environment
    create_logs_dir
    check_migration
    final_checks
    print_next_steps
    
    print_status "Setup completed successfully! 🚀"
}

# Run main function
main "$@"
