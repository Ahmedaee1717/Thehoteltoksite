# 🔧 EMAIL SEND/RECEIVE TROUBLESHOOTING GUIDE

## 🚨 **SYMPTOMS**

- ✅ Emails NOT sending
- ✅ Emails NOT receiving  
- ⚠️ Changed MAILGUN_DOMAIN but still broken

---

## 🔍 **STEP-BY-STEP DIAGNOSIS**

### **Step 1: Verify Mailgun Domain Setup**

**Login to Mailgun Dashboard**:
1. Go to: https://app.mailgun.com/
2. Navigate to: **Sending → Domains**
3. Find: `investaycapital.com`

**Check Domain Status**:
```
✅ Status: Active (green checkmark)
✅ State: Verified
✅ DNS Records: All green checkmarks

OR

❌ Status: Unverified (red/orange)
❌ State: Pending verification
❌ DNS Records: Missing or incorrect
```

---

### **Step 2: Verify DNS Records**

**Required DNS Records** (must be on `investaycapital.com`):

#### **MX Records** (for receiving):
```dns
investaycapital.com.  MX  10  mxa.mailgun.org.
investaycapital.com.  MX  10  mxb.mailgun.org.
```

#### **TXT Records** (for sending):
```dns
; SPF (anti-spam)
investaycapital.com.  TXT  "v=spf1 include:mailgun.org ~all"

; DKIM (authentication)
k1._domainkey.investaycapital.com.  TXT  "k=rsa; p=MIGf..."
```

**How to Check**:
```bash
# Check MX records
dig +short MX investaycapital.com

# Check SPF
dig +short TXT investaycapital.com | grep spf

# Check DKIM
dig +short TXT k1._domainkey.investaycapital.com
```

**Expected Results**:
```
MX: Should show mxa.mailgun.org and mxb.mailgun.org
SPF: Should show "v=spf1 include:mailgun.org ~all"
DKIM: Should show long RSA public key
```

---

### **Step 3: Verify Mailgun API Key**

**Find API Key**:
1. Mailgun Dashboard → **Account → Security → API Keys**
2. Look for: **Private API key** (starts with `key-...`)

**Test API Key**:
```bash
# Replace with your actual key
curl -s --user 'api:YOUR_MAILGUN_API_KEY' \
  https://api.mailgun.net/v3/domains/investaycapital.com
```

**Expected Response**:
```json
{
  "domain": {
    "name": "investaycapital.com",
    "state": "active",
    "created_at": "...",
    ...
  }
}
```

**If Error**:
```json
{
  "message": "Invalid API key"
}
```
→ API key is wrong, regenerate it in Mailgun dashboard

---

### **Step 4: Check Cloudflare Secrets**

**List Current Secrets**:
```bash
cd /home/user/webapp
npx wrangler pages secret list --project-name investay-email-system
```

**Required Secrets**:
```
✅ MAILGUN_API_KEY - Private API key from Mailgun
✅ MAILGUN_DOMAIN - investaycapital.com (NO www)
✅ MAILGUN_REGION - US (or EU)
```

**Update if Wrong**:
```bash
# API Key
echo "key-YOUR_ACTUAL_KEY" | npx wrangler pages secret put MAILGUN_API_KEY --project-name investay-email-system

# Domain (already fixed)
echo "investaycapital.com" | npx wrangler pages secret put MAILGUN_DOMAIN --project-name investay-email-system

# Region
echo "US" | npx wrangler pages secret put MAILGUN_REGION --project-name investay-email-system
```

---

### **Step 5: Test Email Send**

**Via Production API**:
```bash
# Get auth token first (login)
curl -X POST https://www.investaycapital.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@investaycapital.com","password":"YOUR_PASSWORD"}' \
  -c cookies.txt

# Send test email
curl -X POST https://www.investaycapital.com/api/email/send \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "to": "test1@investaycapital.com",
    "subject": "Test Email",
    "body": "This is a test email"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "emailSent": true,
  "emailId": "eml_...",
  "messageId": "<...@mg.investaycapital.com>",
  "message": "✅ Email sent successfully via Mailgun"
}
```

