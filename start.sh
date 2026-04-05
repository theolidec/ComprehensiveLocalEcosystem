#!/bin/bash

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║    Comprehensive Local Ecosystem - Quick Start               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"
echo ""

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating backend/.env from example...${NC}"
    cp backend/.env.example backend/.env
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH=$(openssl rand -base64 32)
    WOPI_SECRET=$(openssl rand -base64 32)
    
    # Replace placeholder secrets
    sed -i "s/your_super_secret_jwt_key_here_replace_in_production/$JWT_SECRET/g" backend/.env
    sed -i "s/your_super_secret_refresh_key_here_replace_in_production/$JWT_REFRESH/g" backend/.env
    sed -i "s/generate-random-32-char-string-here/$WOPI_SECRET/g" backend/.env
    
    echo -e "${GREEN}✓ Secrets generated automatically${NC}"
fi

echo ""
echo "Starting all services..."
echo ""

# Build and start services
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
echo ""

# Wait for services
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🚀 All services running!                   ║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  Frontend:     http://localhost:3000                         ║${NC}"
    echo -e "${GREEN}║  Backend API:  http://localhost:3001                         ║${NC}"
    echo -e "${GREEN}║  Collabora:    http://localhost:9980                       ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "To stop: docker-compose down"
    echo "To view logs: docker-compose logs -f"
    echo ""
else
    echo -e "${RED}Some services failed to start. Check logs with:${NC}"
    echo "docker-compose logs"
fi
