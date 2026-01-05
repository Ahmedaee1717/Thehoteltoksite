# 🚨 ATTACHMENT SENDING - NOT IMPLEMENTED

## **Current Status** ❌

**Attachments can be RECEIVED but NOT SENT!**

### **What Works** ✅
- ✅ Receiving attachments from external emails (Mailgun webhook)
- ✅ Storing attachments in database
- ✅ Displaying attachments in email viewer
- ✅ Downloading attachments

### **What's Broken** ❌
- ❌ Attaching files from computer when composing
- ❌ Attaching files from FileBank when composing
- ❌ Sending emails with attachments

---

## **Root Cause Analysis**

### **Problem 1: No Attachment State in ComposeModal**
```javascript
// ComposeModal (line 4645)
const attachments = []; // ❌ HARDCODED EMPTY!
```

**Impact**: Even if user selects files, they're never stored or tracked.

---

### **Problem 2: FileBank Integration is Just a Placeholder**
```javascript
// FilePicker click handler (line 3278)
onClick: () => {
  alert(`✅ Attached: ${file.filename}\\n\\nIn production, this file would be attached to your email.`);
  setShowFilePicker(false);
}
```

**Impact**: Clicking files in FileBank just shows an alert - doesn't actually attach anything!

---

### **Problem 3: No File Upload from Computer**
- No `<input type="file">` element
- No file selection UI
- No file upload handling

---

### **Problem 4: sendEmail() Doesn't Pass Attachments**
```javascript
// sendEmail function (line 420)
body: JSON.stringify({ from: user, to, subject, body, useAI: true })
// ❌ NO attachments field!
```

**Impact**: Even if attachments were selected, they wouldn't be sent to backend.

---

### **Problem 5: Backend Expects JSON, Not FormData**
```javascript
// Backend send endpoint (line 393)
const { to, subject, body, attachments } = await c.req.json();
// ❌ JSON can't handle file uploads!
```

**For file uploads**, backend needs:
- `multipart/form-data` instead of JSON
- File reading from FormData
- File encoding or R2 upload

---

## **What Needs to Be Implemented**

### **Option A: Quick Fix (FileBank Only)** 🟡

**Pros**: Simpler, uses existing FileBank infrastructure  
**Cons**: Users must upload files to FileBank first

#### **Steps**:
1. Add attachment state to ComposeModal
2. Fix FileBank integration to actually attach files
3. Pass attachment IDs (from FileBank) to backend
4. Backend loads files from FileBank and attaches to email

---

### **Option B: Complete Solution (Computer + FileBank)** 🟢

**Pros**: Full functionality, best UX  
**Cons**: More complex, requires FormData implementation

#### **Steps**:
1. Add attachment state to ComposeModal
2. Add file input for computer uploads
3. Add file preview/removal UI
4. Convert sendEmail to use FormData instead of JSON
5. Update backend to handle multipart/form-data
6. Backend processes files and sends via Mailgun

---

## **Recommended Approach: Option A First**

Implement FileBank attachment first (quicker), then add computer upload later.

---

## **Implementation Plan (FileBank Only)**

### **1. Add Attachment State**
```javascript
// ComposeModal
const [attachments, setAttachments] = useState([]);

const addAttachment = (file) => {
  setAttachments(prev => [...prev, file]);
  console.log('📎 Added attachment:', file.filename);
};

const removeAttachment = (index) => {
  setAttachments(prev => prev.filter((_, i) => i !== index));
};
```

### **2. Fix FileBank Click Handler**
```javascript
// FilePicker (replace line 3278)
onClick: () => {
  addAttachment(file); // ✅ Actually add to attachments
  setShowFilePicker(false);
  alert(`✅ Attached: ${file.filename}`);
}
```

### **3. Update handleSend**
```javascript
// ComposeModal handleSend (line 4835)
onSend(to, subject, body, attachments); // ✅ Pass attachments
```

### **4. Update sendEmail Function**
```javascript
// sendEmail (line 420)
const sendEmail = async (to, subject, body, attachments = []) => {
  // Convert attachments to format backend expects
  const attachmentData = attachments.map(att => ({
    id: att.id,
    filename: att.filename,
    url: att.url, // FileBank URL
    size: att.size,
    content_type: att.content_type
  }));
  
  const response = await fetch('/api/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      from: user, to, subject, body, 
      useAI: true,
      attachments: attachmentData // ✅ Include attachments
    })
  });
  // ...
};
```

### **5. Update Backend to Attach Files**
```typescript
// src/routes/email.ts (around line 525)
// After building HTML body, before sending via Mailgun:

if (attachments && attachments.length > 0) {
  // Load files from FileBank
  for (const att of attachments) {
    const fileData = await DB.prepare(`
      SELECT * FROM files WHERE id = ?
    `).bind(att.id).first();
    
    if (fileData && fileData.url) {
      // Fetch file content
      const fileResponse = await fetch(fileData.url);
      const fileBuffer = await fileResponse.arrayBuffer();
      
      // Add to Mailgun email (Mailgun supports attachments)
      // Implementation depends on Mailgun SDK
    }
  }
}
```

---

## **Current State**

**Status**: ❌ NOT IMPLEMENTED  
**Blocking**: Users cannot send emails with attachments  
**Priority**: 🔴 HIGH

**Workaround**: Users must send emails without attachments, then separately share files via other means.

---

## **Next Steps**

1. **Confirm approach** with user (FileBank only vs Full solution)
2. **Implement chosen solution**
3. **Test thoroughly**
4. **Deploy**

---

*Document created: January 5, 2026*  
*Status: Awaiting implementation*
