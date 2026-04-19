# Deployment Guide

## Overview

This guide covers deployment options for the Comprehensive Local Ecosystem, including Docker containers, Nginx reverse proxy, SSL/TLS setup, and production configuration.

## Deployment Options

```
┌──────────────────────────────────────────────────────────────┐
│                    Deployment Options                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Docker Compose (Recommended for self-hosting)            │
│     └── Single command deployment                            │
│                                                              │
│  2. Manual Server Setup                                      │
│     └── Full control over each component                     │
│                                                              │
│  3. Cloud Platform (AWS, GCP, Azure)                         │
│     └── Scalable managed services                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Docker Deployment (Recommended)

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB storage

### Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd ComprehensiveLocalEcosystem

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# 3. Start all services
docker-compose up -d

# 4. Verify deployment
docker-compose ps
curl http://localhost/health
```

### Docker Compose Services

**`docker-compose.yml`**:

```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:6
    container_name: ecosystem-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ecosystem
    volumes:
      - ./data/mongodb:/data/db
    networks:
      - ecosystem-network

  # Backend API
  backend:
    build: ./backend
    container_name: ecosystem-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      MONGODB_URI: mongodb://admin:${MONGO_ROOT_PASSWORD}@mongodb:27017/ecosystem?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    env_file:
      - backend/.env
    volumes:
      - ./data/uploads:/app/uploads
      - ./data/logs:/app/logs
    depends_on:
      - mongodb
    networks:
      - ecosystem-network

  # Frontend (served by nginx)
  frontend:
    build: ./frontend
    container_name: ecosystem-frontend
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - ecosystem-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: ecosystem-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
    depends_on:
      - backend
      - frontend
    networks:
      - ecosystem-network

networks:
  ecosystem-network:
    driver: bridge
```

### Backend Dockerfile

**`backend/Dockerfile`**:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Create required directories
RUN mkdir -p uploads logs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start server
CMD ["node", "server.js"]
```

### Frontend Dockerfile

**`frontend/Dockerfile`**:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage (nginx)
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Nginx Configuration

### Production nginx.conf

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;

    # Upstream servers
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:80;
    }

    # HTTP server (redirect to HTTPS)
    server {
        listen 80;
        server_name _;
        
        # Certbot challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        # Redirect all to HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        # SSL certificates
        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
        
        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Frontend static files
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend API
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support (if needed)
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Auth endpoints (stricter rate limiting)
        location /api/auth/ {
            limit_req zone=auth burst=5 nodelay;
            
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## SSL/TLS Setup

### Let's Encrypt (Free SSL)

**Initial Certificate**:

```bash
# Install Certbot
docker run -it --rm \
  -v "./data/certbot/conf:/etc/letsencrypt" \
  -v "./data/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --agree-tos \
  --non-interactive \
  --email your-email@example.com
```

**Auto-renewal**:

```bash
# Create renewal script (renew-ssl.sh)
#!/bin/bash
docker run --rm \
  -v "./data/certbot/conf:/etc/letsencrypt" \
  -v "./data/certbot/www:/var/www/certbot" \
  -v "/var/run/docker.sock:/var/run/docker.sock" \
  certbot/certbot renew --quiet

# Reload nginx
docker-compose exec nginx nginx -s reload
```

```bash
# Add to crontab (runs twice daily)
0 0,12 * * * /path/to/renew-ssl.sh
```

### Self-Signed SSL (Development/Internal)

```bash
# Generate certificates
mkdir -p backend/certs
cd backend/certs

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Update .env
USE_HTTPS=true
SSL_KEY_PATH=certs/server.key
SSL_CERT_PATH=certs/server.crt
```

## Production Environment Variables

### Backend `.env`

```env
# Server
PORT=3001
NODE_ENV=production
USE_HTTPS=false  # Nginx handles SSL

# Security (generate strong random values)
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<different-64-char-random-string>
PASSWORD_MASTER_KEY=<32-char-random-string>

# Database (use authenticated connection)
MONGODB_URI=mongodb://admin:STRONG_PASSWORD@mongodb:27017/ecosystem?authSource=admin

# CORS (production domain)
FRONTEND_URL=https://yourdomain.com

# Security
BCRYPT_SALT_ROUNDS=12

# Logging
LOG_LEVEL=info

# File uploads
MAX_FILE_SIZE=524288000  # 500MB
```

### Frontend `.env.production`

```env
REACT_APP_API_URL=/api
REACT_APP_VERSION=$npm_package_version
GENERATE_SOURCEMAP=false
```

## Server Setup (Manual)

### Requirements

- Ubuntu 22.04 LTS (recommended)
- 2GB RAM minimum
- 20GB storage

### Installation Steps

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# 4. Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 5. Install Nginx
sudo apt install -y nginx
sudo systemctl enable nginx

# 6. Clone and setup application
git clone <repository-url>
cd ComprehensiveLocalEcosystem

# 7. Install dependencies
npm run install:all

# 8. Build frontend
cd frontend && npm run build && cd ..

# 9. Configure environment
cp backend/.env.example backend/.env
# Edit with production values

# 10. Setup PM2 for process management
sudo npm install -g pm2
cd backend && pm2 start server.js --name ecosystem-api
cd ../frontend && pm2 serve build 3000 --name ecosystem-web
pm2 save
pm2 startup
```

