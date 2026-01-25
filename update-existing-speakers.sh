#!/bin/bash
echo "🔄 Updating Existing Meetings with Auto-Detected Speakers"
echo "========================================================="

# Login
curl -s -c /tmp/update-cookies.txt -X POST https://www.investaycapital.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@investaycapital.com","password":"ahmed123"}' > /dev/null

echo "✅ Logged in"
echo ""

# Get meetings without speakers
echo "Fetching meetings without speakers..."
MEETINGS=$(curl -s -b /tmp/update-cookies.txt \
  "https://www.investaycapital.com/api/meetings/otter/transcripts?limit=50")

# Count meetings
TOTAL=$(echo "$MEETINGS" | jq '.transcripts | length')
echo "Found $TOTAL meetings"
echo ""

# Process each meeting
echo "$MEETINGS" | jq -r '.transcripts[] | select(.speakers == "" or .speakers == null) | .id' | while read -r ID; do
  echo "Processing Meeting ID: $ID"
  
  # Get full transcript
  MEETING=$(curl -s -b /tmp/update-cookies.txt \
    "https://www.investaycapital.com/api/meetings/otter/transcripts/$ID")
  
  TRANSCRIPT=$(echo "$MEETING" | jq -r '.transcript_text // .transcript.transcript_text')
  
  if [ -n "$TRANSCRIPT" ] && [ "$TRANSCRIPT" != "null" ]; then
    # Extract speakers using regex in bash (simplified)
    SPEAKERS=$(echo "$TRANSCRIPT" | grep -oP '^[A-Za-z\s]+(?=\s+\d+:\d+)' | sort -u | head -5)
    
    if [ -n "$SPEAKERS" ]; then
      # Build JSON array
      JSON_SPEAKERS="["
      FIRST=true
      while IFS= read -r NAME; do
        if [ "$FIRST" = true ]; then
          FIRST=false
        else
          JSON_SPEAKERS=",$JSON_SPEAKERS"
        fi
        JSON_SPEAKERS="${JSON_SPEAKERS}{\"name\":\"$NAME\"}"
      done <<< "$SPEAKERS"
      JSON_SPEAKERS="${JSON_SPEAKERS}]"
      
      echo "  → Detected: $JSON_SPEAKERS"
      
      # Update the meeting
      curl -s -b /tmp/update-cookies.txt -X PUT \
        "https://www.investaycapital.com/api/meetings/otter/transcripts/$ID" \
        -H "Content-Type: application/json" \
        -d "{\"speakers\":\"$JSON_SPEAKERS\"}" > /dev/null
      
      echo "  ✅ Updated"
    else
      echo "  ⚠️ No speakers found in transcript"
    fi
  else
    echo "  ⚠️ No transcript available"
  fi
  
  echo ""
done

echo "🎉 DONE! All meetings updated with auto-detected speakers"
