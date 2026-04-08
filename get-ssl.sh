#!/bin/bash

# Configuration - UPDATE THESE BEFORE RUNNING
DOMAIN="your-domain.com"
EMAIL="your-email@example.com"

# Create required directories
mkdir -p data/certbot/{www,conf}

# Run certbot to get certificate
docker compose run --rm certbot certonly --webroot --webroot-path=/var/www/html \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d "$DOMAIN" -d "www.$DOMAIN"

# Reload nginx to pick up new certificates
docker compose exec nginx nginx -s reload
