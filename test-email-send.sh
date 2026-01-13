#!/bin/bash

# Test sending email via production API
URL="https://www.investaycapital.com/api/email/send"

# Create test payload
PAYLOAD=$(cat <<JSON
{
  "from": "test1@investaycapital.com",
  "to": "ahmed.enin@virgingates.com",
  "subject": "PRODUCTION TEST - FINAL FIX",
  "body": "This email was sent via automated test to verify the TDZ fix is working.",
  "useAI": false,
  "attachments": []
}
JSON
)

echo "🔬 Testing email send to production..."
echo "URL: $URL"
echo ""

# Send request
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d "$PAYLOAD")

# Extract HTTP code
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "📊 Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""
echo "📡 HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ SUCCESS!"
else
  echo "❌ FAILED!"
fi
