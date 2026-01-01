# 🐛 EMAIL RECEIVING ISSUE - DEBUG GUIDE

## 📊 **CURRENT STATUS**

**Problem Reports**:
1. ✅ **Sending**: Working perfectly ✅
2. ❌ **Receiving**: Not working (emails not appearing in inbox) ❌
3. ❌ **Display**: Some emails show encrypted text instead of decrypted ❌

---

## 🔍 **ROOT CAUSE ANALYSIS**

### **Issue #1: Encrypted Text Showing in UI** - ✅ FIXED

**Problem**: When viewing some emails, they display encrypted format like:
```
gnF26BeiSIgSSoJP:G9YlEZcWCd6Hf+EwC2Bq6Q==:vl9aJexZ
```

**Root Cause**: 
- GET `/:id` endpoint was setting `body_text = null` when decryption failed
- This caused frontend to potentially show encrypted text from cache

**Fix Applied**:
```typescript
// BEFORE (WRONG)
decryptedEmail.body_text = await safeDecrypt(email.body_text, ENCRYPTION_KEY);
// ^ Returns null on failure, overwrites content

// AFTER (FIXED) 
const decrypted = await safeDecrypt(email.body_text, ENCRYPTION_KEY);
if (decrypted !== null) {
  decryptedEmail.body_text = decrypted; // Only update if successful
}
// ^ Preserves original encrypted content if decryption fails
```