### Systemd Service (Alternative to PM2)

**`/etc/systemd/system/ecosystem-backend.service`**:

```ini
[Unit]
Description=Ecosystem Backend
After=network.target mongod.service

[Service]
Type=simple
User=ecosystem
WorkingDirectory=/opt/ComprehensiveLocalEcosystem/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/ComprehensiveLocalEcosystem/backend/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ecosystem-backend
sudo systemctl start ecosystem-backend
sudo systemctl status ecosystem-backend
```

## Health Monitoring

### Health Check Endpoint

```bash
curl https://yourdomain.com/health

# Response
{
  "status": "OK",
  "timestamp": "2026-04-19T12:00:00.000Z",
  "uptime": 86400,
  "environment": "production"
}
```

### Docker Health Checks

```yaml
# docker-compose.yml
services:
  backend:
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s
```

### Monitoring with Uptime Kuma (Optional)

```bash
docker run -d \
  --name uptime-kuma \
  -p 3002:3001 \
  -v uptime-kuma-data:/app/data \
  louislam/uptime-kuma:1
```

## Backup Strategy

### MongoDB Backup

```bash
#!/bin/bash
# backup-mongodb.sh

BACKUP_DIR="/opt/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Create backup
docker exec ecosystem-mongodb mongodump \
  --uri="mongodb://admin:PASSWORD@localhost:27017/ecosystem?authSource=admin" \
  --out="/data/db/backup_$DATE"

# Compress
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "/var/lib/docker/volumes" .

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
```

### File Backup

```bash
#!/bin/bash
# backup-files.sh

BACKUP_DIR="/opt/backups/files"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /opt/ComprehensiveLocalEcosystem/backend/uploads

# Sync to remote (optional)
rsync -avz $BACKUP_DIR user@backup-server:/backups/
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * /opt/ComprehensiveLocalEcosystem/scripts/backup-mongodb.sh
0 3 * * * /opt/ComprehensiveLocalEcosystem/scripts/backup-files.sh
```

## Troubleshooting

### Container Issues

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f mongodb

# Restart service
docker-compose restart backend

# Rebuild after changes
docker-compose up -d --build backend

# Reset everything (DATA LOSS)
docker-compose down -v
docker-compose up -d
```

### SSL Issues

```bash
# Test certificate
openssl x509 -in data/certbot/conf/live/yourdomain.com/fullchain.pem -text

# Renew manually
docker-compose run --rm certbot renew

# Check nginx config
docker-compose exec nginx nginx -t
```

### Performance Issues

```bash
# Check resource usage
docker stats

# View slow queries (MongoDB)
docker-compose exec mongodb mongosh --eval "db.setProfilingLevel(2)"

# Enable query logging in backend
LOG_LEVEL=debug
```

## Security Checklist

### Pre-Deployment

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets
- [ ] Enable MongoDB authentication
- [ ] Configure CORS for production domain only
- [ ] Set NODE_ENV=production
- [ ] Disable server error details in production
- [ ] Configure log rotation
- [ ] Setup automated backups

### Post-Deployment

- [ ] Enable firewall (ufw/iptables)
- [ ] Close unused ports
- [ ] Setup fail2ban for brute force protection
- [ ] Enable SSL/TLS
- [ ] Configure security headers
- [ ] Setup monitoring and alerting
- [ ] Test backup restoration
- [ ] Document access credentials securely

## Cloud Deployment

### AWS (Example)

```bash
# Using ECS (Elastic Container Service)

# 1. Create ECR repositories
aws ecr create-repository --repository-name ecosystem-backend
aws ecr create-repository --repository-name ecosystem-frontend

# 2. Build and push images
docker build -t ecosystem-backend ./backend
docker tag ecosystem-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/ecosystem-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/ecosystem-backend:latest

# 3. Deploy to ECS
# (Use AWS Console or Terraform for full setup)
```

### Environment-Specific Notes

| Platform | Notes |
|----------|-------|
| AWS | Use ALB for SSL termination, RDS for MongoDB |
| GCP | Use Cloud Run for containers, Cloud DNS |
| Azure | Use Container Instances, Cosmos DB |
| Heroku | Use buildpacks, MongoDB Atlas |
| Railway | Native Docker support |
| Render | Native Docker support |

## Maintenance

### Regular Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| Update packages | Weekly | `apt update && apt upgrade` |
| Renew SSL | Auto (cron) | `certbot renew` |
| Backup database | Daily | `backup-mongodb.sh` |
| Review logs | Weekly | Check error.log |
| Update images | Monthly | `docker-compose pull && up -d` |
| Clean Docker | Monthly | `docker system prune` |

### Zero-Downtime Updates

```bash
# Blue-green deployment with Docker Compose
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend

# Rolling update (if using swarm)
docker service update --image ecosystem-backend:latest ecosystem_backend
```
