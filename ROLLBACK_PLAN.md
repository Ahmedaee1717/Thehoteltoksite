# 🔄 ROLLBACK PLAN - Remove Encryption, Keep Authentication

## 🎯 Goal
Remove AES-256 encryption that was added in commit 1263b80 while keeping:
- ✅ Authentication (requireAuth middleware)
- ✅ Bcrypt password hashing
- ✅ All bug fixes
- ✅ Mailgun configuration fixes

## 📋 Changes to Make

### 1. Remove Encryption Import (Line 10)
```typescript
// REMOVE THIS LINE:
import { safeEncrypt, safeDecrypt, isEncrypted } from '../lib/encryption'
```

### 2. Remove ENCRYPTION_KEY from Bindings (Line 22)
```typescript
// REMOVE THIS LINE:
ENCRYPTION_KEY?: string; // 🔒 Master key for email encryption
```

### 3. Fix /send endpoint - Store plaintext (around line 425-440)
**BEFORE (with encryption):**
```typescript
// 🔒 ENCRYPT email content before storing
let encryptedBody = body;
if (ENCRYPTION_KEY) {
  try {
    encryptedBody = await safeEncrypt(body, ENCRYPTION_KEY) || body;
    console.log('🔒 Email content encrypted');
  } catch (encError) {
    console.error('⚠️  Encryption failed, storing plaintext:', encError);
  }
}

// Then uses: encryptedBody, encryptedBody, body.substring(0, 150)
```

**AFTER (no encryption):**
```typescript
// Store plaintext directly - no encryption
const snippet = body.substring(0, 150);

// Then uses: body, body, snippet
```

### 4. Fix GET /:id endpoint - No decryption (around line 1370-1390)
**BEFORE (with decryption):**
```typescript
// 🔓 DECRYPT email content before sending to client
let decryptedEmail = { ...email };
if (ENCRYPTION_KEY) {
  try {
    if (email.body_text) {
      decryptedEmail.body_text = await safeDecrypt(email.body_text, ENCRYPTION_KEY);
    }
    if (email.body_html) {
      decryptedEmail.body_html = await safeDecrypt(email.body_html, ENCRYPTION_KEY);
    }
    console.log('🔓 Email content decrypted');
  } catch (error) {
    console.error('❌ Decryption failed:', error);
  }
}
```

**AFTER (no decryption):**
```typescript
// No decryption needed - emails stored as plaintext
const emailData = { ...email };
```

### 5. Fix /receive endpoint - Store plaintext (around line 1990-2010)
**BEFORE (with encryption):**
```typescript
// 🔒 ENCRYPT email content before storing
let encryptedBodyText = bodyText || '';
let encryptedBodyHtml = bodyHtml || bodyText || '';
if (ENCRYPTION_KEY) {
  try {
    encryptedBodyText = await safeEncrypt(bodyText || '', ENCRYPTION_KEY) || (bodyText || '');
    encryptedBodyHtml = await safeEncrypt(bodyHtml || bodyText || '', ENCRYPTION_KEY) || (bodyHtml || bodyText || '');
    console.log('🔒 Incoming email content encrypted');
  } catch (encError) {
    console.error('⚠️  Encryption failed, storing plaintext:', encError);
  }
}

// Then uses: encryptedBodyText, encryptedBodyHtml
```

**AFTER (no encryption):**
```typescript
// Store plaintext directly - no encryption
const bodyTextToStore = bodyText || '';
const bodyHtmlToStore = bodyHtml || bodyText || '';

// Then uses: bodyTextToStore, bodyHtmlToStore
```

## ⚠️ What Stays UNCHANGED

1. **Authentication** - requireAuth middleware
2. **Password Hashing** - Bcrypt (auth.ts)
3. **Mailgun Configuration** - Domain fixes
4. **Bug Fixes** - Deduplication, NULL received_at, etc.

## 🚀 Deployment Steps

1. Make the 5 changes above
2. Build: `npm run build`
3. Deploy: `npx wrangler pages deploy dist --project-name investay-email-system`
4. Test immediately

## 📊 Expected Result

- ✅ Emails stored as plaintext (like before)
- ✅ No encryption/decryption errors
- ✅ Authentication still works
- ✅ Passwords still hashed with bcrypt
- ✅ Email sending/receiving works

## ⏱️ Time Estimate
- Code changes: 5 minutes
- Build + Deploy: 2 minutes
- Testing: 3 minutes
- **Total: 10 minutes**

