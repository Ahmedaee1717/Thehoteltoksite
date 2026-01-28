# 🧪 Live AI Meeting Studio - Testing Guide

## 🚀 Quick Start: Test the Demo NOW (5 minutes)

The Live AI Meeting Studio is **READY TO TEST** with demo data. Follow these steps to see it in action:

---

## Step 1: Create a Demo Meeting

Open your browser and run this command in the console (F12):

```javascript
fetch('https://www.investaycapital.com/meetings/api/demo/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  console.log('Demo meeting created:', data);
  window.open(data.url, '_blank');
});
```

**Or use curl from terminal**:

```bash
curl -X POST https://www.investaycapital.com/meetings/api/demo/create \
  -H "Content-Type: application/json" | jq
```

This will:
- ✅ Create a demo meeting with ID like `demo_1738071234567`
- ✅ Insert 10 realistic transcript chunks (3 speakers having a standup meeting)
- ✅ Add sentiment analysis data (positive/neutral/negative)
- ✅ Create speaker analytics (talk time, word count)
- ✅ Add 1 fact-check example
- ✅ Return a direct URL to open the Live Meeting Studio

**Expected Response**:
```json
{
  "success": true,
  "meeting_id": "demo_1738071234567",
  "message": "Demo meeting created with 10 transcript chunks",
  "url": "/static/live-meeting-studio.html?meeting=demo_1738071234567"
}
```

---

## Step 2: Open the Live Meeting Studio

### Option A: Automatic (from Step 1)
The JavaScript above will automatically open the URL in a new tab.

### Option B: Manual
1. Copy the `meeting_id` from the response
2. Open: `https://www.investaycapital.com/static/live-meeting-studio.html?meeting=demo_1738071234567`
   (Replace with your actual meeting_id)

---

## Step 3: What You Should See

Once the page loads, you should see:

### Header Section
- 🎥 **Live Meeting Studio** title
- 📹 Red pulsing dot (indicates live status)
- ⏱️ **Meeting Duration**: Timer counting (starts from 00:00:00)
- 📝 **Session ID**: `demo_1738071234567`
- 🛑 **End Session** button (red)

### Left Column: Transcript & AI Co-Pilot

#### 1️⃣ Live Transcript Panel
- **10 transcript messages** from 3 speakers:
  - Alice Chen (A)
  - Bob Martinez (B)
  - Carol Zhang (C)
  
- **Color-coded sentiment borders**:
  - 🟢 Green border = Positive sentiment
  - ⚪ Gray border = Neutral sentiment
  - 🔴 Red border = Negative sentiment

- **One fact-check tooltip** on the message: 
  > "We had 85% test coverage last sprint. Should we aim for 90% this sprint?"
  
  Should show:
  - ✅ Green checkmark icon
  - "Verified: Test coverage reports confirm 85% code coverage for Sprint 23."
  - Source links (GitHub, CodeCov)

#### 2️⃣ AI Co-Pilot Chat
- Empty state: "Ask me anything!"
- **To test**: Type a question like:
  - "Summarize the meeting"
  - "What did Bob say?"
  - "List the action items"
  
- ⚠️ **Note**: Requires OPENAI_API_KEY to work (see Setup section below)

### Right Column: Insights Dashboard