**If Error**:
```json
{
  "success": false,
  "error": "Mailgun API error: ..."
}
```

---

### **Step 6: Check Mailgun Logs**

**View Send Logs**:
1. Mailgun Dashboard → **Sending → Logs**
2. Filter: Last 1 hour
3. Look for: Status = "accepted" or "failed"

**Common Errors**:
```
❌ "Domain not found" 
   → MAILGUN_DOMAIN is wrong or domain not added

❌ "Authentication failed"
   → MAILGUN_API_KEY is wrong or expired

❌ "SPF/DKIM validation failed"
   → DNS records not set up correctly

❌ "Recipient rejected"
   → Receiving server blocked the email
```

---

### **Step 7: Test Receiving (Webhook)**

**Webhook URL**:
```
https://www.investaycapital.com/api/email/receive
```

**Configure in Mailgun**:
1. Mailgun Dashboard → **Sending → Webhooks**
2. Find: `investaycapital.com`
3. Add webhook:
   - Event: **incoming**
   - URL: `https://www.investaycapital.com/api/email/receive`

**Test Webhook**:
```bash
# Send email FROM external Gmail TO test1@investaycapital.com
# Check if it arrives in inbox
```

**If Not Receiving**:
- Check MX records are correct
- Check webhook is configured
- Check Mailgun logs for incoming emails
- Check your production logs

---

## 🔧 **COMMON ISSUES & FIXES**

### **Issue 1: Domain Not Verified**

**Symptom**: "Domain not found" or "Domain not verified"

**Fix**:
1. Go to Mailgun → Domains → `investaycapital.com`
2. Copy all DNS records shown
3. Add to Cloudflare DNS (or your DNS provider)
4. Wait 5-10 minutes for DNS propagation
5. Click "Verify DNS Settings" in Mailgun

---

### **Issue 2: Wrong API Key**

**Symptom**: "Authentication failed" or 401/403 errors

**Fix**:
```bash
# Get NEW API key from Mailgun
# Go to: https://app.mailgun.com/app/account/security/api_keys
# Click "Create New Key" → Copy it

# Update Cloudflare secret
echo "key-YOUR_NEW_KEY" | npx wrangler pages secret put MAILGUN_API_KEY --project-name investay-email-system

# Redeploy
cd /home/user/webapp
npx wrangler pages deploy dist --project-name investay-email-system
```

---

### **Issue 3: MX Records Not Set**

**Symptom**: External emails bounce, "No mail servers found"

**Check**:
```bash
dig +short MX investaycapital.com
```

**Should Return**:
```
10 mxa.mailgun.org.
10 mxb.mailgun.org.
```

**If Empty**:
1. Go to Cloudflare DNS
2. Add MX record:
   - Name: `@` (or `investaycapital.com`)
   - Priority: `10`
   - Content: `mxa.mailgun.org`
3. Add second MX record:
   - Name: `@`
   - Priority: `10`
   - Content: `mxb.mailgun.org`

---

### **Issue 4: SPF/DKIM Not Set**

**Symptom**: Emails go to spam, "SPF validation failed"

**Check**:
```bash
dig +short TXT investaycapital.com
```

**Should Include**:
```
"v=spf1 include:mailgun.org ~all"
```

**If Missing**:
1. Cloudflare DNS → Add TXT record
2. Name: `@`
3. Content: `v=spf1 include:mailgun.org ~all`

**For DKIM**:
1. Mailgun → Your Domain → DNS Records
2. Copy the DKIM record (starts with `k=rsa;`)
3. Add TXT record:
   - Name: `k1._domainkey` (or as shown in Mailgun)
   - Content: (paste the long DKIM value)

---

