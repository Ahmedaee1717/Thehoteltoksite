# 🔑 PERPLEXITY API KEY SETUP - FINAL STEPS

## ✅ WHAT'S DONE:

- ✅ **Local Development (.dev.vars)**: Key configured locally
- ✅ **Perplexity AI Integration**: `src/routes/search.ts` uses real AI web search
- ✅ **Code Deployed**: Latest build ready

---

## ⚠️ **NEEDS PRODUCTION SETUP:**

### **Add via Cloudflare Dashboard:**

1. **Go to Cloudflare Dashboard:**
   - URL: https://dash.cloudflare.com/dbc51b3995c651ec043a798b05a0ae94/pages/view/investay-email-system/settings/environment-variables

2. **Add Environment Variable:**
   - Click **"Add variable"**
   - **Variable name**: `PERPLEXITY_API_KEY`
   - **Value**: `[REDACTED - See .dev.vars file]`
   - **Type**: Encrypted (Production)
   - Click **"Save"**

3. **Redeploy:**
   ```bash
   npm run deploy
   ```

---

## 🔍 **HOW IT WORKS:**

### **AI-Powered Contact Search:**

When Nova extracts an email task like:
```
"Send proposal to Sharmdreams Group"
```

Nova calls:
```javascript
GET /api/search/contact?q=Sharmdreams Group contact email
```

**Backend uses Perplexity AI:**
```typescript
// src/routes/search.ts
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  headers: { 'Authorization': `Bearer ${c.env.PERPLEXITY_API_KEY}` },
  body: JSON.stringify({
    model: 'llama-3.1-sonar-small-128k-online',
    messages: [{ 
      content: 'Find REAL contact emails for: Sharmdreams Group'
    }]
  })
})
```

**AI searches the web and returns:**
```json
{
  "suggestedEmails": [
    {
      "email": "contact@sharmdreamsgroup.com",
      "source": "https://sharmdreamsgroup.com/contact"
    },
    {
      "email": "partnerships@sharmdreamsgroup.com",
      "source": "https://linkedin.com/company/sharmdreams"
    }
  ],
  "companyWebsite": "https://sharmdreamsgroup.com"
}
```

---

## 🚀 **DEPLOYMENT STATUS:**

- **Local (.dev.vars)**: ✅ Working
- **Production**: ⚠️ **NEEDS DASHBOARD SETUP** (see above)

---

## 🧪 **TEST AFTER SETUP:**

```bash
# Test locally first
curl "http://localhost:3000/api/search/contact?q=Boson+Protocol+contact+email"

# Test production after deployment
curl "https://www.investaycapital.com/api/search/contact?q=Boson+Protocol+contact+email"
```

**Expected response:**
```json
{
  "success": true,
  "suggestedEmails": [
    {"email": "support@bosonprotocol.io", "source": "https://bosonprotocol.io/terms"},
    {"email": "compliance@bosonprotocol.io", "source": "https://bosonprotocol.io/legal"}
  ],
  "companyWebsite": "https://bosonprotocol.io",
  "note": "These emails were found via AI web search with source attribution"
}
```

---

## ✅ **NEXT STEPS:**

1. **Add PERPLEXITY_API_KEY via Cloudflare Dashboard** (link above)
2. **Deploy to production**: `npm run deploy`
3. **Test the integration**: Try creating an email task via Nova

**That's it! Real AI web search for contact emails!** 🎉
