# 🚀 Quick Start - Live AI Meeting Studio

## ⚡ FASTEST WAY TO TEST (30 seconds)

### Option 1: Browser Console Method

1. Open: https://www.investaycapital.com/static/live-meeting-studio.html
2. Press F12 to open browser console
3. Paste this code and press Enter:

```javascript
fetch('https://www.investaycapital.com/meetings/api/demo/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Demo meeting created:', data.meeting_id);
  window.location.href = data.url;
});
```

This will:
- Create a demo meeting with 10 transcript chunks
- Auto-redirect you to the Live Meeting Studio
- Show real-time sentiment, speaker analytics, and fact-checking

---

### Option 2: Terminal Method (if you prefer curl)

```bash
# Step 1: Create demo meeting
RESPONSE=$(curl -s -X POST "https://www.investaycapital.com/meetings/api/demo/create" \
  -H "Content-Type: application/json")

echo "$RESPONSE"

# Step 2: Extract meeting ID and open URL
MEETING_ID=$(echo "$RESPONSE" | jq -r '.meeting_id')
echo "Open this URL: https://www.investaycapital.com/static/live-meeting-studio.html?meeting=$MEETING_ID"
```

---

## 📋 WHAT YOU'LL SEE

### 1. Live Transcript (Left Panel)
- 10 messages from 3 speakers (Alice, Bob, Carol)
- Color-coded sentiment borders
- Timestamps
- 1 fact-check tooltip with sources

### 2. Meeting Vibe (Right Panel, Top)
- Sentiment emoji (😊, 😐, or 😟)
- Positive/Neutral/Negative percentage bars

### 3. Speaker Participation (Right Panel, Middle)
- Doughnut chart showing talk time
- Percentage breakdown per speaker

### 4. Fact Checks (Right Panel, Bottom)
- ✅ Verified: "We had 85% test coverage..."
- 2 source links

---

## 🎮 INTERACTIVE FEATURES TO TRY

### Test Real-Time Updates

In browser console, run this to add 3 more transcript chunks:

```javascript
fetch('https://www.investaycapital.com/meetings/api/demo/simulate-live', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    meeting_id: 'YOUR_MEETING_ID_HERE' // Replace with actual meeting_id from URL
  })
})
.then(r => r.json())
.then(data => console.log('✅ Added chunks:', data.chunks_added));
```

Watch the transcript, sentiment bars, and speaker chart update automatically!

---

## 🔑 OPTIONAL: Enable AI Features

To use **AI Co-Pilot** and **Generate Sparkpage**, add your OpenAI API key:

```bash
cd /home/user/webapp
npx wrangler pages secret put OPENAI_API_KEY --project-name investay-email-system
# Paste your key when prompted
```

Then test AI Co-Pilot:
1. Type in the chat: "Summarize the meeting"
2. Get AI-generated summary in 3-5 seconds

---

## 🐛 Troubleshooting

**Problem**: No transcript appears  
**Fix**: Wait 2 seconds for first poll, or check browser console for errors

**Problem**: Demo creation times out  
**Fix**: The production database might be slow. Try the latest preview deploy:
```javascript
// Use preview URL instead
fetch('https://84b3e76b.investay-email-system.pages.dev/meetings/api/demo/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  window.open('https://www.investaycapital.com' + data.url, '_blank');
});
```

---

## 📚 More Information

- **Full Testing Guide**: See `TESTING_GUIDE.md`
- **Technical Details**: See `LIVE_AI_MEETING_STUDIO_COMPLETE.md`
- **Current Status**: See `LIVE_AI_MEETING_STUDIO_STATUS.md`

---

**Ready?** Open the browser console and run Option 1 now! 🚀
