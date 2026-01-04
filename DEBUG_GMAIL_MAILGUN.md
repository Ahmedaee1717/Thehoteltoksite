# Debug Steps for Gmail → Mailgun → InvestMail

## Step 1: Check Mailgun Logs

1. Go to: https://app.mailgun.com/
2. Navigate: **Sending → Logs**
3. Search for emails to: `test1@investaycapital.com`
4. Time range: Last 1 hour

### What to look for:

**If you see the email in logs:**
- Status: Accepted ✅
- Look for "Route matched" or "Forwarded"
- Check if there's an error forwarding to webhook

**If you DON'T see the email:**
- Gmail never sent it to Mailgun
- OR Gmail sent but Mailgun rejected it
- Check your Gmail "Sent" folder for bounce messages

---

## Step 2: Test Direct Send

Send an email FROM Mailgun itself:

1. Mailgun Dashboard → Sending → Overview
2. Click "Send a test message"
3. To: `test1@investaycapital.com`
4. Subject: `Mailgun Dashboard Test`
5. Click Send

**Expected:** Should appear in inbox within 10 seconds

---

## Step 3: Check Route Priority

Your route might be conflicting with another route. In Routes page:
- Make sure your route has Priority = **0** (highest)
- Make sure there are no other routes with higher priority
- If multiple routes exist, disable others temporarily

---

## Step 4: Verify Actions

In your route configuration, you must have BOTH:
- ☑️ **Store** (stores in Mailgun)
- ☑️ **Forward** to `https://www.investaycapital.com/api/email/receive`

**Store is required** - without it, Mailgun might not process the email properly.

---

## Step 5: Check Mailgun Domain Status

1. Dashboard → Sending → Domain settings
2. Domain: `investaycapital.com`
3. Check: **Receiving** status
4. Should show: "DNS records verified ✅"

If not verified, you need to add receiving MX records.

---

## Step 6: Test with Different Email

Try sending from:
- Different Gmail account
- Yahoo Mail
- Outlook.com
- Another email service

This tells us if it's Gmail-specific or all external emails.

---

## Most Likely Issues:

### Issue 1: Route Not Active
- Solution: Check route is enabled (toggle should be ON)

### Issue 2: Gmail Sent to Wrong Address
- Check you're sending to `test1@investaycapital.com` (not test1@www.investaycapital.com)

### Issue 3: Mailgun Rejecting Email
- Check Mailgun logs for rejection reason
- Could be: spam filter, rate limit, domain not verified

### Issue 4: Route Expression Wrong
- Current: `.*@investaycapital.com`
- Should match any address @investaycapital.com
- Try exact match: `test1@investaycapital.com` (for testing)

---

## Quick Test

**Try this RIGHT NOW:**

1. Send from Mailgun Dashboard (Step 2 above)
2. If that works → Problem is Gmail → Mailgun
3. If that doesn't work → Problem is Route or Webhook

---

**Do Step 1 (check Mailgun logs) and tell me what you see.**