#### 3️⃣ Live Sentiment Tracker ("Meeting Vibe")
- **Current mood emoji**: Should show 😊 (positive) or 😐 (neutral)
- **Three progress bars**:
  - 🟢 **Positive**: ~60-70% (Alice and Bob are mostly positive)
  - ⚪ **Neutral**: ~20-30%
  - 🔴 **Negative**: ~10% (Carol's API troubles)

#### 4️⃣ Speaker Talk-Time Metrics
- **Doughnut chart** with 3 segments:
  - Alice Chen (blue) - Most talking (host)
  - Bob Martinez (purple) - Medium
  - Carol Zhang (pink) - Least

- **Speaker stats list** below chart:
  - Each speaker with percentage bar
  - Percentages should add up to 100%

#### 5️⃣ Fact-Check Alerts
- **1 fact-check card**:
  - ✅ Green verified icon
  - Claim: "We had 85% test coverage..."
  - Summary: "Verified: Test coverage reports..."
  - 2 source links

#### 6️⃣ Quick Actions
- **Generate Sparkpage** (blue/purple gradient)
- **Extract Action Items** (green/teal gradient)
- **Translate Live** (orange/red gradient)

---

## Step 4: Test Real-Time Updates

The UI polls for updates every 2 seconds. To simulate live updates:

### Add More Transcript Chunks

Run this in browser console or terminal:

```javascript
// Browser console
fetch('https://www.investaycapital.com/meetings/api/demo/simulate-live', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ meeting_id: 'demo_1738071234567' }) // Use your meeting_id
})
.then(r => r.json())
.then(data => console.log('Added:', data.chunks_added, 'new chunks'));
```

```bash
# Terminal (curl)
curl -X POST https://www.investaycapital.com/meetings/api/demo/simulate-live \
  -H "Content-Type: application/json" \
  -d '{"meeting_id": "demo_1738071234567"}'
```

**Expected Behavior**:
- ✅ 3 new transcript chunks appear in the transcript panel
- ✅ Sentiment bars update
- ✅ Speaker chart updates
- ✅ Auto-scrolls to bottom (if auto-scroll is enabled)

---

## 🧪 Feature Testing Checklist

### ✅ Working Features (No API Keys Required)

- [ ] **Create demo meeting** - `/meetings/api/demo/create`
- [ ] **Live transcript display** - Shows 10 messages with avatars
- [ ] **Sentiment color-coding** - Green/gray/red borders
- [ ] **Sentiment tracker** - Shows percentage bars and mood emoji
- [ ] **Speaker analytics** - Doughnut chart displays
- [ ] **Speaker stats list** - Shows percentages per speaker
- [ ] **Fact-check display** - Shows verified fact with sources
- [ ] **Real-time polling** - Updates every 2 seconds
- [ ] **Simulate live updates** - `/meetings/api/demo/simulate-live`
- [ ] **Auto-scroll toggle** - Click to enable/disable
- [ ] **Export transcript** - Click export button
- [ ] **Duration timer** - Counts up from 00:00:00

### ⚠️ Features Requiring API Keys

- [ ] **AI Co-Pilot** - Needs `OPENAI_API_KEY`
- [ ] **Generate Sparkpage** - Needs `OPENAI_API_KEY`
- [ ] **Fact-checking (live)** - Needs `PERPLEXITY_API_KEY`
- [ ] **Translation** - Works with Cloudflare AI (no key needed)

---

## 🔑 Setup API Keys (Optional)

To enable AI Co-Pilot and Sparkpage generation:

### 1. Get OpenAI API Key
- Sign up at https://platform.openai.com
- Create API key
- Requires ~$5-20 credit for testing

### 2. Add to Cloudflare Pages

```bash
cd /home/user/webapp
npx wrangler pages secret put OPENAI_API_KEY --project-name investay-email-system
# Paste your key when prompted
```

### 3. Add Perplexity API Key (for fact-checking)

```bash
npx wrangler pages secret put PERPLEXITY_API_KEY --project-name investay-email-system
```

### 4. Verify Secrets

```bash
npx wrangler pages secret list --project-name investay-email-system
```

### 5. Test AI Co-Pilot

Once OPENAI_API_KEY is added:
1. Open Live Meeting Studio with demo meeting
2. In AI Co-Pilot chat, type: "Summarize the meeting"
3. Should get AI-generated summary within 3-5 seconds

### 6. Test Sparkpage Generation

Click **"Generate Sparkpage"** button:
- Should generate a structured Markdown document
- Includes: Executive Summary, Key Points, Decisions, Action Items
- Takes 5-10 seconds to generate

---

## 🎨 UI Elements to Verify

### Colors & Styling
- **Gradient headers**: Blue-to-purple gradients
- **Sentiment colors**:
  - Positive: Green (#10b981)
  - Neutral: Gray (#6b7280)
  - Negative: Red (#ef4444)
- **Charts**: Chart.js renders properly
- **Icons**: FontAwesome icons display
- **Responsive**: Works on desktop and tablet

### Animations
- **Red pulsing dot**: Should pulse on header
- **Progress bars**: Smooth width transitions
- **Hover effects**: Transcript lines highlight on hover
- **Auto-scroll**: Smooth scroll to bottom

---

## 🐛 Troubleshooting

### Problem: No transcript appears

**Check**:
1. Open browser console (F12)
2. Look for errors in console
3. Check Network tab - is `/meetings/api/live-updates` being called?
4. Verify meeting_id in URL matches the demo meeting created

**Fix**:
```javascript
// Check if meeting exists
fetch('https://www.investaycapital.com/meetings/api/live-updates?meeting=demo_1738071234567')
  .then(r => r.json())
  .then(data => console.log('Meeting data:', data));
```

### Problem: Sentiment bars are all 0%

**Check**: 
- Wait 2 seconds for first polling cycle
- Check if `sentiment` in API response has data

**Expected**:
```json
{
  "sentiment": {
    "positive": 6,
    "neutral": 3,
    "negative": 1
  }
}
```

### Problem: Speaker chart is empty

**Check**:
- Chart.js loaded? Check console for errors
- Speakers data in API response?

### Problem: AI Co-Pilot returns error

**Most common**: Missing OPENAI_API_KEY

**Error message**: "Sorry, I encountered an error. Please try again."

**Fix**: Add API key (see Setup section above)

---

## 📊 API Endpoints Reference

### Demo Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/meetings/api/demo/create` | Create demo meeting with 10 chunks |
| POST | `/meetings/api/demo/simulate-live` | Add 3 more chunks to existing meeting |

### Live Meeting Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meetings/api/live-updates?meeting=<id>&since=<ts>` | Poll for new updates |
| POST | `/meetings/api/process-audio` | Process audio chunk with AI |
| POST | `/meetings/api/copilot` | Ask AI Co-Pilot a question |
| POST | `/meetings/api/generate-sparkpage` | Generate meeting summary |
| POST | `/meetings/api/translate` | Translate transcript |

---

## 🎯 Next Steps After Testing

Once you've verified the demo works:

### Short-term (1-2 days)
1. ✅ Test AI Co-Pilot with OpenAI key
2. ✅ Test Sparkpage generation
3. ✅ Wire up Quick Action buttons
4. ✅ Add more demo scenarios (different meeting types)

### Medium-term (1-2 weeks)
1. 🔧 Build Zoom Meeting Bot for real audio capture
2. 🔧 Integrate with existing meetings from Zoom webhook
3. 🔧 Add translation feature UI
4. 🔧 Add export formats (PDF, DOCX, JSON)

### Long-term (1-2 months)
1. 🚀 Real-time WebSocket updates (replace polling)
2. 🚀 Advanced speaker diarization
3. 🚀 Multi-language support
4. 🚀 Meeting analytics dashboard
5. 🚀 Integration with CRM for automatic follow-ups

---

## 🎉 Success Criteria

The demo is **SUCCESSFUL** if you can:

- [x] Create a demo meeting via API
- [x] See 10 transcript messages with color-coded sentiment
- [x] See sentiment tracker with percentages and mood emoji
- [x] See speaker talk-time chart with 3 speakers
- [x] See 1 fact-check result with sources
- [x] Add more chunks and see real-time updates
- [x] Toggle auto-scroll on/off
- [x] Duration timer is counting

**BONUS** (with API keys):
- [ ] Ask AI Co-Pilot a question and get response
- [ ] Generate Sparkpage and see structured summary

---

## 📝 Sample Meeting Transcript

**Alice Chen**: "Good morning everyone! Let's start our daily standup."

**Bob Martinez**: "Yesterday I finished the user authentication module."

**Alice Chen**: "That's great! Any blockers?"

**Bob Martinez**: "No blockers. Today I'll work on the dashboard."

**Carol Zhang**: "I'm struggling with the API integration. Getting timeout errors."

**Alice Chen**: "Let me help you debug that after the standup."

**Carol Zhang**: "Thanks! According to the documentation, the timeout is 30 seconds." ✅ (fact-checked)

**Bob Martinez**: "We had 85% test coverage last sprint. Should we aim for 90% this sprint?" ✅ (fact-checked)

**Alice Chen**: "Yes! Our goal is to reach 95% coverage by Q2."

**Carol Zhang**: "That sounds challenging but achievable."

---

## 🔗 Quick Links

- **Live Meeting Studio**: https://www.investaycapital.com/static/live-meeting-studio.html
- **Meeting Dashboard**: https://www.investaycapital.com/static/zoom-bot-dashboard.html
- **Latest Deploy**: https://84b3e76b.investay-email-system.pages.dev
- **Production API**: https://www.investaycapital.com/meetings/api/
- **GitHub Repo**: https://github.com/Ahmedaee1717/Thehoteltoksite.git

---

## 💡 Pro Tips

1. **Open browser console** (F12) to see API calls and responses
2. **Use Network tab** to debug API issues
3. **Test in Chrome/Edge** for best compatibility
4. **Use Ctrl+Shift+R** to hard refresh and clear cache
5. **Create multiple demo meetings** to test different scenarios

---

**Ready to test? Run Step 1 now!** 🚀
