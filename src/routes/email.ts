// Email API Routes
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyToken } from '../lib/auth'
import { hashPassword } from '../lib/auth'
import { generateId } from '../utils/id'
import { generateEmbedding, categorizeEmail, summarizeEmail, extractActionItems } from '../services/ai-email'
import { createMailgunService } from '../lib/mailgun'
import { checkSpamScore, getSpamScoreSummary } from '../lib/spam-checker'
import { safeEncrypt, safeDecrypt, isEncrypted } from '../lib/encryption'

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
  ENCRYPTION_KEY?: string; // 🔒 Master key for email encryption
}

const emailRoutes = new Hono<{ Bindings: Bindings }>()

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

// Apply auth middleware to ALL routes EXCEPT tracking pixel and admin account management
// Tracking pixel must be public (loaded from external email clients)
// Admin account management should be accessible without email login
emailRoutes.use('/*', async (c, next) => {
  const path = c.req.path;
  
  // Skip auth for these endpoints:
  // 1. Tracking pixel (external email clients)
  // 2. Admin email account management (admin dashboard access)
  // 3. Email receive webhook (Mailgun calls this)
  if (
    path.includes('/track/') ||
    path.includes('/receive') ||
    path.includes('/accounts/create') ||
    path.includes('/accounts/list') ||
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
  const { DB, OPENAI_API_KEY, MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_REGION, MAILGUN_FROM_EMAIL, MAILGUN_FROM_NAME, ENCRYPTION_KEY } = c.env;
  
  // 🔒 Get authenticated user email
  const authenticatedUserEmail = c.get('userEmail');
  
  if (!authenticatedUserEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const { 
      to, cc, bcc, subject, body, 
      attachments, useAI, thread_id 
    } = await c.req.json();
    
    // 🔒 CRITICAL: Force from to be authenticated user's email - NEVER trust client
    const from = authenticatedUserEmail;
    
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
    const userAccount = await DB.prepare(`
      SELECT display_name FROM email_accounts WHERE email_address = ?
    `).bind(from).first();
    
    const displayName = userAccount?.display_name || from.split('@')[0];
    
    // Send email via Mailgun
    let mailgunSuccess = false;
    let mailgunError = null;
    let mailgunMessageId = null;
    
    if (MAILGUN_API_KEY && MAILGUN_DOMAIN) {
      try {
        const mailgunService = createMailgunService({
          apiKey: MAILGUN_API_KEY,
          domain: MAILGUN_DOMAIN,
          region: MAILGUN_REGION as 'US' | 'EU' || 'US',
          // Use postmaster for actual sending (Mailgun requirement)
          // But set display name to show user's name
          fromEmail: `postmaster@${MAILGUN_DOMAIN}`,
          fromName: `${displayName} (via Investay Signal)`
        });
        
        // Create HTML version of email with tracking pixel
        // Only embed tracking pixel in actual sent emails, not when viewing in app
        const trackingPixelUrl = `https://${c.req.header('host') || 'localhost:3000'}/api/email/track/${emailId}`;
        const htmlBody = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .email-header { border-bottom: 2px solid #0066cc; padding-bottom: 10px; margin-bottom: 20px; }
                .email-body { white-space: pre-wrap; }
                .email-footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="email-header">
                  <h2 style="margin: 0; color: #0066cc;">${subject}</h2>
                </div>
                <div class="email-body">
                  ${body.replace(/\n/g, '<br>')}
                </div>
                <div class="email-footer">
                  <p>Sent via Investay Signal</p>
                </div>
              </div>
              <!-- Email open tracking pixel - Only loaded when recipient opens email in their email client -->
              <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;visibility:hidden;" alt="" border="0" />
            </body>
          </html>
        `;
        
        const result = await mailgunService.sendEmail({
          to,
          subject,
          text: body,
          html: htmlBody,
          cc,
          bcc,
          replyTo: from  // Set reply-to as the actual user's email
        });
        
        if (result.success) {
          mailgunSuccess = true;
          mailgunMessageId = result.messageId;
          console.log('✅ Email sent via Mailgun:', result.messageId);
        } else {
          mailgunError = result.error;
          console.error('❌ Mailgun send failed:', result.error);
        }
      } catch (mailgunException: any) {
        mailgunError = mailgunException.message;
        console.error('❌ Mailgun exception:', mailgunException);
      }
    } else {
      mailgunError = 'Mailgun not configured';
      console.warn('⚠️ Mailgun credentials not found in environment');
    }
    
    // 🔒 ENCRYPT email content before storing
    let encryptedBody = body;
    if (ENCRYPTION_KEY) {
      try {
        encryptedBody = await safeEncrypt(body, ENCRYPTION_KEY) || body;
        console.log('🔒 Email content encrypted');
      } catch (encError) {
        console.error('⚠️  Encryption failed, storing plaintext:', encError);
        // Fall back to plaintext if encryption fails
      }
    } else {
      console.warn('⚠️  ENCRYPTION_KEY not set - storing email in plaintext (INSECURE)');
    }
    
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
      encryptedBody, // 🔒 Store encrypted
      encryptedBody, // 🔒 Store encrypted
      body.substring(0, 150), // Snippet stays plaintext for preview
      category,
      aiSummary,
      aiActionItems ? JSON.stringify(aiActionItems) : null,
      embeddingVector ? JSON.stringify(embeddingVector) : null,
      '30d' // Default expiry: 30 days
    ).run();
    
    console.log('📧 Email saved to database:', insertResult.success ? '✅ SUCCESS' : '❌ FAILED', emailId, '⏳ Expires: 30d');
    
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
    console.error('Send email error:', error);
    return c.json({ success: false, error: error.message }, 500);
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
  const { DB, ENCRYPTION_KEY } = c.env;
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
      } catch (decError) {
        console.error('⚠️  Decryption failed:', decError);
        // Return encrypted content if decryption fails (shouldn't happen)
      }
    }
    
    // Mark as read (only if recipient)
    if (email.to_email === userEmail) {
      await DB.prepare(`
        UPDATE emails 
        SET is_read = 1, opened_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(emailId).run();
    }
    
    // Get attachments
    const { results: attachments } = await DB.prepare(`
      SELECT * FROM attachments WHERE email_id = ?
    `).bind(emailId).all();
    
    return c.json({ 
      success: true, 
      email: { ...decryptedEmail, attachments }
    });
  } catch (error: any) {
    console.error('Email fetch error:', error);
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
    
    // IMPORTANT: Only track if request is NOT from the sender viewing their own email
    // Check if the request is from our app or a real email client
    const referer = c.req.header('referer') || '';
    const isFromOurApp = referer.includes('/mail') || 
                         referer.includes('investay') || 
                         referer.includes('localhost') ||
                         referer.includes('sandbox') ||
                         userAgent.includes('Chrome') && referer.includes('3000-');
    
    // If request is from our own app viewing sent emails, don't track
    // Only track when email is opened by recipient in their actual email client
    if (isFromOurApp) {
      console.log('⏭️ Skipping tracking - request from app interface, not email client');
      return new Response(TRACKING_PIXEL, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    console.log(`✅ Tracking email open from recipient email client for email ${emailId}`);
    
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
          ip_address, user_agent, device_type, email_client
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
      `).bind(
        receiptId, emailId, email.to_email,
        ipAddress, userAgent, deviceType, emailClient
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
  const { DB, OPENAI_API_KEY, ENCRYPTION_KEY } = c.env;
  
  try {
    // Mailgun sends form data, not JSON
    const formData = await c.req.formData();
    
    // Extract email data from Mailgun webhook
    const from = formData.get('from') as string;
    const to = formData.get('recipient') as string;
    const subject = formData.get('subject') as string;
    const bodyText = formData.get('body-plain') as string;
    const bodyHtml = formData.get('body-html') as string;
    const timestamp = formData.get('timestamp') as string;
    const replyTo = formData.get('Reply-To') as string; // Get Reply-To header
    const messageId = formData.get('Message-Id') as string; // Unique message identifier
    
    console.log('📬 Incoming email from Mailgun:', { from, to, subject, replyTo, messageId });
    
    // Validate required fields
    if (!from || !to || !subject) {
      console.error('❌ Missing required fields:', { from, to, subject });
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    
    // 🔒 DEDUPLICATION: Check if this email already exists using Message-Id or timestamp
    // Mailgun may send webhooks multiple times for reliability
    if (messageId) {
      const existing = await DB.prepare(`
        SELECT id FROM emails WHERE snippet LIKE ?
      `).bind(`%${messageId}%`).first();
      
      if (existing) {
        console.log('⚠️ Duplicate email detected (Message-Id exists):', messageId);
        return c.json({ success: true, message: 'Email already processed', duplicate: true });
      }
    } else {
      // Fallback: check for duplicate by from/to/subject/timestamp
      const timeWindow = timestamp ? new Date(parseInt(timestamp) * 1000).toISOString() : new Date().toISOString();
      const existing = await DB.prepare(`
        SELECT id FROM emails 
        WHERE from_email = ? AND to_email = ? AND subject = ? 
        AND datetime(created_at) >= datetime(?, '-10 seconds')
        AND datetime(created_at) <= datetime(?, '+10 seconds')
      `).bind(from.includes('<') ? from.match(/<(.+?)>/)?.[1] || from : from, to, subject, timeWindow, timeWindow).first();
      
      if (existing) {
        console.log('⚠️ Duplicate email detected (time-based):', { from, to, subject, timeWindow });
        return c.json({ success: true, message: 'Email already processed', duplicate: true });
      }
    }
    
    // Extract sender name and email
    // 🔧 FIX: If Reply-To exists, use it as the actual sender (for emails sent via postmaster)
    let fromEmail: string;
    let fromName: string;
    
    if (replyTo && replyTo.includes('@')) {
      // Email was sent via postmaster with Reply-To - use Reply-To as actual sender
      const replyToMatch = replyTo.match(/^(.+?)\s*<(.+?)>$/);
      fromEmail = replyToMatch ? replyToMatch[2] : replyTo;
      fromName = replyToMatch ? replyToMatch[1].trim() : fromEmail.split('@')[0];
      console.log('✅ Using Reply-To as sender:', { fromEmail, fromName });
    } else {
      // Normal external email - use FROM header
      const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/);
      fromEmail = fromMatch ? fromMatch[2] : from;
      fromName = fromMatch ? fromMatch[1].trim() : fromEmail.split('@')[0];
      console.log('✅ Using FROM as sender:', { fromEmail, fromName });
    }
    
    // Generate IDs
    const emailId = generateId('eml');
    
    // Smart thread detection for replies
    let threadId = generateId('thr');
    
    // Check if this is a reply (Re:, RE:, Fwd:, FW:)
    const isReply = /^(re|fwd|fw):/i.test(subject);
    
    if (isReply) {
      // Extract original subject by removing Re:/Fwd: prefixes
      const originalSubject = subject.replace(/^(re|fwd|fw):\s*/gi, '').trim();
      
      console.log('🔍 Detected reply - searching for thread with subject:', originalSubject);
      
      // Try to find existing thread by matching subject
      // Look for emails between same parties or with same subject
      const existingThread = await DB.prepare(`
        SELECT thread_id FROM emails 
        WHERE (
          (from_email = ? AND to_email = ?) OR 
          (from_email = ? AND to_email = ?) OR
          subject LIKE ?
        )
        AND thread_id IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      `).bind(to, fromEmail, fromEmail, to, `%${originalSubject}%`).first();
      
      if (existingThread) {
        threadId = existingThread.thread_id;
        console.log('✅ Found existing thread:', threadId);
      } else {
        console.log('⚠️ No existing thread found, creating new one');
      }
    }
    
    // AI enhancements for received emails
    let aiSummary = null;
    let aiActionItems = null;
    let embeddingVector = null;
    let category = 'inbox';
    
    if (OPENAI_API_KEY && bodyText) {
      console.log('🤖 Processing AI enhancements for received email...');
      try {
        [aiSummary, aiActionItems, embeddingVector, category] = await Promise.all([
          summarizeEmail(bodyText, OPENAI_API_KEY),
          extractActionItems(bodyText, OPENAI_API_KEY),
          generateEmbedding(bodyText, OPENAI_API_KEY),
          categorizeEmail(subject + ' ' + bodyText, OPENAI_API_KEY)
        ]);
        console.log('✅ AI processing complete:', { aiSummary: !!aiSummary, category });
      } catch (aiError) {
        console.error('❌ AI processing error:', aiError);
        // Continue without AI features
        category = 'inbox';
      }
    } else {
      console.log('⚠️ Skipping AI processing - no OpenAI API key or body text');
    }
    
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
    
    // Store in database with AI data
    const result = await DB.prepare(`
      INSERT INTO emails (
        id, thread_id, from_email, from_name, to_email, subject,
        body_text, body_html, snippet, category, 
        ai_summary, action_items, embedding_vector,
        is_read, received_at, created_at,
        expiry_type, expires_at, is_expired
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, datetime('now', '+30 days'), 0)
    `).bind(
      emailId,
      threadId,
      fromEmail,
      fromName,
      to,
      subject,
      encryptedBodyText, // 🔒 Store encrypted
      encryptedBodyHtml, // 🔒 Store encrypted
      (bodyText || '').substring(0, 150), // Snippet stays plaintext
      category, // Use AI-detected category or 'inbox'
      aiSummary,
      aiActionItems,
      embeddingVector ? JSON.stringify(embeddingVector) : null, // Convert array to JSON string
      '30d' // Default expiry: 30 days
    ).run();
    
    if (result.success) {
      console.log('✅ Email stored in inbox with AI data:', emailId);
      return c.json({ success: true, emailId });
    } else {
      console.error('❌ Failed to store email');
      return c.json({ success: false, error: 'Failed to store email' }, 500);
    }
    
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
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
    // Mark as read only if user is the recipient
    await DB.prepare(`
      UPDATE emails 
      SET is_read = 1, opened_at = CURRENT_TIMESTAMP
      WHERE id = ? AND to_email = ?
    `).bind(emailId, userEmail).run();
    
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
      ORDER BY sent_at ASC, created_at ASC
    `).bind(threadId, userEmail, userEmail).all();
    
    return c.json({ success: true, emails: results, thread_id: threadId });
  } catch (error: any) {
    console.error('Thread fetch error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export { emailRoutes }
