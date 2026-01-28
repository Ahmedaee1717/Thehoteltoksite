# 🤖 Real-Time Zoom SDK Bot Implementation Plan

**Goal:** Build a Zoom Meeting Bot that joins meetings, captures audio in real-time, and sends to Live Meeting Studio

**Timeline:** 2-3 hours  
**Cost:** FREE (uses existing Zoom SDK app)

---

## ✅ WHAT'S ALREADY COMPLETE

### Backend API (100% Ready):
- ✅ `/meetings/api/process-audio` - Processes audio chunks
  - Transcribes with Cloudflare Whisper
  - Analyzes sentiment with DistilBERT
  - Stores in database
  - Fact-checks with Perplexity
  - Updates speaker analytics

- ✅ `/meetings/api/live-updates` - Polling endpoint for UI
  - Returns new transcripts
  - Sentiment data
  - Speaker statistics

### Frontend (100% Ready):
- ✅ Live Meeting Studio UI at `/static/live-meeting-studio.html`
  - Live transcript display
  - Sentiment tracker
  - Speaker analytics chart
  - Fact-check alerts
  - AI Co-Pilot

### Database (100% Ready):
- ✅ All tables created and migrated
- ✅ zoom_transcript_chunks
- ✅ meeting_sentiment_analysis
- ✅ speaker_analytics
- ✅ meeting_fact_checks

### Credentials (100% Ready):
- ✅ Zoom SDK Client ID: `LHrJs29tQ7Gzj517tgy4og`
- ✅ Zoom SDK Client Secret: Configured in Cloudflare secrets
- ✅ Perplexity API Key: Configured in Cloudflare secrets
- ✅ OpenAI API Key: Configured in Cloudflare secrets

---

## 🚧 WHAT NEEDS TO BE BUILT

### Option 1: Zoom Meeting SDK Bot (Node.js Service)

**Architecture:**
```
Zoom Meeting (audio stream)
    ↓
Zoom Meeting SDK (Node.js bot)
    ↓
Capture audio every 5 seconds
    ↓
Convert to base64
    ↓
POST to /meetings/api/process-audio
    ↓
Cloudflare Workers AI processes
    ↓
Real-time updates in Live Studio
```

**Components needed:**
1. **Bot Service** (Node.js)
   - Zoom Meeting SDK integration
   - Audio capture pipeline
   - Base64 encoding
   - HTTP client to post to API

2. **Bot Coordinator** (Cloudflare Worker)
   - Receives webhook when meeting starts
   - Instructs bot to join meeting
   - Monitors bot status

3. **Bot User Account** (Zoom)
   - Create a bot user in your Zoom workspace
   - Assign SDK license to bot

**Limitations:**
- ❌ Cannot run on Cloudflare Workers (needs Node.js runtime)
- ❌ Requires separate server infrastructure
- ❌ More complex to maintain

---

### Option 2: Zoom Cloud Recording + Transcript API (RECOMMENDED)

**Architecture:**
```
Zoom Meeting (with recording enabled)
    ↓
Zoom Cloud Recording processes
    ↓
Webhook fires when transcript ready
    ↓
Fetch transcript from Zoom API
    ↓
Parse and chunk transcript
    ↓
Process each chunk through /process-audio
    ↓
Display in Live Studio
```

**Components needed:**
1. **Webhook Handler Enhancement** (already exists!)
   - Listen for recording.transcript_completed event
   - Fetch transcript from Zoom API
   - Parse VTT/SRT format
   - Post chunks to /process-audio

**Advantages:**
- ✅ Works with existing Cloudflare Workers infrastructure
- ✅ No separate server needed
- ✅ Uses existing Zoom OAuth
- ✅ High-quality transcripts from Zoom
- ✅ Speaker identification included

**Limitations:**
- ⚠️ Not truly real-time (5-10 min delay after meeting)
- ⚠️ Requires cloud recording enabled

---

### Option 3: Hybrid Approach (BEST FOR PRODUCTION)

**Use Option 2 now, add Option 1 later**

**Why?**
1. Get working end-to-end in 30 minutes (Option 2)
2. Test all features with real meeting data
3. Gather user feedback
4. Build real-time bot (Option 1) only if truly needed

---

## 🎯 RECOMMENDED IMPLEMENTATION: Option 2

Let's enhance the existing webhook handler to process Zoom transcripts automatically.

