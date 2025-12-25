# 📧 How to Test Email Sending from Frontend

## ✅ EMAIL SENDING IS WORKING!

The backend API is confirmed working. Here's how to test from the frontend:

---

## 🚀 Step-by-Step Guide:

### 1. Open InvestMail
Go to: **https://3000-ivn8as47qxbnu8dje62yt-0e616f0a.sandbox.novita.ai/mail**

### 2. Click "Compose" Button
- Look for the **"✉ Compose"** button in the top right area
- Click it to open the compose modal

### 3. Fill in Email Details

**IMPORTANT:** You can only send to: **ahmed.enin@virgingates.com** (your authorized recipient)

Fill in:
- **To**: `ahmed.enin@virgingates.com`
- **Subject**: `Test from InvestMail Frontend`
- **Body**: Your message (can be anything)

### 4. Click "Send"

The system will:
1. Show console logs (open browser DevTools to see)
2. Send email via Mailgun API
3. Store in database
4. Show success/error message

### 5. Check Results

**If Successful:**
```
✅ Email sent successfully via Mailgun!

Message ID: <...@mailgun.org>
```

**If Failed (wrong recipient):**
```
⚠️ Email saved but not sent:

Sandbox subdomains are for test purposes only. 
Please add your own domain or add the address 
to your authorized recipients.
```

---

## 🔍 Debugging:

### Open Browser Console:
1. Press **F12** or **Cmd+Option+I** (Mac)
2. Go to **Console** tab
3. You'll see:
   ```
   Sending email: {from: "admin@...", to: "...", subject: "...", body: "..."}
   Send result: {success: true, emailSent: true, messageId: "..."}
   ```

### Check Server Logs:
```bash
pm2 logs investay-capital --nostream --lines 20
```

Look for:
- `✅ Email sent successfully`
- `✅ Email sent via Mailgun: <messageId>`
- Any error messages

---

## ⚠️ Common Issues:

### Issue: "Email saved but not sent"
**Cause:** Sending to non-authorized recipient

**Fix:** 
1. Only send to: `ahmed.enin@virgingates.com`
2. OR add more authorized recipients in Mailgun dashboard

### Issue: "Network error"
**Cause:** API not reachable

**Fix:**
1. Check if server is running: `pm2 list`
2. Restart server: `pm2 restart investay-capital`

---

## ✅ Confirmed Working:

These API calls are tested and working:

```bash
# Test 1: Direct API call
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "from": "admin@investaycapital.com",
    "to": "ahmed.enin@virgingates.com",
    "subject": "Test",
    "body": "Hello!"
  }'

# Result: ✅ SUCCESS
# Message ID: <20251225044502...@mailgun.org>
```

```bash
# Test 2: With AI features
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "from": "admin@investaycapital.com",
    "to": "ahmed.enin@virgingates.com",
    "subject": "Test from Frontend Simulation",
    "body": "Testing",
    "useAI": true
  }'

# Result: ✅ SUCCESS
# Message ID: <20251225044840...@mailgun.org>
```

---

## 📊 What Gets Logged:

### Frontend Console:
```javascript
Sending email: {
  from: "admin@investaycapital.com",
  to: "ahmed.enin@virgingates.com",
  subject: "Test",
  body: "Hello!",
  useAI: true
}

Send result: {
  success: true,
  emailSent: true,
  emailId: "eml_xyz123",
  messageId: "<...@mailgun.org>",
  message: "✅ Email sent successfully via Mailgun and saved to database"
}
```

### Backend Logs:
```
✅ Mailgun client initialized
✅ Email sent successfully: { id: '...', message: 'Queued' }
✅ Email sent via Mailgun: <messageId>
POST /api/email/send 200 OK
```

---

## 🎯 Quick Test Script:

1. Open: https://3000-ivn8as47qxbnu8dje62yt-0e616f0a.sandbox.novita.ai/mail
2. Press **F12** (open console)
3. Click **"✉ Compose"**
4. Enter:
   - To: `ahmed.enin@virgingates.com`
   - Subject: `Frontend Test`
   - Body: `This is a test`
5. Click **"Send"**
6. Watch console logs
7. Check for success message
8. Check your email inbox!

---

## 📧 Expected Outcome:

After sending:
1. ✅ Success popup appears
2. ✅ Email appears in your inbox (ahmed.enin@virgingates.com)
3. ✅ Email stored in database
4. ✅ Message ID returned from Mailgun
5. ✅ Console shows full details

---

## 🔥 System is WORKING!

The email sending is fully functional. Just make sure to send to your authorized recipient email address!

**Try it now!** 🚀
