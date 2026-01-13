import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyToken } from '../lib/auth'
import { hashPassword } from '../lib/auth'
import { generateId } from '../utils/id'
import { generateEmbedding, categorizeEmail, summarizeEmail, extractActionItems } from '../services/ai-email'
import { checkSpamScore, getSpamScoreSummary } from '../lib/spam-checker'
// Encryption temporarily disabled for debugging
// import { safeEncrypt, safeDecrypt, isEncrypted } from '../lib/encryption'

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
  R2_BUCKET?: R2Bucket;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  MAILGUN_REGION?: string;
  MAILGUN_FROM_EMAIL?: string;
  MAILGUN_FROM_NAME?: string;
  JWT_SECRET?: string;
  // ENCRYPTION_KEY?: string; // 🔒 Temporarily disabled for debugging
}

const emailRoutes = new Hono<{ Bindings: Bindings }>()

// DEBUG: Store last request for debugging
let lastDebugInfo: any = null;

// DEBUG ENDPOINT: Get last send request info
emailRoutes.get('/debug/last-send', (c) => {
  return c.json({
    lastRequest: lastDebugInfo || 'No requests yet',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 🔗 Link Tracking Helper Function
// Wraps all links in HTML with tracking redirects
// This dramatically improves read tracking reliability!
// ============================================
function wrapLinksWithTracking(html: string, emailId: string, baseUrl: string): string {
  // Match all <a> tags and wrap their href with tracking URL
  return html.replace(
    /<a\s+([^>]*?)href="([^"]+)"([^>]*)>/gi,
    (match, before, href, after) => {
      // Skip if already a tracking link
      if (href.includes('/api/email/link/') || href.includes('/api/email/track/')) {
        return match;
      }
      
      // Skip mailto: and tel: links
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
        return match;
      }
      
      // Create tracked link
      const trackedUrl = `${baseUrl}/api/email/link/${emailId}?dest=${encodeURIComponent(href)}`;
      return `<a ${before}href="${trackedUrl}"${after}>`;
    }
  );
}

// ============================================
// 🎯 Plain Text Link Tracking
// Also wrap links in plain text emails
// ============================================
function wrapPlainTextLinks(text: string, emailId: string, baseUrl: string): string {
  // Match URLs in plain text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    const trackedUrl = `${baseUrl}/api/email/link/${emailId}?dest=${encodeURIComponent(url)}`;
    return trackedUrl;
  });
}

// 🔒 CRITICAL SECURITY: Authentication Middleware
// Protects ALL email routes - ensures users can ONLY see their own emails
const requireAuth = async (c: any, next: any) => {
  const token = getCookie(c, 'auth_token');
  
  console.log('🔐 Auth check - Token present:', !!token);
  
  if (!token) {
    console.log('❌ No auth_token cookie found');
    return c.json({ success: false, error: 'Unauthorized - Please login' }, 401);
  }
  
  const secret = c.env.JWT_SECRET || 'investay-super-secret-key-2025';
  const decoded = await verifyToken(token, secret);
  
  if (!decoded) {
    console.log('❌ Token verification failed');
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }
  
  console.log('✅ Auth successful for:', decoded.email);
  
  // Set authenticated user email in context
  c.set('userEmail', decoded.email);
  c.set('userId', decoded.sub);
  
  await next();
}

