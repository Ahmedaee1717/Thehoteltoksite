#!/bin/bash

# Test Mailgun Configuration
echo "🧪 Testing Mailgun Email Send..."
echo ""

# Check current MAILGUN_DOMAIN via API test
echo "📧 Attempting to send test email..."
echo "From: test@investaycapital.com"
echo "To: ahmed@investaycapital.com"
echo "Subject: Mailgun Test $(date +%s)"
echo ""

# Try to send via webhook endpoint (simulate)
curl -X POST https://www.investaycapital.com/api/email/receive \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=mailgun-test@example.com" \
  -d "to=test1@investaycapital.com" \
  -d "subject=Mailgun Configuration Test $(date +%s)" \
  -d "body-plain=This is a test to verify Mailgun webhook is working. If you see this, the webhook endpoint is accessible." \
  -d "timestamp=$(date +%s)" \
  2>&1

echo ""
echo ""
echo "✅ Webhook test complete"
echo ""
echo "Now checking if email appeared in database..."
sleep 2

# Query the database for the test email
echo "📊 Recent emails in database:"
cd /home/user/webapp && npx wrangler d1 execute investay-email-production --remote \
  --command="SELECT id, from_email, to_email, subject, received_at, created_at FROM emails WHERE subject LIKE '%Configuration Test%' ORDER BY created_at DESC LIMIT 3" 2>&1 | grep -A 30 "results"