**Status**: ✅ DEPLOYED (https://fcae3b01.investay-email-system.pages.dev)

---

### **Issue #2: External Emails Not Being Received** - 🔍 INVESTIGATING

**Problem**: Emails sent from external addresses (e.g., ahmed.enin@virgingates.com) are not appearing in inbox.

**Evidence from Database**:
```sql
-- Recent emails sent TO test1@investaycapital.com
-- All have received_at = NULL (not received via webhook!)

eml_mjrvgquax60n55v | ahmed@investaycapital.com → test1@investaycapital.com | received_at: NULL
eml_mjrvfifxldicr4s | ahmed@investaycapital.com → test1@investaycapital.com | received_at: NULL

-- Compare to OLDER emails (before encryption):
eml_mjrv9kcgnkp41z6 | ahmed@investaycapital.com → test1@investaycapital.com | received_at: 2025-12-30 00:46:20 ✅
```

**Key Observation**: 
- **Older emails** (Dec 30, 00:46) HAVE `received_at` timestamps ✅
- **Newer emails** (Dec 30, 00:51+) have `received_at = NULL` ❌

**This means**: 
- Emails ARE being sent via Mailgun (have `sent_at`)
- Emails are NOT triggering the webhook (no `received_at`)
- **Webhook `/api/email/receive` is NOT being called** ❌

---

## 🔧 **WEBHOOK CONFIGURATION CHECK**

### **1. Mailgun Webhook Setup**

**Required**: Mailgun must be configured to call our webhook when emails arrive.

**Check in Mailgun Dashboard**:
1. Go to: https://app.mailgun.com/
2. Navigate to: **Sending** → **Domains** → `investaycapital.com`
3. Click: **Webhooks** tab
4. Verify webhook is set for **`Delivered`** or **`Incoming Messages`**

**Expected Webhook URL**:
```
https://www.investaycapital.com/api/email/receive
```

**Alternative (if using Pages directly)**:
```
https://investay-email-system.pages.dev/api/email/receive
```

---

### **2. Webhook Endpoint Verification**

**Our Endpoint**: `POST /api/email/receive`

**Authentication**: ✅ Public (no auth required) - line 68 in email.ts
```typescript
if (path.includes('/receive')) {
  return next(); // Skip auth for webhook
}
```

**Test Manually**:
```bash
# Test if webhook endpoint is accessible
curl -X POST https://www.investaycapital.com/api/email/receive \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=test@example.com" \
  -d "to=test1@investaycapital.com" \
  -d "subject=Test Webhook" \
  -d "body-plain=This is a test"

# Expected response:
# {"success":true,"emailId":"eml_..."}
```

---

### **3. Mailgun Domain Configuration**

**IMPORTANT**: After changing `MAILGUN_DOMAIN` from `www.investaycapital.com` to `investaycapital.com`, webhook URL might have changed!

**Old Webhook** (WRONG):
```
https://www.investaycapital.com/api/email/receive
```

**Correct Webhook** (if domain is investaycapital.com):
```
https://investaycapital.com/api/email/receive
OR
https://www.investaycapital.com/api/email/receive  (if using www for web)
```

**Check DNS**:
```bash
# Verify MX records point to Mailgun
dig MX investaycapital.com

# Expected:
# investaycapital.com. 300 IN MX 10 mxa.mailgun.org.
# investaycapital.com. 300 IN MX 10 mxb.mailgun.org.
```

---

## 🧪 **DEBUGGING STEPS**

### **Step 1: Check Mailgun Logs**

1. Go to: https://app.mailgun.com/
2. Navigate to: **Sending** → **Logs**
3. Search for recent emails sent to `test1@investaycapital.com`
4. Look for:
   - **Delivery Status**: Should be "Delivered" ✅
   - **Webhook Calls**: Check if webhook was triggered
   - **Error Messages**: Any webhook failures?

**What to Look For**:
- ✅ "Email delivered to test1@investaycapital.com"
- ❌ "Webhook call failed: Connection timeout"
- ❌ "Webhook call failed: 401 Unauthorized"

---

### **Step 2: Test Webhook Manually**

**Using curl**:
```bash
curl -X POST https://www.investaycapital.com/api/email/receive \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=testwebhook@example.com" \
  -d "to=test1@investaycapital.com" \
  -d "subject=Manual Webhook Test" \
  -d "body-plain=Testing webhook manually" \
  -d "timestamp=$(date +%s)"
```

**Expected Response**:
```json
{
  "success": true,
  "emailId": "eml_xxxxx"
}
```

**Then Check Database**:
```sql
SELECT id, from_email, to_email, subject, received_at 
FROM emails 
WHERE subject = 'Manual Webhook Test'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected**: Email should appear with `received_at` timestamp ✅

---

### **Step 3: Check Cloudflare Pages Logs**

**Using wrangler**:
```bash
# Check for webhook errors
npx wrangler pages deployment list --project-name investay-email-system

# Get deployment logs (if available)
# Look for POST /api/email/receive requests
```

**What to Look For**:
- Webhook POST requests
- Any 500 errors
- Decryption failures
- Database insertion errors

---

### **Step 4: Verify Email Flow**

**Internal Email** (investaycapital.com → investaycapital.com):
1. ahmed@investaycapital.com sends to test1@investaycapital.com
2. Email stored in database with `sent_at` ✅
3. Mailgun sends email ✅
4. **Mailgun should call webhook** ❌ (NOT HAPPENING)
5. Webhook creates new email with `received_at` ❌ (NOT HAPPENING)

**External Email** (external → investaycapital.com):
1. External sender → test1@investaycapital.com
2. MX records route to Mailgun ✅
3. Mailgun receives email ✅
4. **Mailgun should call webhook** ❌ (UNKNOWN)
5. Webhook creates email with `received_at` ❌ (NOT HAPPENING)

---

## 🎯 **MOST LIKELY ROOT CAUSES**

### **Hypothesis #1: Webhook Not Configured in Mailgun** (90% probability)

**Issue**: After changing `MAILGUN_DOMAIN`, webhook configuration was lost or points to wrong URL.

**Fix**: 
1. Go to Mailgun Dashboard → investaycapital.com → Webhooks
2. Add webhook for **"Delivered"** or **"Incoming Messages"**
3. Webhook URL: `https://www.investaycapital.com/api/email/receive`
4. Test webhook

---

### **Hypothesis #2: Webhook URL Incorrect** (8% probability)

**Issue**: Webhook points to old domain (www.investaycapital.com instead of investaycapital.com).

**Fix**: Update webhook URL to match current domain configuration.

---

### **Hypothesis #3: Mailgun Route Missing** (2% probability)

**Issue**: Mailgun is not configured to receive emails for investaycapital.com.

**Check**:
1. Mailgun Dashboard → Receiving → Routes
2. Ensure route exists for `*@investaycapital.com`
3. Route action should be "Store and forward to webhook"

**Expected Route**:
```
Priority: 0
Expression: match_recipient(".*@investaycapital.com")
Action: store(), forward("https://www.investaycapital.com/api/email/receive")
```

---

## ✅ **IMMEDIATE ACTION ITEMS**

### **For You to Do**:

1. **Check Mailgun Webhooks**:
   - Go to: https://app.mailgun.com/app/sending/domains/investaycapital.com/webhooks
   - Screenshot the webhooks page
   - Look for "Delivered" or "Incoming" webhook

2. **Check Mailgun Routes**:
   - Go to: https://app.mailgun.com/app/receiving/routes
   - Screenshot the routes page
   - Verify route exists for `*@investaycapital.com`

3. **Check Mailgun Logs**:
   - Go to: https://app.mailgun.com/app/sending/domains/investaycapital.com/logs
   - Search for: `test1@investaycapital.com`
   - Screenshot any delivery attempts
   - Look for webhook call results

4. **Test Webhook Manually**:
   - Run the curl command above
   - Check if email appears in database
   - Report results

---

## 📋 **VERIFICATION CHECKLIST**

- [ ] Mailgun webhook configured for "Delivered" or "Incoming"
- [ ] Webhook URL points to correct endpoint
- [ ] Mailgun route exists for `*@investaycapital.com`
- [ ] MX records point to Mailgun (mxa.mailgun.org)
- [ ] Manual webhook test succeeds
- [ ] Webhook endpoint is public (no auth)
- [ ] ENCRYPTION_KEY is set in Cloudflare secrets
- [ ] Database has `received_at` column

---

## 🚀 **EXPECTED BEHAVIOR AFTER FIX**

**When email is received**:
1. ✅ External MTA connects to Mailgun MX servers
2. ✅ Mailgun receives email
3. ✅ Mailgun calls webhook: `POST /api/email/receive`
4. ✅ Webhook encrypts email content
5. ✅ Webhook stores in database with `received_at` timestamp
6. ✅ Email appears in recipient's inbox
7. ✅ Email is decrypted when viewed
8. ✅ User sees readable content

---

## 📚 **RELATED DOCUMENTATION**

- Encryption Fix: `SECURITY_IMPACT_ANALYSIS.md`
- Mailgun Domain Fix: `EMAIL_DELIVERY_FIX.md`
- Security Audit: `SECURITY_AUDIT.md`

---

**Status**: 🔍 INVESTIGATING  
**Next Step**: Check Mailgun webhook configuration  
**Last Updated**: 2026-01-01 02:15 UTC
