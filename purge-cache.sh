#!/bin/bash

# Get Cloudflare credentials
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN not found"
  exit 1
fi

# Purge everything for the domain
echo "🔥 Purging cache for www.investaycapital.com..."
curl -X POST "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" 2>&1 | head -50

echo ""
echo "✅ Cache purge initiated"
