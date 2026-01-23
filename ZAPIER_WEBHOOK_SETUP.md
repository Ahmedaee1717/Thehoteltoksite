# 🪝 Zapier Webhook Setup - Complete Guide

## ✅ Webhook Endpoint is READY!

Your Cloudflare webhook endpoint is now live and ready to receive meetings from Zapier:

**Webhook URL:**
```
https://www.investaycapital.com/api/meetings/webhook/zapier
```

---

## 📋 Zap Configuration

### Your Zap Details:
- **Zap ID**: 345249969
- **Status**: Ready to configure
- **Edit Link**: [Configure Webhook Action](https://zapier.com/editor/345249969)

### Trigger:
- **App**: Zapier Tables
- **Event**: New Record in Table
- **Table**: Meeting Transcripts (ID: 01KFP9A1JMZYREQSMBWGGQ726Q)

### Action:
- **App**: Webhooks by Zapier
- **Event**: POST
- **URL**: `https://www.investaycapital.com/api/meetings/webhook/zapier`

---

## 🔧 How to Configure the Webhook in Zapier

### Step 1: Open Your Zap
Go to: https://zapier.com/editor/345249969

### Step 2: Add Webhook Action
1. Click **"+ Add Step"**
2. Search for **"Webhooks by Zapier"**
3. Select **"POST"**
4. Click **"Continue"**

### Step 3: Configure the Webhook
In the **"URL"** field, enter:
```
https://www.investaycapital.com/api/meetings/webhook/zapier
```

### Step 4: Map the Data Fields
Under **"Data"** section, add these mappings:

| Field Name | Zapier Field Variable |
|------------|----------------------|
| `title` | `{{345249969__f1}}` (Meeting Title) |
| `transcript` | `{{345249969__f2}}` (Full Transcript) |
| `summary` | `{{345249969__f3}}` (Summary) |
| `meeting_url` | `{{345249969__f4}}` (Meeting URL) |
| `owner_name` | `{{345249969__f5}}` (Owner Name) |
| `date_created` | `{{345249969__f6}}` (Date Created) |

**Visual Setup:**
```
Data:
  title: [Insert Data] → Meeting Title
  transcript: [Insert Data] → Full Transcript
  summary: [Insert Data] → Summary
  meeting_url: [Insert Data] → Meeting URL
  owner_name: [Insert Data] → Owner Name
  date_created: [Insert Data] → Date Created
```

### Step 5: Test the Webhook
1. Click **"Test & Continue"**
2. Zapier will send a test POST request
3. You should see a success response:
   ```json
   {
     "success": true,
     "message": "Meeting transcript saved successfully",
     "title": "Test Meeting"
   }
   ```

### Step 6: Turn ON the Zap
1. Click **"Publish"** or **"Turn On"**
2. Your Zap is now live!

---

## 📨 Sample Webhook Payload

When a new meeting is transcribed, Zapier will send this JSON to your webhook:

```json
{
  "title": "Learn how to use Otter",
  "transcript": "Charlie 00:00\nHey Lisa, I got your email about trying Otter AI...",
  "summary": "Charlie and Lisa discuss Otter AI features...",
  "meeting_url": "https://otter.ai/note/2HHB7FX7TXPRVDAL",
  "owner_name": "Ahmed Abou El-Enin",
  "date_created": "2026-01-23T20:50:00Z"
}
```

---

## 🔄 How the Flow Works

1. **Otter.ai** records and transcribes your Zoom meeting
2. **Zapier Trigger** detects new record in "Meeting Transcripts" table
3. **Webhook Action** POSTs meeting data to Cloudflare
4. **Cloudflare Worker** receives webhook and saves to D1 database
5. **Collaboration Center** displays the new meeting instantly (auto-refresh)

---

## 🎯 What Happens After Setup

### Automatic Behavior:
✅ New meetings appear automatically (no manual sync needed)  
✅ Meetings saved to `otter_transcripts` table in D1 database  
✅ Available immediately in Collaboration Center → Meetings tab  
✅ Full transcript, summary, speakers, and URL stored  
✅ Searchable across all fields  

### Manual Sync (Backup):
- If webhook fails, users can still manually sync from Zapier Tables
- Click "Manual Sync (Backup)" button in Meetings view
- Enter Zapier API key to pull all meetings

---

## 🧪 Testing the Integration

### Test 1: Record a New Meeting
1. Schedule a Zoom meeting
2. Record and transcribe with Otter.ai
3. Wait for Otter.ai to finish transcription
4. Check Zapier → should see Zap triggered
5. Check Collaboration Center → meeting should appear

### Test 2: Send Test Webhook
You can manually test the webhook using curl:

```bash
curl -X POST https://www.investaycapital.com/api/meetings/webhook/zapier \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Meeting",
    "transcript": "This is a test transcript.",
    "summary": "Test summary",
    "meeting_url": "https://otter.ai/test",
    "owner_name": "Test User",
    "date_created": "2026-01-23T20:50:00Z"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Meeting transcript saved successfully",
  "id": 123,
  "title": "Test Meeting"
}
```

---

## 🔍 Troubleshooting

### Webhook Not Receiving Data?
1. Check Zap is turned ON
2. Verify webhook URL is correct
3. Check Zap history for errors
4. Test webhook with curl command above

### Meetings Not Appearing?
1. Hard refresh Collaboration Center (Ctrl+Shift+R)
2. Check browser console for errors
3. Verify database has records:
   ```bash
   npx wrangler d1 execute investay-email-production \
     --command="SELECT COUNT(*) FROM otter_transcripts"
   ```

### Webhook Errors?
- Check Cloudflare Workers logs
- Verify field mappings in Zapier
- Ensure all required fields are present

---

## 📊 Database Schema

Meetings are stored in the `otter_transcripts` table:

```sql
CREATE TABLE otter_transcripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  otter_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  start_time DATETIME,
  end_time DATETIME,
  duration_seconds INTEGER DEFAULT 0,
  transcript_text TEXT,
  speakers TEXT, -- JSON array
  meeting_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 Next Steps

1. ✅ Configure webhook in Zapier (follow steps above)
2. ✅ Test with a new Otter.ai meeting
3. ✅ Verify meeting appears in Collaboration Center
4. ✅ Start using meeting transcripts for AI assistant!

---

## 📞 Support

If you need help:
1. Check Zapier Zap history for errors
2. Review Cloudflare Workers logs
3. Test webhook manually with curl
4. Verify database records with wrangler CLI

**Webhook is ready to receive meetings! 🎉**
