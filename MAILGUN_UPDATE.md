# Update Mailgun Webhook URL

**Delete the www URL and add the bare domain:**

Old (delete this):
```
https://www.investaycapital.com/api/email/receive
```

New (use this):
```
https://investaycapital.com/api/email/receive
```

## In Mailgun Dashboard:

1. Delete: `https://www.investaycapital.com/api/email/receive`
2. Delete: `https://52a9c823.investay-email-system.pages.dev/api/email/receive`
3. Add new webhook:
   - Event: **Delivered Messages**
   - URL: `https://investaycapital.com/api/email/receive`
   - Save

Then test with the API endpoint.