### **Issue 5: Webhook Not Configured**

**Symptom**: Sending works, receiving doesn't

**Fix**:
1. Mailgun → Webhooks → `investaycapital.com`
2. Add webhook:
   - Event Type: **incoming**
   - URL: `https://www.investaycapital.com/api/email/receive`
   - Method: POST
3. Save
4. Test: Send email TO `test1@investaycapital.com` from Gmail

---

## 📊 **DIAGNOSTIC CHECKLIST**

### **Mailgun Dashboard**:
- [ ] Domain `investaycapital.com` exists
- [ ] Domain status: **Active** (green)
- [ ] All DNS records: **Verified** (green)
- [ ] Webhook configured for **incoming** emails
- [ ] API key is valid and has "Mail Send" permission

### **DNS Records** (Cloudflare or your provider):
- [ ] MX: `mxa.mailgun.org` priority 10
- [ ] MX: `mxb.mailgun.org` priority 10
- [ ] TXT: SPF record with `include:mailgun.org`
- [ ] TXT: DKIM record on `k1._domainkey`

### **Cloudflare Secrets**:
- [ ] `MAILGUN_API_KEY` = `key-...` (from Mailgun)
- [ ] `MAILGUN_DOMAIN` = `investaycapital.com` (NO www)
- [ ] `MAILGUN_REGION` = `US` or `EU`

### **Application**:
- [ ] Latest code deployed
- [ ] No errors in production logs
- [ ] Test email send returns success
- [ ] Test email receive via webhook

---

## 🎯 **QUICK TEST SCRIPT**

```bash
#!/bin/bash
# Quick Mailgun Test

echo "🔍 Testing Mailgun Configuration..."

# 1. Test DNS
echo "1. Checking MX records..."
dig +short MX investaycapital.com

echo ""
echo "2. Checking SPF..."
dig +short TXT investaycapital.com | grep spf

echo ""
echo "3. Checking DKIM..."
dig +short TXT k1._domainkey.investaycapital.com

echo ""
echo "4. Testing Mailgun API..."
read -p "Enter your Mailgun API key: " API_KEY
curl -s --user "api:$API_KEY" \
  https://api.mailgun.net/v3/domains/investaycapital.com | jq .

echo ""
echo "✅ Test complete! Check results above."
```

---

## 🆘 **STILL NOT WORKING?**

### **Get Mailgun Support**:
1. Mailgun Dashboard → **Support**
2. Provide:
   - Domain: `investaycapital.com`
   - Issue: "Emails not sending/receiving"
   - DNS verification screenshot
   - Error messages from logs

### **Check Production Logs**:
```bash
# In Cloudflare dashboard:
# Pages → investay-email-system → Functions → View Logs
# Look for Mailgun errors
```

---

## 📝 **MOST LIKELY CAUSES**

**Based on your symptoms** (not sending OR receiving):

1. **🔴 Most Likely**: Domain not verified in Mailgun
   - Solution: Complete DNS setup in Mailgun dashboard

2. **🟠 Likely**: Wrong API key
   - Solution: Regenerate and update secret

3. **🟡 Possible**: DNS records not propagated
   - Solution: Wait 10-30 minutes, then retest

4. **🟢 Less Likely**: Code issue
   - We just deployed working code

---

## 🎯 **ACTION ITEMS FOR YOU**

**Do These Now**:
1. ✅ Login to Mailgun dashboard
2. ✅ Check if `investaycapital.com` shows as **Active**
3. ✅ If not, copy DNS records and add to Cloudflare
4. ✅ Wait 5-10 minutes
5. ✅ Click "Verify DNS" in Mailgun
6. ✅ Try sending test email again

**Report Back**:
- What is the domain status in Mailgun? (Active/Pending/Unverified)
- Do you see green checkmarks on all DNS records?
- What error do you see when trying to send email?

---

**I need more info to help debug! Please check Mailgun dashboard and report the domain status.**