### Step 1: Update Webhook Handler (30 minutes)

Add handler for `recording.transcript_completed` event:

```typescript
// In src/routes/zoom.ts

webhookRoutes.post('/webhook', async (c) => {
  // ... existing verification code ...
  
  const event = payload.event
  
  // NEW: Handle transcript ready event
  if (event === 'recording.transcript_completed') {
    const meetingId = payload.object.id
    const transcriptFiles = payload.object.recording_files.filter(
      f => f.file_type === 'TRANSCRIPT'
    )
    
    for (const file of transcriptFiles) {
      // Fetch transcript file
      const vttContent = await fetchTranscriptFile(file.download_url, accessToken)
      
      // Parse VTT/SRT format
      const chunks = parseVTTTranscript(vttContent)
      
      // Process each chunk through AI pipeline
      for (const chunk of chunks) {
        await fetch('https://www.investaycapital.com/meetings/api/process-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meeting_id: meetingId,
            audio_data: null, // Already transcribed
            text: chunk.text, // Use Zoom's transcript
            timestamp_ms: chunk.timestamp,
            speaker_id: chunk.speaker
          })
        })
      }
    }
  }
})
```

### Step 2: Add Transcript Parser

```typescript
function parseVTTTranscript(vtt: string) {
  const lines = vtt.split('\n')
  const chunks = []
  
  let currentChunk = null
  
  for (const line of lines) {
    // Parse timestamp: 00:00:05.000 --> 00:00:10.000
    const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*/)
    if (timeMatch) {
      const [_, h, m, s, ms] = timeMatch
      currentChunk = {
        timestamp: (parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s)) * 1000 + parseInt(ms),
        text: '',
        speaker: 'Unknown'
      }
    }
    
    // Parse speaker and text
    if (currentChunk && line.trim() && !line.startsWith('WEBVTT')) {
      const speakerMatch = line.match(/^(.+?):\s*(.+)$/)
      if (speakerMatch) {
        currentChunk.speaker = speakerMatch[1]
        currentChunk.text = speakerMatch[2]
      } else {
        currentChunk.text += ' ' + line
      }
      
      if (currentChunk.text.length > 0) {
        chunks.push({...currentChunk})
        currentChunk = null
      }
    }
  }
  
  return chunks
}
```

### Step 3: Test with Real Meeting

1. Start a Zoom meeting with cloud recording enabled
2. Have a conversation (3-5 minutes)
3. End the meeting
4. Wait 5-10 minutes for Zoom to process
5. Webhook fires → transcript processed → appears in Live Studio

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Webhook Enhancement (30 min)
- [ ] Add `recording.transcript_completed` event handler
- [ ] Implement VTT/SRT parser
- [ ] Connect to `/process-audio` endpoint
- [ ] Test with sample VTT file
- [ ] Deploy to production

### Phase 2: Testing (30 min)
- [ ] Enable cloud recording in Zoom settings
- [ ] Start test meeting with multiple speakers
- [ ] End meeting and wait for processing
- [ ] Verify webhook fires
- [ ] Check Live Studio shows transcript
- [ ] Verify sentiment analysis works
- [ ] Test speaker analytics
- [ ] Test fact-checking

### Phase 3: Real-Time Bot (IF NEEDED - 2-3 hours)
- [ ] Set up Node.js server for bot
- [ ] Integrate Zoom Meeting SDK
- [ ] Implement audio capture
- [ ] Connect to `/process-audio`
- [ ] Deploy bot service
- [ ] Test real-time updates

---

## 🚀 LET'S START WITH PHASE 1

I'll implement the webhook enhancement to process Zoom transcripts automatically.

**This approach:**
- ✅ Uses existing infrastructure
- ✅ No new servers needed
- ✅ Works with your existing Zoom OAuth
- ✅ Can be completed in 30 minutes
- ✅ Provides high-quality transcripts with speaker identification

**After testing Phase 1, we can decide if real-time bot (Phase 3) is truly necessary.**

---

## 📞 NEXT STEPS

**Tell me:**
1. ✅ Proceed with Phase 1 (webhook enhancement)?
2. ✅ Or build full real-time Node.js bot (Phase 3)?

**My recommendation:** Start with Phase 1, test with real meetings, then decide if Phase 3 is needed.

---

**Ready to proceed?** 🚀
