#!/bin/bash

# Renew Let's Encrypt certificates
docker compose run --rm certbot renew

# Reload nginx to pick up renewed certificates
docker compose exec nginx nginx -s reload
