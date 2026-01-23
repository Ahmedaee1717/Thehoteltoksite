#!/bin/bash

# Cloudflare Web Analytics Token Setup Script
# Usage: ./add-analytics-token.sh YOUR_TOKEN_HERE

if [ -z "$1" ]; then
    echo "❌ Error: No token provided"
    echo ""
    echo "Usage: ./add-analytics-token.sh YOUR_TOKEN_HERE"
    echo ""
    echo "To get your token:"
    echo "1. Go to: https://dash.cloudflare.com"
    echo "2. Navigate to: Analytics & Logs → Web Analytics"
    echo "3. Click on your site: investay-email-system.pages.dev"
    echo "4. Click 'Manage site' button"
    echo "5. Copy the token from the JavaScript snippet"
    echo ""
    exit 1
fi

TOKEN="$1"

echo "🔧 Adding Cloudflare Web Analytics token..."

# Replace token in home page
sed -i "s/REPLACE_WITH_YOUR_TOKEN/$TOKEN/g" src/pages/home.tsx

echo "✅ Token added successfully!"
echo ""
echo "📦 Building project..."
npm run build

echo ""
echo "🚀 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name investay-email-system

echo ""
echo "🎉 Done! Your analytics tracking is now active!"
echo "📊 Data will start appearing within 2-4 hours."
echo ""
echo "Visit your dashboard:"
echo "https://www.investaycapital.com/admin/dashboard"