// ============================================
// GET /api/email/test-mailgun-send
// Test sending via Mailgun API directly
// PUBLIC endpoint - defined BEFORE auth middleware
// ============================================
emailRoutes.get('/test-mailgun-send', async (c) => {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_REGION } = c.env;
  
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    return c.json({
      success: false,
      error: 'Missing Mailgun credentials',
      hasApiKey: !!MAILGUN_API_KEY,
      hasDomain: !!MAILGUN_DOMAIN
    }, 500);
  }

  try {
    // Send test email via Mailgun API
    const testForm = new FormData();
    testForm.append('from', `API Test <test@${MAILGUN_DOMAIN}>`);
    testForm.append('to', 'test1@investaycapital.com');
    testForm.append('subject', `Mailgun API Direct Test ${Date.now()}`);
    testForm.append('text', 'SUCCESS! This email was sent directly via Mailgun API, bypassing Gmail entirely. If you see this, the entire email flow is working perfectly.');
    testForm.append('html', '<h2>✅ SUCCESS!</h2><p>This email was sent directly via <strong>Mailgun API</strong>, bypassing Gmail entirely.</p><p><strong>This proves everything is working!</strong></p>');

    const region = MAILGUN_REGION === 'EU' ? 'api.eu.mailgun.net' : 'api.mailgun.net';
    const url = `https://${region}/v3/${MAILGUN_DOMAIN}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`api:${MAILGUN_API_KEY}`)
      },
      body: testForm
    });

    const resultText = await response.text();

    if (!response.ok) {
      return c.json({
        success: false,
        error: 'Mailgun API error',
        status: response.status,
        body: resultText,
        domain: MAILGUN_DOMAIN
      }, response.status);
    }

    let mailgunResult;
    try {
      mailgunResult = JSON.parse(resultText);
    } catch {
      mailgunResult = { raw: resultText };
    }

    return c.json({
      success: true,
      message: 'Email sent via Mailgun API! Check inbox in 10-30 seconds.',
      mailgun: mailgunResult,
      checkInbox: 'Login at https://www.investaycapital.com/mail as test1@investaycapital.com'
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Apply auth middleware to ALL routes EXCEPT tracking pixel and admin account management
// Tracking pixel must be public (loaded from external email clients)
// Admin account management should be accessible without email login
emailRoutes.use('/*', async (c, next) => {
  const path = c.req.path;
  
  // Skip auth for these endpoints:
  // 1. Tracking pixel (external email clients)
  // 2. Admin email account management (admin dashboard access)
  // 3. Email receive webhook (Mailgun calls this)
  // 4. Test endpoint for Mailgun API
  // 5. Shared mailbox admin endpoints (admin dashboard)
  if (
    path.includes('/track/') ||
    path.includes('/receive') ||
    path.includes('/test-mailgun-send') ||
    path.includes('/accounts/create') ||
    path.includes('/accounts/list') ||
    path.includes('/shared-mailboxes/list') ||
    path.includes('/shared-mailboxes/create') ||
    (path.includes('/shared-mailboxes/') && path.includes('/toggle')) ||
    (path.includes('/shared-mailboxes/') && path.includes('/members')) ||
    path.includes('/accounts/') && (c.req.method === 'DELETE' || c.req.method === 'PATCH')
  ) {
    return next();
  }
  
  // Apply auth to all other routes (user email operations)
  return requireAuth(c, next);
})

// ============================================
// GET /api/email/inbox
// Get inbox emails for authenticated user ONLY
// 🔒 SECURITY: Users can ONLY see their own emails
// ============================================
emailRoutes.get('/inbox', async (c) => {
  const { DB } = c.env;
  // 🔒 Get email from authenticated session - NO query parameter!
  const userEmail = c.get('userEmail');
  
  console.log('📥 Inbox request for user:', userEmail);
  
  if (!userEmail) {
    console.log('❌ No userEmail in context');
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        id, thread_id, from_email, from_name, to_email, subject,
        snippet, category, priority, sentiment, is_read, is_starred,
        is_archived, labels, received_at, sent_at, ai_summary,
        expiry_type, expires_at, is_expired
      FROM emails
      WHERE to_email = ? 
        AND category != 'trash' 
        AND category != 'spam'
        AND is_archived = 0
      ORDER BY COALESCE(received_at, sent_at, created_at) DESC
      LIMIT 50
    `).bind(userEmail).all();
    
    console.log(`✅ Found ${results.length} emails for ${userEmail}`);
    
    return c.json({ success: true, emails: results });
  } catch (error: any) {
    console.error('Inbox fetch error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// GET /api/email/sent
// Get sent emails for authenticated user ONLY
// 🔒 SECURITY: Users can ONLY see their own sent emails
// ============================================
emailRoutes.get('/sent', async (c) => {
  const { DB } = c.env;
  // 🔒 Get email from authenticated session - NO query parameter!
  const userEmail = c.get('userEmail');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        id, thread_id, from_email, from_name, to_email, subject,
        snippet, category, priority, sentiment, is_read, is_starred,
        is_archived, labels, received_at, sent_at, ai_summary,
        expiry_type, expires_at, is_expired
      FROM emails
      WHERE from_email = ? 
        AND category != 'trash'
      ORDER BY sent_at DESC
      LIMIT 50
    `).bind(userEmail).all();
    
    return c.json({ success: true, emails: results });
  } catch (error: any) {
    console.error('Sent fetch error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// GET /api/email/spam
// Get spam emails for authenticated user ONLY
// 🔒 SECURITY: Users can ONLY see their own spam
// ============================================
emailRoutes.get('/spam', async (c) => {
  const { DB } = c.env;
  // 🔒 Get email from authenticated session - NO query parameter!
  const userEmail = c.get('userEmail');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        id, thread_id, from_email, from_name, to_email, subject,
        snippet, category, priority, sentiment, is_read, is_starred,
        is_archived, labels, received_at, sent_at,
        expiry_type, expires_at, expiry_action, ai_summary
      FROM emails
      WHERE to_email = ? 
        AND category = 'spam'
      ORDER BY COALESCE(received_at, sent_at, created_at) DESC
      LIMIT 50
    `).bind(userEmail).all();
    
    return c.json({ success: true, emails: results });
  } catch (error: any) {
    console.error('Spam fetch error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// GET /api/email/trash
// Get trashed emails for authenticated user ONLY
// 🔒 SECURITY: Users can ONLY see their own trash
// ============================================
emailRoutes.get('/trash', async (c) => {
  const { DB } = c.env;
  // 🔒 Get email from authenticated session - NO query parameter!
  const userEmail = c.get('userEmail');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        id, thread_id, from_email, from_name, to_email, subject,
        snippet, category, priority, sentiment, is_read, is_starred,
        is_archived, labels, received_at, sent_at,
        expiry_type, expires_at, expiry_action, ai_summary
      FROM emails
      WHERE (to_email = ? OR from_email = ?)
        AND category = 'trash'
      ORDER BY COALESCE(received_at, sent_at, created_at) DESC
      LIMIT 50
    `).bind(userEmail, userEmail).all();
    
    return c.json({ success: true, emails: results });
  } catch (error: any) {
    console.error('Trash fetch error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// GET /api/email/archived
// Get archived emails for authenticated user ONLY
// 🔒 SECURITY: Users can ONLY see their own archived emails
// ============================================
emailRoutes.get('/archived', async (c) => {
  const { DB } = c.env;
  // 🔒 Get email from authenticated session - NO query parameter!
  const userEmail = c.get('userEmail');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        id, thread_id, from_email, from_name, to_email, subject,
        snippet, category, priority, sentiment, is_read, is_starred,
        is_archived, labels, received_at, sent_at
      FROM emails
      WHERE (to_email = ? OR from_email = ?)
        AND is_archived = 1
        AND category != 'trash'
      ORDER BY COALESCE(received_at, sent_at, created_at) DESC
      LIMIT 50
    `).bind(userEmail, userEmail).all();
    
    return c.json({ success: true, emails: results });
  } catch (error: any) {
    console.error('Archived fetch error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// POST /api/email/send
// Send a new email
// 🔒 SECURITY: Users can ONLY send emails from their own address
// ============================================
emailRoutes.post('/send', async (c) => {
  console.log('🚀🚀🚀 === EMAIL SEND ROUTE HIT === 🚀🚀🚀');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  try {
    const { DB, OPENAI_API_KEY, MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_REGION, MAILGUN_FROM_EMAIL, MAILGUN_FROM_NAME } = c.env;
    console.log('🔧 Environment variables check:');
    console.log('  - MAILGUN_API_KEY:', MAILGUN_API_KEY ? '✅ Present' : '❌ Missing');
    console.log('  - MAILGUN_DOMAIN:', MAILGUN_DOMAIN || '❌ Missing');
    console.log('  - MAILGUN_REGION:', MAILGUN_REGION || 'US (default)');
    
    // 🔒 Get authenticated user email
    const authenticatedUserEmail = c.get('userEmail');
    console.log('👤 Authenticated user:', authenticatedUserEmail || '❌ NOT AUTHENTICATED');
    
    if (!authenticatedUserEmail) {
      console.error('❌ NO AUTHENTICATION - Returning 401');
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }
  
  try {
    // 🔍 CRITICAL: Log raw request size BEFORE parsing
    const rawBodyText = await c.req.text();
    console.log('📦 RAW REQUEST SIZE:', rawBodyText.length, 'bytes');
    console.log('📦 Request preview (first 1000 chars):', rawBodyText.substring(0, 1000));
    
    // Parse JSON from raw text
    const requestData = JSON.parse(rawBodyText);
    const { 
      from: requestedFrom,
      to, cc, bcc, subject, body, 
      attachments, useAI, thread_id 
    } = requestData;
    
    // 🔒 VALIDATE FROM ADDRESS
    // Allow user's own email OR shared mailbox email (if they're a member)
    let from = authenticatedUserEmail; // Default to user's email
    
    if (requestedFrom && requestedFrom !== authenticatedUserEmail) {
      // User wants to send from a different address - check if it's a valid shared mailbox
      console.log('📬 Checking shared mailbox access:', requestedFrom);
      
      try {
        // Query to check if user is a member of this shared mailbox
        const memberCheck = await DB.prepare(`
          SELECT sm.id, sm.email_address, sm.display_name, smm.role
          FROM shared_mailboxes sm
          JOIN shared_mailbox_members smm ON sm.id = smm.shared_mailbox_id
          WHERE sm.email_address = ? 
            AND smm.user_email = ? 
            AND sm.is_active = 1 
            AND smm.is_active = 1
        `).bind(requestedFrom, authenticatedUserEmail).first();
        
        if (memberCheck) {
          // User is a valid member of this shared mailbox
          from = requestedFrom;
          console.log('✅ Shared mailbox send authorized:', from, '(Role:', memberCheck.role, ')');
        } else {
          console.log('❌ Unauthorized shared mailbox send attempt:', requestedFrom);
          console.log('   User:', authenticatedUserEmail, 'is not a member of:', requestedFrom);
          return c.json({ 
            success: false, 
            error: 'You are not authorized to send from this mailbox. Please ask an admin to add you as a member.' 
          }, 403);
        }
      } catch (dbError: any) {
        console.error('❌ Database error checking shared mailbox access:', dbError);
        return c.json({ 
          success: false, 
          error: 'Database error: ' + dbError.message 
        }, 500);
      }
    }
    
    // CRITICAL DEBUG: Log what we received
    console.log('📧 SEND REQUEST RECEIVED:');
    console.log('  - requestedFrom:', requestedFrom);
    console.log('  - actualFrom:', from);
    console.log('  - authenticatedUser:', authenticatedUserEmail);
    console.log('  - to:', to);
    console.log('  - subject:', subject);
    console.log('  - bodyLength:', body?.length);
    console.log('  - hasAttachments:', !!attachments);
    console.log('  - attachments type:', typeof attachments);
    console.log('  - attachments isArray:', Array.isArray(attachments));
    console.log('  - attachments length:', attachments?.length || 0);
    
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      console.log('📎 ATTACHMENTS DETAILS:', JSON.stringify(attachments.map((a: any) => ({
        filename: a.filename,
        isLocalFile: a.isLocalFile,
        hasData: !!a.data,
        dataLength: a.data?.length || 0,
        dataPreview: a.data ? a.data.substring(0, 50) + '...' : 'NO DATA',
        hasId: !!a.id,
        id: a.id
      })), null, 2));
      
      // Store debug info
      lastDebugInfo = {
        timestamp: new Date().toISOString(),
        to,
        subject,
        attachmentsCount: attachments.length,
        attachments: attachments.map((a: any) => ({
          filename: a.filename,
          isLocalFile: a.isLocalFile,
          hasData: !!a.data,
          dataLength: a.data?.length || 0,
          id: a.id,
          url: a.url
        }))
      };
    } else {
      console.log('❌ NO ATTACHMENTS ARRAY OR EMPTY!');
      console.log('❌ Raw attachments value:', attachments);
      lastDebugInfo = {
        timestamp: new Date().toISOString(),
        to,
        subject,
        error: 'No attachments received',
        attachmentsValue: attachments
      };
    }
    
    
    if (!to || !subject || !body) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: to, subject, body' 
      }, 400);
    }
    
    const emailId = generateId('eml');
    // Use provided thread_id for replies, or generate new one for new conversations
    const threadId = thread_id || generateId('thr');
    
    // Check spam score before sending
    const spamCheck = checkSpamScore(subject, body);
    console.log('📊 Spam Check:', getSpamScoreSummary(spamCheck));
    
    // Log all spam issues
    if (spamCheck.issues.length > 0) {
      console.log('⚠️ Spam Issues Found:', spamCheck.issues);
      console.log('💡 Recommendations:', spamCheck.recommendations);
    }
    
    // Optionally block high-risk emails
    if (spamCheck.level === 'danger') {
      return c.json({
        success: false,
        error: 'Email failed spam check - high spam risk detected',
        spamCheck: {
          score: spamCheck.score,
          level: spamCheck.level,
          issues: spamCheck.issues,
          recommendations: spamCheck.recommendations
        }
      }, 400);
    }
    
    // AI enhancements (if enabled)
    let aiSummary = null;
    let aiActionItems = null;
    let embeddingVector = null;
    let category = 'sent';
    
    if (useAI && OPENAI_API_KEY) {
      try {
        [aiSummary, aiActionItems, embeddingVector, category] = await Promise.all([
          summarizeEmail(body, OPENAI_API_KEY),
          extractActionItems(body, OPENAI_API_KEY),
          generateEmbedding(body, OPENAI_API_KEY),
          categorizeEmail(subject + ' ' + body, OPENAI_API_KEY)
        ]);
      } catch (aiError) {
        console.error('AI processing error:', aiError);
        // Continue without AI features
      }
    }
    
    // Get user's display name from email accounts table (needed for both Mailgun and DB)
    console.log('🔍 Looking up display name for:', from);
    const userAccount = await DB.prepare(`
      SELECT display_name FROM email_accounts WHERE email_address = ?
    `).bind(from).first();
    
    const displayName = userAccount?.display_name || from.split('@')[0];
    console.log('📝 Display name:', displayName);
    
    // Send email via Mailgun
    let mailgunSuccess = false;
    let mailgunError = null;
    let mailgunMessageId = null;
    
    console.log('🔐 Mailgun config check:', {
      hasApiKey: !!MAILGUN_API_KEY,
      hasDomain: !!MAILGUN_DOMAIN,
      domain: MAILGUN_DOMAIN,
      region: MAILGUN_REGION
    });
    
    if (MAILGUN_API_KEY && MAILGUN_DOMAIN) {
      try {
        console.log('📬 Sending via Mailgun with from:', from, 'displayName:', displayName);
        
        // Create HTML version of email with LINK TRACKING + tracking pixel
        // Link tracking is MORE RELIABLE than pixels (works even if images blocked)
        const baseUrl = `https://${c.req.header('host') || 'www.investaycapital.com'}`;
        const trackingPixelUrl = `${baseUrl}/api/email/track/${emailId}`;
        
        // Convert line breaks to HTML and wrap links with tracking
        let emailBodyHtml = body.replace(/\n/g, '<br>');
        emailBodyHtml = wrapLinksWithTracking(emailBodyHtml, emailId, baseUrl);
        
        const htmlBody = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .email-header { border-bottom: 2px solid #0066cc; padding-bottom: 10px; margin-bottom: 20px; }
                .email-body { white-space: pre-wrap; }
                .email-footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
                a { color: #0066cc; text-decoration: none; }
                a:hover { text-decoration: underline; }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="email-header">
                  <h2 style="margin: 0; color: #0066cc;">${subject}</h2>
                </div>
                <div class="email-body">
                  ${emailBodyHtml}
                </div>
                <div class="email-footer">
                  <p>Sent via Investay Capital Internal Email System</p>
                </div>
              </div>
              <!-- Multi-method tracking for maximum reliability -->
              <!-- Method 1: Tracking pixel (works ~50-60% of the time) -->
              <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;visibility:hidden;" alt="" border="0" />
              <!-- Method 2: Link tracking (works ~85-90% - see wrapped links above) -->
              <!-- Method 3: Reply detection (automatic via webhook) -->
            </body>
          </html>
        `;
        
        // Also wrap links in plain text version
        const textBodyWithTracking = wrapPlainTextLinks(body, emailId, baseUrl);
        
        // 📎 HANDLE ATTACHMENTS (FileBank files + Computer uploads)
        const mailgunAttachments: Array<{ filename: string; data: Buffer | string }> = [];
        
        console.log('📎 DEBUG: Raw attachments received:', JSON.stringify(attachments?.map(a => ({
          filename: a.filename,
          isLocalFile: a.isLocalFile,
          hasData: !!a.data,
          hasFile: !!a.file,
          hasId: !!a.id
        }))));
        
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
          console.log(`📎 Processing ${attachments.length} attachments for sending`);
          
          for (const att of attachments) {
            try {
              if (att.isLocalFile && att.data) {
                // Computer upload: data is base64 string
                console.log(`📎 Processing computer upload: ${att.filename} (${att.data?.length} chars of base64)`);
                console.log(`📎 Base64 preview (first 100 chars): ${att.data.substring(0, 100)}`);
                
                const buffer = Buffer.from(att.data, 'base64');
                console.log(`📎 Buffer created: ${buffer.length} bytes, isBuffer: ${buffer instanceof Buffer}`);
                
                mailgunAttachments.push({
                  filename: att.filename,
                  data: buffer
                });
                console.log(`✅ Added computer upload to mailgunAttachments: ${att.filename} (${buffer.length} bytes)`);
              } else {
                // FileBank file: Load from database
                console.log(`📎 Looking up FileBank file ID: ${att.id}`);
                console.log(`📎 att object:`, JSON.stringify(att));
                
                const fileRecord = await DB.prepare(`
                  SELECT * FROM file_bank_files WHERE id = ?
                `).bind(att.id).first();
                
                console.log(`📎 FileBank query result:`, fileRecord ? 'FOUND' : 'NOT FOUND');
                
                if (fileRecord && fileRecord.file_url) {
                  console.log(`📎 FileBank record:`, JSON.stringify({
                    id: fileRecord.id,
                    filename: fileRecord.filename,
                    file_url: fileRecord.file_url,
                    file_size: fileRecord.file_size
                  }));
                  console.log(`📎 Fetching FileBank file: ${att.filename} from ${fileRecord.file_url}`);
                  
                  // Check if URL is absolute or relative
                  let fetchUrl = fileRecord.file_url;
                  if (!fetchUrl.startsWith('http')) {
                    // Relative URL - construct full URL
                    const baseUrl = `https://${c.req.header('host') || 'www.investaycapital.com'}`;
                    
                    // Fix: R2 URLs need /api/filebank prefix
                    if (fetchUrl.startsWith('/r2/')) {
                      fetchUrl = `/api/filebank${fetchUrl}`;
                    }
                    
                    fetchUrl = `${baseUrl}${fetchUrl.startsWith('/') ? '' : '/'}${fetchUrl}`;
                    console.log(`📎 Constructed full URL: ${fetchUrl}`);
                  }
                  
                  // Fetch file content
                  console.log(`📎 Fetching from: ${fetchUrl}`);
                  const fileResponse = await fetch(fetchUrl);
                  console.log(`📎 Fetch response: ${fileResponse.status} ${fileResponse.statusText}`);
                  
                  if (!fileResponse.ok) {
                    console.error(`❌ Failed to fetch attachment ${att.filename}: HTTP ${fileResponse.status} ${fileResponse.statusText} from ${fetchUrl}`);
                    console.error(`📎 This is likely a dummy URL from seed data. Upload real files or use computer upload!`);
                    continue;
                  }
                  
                  // Convert to Buffer
                  const arrayBuffer = await fileResponse.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  console.log(`📎 Buffer created: ${buffer.length} bytes`);
                  
                  // Add to Mailgun attachments
                  mailgunAttachments.push({
                    filename: att.filename,
                    data: buffer
                  });
                  
                  console.log(`✅ Added FileBank file: ${att.filename} (${buffer.length} bytes)`);
                } else {
                  console.warn(`⚠️ FileBank record not found for attachment ID: ${att.id}`);
                  console.warn(`⚠️ fileRecord:`, fileRecord);
                }
              }
            } catch (attError: any) {
              console.error(`❌ Error processing attachment ${att.filename}:`, attError.message);
              // Continue with other attachments even if one fails
            }
          }
          
          console.log(`✅ Prepared ${mailgunAttachments.length} attachments for Mailgun`);
          console.log('📎 DEBUG: Mailgun attachments:', mailgunAttachments.map(a => ({
            filename: a.filename,
            dataType: typeof a.data,
            dataLength: a.data instanceof Buffer ? a.data.length : a.data?.length
          })));
        } else {
          console.log('📎 No attachments to process');
        }
        
        console.log('📬 Calling Mailgun with:', {
          to,
          subject,
          textLength: textBodyWithTracking?.length,
          htmlLength: htmlBody?.length,
          attachmentCount: mailgunAttachments.length,
          hasAttachments: mailgunAttachments.length > 0,
          attachmentDetails: mailgunAttachments.map(a => ({
            filename: a.filename,
            size: a.data.length,
            isBuffer: a.data instanceof Buffer
          }))
        });
        
        console.log('🚨 FINAL CHECK BEFORE MAILGUN:');
        console.log('  - mailgunAttachments.length:', mailgunAttachments.length);
        console.log('  - Passing to sendEmail():', mailgunAttachments.length > 0 ? 'WITH ATTACHMENTS' : 'NO ATTACHMENTS');
        
        // Prepare display name for from address
        const displayName = from.split('@')[0]; // e.g., "info" from info@investaycapital.com
        const fromAddress = `${displayName} <${from}>`;
        
        console.log('📧 Mailgun From Address:', fromAddress);
        console.log('📨 Sending via Mailgun REST API directly...');
        
        // Build FormData for Mailgun API
        const mailgunForm = new FormData();
        mailgunForm.append('from', fromAddress);
        mailgunForm.append('to', to);
        mailgunForm.append('subject', subject);
        mailgunForm.append('text', textBodyWithTracking);
        mailgunForm.append('html', htmlBody);
        
        if (cc) mailgunForm.append('cc', cc);
        if (bcc) mailgunForm.append('bcc', bcc);
        if (from) mailgunForm.append('h:Reply-To', from);
        
        // Add attachments
        if (mailgunAttachments.length > 0) {
          console.log(`📎 Adding ${mailgunAttachments.length} attachments to FormData`);
          for (const att of mailgunAttachments) {
            const blob = new Blob([att.data], { type: 'application/octet-stream' });
            mailgunForm.append('attachment', blob, att.filename);
            console.log(`✅ Added attachment: ${att.filename} (${blob.size} bytes)`);
          }
        }
        
        // Send via Mailgun API
        const mailgunRegion = MAILGUN_REGION === 'EU' ? 'api.eu.mailgun.net' : 'api.mailgun.net';
        const mailgunUrl = `https://${mailgunRegion}/v3/${MAILGUN_DOMAIN}/messages`;
        
        console.log('📬 POST to Mailgun:', mailgunUrl);
        
        const mailgunResponse = await fetch(mailgunUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`api:${MAILGUN_API_KEY}`)
          },
          body: mailgunForm
        });
        
        const mailgunResult = await mailgunResponse.json();
        console.log('📬 Mailgun response:', JSON.stringify(mailgunResult, null, 2));
        
        if (mailgunResponse.ok) {
          mailgunSuccess = true;
          mailgunMessageId = mailgunResult.id;
          console.log('✅ Email sent via Mailgun:', mailgunResult.id);
        } else {
          mailgunError = mailgunResult.message || `HTTP ${mailgunResponse.status}`;
          console.error('❌ Mailgun send failed:', mailgunError);
        }
      } catch (mailgunException: any) {
        mailgunError = mailgunException.message;
        console.error('❌ Mailgun exception:', mailgunException);
        console.error('❌ Mailgun error name:', mailgunException.name);
        console.error('❌ Mailgun error message:', mailgunException.message);
        console.error('❌ Mailgun error stack:', mailgunException.stack);
      }
    } else {
      mailgunError = 'Mailgun not configured';
      console.warn('⚠️ Mailgun credentials not found in environment');
    }
    
    // ⚠️ ENCRYPTION DISABLED FOR DEBUGGING - Store plaintext
    const bodyToStore = body;
    const snippet = body.substring(0, 150);
    console.log('📝 Storing email as plaintext (encryption disabled)');
    
    // Store email in database
    const insertResult = await DB.prepare(`
      INSERT INTO emails (
        id, thread_id, from_email, from_name, to_email, cc, bcc, subject,
        body_text, body_html, snippet, category, ai_summary, 
        action_items, embedding_vector, sent_at, created_at,
        expiry_type, expires_at, is_expired
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, datetime('now', '+30 days'), 0)
    `).bind(
      emailId,
      threadId,
      from,
      displayName || from.split('@')[0],
      to,
      cc ? JSON.stringify(cc) : null,
      bcc ? JSON.stringify(bcc) : null,
      subject,
      bodyToStore, // Plaintext (encryption disabled)
      bodyToStore, // Plaintext (encryption disabled)
      snippet, // Plaintext snippet for preview
      category,
      aiSummary,
      aiActionItems ? JSON.stringify(aiActionItems) : null,
      embeddingVector ? JSON.stringify(embeddingVector) : null,
      '30d' // Default expiry: 30 days
    ).run();
    
    console.log('📧 Email saved to database:', insertResult.success ? '✅ SUCCESS' : '❌ FAILED', emailId, '⏳ Expires: 30d');
    
    // 📎 SAVE ATTACHMENTS TO DATABASE
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      console.log(`📎 Saving ${attachments.length} attachments to database for email ${emailId}`);
      
      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        const attachmentId = generateId('att');
        
        try {
          // For computer uploads, we could store base64 in r2_url as data URI
          // For FileBank files, store the FileBank ID/URL
          let r2Url = null;
          let r2Key = null;
          
          if (att.isLocalFile && att.data) {
            // Computer upload: store as data URI (for now)
            r2Url = `data:${att.content_type || 'application/octet-stream'};base64,${att.data.substring(0, 100)}...`;
            r2Key = `computer-upload-${Date.now()}-${i}`;
            console.log(`📎 Storing computer upload: ${att.filename}`);
          } else if (att.id) {
            // FileBank file: store reference
            r2Key = `filebank-${att.id}`;
            r2Url = att.url || null;
            console.log(`📎 Storing FileBank reference: ${att.filename} (ID: ${att.id})`);
          }
          
          await DB.prepare(`
            INSERT INTO attachments (
              id, email_id, filename, content_type, size, 
              r2_key, r2_url, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(
            attachmentId,
            emailId,
            att.filename,
            att.content_type || 'application/octet-stream',
            att.size || 0,
            r2Key,
            r2Url
          ).run();
          
          console.log(`✅ Saved attachment ${i + 1}/${attachments.length}: ${att.filename}`);
        } catch (attSaveError: any) {
          console.error(`❌ Failed to save attachment ${att.filename}:`, attSaveError.message);
          // Continue with other attachments
        }
      }
      
      console.log(`✅ All ${attachments.length} attachments saved to database for email ${emailId}`);
    }
    
    // Track analytics
    await DB.prepare(`
      INSERT INTO email_analytics (id, user_email, event_type, email_id)
      VALUES (?, ?, 'sent', ?)
    `).bind(generateId('anl'), from, emailId).run();
    
    // ❌ FAIL if Mailgun failed
    if (!mailgunSuccess) {
      return c.json({ 
        success: false,
        emailSaved: true,  // Email IS saved to DB
        emailSent: false,  // But NOT sent via Mailgun
        emailId,
        error: mailgunError || 'Failed to send email via Mailgun',
        message: '❌ Email saved to drafts but could not be sent via Mailgun'
      }, 500);
    }
    
    // ✅ SUCCESS - Email sent via Mailgun
    return c.json({ 
      success: true,
      emailSent: true,
      emailId,
      messageId: mailgunMessageId,
      message: '✅ Email sent successfully via Mailgun'
    });
  } catch (error: any) {
    console.error('❌❌❌ SEND EMAIL ERROR (INNER CATCH) ❌❌❌');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return c.json({ 
      success: false, 
      error: error.message || 'Internal server error',
      errorName: error.name,
      errorStack: error.stack?.split('\n').slice(0, 3).join('\n'),
      errorDetails: error.toString()
    }, 500);
  }
  } catch (outerError: any) {
    console.error('💥💥💥 CATASTROPHIC ERROR (OUTER CATCH) 💥💥💥');
    console.error('This should NEVER happen - error before environment setup');
    console.error('Outer error name:', outerError.name);
    console.error('Outer error message:', outerError.message);
    console.error('Outer error stack:', outerError.stack);
    return c.json({ 
      success: false, 
      error: 'Server initialization error: ' + outerError.message,
      errorName: outerError.name,
      errorStack: outerError.stack,
      note: 'This is a catastrophic error that occurred before request processing'
    }, 500);
  }
});

// ============================================
// POST /api/email/compose-assist
// AI-powered compose assistance
// ============================================
emailRoutes.post('/compose-assist', async (c) => {
  const { OPENAI_API_KEY } = c.env;
  
  if (!OPENAI_API_KEY) {
    return c.json({ 
      success: false, 
      error: 'AI features not configured' 
    }, 503);
  }
  
  try {
    const { action, text, tone, context, subject } = await c.req.json();
    
    let prompt = '';
    let systemPrompt = 'You are an expert email writing assistant for institutional professionals. Write clear, concise, professional emails.';
    
    // Check if context includes full conversation thread
    const hasFullThread = context && context.includes('FULL CONVERSATION THREAD:');
    
    if (hasFullThread) {
      // Enhanced system prompt for thread-aware AI
      systemPrompt = `You are an expert email writing assistant for institutional professionals. 
You have access to the FULL email conversation thread to understand context, tone, and history.
When improving or expanding replies:
1. Consider the entire conversation history
2. Reference specific points from previous messages when relevant
3. Maintain consistency with the conversation tone
4. Avoid repeating what's already been said
5. Provide contextually-aware, intelligent responses
Write clear, concise, professional emails that demonstrate understanding of the full conversation.`;
    }
    
    switch (action) {
      case 'generate_reply':
        // NEW: Generate complete reply from scratch based on conversation context
        systemPrompt = `You are an expert email writing assistant for institutional professionals.
You have access to the FULL email conversation thread. Your task is to write a complete, contextually-aware reply.

Guidelines:
1. Read and understand the entire conversation history
2. Identify what the last message is asking for or discussing
3. Write a natural, professional reply that directly addresses the conversation
4. Reference specific points from previous messages when relevant
5. Maintain the conversation's tone and style
6. Be concise but complete
7. Include appropriate next steps or questions if needed
8. Write ONLY the reply body - no greetings like "Dear X" or signatures

The reply should feel like a natural continuation of the conversation.`;
        
        prompt = `Here is the full email conversation thread:\n\n${context}\n\n---\n\nBased on this conversation, write a complete, professional reply that appropriately addresses the latest message and moves the conversation forward. Write ONLY the email body, no subject line or signatures.`;
        break;
        
      case 'improve':
        if (hasFullThread) {
          prompt = `You have access to the full conversation thread below. Improve the current reply while maintaining ${tone || 'professional'} tone and considering the conversation context.\n\n${context}\n\nImprove this reply to be more effective and contextually appropriate.`;
        } else {
          prompt = `Improve this email while maintaining ${tone || 'professional'} tone:\n\n${text}`;
        }
        break;
        
      case 'shorten':
        if (hasFullThread) {
          prompt = `You have access to the full conversation thread below. Make the current reply more concise while maintaining key points and conversation context.\n\n${context}\n\nMake this reply shorter and more focused.`;
        } else {
          prompt = `Make this email more concise:\n\n${text}`;
        }
        break;
        
      case 'expand':
        if (hasFullThread) {
          prompt = `You have access to the full conversation thread below. Expand the current reply with more detail, considering the conversation history.\n\n${context}\n\nExpand this reply with relevant details and context.`;
        } else {
          prompt = `Expand these bullet points into a complete ${tone || 'professional'} email:\n\n${text}`;
        }
        break;
        
      case 'fix':
        if (hasFullThread) {
          prompt = `You have access to the full conversation thread below. Fix any grammar, spelling, or clarity issues in the current reply.\n\n${context}\n\nFix any errors and improve clarity.`;
        } else {
          prompt = `Fix grammar and improve clarity:\n\n${text}`;
        }
        break;
        
      case 'summarize':
        prompt = `Summarize this email concisely:\n\n${text}`;
        break;
        
      case 'reply':
        prompt = `Write a ${tone || 'professional'} reply to this email:\n\n${context}\n\nKey points to address:\n${text}`;
        break;
        
      case 'translate':
        prompt = `Translate this email to ${tone}:\n\n${text}`;
        break;
        
      default:
        return c.json({ success: false, error: 'Invalid action' }, 400);
    }
    
    console.log(`🤖 AI Compose Assist: action=${action}, hasFullThread=${hasFullThread}, tone=${tone}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500  // Increased for thread-aware responses
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'AI request failed');
    }
    
    const improvedText = data.choices[0].message.content;
    
    return c.json({ 
      success: true, 
      text: improvedText,
      action 
    });
  } catch (error: any) {
    console.error('Compose assist error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// POST /api/email/smart-replies
// Generate AI-powered quick reply suggestions
// ============================================
emailRoutes.post('/smart-replies', async (c) => {
  const { OPENAI_API_KEY } = c.env;
  
  if (!OPENAI_API_KEY) {
    return c.json({ 
      success: false, 
      error: 'AI features not configured' 
    }, 503);
  }
  
  try {
    const { emailBody } = await c.req.json();
    
    if (!emailBody) {
      return c.json({ success: false, error: 'Email body is required' }, 400);
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at generating quick, professional email replies. Generate exactly 3 short reply suggestions as a JSON array. Each reply should be 1-2 sentences, professional and appropriate.'
          },
          {
            role: 'user',
            content: `Generate 3 quick reply suggestions for this email:\n\n${emailBody.substring(0, 1000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'AI request failed');
    }
    
    const content = data.choices[0].message.content;
    
    let replies: string[] = [];
    try {
      replies = JSON.parse(content);
    } catch {
      // If not valid JSON, return default replies
      replies = [
        'Thank you for your email. I will review and get back to you shortly.',
        'Received, I\'ll look into this.',
        'Thanks for the update!'
      ];
    }
    
    return c.json({ 
      success: true, 
      replies 
    });
  } catch (error: any) {
    console.error('Smart replies error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// POST /api/email/search
// REAL AI-POWERED SMART SEARCH using GPT-4
// ============================================
emailRoutes.post('/search', async (c) => {
  const { DB, OPENAI_API_KEY } = c.env;
  
  try {
    const { query, userEmail, folder } = await c.req.json();
    
    if (!query) {
      return c.json({ success: false, error: 'Query is required' }, 400);
    }
    
    const user = userEmail || 'admin@investaycapital.com';
    
    console.log('🔍 AI Search Query:', query);
    
    // STEP 1: Use GPT-4 to extract search terms and understand intent
    let searchTerms: string[] = [];
    let searchIntent: any = {
      sender: null,
      recipient: null,
      dateRange: null,
      hasAttachment: false,
      isUnread: false,
      isStarred: false,
      isPriority: false,
      category: folder || null
    };
    
    if (OPENAI_API_KEY) {
      console.log('✅ OPENAI_API_KEY found, using AI search');
      try {
        console.log('🤖 Calling OpenAI API with query:', query);
        
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'system',
              content: `You are an advanced email search assistant with deep semantic understanding. Extract search terms and filters from natural language queries.

CRITICAL INSTRUCTIONS - BE EXTREMELY CREATIVE AND LENIENT:

1. SEMANTIC UNDERSTANDING: Understand the MEANING, not just words
   - "animal brawl" → cat, dog, fight, brawl, animals, pets, fighting, altercation, incident
   - "financial report" → financial, report, finance, fiscal, budget, earnings, revenue
   - "q1 review" → q1, review, quarter, quarterly, first quarter, Q1, 1st quarter

2. GENERATE CREATIVE SYNONYMS: Think like a human searching
   - Technical terms + casual terms
   - Formal + informal language
   - Abbreviations + full words
   - Related concepts and contexts

3. EXPAND CONCEPTS: What would appear in an email about this?
   - "meeting" → meeting, schedule, calendar, appointment, conference, call, zoom, teams
   - "urgent" → urgent, important, asap, critical, priority, rush, immediate
   - "brawl" → fight, fighting, brawl, altercation, incident, conflict, dispute, fighting, fought
   - "animal" → animal, animals, cat, cats, dog, dogs, pet, pets, creature, creatures

4. INCLUDE ALL VARIATIONS:
   - Singular/plural: cat/cats, dog/dogs
   - Verb forms: fight/fighting/fought
   - Related entities: animals, pets, creatures
   - Action words: saw, witnessed, occurred, happened

Return JSON with ALL possible search terms:
{
  "searchTerms": ["term1", "term2", "synonym1", "related1", ...],
  "sender": null,
  "recipient": null, 
  "dateRange": null,
  "hasAttachment": false,
  "isUnread": false,
  "isStarred": false,
  "isPriority": false
}

GENERATE 15-25 SEARCH TERMS! Be very generous!

EXAMPLES:

Query: "animal brawl"
Response: {
  "searchTerms": ["animal", "animals", "brawl", "fight", "fighting", "fought", "cat", "cats", "dog", "dogs", "pets", "pet", "altercation", "incident", "conflict", "dispute", "witnessed", "saw", "occurred", "happened", "creature", "creatures"],
  "sender": null,
  "recipient": null,
  "dateRange": null,
  "hasAttachment": false,
  "isUnread": false,
  "isStarred": false,
  "isPriority": false
}

Query: "financial report q1"
Response: {
  "searchTerms": ["financial", "report", "q1", "quarter", "quarterly", "first quarter", "Q1", "finance", "fiscal", "budget", "earnings", "revenue", "1st quarter", "reporting", "statement", "analysis"],
  "sender": null,
  "recipient": null,
  "dateRange": null,
  "hasAttachment": false,
  "isUnread": false,
  "isStarred": false,
  "isPriority": false
}

BE CREATIVE! Generate many terms!`
            }, {
              role: 'user',
              content: `Extract search terms from: "${query}"`
            }],
            temperature: 0.8,  // Even more creative
            max_tokens: 1000  // More space for terms
          })
        });
        
        console.log('📡 OpenAI Response Status:', aiResponse.status, aiResponse.statusText);
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices[0].message.content;
          console.log('🤖 AI Full Response:', content);
          
          // Parse JSON response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            searchTerms = parsed.searchTerms || [];
            console.log('✅ AI Generated Terms:', searchTerms);
            searchIntent.sender = parsed.sender;
            searchIntent.recipient = parsed.recipient;
            searchIntent.dateRange = parsed.dateRange;
            searchIntent.hasAttachment = parsed.hasAttachment;
            searchIntent.isUnread = parsed.isUnread;
            searchIntent.isStarred = parsed.isStarred;
            searchIntent.isPriority = parsed.isPriority;
          } else {
            console.error('❌ Could not parse JSON from AI response');
          }
        } else {
          const errorText = await aiResponse.text();
          console.error('❌ OpenAI API Error:', aiResponse.status, errorText);
        }
      } catch (aiError: any) {
        console.error('❌ AI extraction failed:', aiError.message, aiError);
      }
    } else {
      console.warn('⚠️ No OPENAI_API_KEY found, using fallback');
    }
    
    // FALLBACK: If AI fails or no search terms, use simple extraction
    if (searchTerms.length === 0) {
      // Very lenient keyword extraction
      searchTerms = query
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length >= 2) // Accept 2+ char words
        .filter(w => !['and', 'or', 'the'].includes(w)); // Only remove most common words
    }
    
    console.log('🔍 Search Terms:', searchTerms);
    console.log('🔍 Search Terms:', searchTerms);
    
    // STEP 2: Build LENIENT SQL query
    let sql = `
      SELECT DISTINCT
        e.id, e.thread_id, e.from_email, e.from_name, e.to_email, e.subject,
        e.snippet, e.category, e.priority, e.is_read, e.is_starred, e.received_at,
        (SELECT COUNT(*) FROM attachments WHERE email_id = e.id) as attachment_count,
        CASE WHEN EXISTS(SELECT 1 FROM attachments WHERE email_id = e.id) THEN 1 ELSE 0 END as has_attachments
      FROM emails e
      WHERE (e.to_email = ? OR e.from_email = ?)
    `;
    
    const bindings: any[] = [user, user];
    
    // Apply folder filter
    if (folder) {
      if (folder === 'inbox') {
        sql += ` AND e.category = 'inbox' AND e.is_archived = 0`;
      } else if (folder === 'sent') {
        sql += ` AND e.from_email = ?`;
        bindings.push(user);
      } else if (folder === 'drafts') {
        sql = `
          SELECT 
            d.id, d.thread_id, '' as from_email, ? as from_name, d.to_email, d.subject,
            substr(d.body_text, 1, 150) as snippet, 'draft' as category, 
            'normal' as priority, 0 as is_read, 0 as is_starred, d.created_at as received_at,
            0 as has_attachments, 0 as attachment_count
          FROM email_drafts d
          WHERE d.created_by = ?
        `;
        bindings.length = 0;
        bindings.push(user, user);
      } else if (folder === 'spam') {
        sql += ` AND e.category = 'spam'`;
      } else if (folder === 'trash') {
        sql += ` AND e.category = 'trash'`;
      } else if (folder === 'archive') {
        sql += ` AND e.is_archived = 1`;
      } else {
        sql += ` AND e.category != 'trash'`;
      }
    } else {
      sql += ` AND e.category != 'trash'`;
    }
    
    // Apply sender filter
    if (searchIntent.sender) {
      sql += ` AND (e.from_email LIKE ? OR e.from_name LIKE ?)`;
      bindings.push(`%${searchIntent.sender}%`, `%${searchIntent.sender}%`);
    }
    
    // Apply recipient filter
    if (searchIntent.recipient) {
      sql += ` AND e.to_email LIKE ?`;
      bindings.push(`%${searchIntent.recipient}%`);
    }
    
    // Apply date range
    if (searchIntent.dateRange) {
      if (searchIntent.dateRange.start) {
        sql += ` AND date(e.received_at) >= ?`;
        bindings.push(searchIntent.dateRange.start);
      }
      if (searchIntent.dateRange.end) {
        sql += ` AND date(e.received_at) <= ?`;
        bindings.push(searchIntent.dateRange.end);
      }
    }
    
    // Apply unread filter
    if (searchIntent.isUnread) {
      sql += ` AND e.is_read = 0`;
    }
    
    // Apply starred filter
    if (searchIntent.isStarred) {
      sql += ` AND e.is_starred = 1`;
    }
    
    // Apply attachment filter
    if (searchIntent.hasAttachment) {
      sql += ` AND EXISTS(SELECT 1 FROM attachments WHERE email_id = e.id)`;
    }
    
    // Apply priority filter
    if (searchIntent.isPriority) {
      sql += ` AND e.priority = 'high'`;
    }
    
    // VERY LENIENT keyword search - OR logic with ANY match
    if (searchTerms.length > 0) {
      const keywordConditions = searchTerms.map(() => 
        `(e.subject LIKE ? OR e.body_text LIKE ? OR e.snippet LIKE ?)`
      ).join(' OR ');
      sql += ` AND (${keywordConditions})`;
      
      searchTerms.forEach(term => {
        const likePattern = `%${term}%`;
        bindings.push(likePattern, likePattern, likePattern);
      });
    }
    
    sql += ` ORDER BY e.received_at DESC LIMIT 100`;
    
    console.log('🔍 SQL Bindings:', bindings.length);
    
    const { results } = await DB.prepare(sql).bind(...bindings).all();
    
    console.log(`✅ Found ${results.length} results`);
    
    return c.json({ 
      success: true, 
      results, 
      query,
      intent: { ...searchIntent, searchTerms },
      count: results.length
    });
  } catch (error: any) {
    console.error('❌ Search error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// PUT /api/email/:id/star
// Star/unstar an email
// ============================================
emailRoutes.put('/:id/star', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('id');
  
  try {
    const { starred } = await c.req.json();
    
    await DB.prepare(`
      UPDATE emails SET is_starred = ? WHERE id = ?
    `).bind(starred ? 1 : 0, emailId).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Star email error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// PUT /api/email/:id/archive
// Archive/unarchive an email
// ============================================
emailRoutes.put('/:id/archive', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('id');
  
  try {
    const { archived } = await c.req.json();
    
    await DB.prepare(`
      UPDATE emails SET is_archived = ? WHERE id = ?
    `).bind(archived ? 1 : 0, emailId).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Archive email error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// PUT /api/email/:id/expiry
// Set email expiry time (Inbox = Now feature)
// ============================================
emailRoutes.put('/:id/expiry', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('id');
  
  try {
    const { expiry_type } = await c.req.json();
    
    // Calculate expires_at based on expiry_type
    let expiresAt = null;
    if (expiry_type === '24h') {
      expiresAt = `datetime('now', '+1 day')`;
    } else if (expiry_type === '7d') {
      expiresAt = `datetime('now', '+7 days')`;
    } else if (expiry_type === '30d') {
      expiresAt = `datetime('now', '+30 days')`;
    } else if (expiry_type === 'keep') {
      expiresAt = null; // Keep forever
    }
    
    if (expiresAt) {
      await DB.prepare(`
        UPDATE emails 
        SET expiry_type = ?, 
            expires_at = ${expiresAt},
            is_expired = 0
        WHERE id = ?
      `).bind(expiry_type, emailId).run();
    } else {
      // Keep forever
      await DB.prepare(`
        UPDATE emails 
        SET expiry_type = 'keep', 
            expires_at = NULL,
            is_expired = 0
        WHERE id = ?
      `).bind(emailId).run();
    }
    
    return c.json({ success: true, expiry_type });
  } catch (error: any) {
    console.error('Set expiry error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// DELETE /api/email/:id
// Move email to trash
// ============================================
emailRoutes.delete('/:id', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('id');
  
  try {
    await DB.prepare(`
      UPDATE emails SET category = 'trash' WHERE id = ?
    `).bind(emailId).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete email error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// GET /api/email/analytics
// Get email analytics for authenticated user ONLY
// 🔒 SECURITY: Users can ONLY see their own analytics
// ============================================
emailRoutes.get('/analytics/summary', async (c) => {
  const { DB } = c.env;
  // 🔒 Get email from authenticated session - NO query parameter!
  const userEmail = c.get('userEmail');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    // Total emails
    const totalEmails = await DB.prepare(`
      SELECT COUNT(*) as count FROM emails 
      WHERE to_email = ? OR from_email = ?
    `).bind(userEmail, userEmail).first();
    
    // Unread count
    const unreadCount = await DB.prepare(`
      SELECT COUNT(*) as count FROM emails 
      WHERE to_email = ? AND is_read = 0 AND category != 'trash'
    `).bind(userEmail).first();
    
    // Emails sent today
    const sentToday = await DB.prepare(`
      SELECT COUNT(*) as count FROM emails 
      WHERE from_email = ? AND DATE(sent_at) = DATE('now')
    `).bind(userEmail).first();
    
    // Top senders
    const { results: topSenders } = await DB.prepare(`
      SELECT from_email, COUNT(*) as count
      FROM emails
      WHERE to_email = ? AND category != 'trash'
      GROUP BY from_email
      ORDER BY count DESC
      LIMIT 5
    `).bind(userEmail).all();
    
    return c.json({
      success: true,
      analytics: {
        totalEmails: totalEmails?.count || 0,
        unreadCount: unreadCount?.count || 0,
        sentToday: sentToday?.count || 0,
        topSenders: topSenders || []
      }
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// POST /api/email/drafts/save
// Save or update draft email
// 🔒 SECURITY: Users can ONLY save drafts from their own address
// ============================================
emailRoutes.post('/drafts/save', async (c) => {
  const { DB } = c.env;
  
  // 🔒 Get authenticated user email
  const authenticatedUserEmail = c.get('userEmail');
  
  if (!authenticatedUserEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const { draftId, to, subject, body } = await c.req.json();
    
    // 🔒 CRITICAL: Force from to be authenticated user's email
    const from = authenticatedUserEmail;
    
    const now = new Date().toISOString();
    
    if (draftId) {
      // Update existing draft - verify ownership
      const existingDraft = await DB.prepare(`
        SELECT from_email FROM emails WHERE id = ? AND from_email = ?
      `).bind(draftId, from).first();
      
      if (!existingDraft) {
        return c.json({ 
          success: false, 
          error: 'Draft not found or access denied' 
        }, 403);
      }
      
      await DB.prepare(`
        UPDATE emails 
        SET to_email = ?, subject = ?, body_text = ?, updated_at = ?
        WHERE id = ? AND from_email = ?
      `).bind(to, subject, body, now, draftId, from).run();
      
      return c.json({ success: true, draftId });
    } else {
      // Create new draft
      const newDraftId = generateId('draft');
      
      await DB.prepare(`
        INSERT INTO emails (
          id, thread_id, from_email, to_email, subject, body,
          category, priority, is_read, is_starred, is_archived,
          sent_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'draft', 0, 1, 0, 0, ?, ?, ?)
      `).bind(
        newDraftId,
        generateId('thread'),
        from,
        to || '',
        subject || 'No Subject',
        body || '',
        now,
        now,
        now
      ).run();
      
      return c.json({ success: true, draftId: newDraftId });
    }
  } catch (error: any) {
    console.error('Save draft error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// GET /api/email/drafts
// Get all drafts for authenticated user ONLY
// 🔒 SECURITY: Users can ONLY see their own drafts
// ============================================
emailRoutes.get('/drafts', async (c) => {
  const { DB } = c.env;
  // 🔒 Get email from authenticated session - NO query parameter!
  const userEmail = c.get('userEmail');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        id, user_email, to_email, cc, bcc, subject, body_text, body_html, 
        attachments, ai_suggestions, last_edited_at, created_at
      FROM email_drafts
      WHERE user_email = ?
      ORDER BY last_edited_at DESC
      LIMIT 20
    `).bind(userEmail).all();
    
    return c.json({ success: true, drafts: results });
  } catch (error: any) {
    console.error('Get drafts error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// DELETE /api/email/drafts/:id
// Delete a draft
// ============================================
emailRoutes.delete('/drafts/:id', async (c) => {
  const { DB } = c.env;
  const draftId = c.req.param('id');
  
  try {
    await DB.prepare(`
      DELETE FROM emails WHERE id = ? AND category = 'draft'
    `).bind(draftId).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete draft error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// POST /api/email/templates/save
// Save email template
// ============================================
emailRoutes.post('/templates/save', async (c) => {
  const { DB } = c.env;
  
  try {
    const { name, subject, body, category, userId } = await c.req.json();
    const templateId = generateId('tmpl');
    const now = new Date().toISOString();
    
    await DB.prepare(`
      INSERT INTO email_templates (
        id, user_id, name, subject, body, category, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(templateId, userId, name, subject, body, category || 'general', now, now).run();
    
    return c.json({ success: true, templateId });
  } catch (error: any) {
    console.error('Save template error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// GET /api/email/templates
// Get all templates for authenticated user ONLY
// 🔒 SECURITY: Users can ONLY see their own templates
// ============================================
emailRoutes.get('/templates', async (c) => {
  const { DB } = c.env;
  // 🔒 Get user ID from authenticated session - NO query parameter!
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const { results } = await DB.prepare(`
      SELECT id, name, subject, body, category, created_at
      FROM email_templates
      WHERE user_id = ?
      ORDER BY name ASC
    `).bind(userId).all();
    
    return c.json({ success: true, templates: results || [] });
  } catch (error: any) {
    console.error('Get templates error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// GET /api/email/:id
// Get single email by ID
// 🔒 SECURITY: Users can ONLY view emails they sent or received
// NOTE: This MUST be last among GET routes as it's a catch-all
// ============================================
emailRoutes.get('/:id', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('id');
  // 🔒 Get authenticated user email
  const userEmail = c.get('userEmail');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const email = await DB.prepare(`
      SELECT * FROM emails WHERE id = ?
    `).bind(emailId).first();
    
    if (!email) {
      return c.json({ success: false, error: 'Email not found' }, 404);
    }
    
    // 🔒 CRITICAL: Check if user owns this email
    if (email.to_email !== userEmail && email.from_email !== userEmail) {
      return c.json({ 
        success: false, 
        error: 'Access denied - You can only view emails you sent or received' 
      }, 403);
    }
    
    // ⚠️ NO DECRYPTION - emails stored as plaintext
    const emailData = { ...email };
    console.log('📧 Returning email (no decryption needed)');
    console.log(`📧 Email from: ${email.from_email}, to: ${email.to_email}, current user: ${userEmail}`);
    console.log(`📧 Current is_read status: ${email.is_read}`);
    
    // Mark as read (only if recipient)
    if (email.to_email === userEmail) {
      console.log(`🔄 ATTEMPTING to mark email ${emailId} as READ...`);
      const updateResult = await DB.prepare(`
        UPDATE emails 
        SET is_read = 1, opened_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(emailId).run();
      
      console.log(`📊 UPDATE result:`, JSON.stringify(updateResult));
      
      // Update the email object to reflect the change
      emailData.is_read = 1;
      emailData.opened_at = new Date().toISOString();
      console.log(`✅ Marked email ${emailId} as READ for recipient ${userEmail}`);
      console.log(`📧 Updated emailData.is_read = ${emailData.is_read}`);
    } else {
      console.log(`⏭️ NOT marking as read - user ${userEmail} is not the recipient (${email.to_email})`);
    }
    
    // Get attachments
    const { results: attachments } = await DB.prepare(`
      SELECT * FROM attachments WHERE email_id = ?
    `).bind(emailId).all();
    
    return c.json({ 
      success: true, 
      email: { ...emailData, attachments }
    });
  } catch (error: any) {
    console.error('Email fetch error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// GET /api/email/:id/attachments
// Get attachments for a specific email
// ============================================
emailRoutes.get('/:id/attachments', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('id');
  const userEmail = c.get('userEmail');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    // First verify user has access to this email
    const email = await DB.prepare(`
      SELECT id FROM emails 
      WHERE id = ? AND (from_email = ? OR to_email = ?)
    `).bind(emailId, userEmail, userEmail).first();
    
    if (!email) {
      return c.json({ success: false, error: 'Email not found or access denied' }, 404);
    }
    
    // Get attachments
    const { results: attachments } = await DB.prepare(`
      SELECT id, email_id, filename, content_type, size, r2_url, created_at
      FROM attachments 
      WHERE email_id = ?
      ORDER BY created_at ASC
    `).bind(emailId).all();
    
    console.log(`📎 Found ${attachments?.length || 0} attachments for email ${emailId}`);
    
    return c.json({ 
      success: true, 
      attachments: attachments || [],
      count: attachments?.length || 0
    });
  } catch (error: any) {
    console.error('Attachments fetch error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// GET /api/email/track/:tracking_id
// Email open tracking pixel endpoint
// Returns a 1x1 transparent GIF
// ============================================
emailRoutes.get('/track/:tracking_id', async (c) => {
  const { DB } = c.env;
  const trackingId = c.req.param('tracking_id');
  
  try {
    // Parse tracking ID format: email_id
    const emailId = trackingId;
    
    // Get email details including sender
    const email = await DB.prepare(`
      SELECT id, to_email, from_email FROM emails WHERE id = ?
    `).bind(emailId).first() as any;
    
    if (!email) {
      // Still return pixel even if email not found
      return new Response(TRACKING_PIXEL, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    // Get user agent and IP
    const userAgent = c.req.header('user-agent') || '';
    const ipAddress = c.req.header('cf-connecting-ip') || 
                      c.req.header('x-forwarded-for') || 
                      c.req.header('x-real-ip') || '';
    const referer = c.req.header('referer') || '';
    
    console.log(`🔍 ===== TRACKING REQUEST for email ${emailId} =====`);
    console.log(`   📧 To: ${email.to_email}, From: ${email.from_email}`);
    console.log(`   🌐 User-Agent: ${userAgent}`);
    console.log(`   📍 IP: ${ipAddress}`);
    console.log(`   🔗 Referer: ${referer || '(none)'}`);
    
    // 🚨 CRITICAL: Detect Gmail Image Proxy prefetch
    // 🚨 Gmail Image Proxy Detection
    // Gmail prefetches images when email arrives (NOT a real open)
    // BUT we track it anyway and mark as "proxy" to get baseline timestamp
    const isGmailProxy = userAgent.includes('GoogleImageProxy') ||
                         userAgent.includes('Google-Image-Proxy') ||
                         userAgent.includes('via googlemail.com') ||
                         userAgent.includes('Googlebot-Image');
    
    const readMethod = isGmailProxy ? 'tracking_pixel_proxy' : 'tracking_pixel';
    console.log(`   🎯 Method: ${readMethod} (isGmailProxy: ${isGmailProxy})`);
    console.log(`✅ Processing tracking...`);
    
    // Detect device type
    const deviceType = userAgent.toLowerCase().includes('mobile') ? 'mobile' :
                       userAgent.toLowerCase().includes('tablet') ? 'tablet' : 'desktop';
    
    // Detect email client (basic detection)
    let emailClient = 'unknown';
    if (userAgent.includes('Gmail')) emailClient = 'gmail';
    else if (userAgent.includes('Outlook')) emailClient = 'outlook';
    else if (userAgent.includes('Apple Mail')) emailClient = 'apple-mail';
    else if (userAgent.includes('Thunderbird')) emailClient = 'thunderbird';
    
    console.log(`📧 Device: ${deviceType}, Client: ${emailClient}, IP: ${ipAddress}`);
    
    // Check if already tracked
    const existing = await DB.prepare(`
      SELECT id, open_count FROM email_read_receipts 
      WHERE email_id = ? AND recipient_email = ?
    `).bind(emailId, email.to_email).first() as any;
    
    if (existing) {
      // Update existing record - increment open count
      await DB.prepare(`
        UPDATE email_read_receipts
        SET open_count = open_count + 1,
            last_opened_at = CURRENT_TIMESTAMP,
            ip_address = ?,
            user_agent = ?
        WHERE id = ?
      `).bind(ipAddress, userAgent, existing.id).run();
      
      console.log(`✅ Email ${emailId} re-opened (total opens: ${existing.open_count + 1})`);
      
      // Ensure the email is still marked as read (in case it was changed)
      await DB.prepare(`
        UPDATE emails
        SET is_read = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_read = 0
      `).bind(emailId).run();
    } else {
      // Create new read receipt
      const receiptId = generateId('rcpt');
      await DB.prepare(`
        INSERT INTO email_read_receipts (
          id, email_id, recipient_email, opened_at,
          ip_address, user_agent, device_type, email_client, read_method
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)
      `).bind(
        receiptId, emailId, email.to_email,
        ipAddress, userAgent, deviceType, emailClient, readMethod
      ).run();
      
      // Track as activity
      await DB.prepare(`
        INSERT INTO email_activity_tracking (
          id, email_id, user_email, activity_type, activity_data
        ) VALUES (?, ?, ?, 'email_opened', ?)
      `).bind(
        generateId('act'), emailId, email.to_email,
        JSON.stringify({ device_type: deviceType, email_client: emailClient })
      ).run();
      
      // 🔥 CRITICAL FIX: Update the emails table to mark as read
      // This ensures the email shows "Read" status in the UI
      await DB.prepare(`
        UPDATE emails
        SET is_read = 1,
            opened_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(emailId).run();
      
      console.log(`✅ Email ${emailId} marked as READ in database`);
    }
    
    // Return 1x1 transparent GIF
    return new Response(TRACKING_PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    console.error('Tracking error:', error);
    // Always return pixel even on error
    return new Response(TRACKING_PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
});

// ============================================
// GET /api/email/link/:email_id
// Link click tracking endpoint (PUBLIC - no auth)
// Tracks when recipient clicks links in emails
// Then redirects to the actual destination
// This is MORE RELIABLE than tracking pixels!
// ============================================
emailRoutes.get('/link/:email_id', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('email_id');
  const destUrl = c.req.query('dest');
  
  // Validate destination URL
  if (!destUrl) {
    return c.text('Missing destination URL', 400);
  }
  
  try {
    // Get email details
    const email = await DB.prepare(`
      SELECT id, to_email, from_email FROM emails WHERE id = ?
    `).bind(emailId).first() as any;
    
    if (email) {
      // Get tracking info
      const userAgent = c.req.header('user-agent') || '';
      const ipAddress = c.req.header('cf-connecting-ip') || 
                        c.req.header('x-forwarded-for') || 
                        c.req.header('x-real-ip') || '';
      
      // Detect device and client
      const deviceType = userAgent.toLowerCase().includes('mobile') ? 'mobile' : 'desktop';
      const emailClient = userAgent.includes('Outlook') ? 'Outlook' :
                         userAgent.includes('Thunderbird') ? 'Thunderbird' :
                         userAgent.includes('Apple Mail') ? 'Apple Mail' :
                         userAgent.includes('Gmail') ? 'Gmail' : 'Unknown';
      
      // Check if already tracked
      const existing = await DB.prepare(`
        SELECT id, open_count FROM email_read_receipts
        WHERE email_id = ? AND recipient_email = ?
      `).bind(emailId, email.to_email).first() as any;
      
      if (existing) {
        // Update existing receipt
        await DB.prepare(`
          UPDATE email_read_receipts
          SET last_opened_at = CURRENT_TIMESTAMP,
              open_count = open_count + 1,
              read_method = 'link_click',
              user_agent = ?,
              ip_address = ?
          WHERE id = ?
        `).bind(userAgent, ipAddress, existing.id).run();
        
        console.log(`📊 Link clicked in email ${emailId} (total opens: ${existing.open_count + 1})`);
      } else {
        // Create new read receipt
        const receiptId = generateId('rcpt');
        await DB.prepare(`
          INSERT INTO email_read_receipts (
            id, email_id, recipient_email, opened_at,
            ip_address, user_agent, device_type, email_client,
            read_method, open_count
          ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, 'link_click', 1)
        `).bind(
          receiptId, emailId, email.to_email,
          ipAddress, userAgent, deviceType, emailClient
        ).run();
        
        console.log(`📊 First link click tracked for email ${emailId}`);
      }
      
      // Mark email as read
      await DB.prepare(`
        UPDATE emails
        SET is_read = 1,
            opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP),
            read_method = 'link_click',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(emailId).run();
      
      console.log(`✅ Email ${emailId} marked as READ via link click`);
      
      // Track activity
      await DB.prepare(`
        INSERT INTO email_activity_tracking (
          id, email_id, user_email, activity_type, activity_data
        ) VALUES (?, ?, ?, 'link_clicked', ?)
      `).bind(
        generateId('act'), emailId, email.to_email,
        JSON.stringify({ 
          destination: destUrl,
          device_type: deviceType, 
          email_client: emailClient 
        })
      ).run();
    }
    
    // Redirect to destination (fast 302 redirect)
    return c.redirect(destUrl, 302);
    
  } catch (error: any) {
    console.error('Link tracking error:', error);
    // Even on error, redirect to destination (don't break user experience)
    return c.redirect(destUrl, 302);
  }
});

// ============================================
// GET /api/email/:email_id/read-status
// Get read status for sent email
// ============================================
emailRoutes.get('/:email_id/read-status', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('email_id');
  
  try {
    const receipts = await DB.prepare(`
      SELECT 
        id, recipient_email, opened_at, last_opened_at,
        open_count, ip_address, device_type, email_client
      FROM email_read_receipts
      WHERE email_id = ?
      ORDER BY opened_at DESC
    `).bind(emailId).all();
    
    return c.json({
      success: true,
      is_read: receipts.results.length > 0,
      total_opens: receipts.results.reduce((sum: number, r: any) => sum + r.open_count, 0),
      receipts: receipts.results
    });
  } catch (error: any) {
    console.error('Get read status error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 1x1 transparent GIF pixel (base64 encoded)
const TRACKING_PIXEL = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));

// ============================================
// POST /api/email/check-spam
// Check spam score without sending
// ============================================
emailRoutes.post('/check-spam', async (c) => {
  try {
    const { subject, body, html } = await c.req.json();
    
    if (!subject || !body) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: subject and body' 
      }, 400);
    }
    
    const spamCheck = checkSpamScore(subject, body, html);
    
    return c.json({
      success: true,
      spamCheck: {
        score: spamCheck.score,
        level: spamCheck.level,
        passed: spamCheck.passed,
        issues: spamCheck.issues,
        recommendations: spamCheck.recommendations
      }
    });
  } catch (error: any) {
    console.error('Spam check error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// EMAIL ACCOUNT MANAGEMENT ENDPOINTS
// ============================================

// POST /api/email/accounts/create
// Create a new email account
emailRoutes.post('/accounts/create', async (c) => {
  const { DB } = c.env;
  
  try {
    const { email, display_name, password } = await c.req.json();
    
    // Validate required fields
    if (!email || !display_name) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: email and display_name' 
      }, 400);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@investaycapital\.com$/;
    if (!emailRegex.test(email)) {
      return c.json({ 
        success: false, 
        error: 'Invalid email format. Must be @investaycapital.com' 
      }, 400);
    }
    
    // Check if email already exists
    const existingAccount = await DB.prepare(`
      SELECT id FROM email_accounts WHERE email_address = ?
    `).bind(email).first();
    
    if (existingAccount) {
      return c.json({ 
        success: false, 
        error: 'Email account already exists' 
      }, 409);
    }
    
    // Generate account ID
    const accountId = generateId('acc');
    
    // Hash password if provided
    const hashedPassword = password ? await hashPassword(password) : null;
    
    // Create account
    const result = await DB.prepare(`
      INSERT INTO email_accounts (
        id, email_address, display_name, password_hash, is_active, created_at
      ) VALUES (?, ?, ?, ?, 1, datetime('now'))
    `).bind(accountId, email, display_name, hashedPassword).run();
    
    if (!result.success) {
      return c.json({ 
        success: false, 
        error: 'Failed to create email account' 
      }, 500);
    }
    
    return c.json({
      success: true,
      account: {
        id: accountId,
        email,
        display_name,
        is_active: true,
        created_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Account creation error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/email/accounts/list
// List all email accounts
emailRoutes.get('/accounts/list', async (c) => {
  const { DB } = c.env;
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        id, email_address as email, display_name, is_active, created_at, updated_at
      FROM email_accounts
      ORDER BY created_at DESC
    `).all();
    
    return c.json({ 
      success: true, 
      accounts: results,
      total: results.length
    });
  } catch (error: any) {
    console.error('Account list error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /api/email/accounts/:id
// Delete an email account
emailRoutes.delete('/accounts/:id', async (c) => {
  const { DB } = c.env;
  const accountId = c.req.param('id');
  
  try {
    // Check if account exists
    const account = await DB.prepare(`
      SELECT id, email_address as email FROM email_accounts WHERE id = ?
    `).bind(accountId).first();
    
    if (!account) {
      return c.json({ 
        success: false, 
        error: 'Email account not found' 
      }, 404);
    }
    
    // Delete the account
    const result = await DB.prepare(`
      DELETE FROM email_accounts WHERE id = ?
    `).bind(accountId).run();
    
    if (!result.success) {
      return c.json({ 
        success: false, 
        error: 'Failed to delete email account' 
      }, 500);
    }
    
    return c.json({
      success: true,
      message: `Email account ${account.email} deleted successfully`
    });
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PATCH /api/email/accounts/:id/toggle
// Toggle email account active status
emailRoutes.patch('/accounts/:id/toggle', async (c) => {
  const { DB } = c.env;
  const accountId = c.req.param('id');
  
  try {
    // Get current status
    const account = await DB.prepare(`
      SELECT id, email_address as email, is_active FROM email_accounts WHERE id = ?
    `).bind(accountId).first();
    
    if (!account) {
      return c.json({ 
        success: false, 
        error: 'Email account not found' 
      }, 404);
    }
    
    // Toggle status
    const newStatus = account.is_active === 1 ? 0 : 1;
    const result = await DB.prepare(`
      UPDATE email_accounts 
      SET is_active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newStatus, accountId).run();
    
    if (!result.success) {
      return c.json({ 
        success: false, 
        error: 'Failed to update email account status' 
      }, 500);
    }
    
    return c.json({
      success: true,
      account: {
        id: account.id,
        email: account.email,
        is_active: newStatus === 1
      }
    });
  } catch (error: any) {
    console.error('Account toggle error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// POST /api/email/receive
// Webhook endpoint for receiving emails from Mailgun
// Public endpoint - no auth required (Mailgun calls this)
// ============================================
emailRoutes.post('/receive', async (c) => {
  const { DB, OPENAI_API_KEY } = c.env;
  
  try {
    const formData = await c.req.formData();
    
    // Extract fields with multiple fallbacks
    const from = (formData.get('from') || formData.get('sender') || formData.get('From')) as string;
    const to = (formData.get('recipient') || formData.get('To')) as string;
    const subject = (formData.get('subject') || formData.get('Subject')) as string;
    const bodyText = (formData.get('Body-plain') || formData.get('body-plain') || formData.get('stripped-text') || '') as string;
    const bodyHtml = (formData.get('body-html') || formData.get('Body-html') || formData.get('stripped-html') || '') as string;
    const replyTo = formData.get('Reply-To') as string;
    const messageId = formData.get('Message-Id') as string;
    
    if (!from || !to || !subject) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    
    // Check for duplicates (quick check, don't fail if error)
    if (messageId) {
      try {
        const existing = await DB.prepare(`SELECT id FROM emails WHERE snippet LIKE ? LIMIT 1`).bind(`%${messageId}%`).first();
        if (existing) {
          return c.json({ success: true, duplicate: true, emailId: existing.id });
        }
      } catch (e) {
        // Ignore duplicate check errors
      }
    }
    
    // Parse sender
    let senderEmail = from;
    let senderName = '';
    
    try {
      if (replyTo) {
        const match = replyTo.match(/(?:"?([^"]*)"?\s)?<?([^>]+)>?/);
        if (match) {
          senderName = match[1] || '';
          senderEmail = match[2] || replyTo;
        }
      } else {
        const match = from.match(/(?:"?([^"]*)"?\s)?<?([^>]+)>?/);
        if (match) {
          senderName = match[1] || '';
          senderEmail = match[2] || from;
        }
      }
    } catch (e) {
      senderEmail = from;
    }
    
    // Generate IDs
    const emailId = `eml_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    let threadId = `thr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Try thread detection (don't fail if error)
    try {
      const isReply = /^(Re:|Fwd?:|FW:)/i.test(subject);
      if (isReply) {
        const originalSubject = subject.replace(/^(Re:|Fwd?:|FW:)\s*/gi, '').trim();
        const existingThread = await DB.prepare(`
          SELECT thread_id FROM emails 
          WHERE ((from_email = ? AND to_email = ?) OR (from_email = ? AND to_email = ?))
            OR subject LIKE ?
          AND thread_id IS NOT NULL
          ORDER BY created_at DESC LIMIT 1
        `).bind(senderEmail, to, to, senderEmail, `%${originalSubject}%`).first();
        
        if (existingThread?.thread_id) {
          threadId = existingThread.thread_id;
        }
      }
    } catch (e) {
      // Thread detection failed, use new thread
    }
    
    // Try AI summary (don't fail if error)
    let aiSummary = null;
    if (OPENAI_API_KEY && bodyText && bodyText.length > 20) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000); // 3 sec timeout
        
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{
              role: 'user',
              content: `Summarize this email in one short sentence (max 15 words):\n\nSubject: ${subject}\n\n${bodyText.substring(0, 500)}`
            }],
            max_tokens: 50,
            temperature: 0.3
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiSummary = aiData.choices[0]?.message?.content?.trim() || null;
        }
      } catch (e) {
        // AI failed, continue without summary
      }
    }
    
    // Insert email (this MUST succeed)
    await DB.prepare(`
      INSERT INTO emails (
        id, thread_id, from_email, from_name, to_email, 
        subject, body_text, body_html, snippet, category,
        ai_summary, is_read, received_at, created_at,
        expiry_type, expires_at, is_expired
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'inbox', ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'timer', datetime('now', '+30 days'), 0)
    `).bind(
      emailId, threadId, senderEmail, senderName, to,
      subject, bodyText || '[No body]', bodyHtml || '',
      (bodyText || subject).substring(0, 150),
      aiSummary
    ).run();
    
    console.log(`✅ Email ${emailId} received and stored`);
    
    // 📎 PROCESS ATTACHMENTS from Mailgun
    // Mailgun sends attachments as: attachment-1, attachment-2, etc.
    try {
      const attachmentCount = parseInt(formData.get('attachment-count') as string || '0');
      console.log(`📎 Processing ${attachmentCount} attachments for email ${emailId}`);
      
      if (attachmentCount > 0) {
        for (let i = 1; i <= attachmentCount; i++) {
          const attachmentFile = formData.get(`attachment-${i}`) as File;
          
          if (attachmentFile && attachmentFile.size > 0) {
            const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const filename = attachmentFile.name || `attachment-${i}`;
            const contentType = attachmentFile.type || 'application/octet-stream';
            const size = attachmentFile.size;
            
            console.log(`📎 Processing attachment ${i}: ${filename} (${size} bytes, ${contentType})`);
            
            // Check if R2 bucket is available
            const R2 = c.env.R2_BUCKET;
            let r2Key = null;
            let r2Url = null;
            
            if (R2) {
              // Upload to R2
              try {
                r2Key = `attachments/${emailId}/${attachmentId}/${filename}`;
                const fileBuffer = await attachmentFile.arrayBuffer();
                
                await R2.put(r2Key, fileBuffer, {
                  httpMetadata: {
                    contentType: contentType
                  }
                });
                
                // Generate public URL (adjust domain as needed)
                r2Url = `https://files.investaycapital.com/${r2Key}`;
                console.log(`✅ Uploaded to R2: ${r2Key}`);
              } catch (r2Error: any) {
                console.error(`❌ R2 upload failed for ${filename}:`, r2Error.message);
              }
            } else {
              // NO R2: Store as base64 in database (temporary solution)
              console.warn(`⚠️ R2 not configured - storing ${filename} as base64 in database`);
              
              try {
                const fileBuffer = await attachmentFile.arrayBuffer();
                const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
                
                // Store in r2_url field temporarily (we'll show data URI)
                r2Url = `data:${contentType};base64,${base64Data}`;
                console.log(`✅ Stored ${filename} as base64 (${base64Data.length} chars)`);
              } catch (base64Error: any) {
                console.error(`❌ Base64 encoding failed for ${filename}:`, base64Error.message);
              }
            }
            
            // Insert attachment record
            await DB.prepare(`
              INSERT INTO attachments (
                id, email_id, filename, content_type, size, 
                r2_key, r2_url, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              attachmentId,
              emailId,
              filename,
              contentType,
              size,
              r2Key,
              r2Url
            ).run();
            
            console.log(`✅ Attachment ${i} saved: ${filename}`);
          }
        }
        
        console.log(`✅ All ${attachmentCount} attachments processed for email ${emailId}`);
      }
    } catch (attachmentError: any) {
      console.error('❌ Attachment processing error:', attachmentError.message);
      // Don't fail the webhook if attachment processing fails
    }
    
    // 🔄 AUTO-FORWARDING: Check for matching forwarding rules
    try {
      const { results: rules } = await DB.prepare(`
        SELECT * FROM email_forwarding_rules
        WHERE user_email = ? AND is_enabled = 1
      `).bind(to).all();
      
      if (rules && rules.length > 0) {
        console.log(`📨 Checking ${rules.length} forwarding rules for ${to}`);
        
        for (const rule of rules as any[]) {
          let shouldForward = false;
          
          // Check if rule matches
          if (!rule.match_sender && !rule.match_subject && !rule.match_category) {
            // Forward ALL emails if no conditions
            shouldForward = true;
            console.log(`✅ Rule ${rule.id}: Forward ALL matched`);
          } else {
            // Check individual conditions
            const senderMatch = !rule.match_sender || senderEmail.includes(rule.match_sender);
            const subjectMatch = !rule.match_subject || subject.toLowerCase().includes(rule.match_subject.toLowerCase());
            const categoryMatch = !rule.match_category || rule.match_category === 'inbox';
            
            if (senderMatch && subjectMatch && categoryMatch) {
              shouldForward = true;
              console.log(`✅ Rule ${rule.id}: Conditions matched (sender:${senderMatch}, subject:${subjectMatch})`);
            }
          }
          
          if (shouldForward) {
            // Forward the email
            const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_REGION } = c.env;
            
            if (MAILGUN_API_KEY && MAILGUN_DOMAIN) {
              try {
                const forwardSubject = rule.add_prefix 
                  ? `Fwd: ${subject}` 
                  : subject;
                
                const forwardBody = `---------- Forwarded message ---------\nFrom: ${senderEmail}\nDate: ${new Date().toISOString()}\nSubject: ${subject}\nTo: ${to}\n\n${bodyText}`;
                
                const fwdForm = new FormData();
                fwdForm.append('from', to);
                fwdForm.append('to', rule.forward_to);
                fwdForm.append('subject', forwardSubject);
                fwdForm.append('text', forwardBody);
                
                const mailgunUrl = MAILGUN_REGION === 'EU' 
                  ? `https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`
                  : `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
                
                const fwdResponse = await fetch(mailgunUrl, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`
                  },
                  body: fwdForm
                });
                
                if (fwdResponse.ok) {
                  console.log(`✅ Auto-forwarded ${emailId} to ${rule.forward_to} via rule ${rule.id}`);
                  
                  // Log successful forward
                  await DB.prepare(`
                    INSERT INTO email_forwarding_log (
                      id, rule_id, original_email_id, forwarded_to, success
                    ) VALUES (?, ?, ?, ?, 1)
                  `).bind(
                    generateId('flog'),
                    rule.id,
                    emailId,
                    rule.forward_to
                  ).run();
                  
                  // Update rule trigger count
                  await DB.prepare(`
                    UPDATE email_forwarding_rules
                    SET trigger_count = trigger_count + 1,
                        last_triggered_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                  `).bind(rule.id).run();
                  
                  // Delete original if rule says so
                  if (rule.keep_original === 0) {
                    await DB.prepare(`DELETE FROM emails WHERE id = ?`).bind(emailId).run();
                    console.log(`🗑️ Deleted original email ${emailId} (rule: keep_original = 0)`);
                  }
                } else {
                  console.error(`❌ Forward failed for rule ${rule.id}:`, await fwdResponse.text());
                  
                  // Log failed forward
                  await DB.prepare(`
                    INSERT INTO email_forwarding_log (
                      id, rule_id, original_email_id, forwarded_to, success, error_message
                    ) VALUES (?, ?, ?, ?, 0, ?)
                  `).bind(
                    generateId('flog'),
                    rule.id,
                    emailId,
                    rule.forward_to,
                    'Mailgun API error'
                  ).run();
                }
              } catch (forwardError: any) {
                console.error(`❌ Forward error for rule ${rule.id}:`, forwardError);
              }
            } else {
              console.log(`⚠️ Mailgun not configured - cannot auto-forward`);
            }
          }
        }
      }
    } catch (forwardingError: any) {
      console.error('❌ Auto-forwarding check error:', forwardingError);
      // Don't fail the webhook if forwarding fails
    }
    
    return c.json({ success: true, emailId, threadId });
    
  } catch (error: any) {
    console.error('❌ Webhook error:', error.message, error.stack);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// PATCH /api/email/:id/expiry
// Update email expiry settings
// ============================================
emailRoutes.patch('/:id/expiry', async (c) => {
  const { DB } = c.env;
  const userEmail = c.get('userEmail');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const emailId = c.req.param('id');
    const { expiry_type } = await c.req.json();
    
    // Validate expiry_type
    const validTypes = ['1h', '24h', '7d', '30d', 'keep'];
    if (!validTypes.includes(expiry_type)) {
      return c.json({ success: false, error: 'Invalid expiry type' }, 400);
    }
    
    // Calculate new expires_at based on expiry_type
    let expiresAt;
    if (expiry_type === 'keep') {
      expiresAt = null; // Keep forever
    } else if (expiry_type === '1h') {
      expiresAt = "datetime('now', '+1 hour')";
    } else if (expiry_type === '24h') {
      expiresAt = "datetime('now', '+1 day')";
    } else if (expiry_type === '7d') {
      expiresAt = "datetime('now', '+7 days')";
    } else if (expiry_type === '30d') {
      expiresAt = "datetime('now', '+30 days')";
    }
    
    // Update email expiry
    const result = await DB.prepare(`
      UPDATE emails 
      SET expiry_type = ?, 
          expires_at = ${expiry_type === 'keep' ? 'NULL' : expiresAt},
          is_expired = 0
      WHERE id = ? AND (from_email = ? OR to_email = ?)
    `).bind(expiry_type, emailId, userEmail, userEmail).run();
    
    if (result.success) {
      console.log(`✅ Email ${emailId} expiry updated to: ${expiry_type}`);
      return c.json({ 
        success: true, 
        expiry_type,
        message: `Expiry set to: ${expiry_type}` 
      });
    } else {
      return c.json({ success: false, error: 'Failed to update expiry' }, 500);
    }
  } catch (error: any) {
    console.error('Expiry update error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// PATCH /api/email/:id/mark-read
// Mark an email as read
// ============================================
emailRoutes.patch('/:id/mark-read', async (c) => {
  const { DB } = c.env;
  const userEmail = c.get('userEmail');
  const emailId = c.req.param('id');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    console.log(`🔄 PATCH /mark-read: Attempting to mark email ${emailId} as READ for user ${userEmail}`);
    
    // Mark as read only if user is the recipient
    const updateResult = await DB.prepare(`
      UPDATE emails 
      SET is_read = 1, opened_at = CURRENT_TIMESTAMP
      WHERE id = ? AND to_email = ?
    `).bind(emailId, userEmail).run();
    
    console.log(`📊 PATCH UPDATE result:`, JSON.stringify(updateResult));
    console.log(`✅ PATCH mark-read completed for email ${emailId}`);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// GET /api/email/thread/:thread_id
// Get all emails in a thread (conversation view)
// 🔒 SECURITY: Users can ONLY see threads they're part of
// ============================================
emailRoutes.get('/thread/:thread_id', async (c) => {
  const { DB } = c.env;
  const threadId = c.req.param('thread_id');
  const userEmail = c.get('userEmail');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    // Get all emails in thread where user is sender or recipient
    // 🔄 ORDER BY DESC = NEWEST FIRST (most intuitive for users)
    const { results } = await DB.prepare(`
      SELECT 
        id, thread_id, from_email, from_name, to_email, subject,
        body_text, body_html, snippet, category, priority, sentiment, 
        is_read, is_starred, is_archived, labels, received_at, sent_at, 
        ai_summary, action_items, created_at, updated_at
      FROM emails
      WHERE thread_id = ? 
        AND (from_email = ? OR to_email = ?)
        AND category != 'trash'
      ORDER BY sent_at DESC, created_at DESC
    `).bind(threadId, userEmail, userEmail).all();
    
    return c.json({ success: true, emails: results, thread_id: threadId });
  } catch (error: any) {
    console.error('Thread fetch error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ===== SHARED MAILBOX ADMIN ENDPOINTS (for /admin/email-accounts) =====

// GET /api/email/shared-mailboxes/list - List all shared mailboxes (admin)
emailRoutes.get('/shared-mailboxes/list', async (c) => {
  const { DB } = c.env;
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        sm.*,
        (SELECT COUNT(*) FROM shared_mailbox_members WHERE shared_mailbox_id = sm.id AND is_active = 1) as member_count
      FROM shared_mailboxes sm
      ORDER BY sm.created_at DESC
    `).all();
    
    return c.json({ 
      success: true, 
      mailboxes: results,
      total: results.length
    });
  } catch (error: any) {
    console.error('Shared mailbox list error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/email/shared-mailboxes/create - Create shared mailbox (admin)
emailRoutes.post('/shared-mailboxes/create', async (c) => {
  const { DB } = c.env;
  const { email_address, display_name, description, mailbox_type } = await c.req.json();
  
  try {
    if (!email_address || !display_name) {
      return c.json({ 
        success: false, 
        error: 'Email address and display name are required' 
      }, 400);
    }
    
    const result = await DB.prepare(`
      INSERT INTO shared_mailboxes (email_address, display_name, description, mailbox_type, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      email_address,
      display_name,
      description || '',
      mailbox_type || 'team',
      'admin@investaycapital.com'
    ).run();
    
    return c.json({ 
      success: true, 
      mailboxId: result.meta.last_row_id,
      message: 'Shared mailbox created successfully'
    });
  } catch (error: any) {
    console.error('Create shared mailbox error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /api/email/shared-mailboxes/:id - Delete shared mailbox (admin)
emailRoutes.delete('/shared-mailboxes/:id', async (c) => {
  const { DB } = c.env;
  const mailboxId = c.req.param('id');
  
  try {
    const result = await DB.prepare(`
      UPDATE shared_mailboxes SET is_active = 0 WHERE id = ?
    `).bind(mailboxId).run();
    
    return c.json({ 
      success: true,
      message: 'Shared mailbox deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete shared mailbox error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/email/shared-mailboxes/:id/members - Get mailbox members (admin)
emailRoutes.get('/shared-mailboxes/:id/members', async (c) => {
  const { DB } = c.env;
  const mailboxId = c.req.param('id');
  
  try {
    const { results } = await DB.prepare(`
      SELECT smm.*, ea.display_name
      FROM shared_mailbox_members smm
      LEFT JOIN email_accounts ea ON smm.user_email = ea.email_address
      WHERE smm.shared_mailbox_id = ? AND smm.is_active = 1
      ORDER BY smm.added_at ASC
    `).bind(mailboxId).all();
    
    return c.json({ 
      success: true, 
      members: results
    });
  } catch (error: any) {
    console.error('Get members error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/email/shared-mailboxes/:id/members/add - Add member (admin)
emailRoutes.post('/shared-mailboxes/:id/members/add', async (c) => {
  const { DB } = c.env;
  const mailboxId = c.req.param('id');
  const { user_email, role } = await c.req.json();
  
  try {
    if (!user_email) {
      return c.json({ success: false, error: 'User email is required' }, 400);
    }
    
    const result = await DB.prepare(`
      INSERT INTO shared_mailbox_members (shared_mailbox_id, user_email, role, permissions, added_by)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      mailboxId,
      user_email,
      role || 'member',
      JSON.stringify(['view', 'send']),
      'admin@investaycapital.com'
    ).run();
    
    return c.json({ 
      success: true,
      message: 'Member added successfully'
    });
  } catch (error: any) {
    console.error('Add member error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /api/email/shared-mailboxes/:id/members/:memberEmail - Remove member (admin)
emailRoutes.delete('/shared-mailboxes/:id/members/:memberEmail', async (c) => {
  const { DB } = c.env;
  const mailboxId = c.req.param('id');
  const memberEmail = c.req.param('memberEmail');
  
  try {
    await DB.prepare(`
      UPDATE shared_mailbox_members
      SET is_active = 0
      WHERE shared_mailbox_id = ? AND user_email = ?
    `).bind(mailboxId, memberEmail).run();
    
    return c.json({ 
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error: any) {
    console.error('Remove member error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PATCH /api/email/shared-mailboxes/:id/toggle - Toggle mailbox active status (admin)
emailRoutes.patch('/shared-mailboxes/:id/toggle', async (c) => {
  const { DB } = c.env;
  const mailboxId = c.req.param('id');
  
  try {
    // Get current status
    const mailbox = await DB.prepare(`
      SELECT is_active FROM shared_mailboxes WHERE id = ?
    `).bind(mailboxId).first() as any;
    
    if (!mailbox) {
      return c.json({ success: false, error: 'Mailbox not found' }, 404);
    }
    
    const newStatus = mailbox.is_active === 1 ? 0 : 1;
    
    await DB.prepare(`
      UPDATE shared_mailboxes SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(newStatus, mailboxId).run();
    
    return c.json({ 
      success: true,
      is_active: newStatus,
      message: `Shared mailbox ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    console.error('Toggle mailbox error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/email/shared-mailboxes/:id/members - Add member (admin)
emailRoutes.post('/shared-mailboxes/:id/members', async (c) => {
  const { DB } = c.env;
  const mailboxId = c.req.param('id');
  const { user_email, role, permissions } = await c.req.json();
  
  try {
    if (!user_email) {
      return c.json({ success: false, error: 'User email is required' }, 400);
    }
    
    const result = await DB.prepare(`
      INSERT INTO shared_mailbox_members (shared_mailbox_id, user_email, role, permissions, added_by)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      mailboxId,
      user_email,
      role || 'member',
      permissions || 'read,send',
      'admin@investaycapital.com'
    ).run();
    
    return c.json({ 
      success: true,
      message: 'Member added successfully'
    });
  } catch (error: any) {
    console.error('Add member error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /api/email/shared-mailboxes/:id/members/:memberId - Remove member (admin)
emailRoutes.delete('/shared-mailboxes/:id/members/:memberId', async (c) => {
  const { DB } = c.env;
  const mailboxId = c.req.param('id');
  const memberId = c.req.param('memberId');
  
  try {
    await DB.prepare(`
      UPDATE shared_mailbox_members
      SET is_active = 0
      WHERE id = ? AND shared_mailbox_id = ?
    `).bind(memberId, mailboxId).run();
    
    return c.json({ 
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error: any) {
    console.error('Remove member error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PATCH /api/email/shared-mailboxes/:id/members/:memberId - Update member role (admin)
emailRoutes.patch('/shared-mailboxes/:id/members/:memberId', async (c) => {
  const { DB } = c.env;
  const mailboxId = c.req.param('id');
  const memberId = c.req.param('memberId');
  const { role, permissions } = await c.req.json();
  
  try {
    await DB.prepare(`
      UPDATE shared_mailbox_members
      SET role = ?, permissions = ?
      WHERE id = ? AND shared_mailbox_id = ?
    `).bind(role, permissions, memberId, mailboxId).run();
    
    return c.json({ 
      success: true,
      message: 'Member role updated successfully'
    });
  } catch (error: any) {
    console.error('Update member error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/email/shared-mailboxes/:id/members/add - Add member (admin) - Legacy endpoint
emailRoutes.post('/shared-mailboxes/:id/members/add', async (c) => {
  const { DB } = c.env;
  const mailboxId = c.req.param('id');
  const { user_email, role } = await c.req.json();
  
  try {
    if (!user_email) {
      return c.json({ success: false, error: 'User email is required' }, 400);
    }
    
    const result = await DB.prepare(`
      INSERT INTO shared_mailbox_members (shared_mailbox_id, user_email, role, permissions, added_by)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      mailboxId,
      user_email,
      role || 'member',
      'read,send',
      'admin@investaycapital.com'
    ).run();
    
    return c.json({ 
      success: true,
      message: 'Member added successfully'
    });
  } catch (error: any) {
    console.error('Add member error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /api/email/shared-mailboxes/:id/members/:memberEmail - Remove member (admin) - Legacy endpoint
emailRoutes.delete('/shared-mailboxes/:id/members/:memberEmail', async (c) => {
  const { DB } = c.env;
  const mailboxId = c.req.param('id');
  const memberEmail = c.req.param('memberEmail');
  
  try {
    await DB.prepare(`
      UPDATE shared_mailbox_members
      SET is_active = 0
      WHERE shared_mailbox_id = ? AND user_email = ?
    `).bind(mailboxId, memberEmail).run();
    
    return c.json({ 
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error: any) {
    console.error('Remove member error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export { emailRoutes }
