// Email API Routes
import { Hono } from 'hono'
import { generateId } from '../utils/id'
import { generateEmbedding, categorizeEmail, summarizeEmail, extractActionItems } from '../services/ai-email'
import { createMailgunService } from '../lib/mailgun'

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
  R2_BUCKET?: R2Bucket;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  MAILGUN_REGION?: string;
  MAILGUN_FROM_EMAIL?: string;
  MAILGUN_FROM_NAME?: string;
}

const emailRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================
// GET /api/email/inbox
// Get inbox emails for a user
// ============================================
emailRoutes.get('/inbox', async (c) => {
  const { DB } = c.env;
  const userEmail = c.req.query('user') || 'admin@investaycapital.com';
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        id, thread_id, from_email, from_name, to_email, subject,
        snippet, category, priority, sentiment, is_read, is_starred,
        is_archived, labels, received_at, sent_at
      FROM emails
      WHERE to_email = ? 
        AND category != 'trash' 
        AND category != 'spam'
        AND is_archived = 0
      ORDER BY received_at DESC
      LIMIT 50
    `).bind(userEmail).all();
    
    return c.json({ success: true, emails: results });
  } catch (error: any) {
    console.error('Inbox fetch error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// GET /api/email/sent
// Get sent emails for a user
// ============================================
emailRoutes.get('/sent', async (c) => {
  const { DB } = c.env;
  const userEmail = c.req.query('user') || 'admin@investaycapital.com';
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        id, thread_id, from_email, from_name, to_email, subject,
        snippet, category, priority, sentiment, is_read, is_starred,
        is_archived, labels, received_at, sent_at
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
// Get spam emails for a user
// ============================================
emailRoutes.get('/spam', async (c) => {
  const { DB } = c.env;
  const userEmail = c.req.query('user') || 'admin@investaycapital.com';
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        id, thread_id, from_email, from_name, to_email, subject,
        snippet, category, priority, sentiment, is_read, is_starred,
        is_archived, labels, received_at, sent_at
      FROM emails
      WHERE to_email = ? 
        AND category = 'spam'
      ORDER BY received_at DESC
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
// Get trashed emails for a user
// ============================================
emailRoutes.get('/trash', async (c) => {
  const { DB } = c.env;
  const userEmail = c.req.query('user') || 'admin@investaycapital.com';
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        id, thread_id, from_email, from_name, to_email, subject,
        snippet, category, priority, sentiment, is_read, is_starred,
        is_archived, labels, received_at, sent_at
      FROM emails
      WHERE (to_email = ? OR from_email = ?)
        AND category = 'trash'
      ORDER BY received_at DESC
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
// Get archived emails for a user
// ============================================
emailRoutes.get('/archived', async (c) => {
  const { DB } = c.env;
  const userEmail = c.req.query('user') || 'admin@investaycapital.com';
  
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
      ORDER BY received_at DESC
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
// ============================================
emailRoutes.post('/send', async (c) => {
  const { DB, OPENAI_API_KEY, MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_REGION, MAILGUN_FROM_EMAIL, MAILGUN_FROM_NAME } = c.env;
  
  try {
    const { 
      from, to, cc, bcc, subject, body, 
      attachments, useAI 
    } = await c.req.json();
    
    if (!from || !to || !subject || !body) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: from, to, subject, body' 
      }, 400);
    }
    
    const emailId = generateId('eml');
    const threadId = generateId('thr');
    
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
          fromEmail: MAILGUN_FROM_EMAIL || from,
          fromName: MAILGUN_FROM_NAME || 'InvestMail'
        });
        
        // Create HTML version of email with tracking pixel
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
                  <p>Sent via InvestMail</p>
                </div>
              </div>
              <!-- Email open tracking pixel -->
              <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
            </body>
          </html>
        `;
        
        const result = await mailgunService.sendEmail({
          to,
          subject,
          text: body,
          html: htmlBody,
          cc,
          bcc
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
    
    // Store email in database
    await DB.prepare(`
      INSERT INTO emails (
        id, thread_id, from_email, to_email, cc, bcc, subject,
        body_text, body_html, snippet, category, ai_summary, 
        action_items, embedding_vector, sent_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      emailId,
      threadId,
      from,
      to,
      cc ? JSON.stringify(cc) : null,
      bcc ? JSON.stringify(bcc) : null,
      subject,
      body,
      body,
      body.substring(0, 150),
      category,
      aiSummary,
      aiActionItems ? JSON.stringify(aiActionItems) : null,
      embeddingVector ? JSON.stringify(embeddingVector) : null
    ).run();
    
    // Track analytics
    await DB.prepare(`
      INSERT INTO email_analytics (id, user_email, event_type, email_id)
      VALUES (?, ?, 'sent', ?)
    `).bind(generateId('anl'), from, emailId).run();
    
    return c.json({ 
      success: true,
      emailSent: mailgunSuccess,
      emailId,
      messageId: mailgunMessageId,
      message: mailgunSuccess 
        ? '✅ Email sent successfully via Mailgun and saved to database' 
        : '⚠️ Email saved to database but could not be sent via Mailgun',
      mailgunError: mailgunError || undefined,
      warning: !mailgunSuccess ? 'Check Mailgun configuration' : undefined
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
    const { action, text, tone, context } = await c.req.json();
    
    let prompt = '';
    
    switch (action) {
      case 'improve':
        prompt = `Improve this email while maintaining ${tone || 'professional'} tone:\n\n${text}`;
        break;
      case 'expand':
        prompt = `Expand these bullet points into a complete ${tone || 'professional'} email:\n\n${text}`;
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
            content: 'You are an expert email writing assistant for institutional professionals. Write clear, concise, professional emails.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
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
// POST /api/email/search
// Semantic search in emails
// ============================================
emailRoutes.post('/search', async (c) => {
  const { DB, OPENAI_API_KEY } = c.env;
  
  try {
    const { query, userEmail } = await c.req.json();
    
    if (!query) {
      return c.json({ success: false, error: 'Query is required' }, 400);
    }
    
    // Simple text search (fallback if no AI)
    const { results } = await DB.prepare(`
      SELECT 
        id, thread_id, from_email, from_name, to_email, subject,
        snippet, category, priority, is_read, is_starred, received_at
      FROM emails
      WHERE (to_email = ? OR from_email = ?)
        AND (subject LIKE ? OR body_text LIKE ?)
        AND category != 'trash'
      ORDER BY received_at DESC
      LIMIT 50
    `).bind(
      userEmail || 'admin@investaycapital.com',
      userEmail || 'admin@investaycapital.com',
      `%${query}%`,
      `%${query}%`
    ).all();
    
    // TODO: Implement semantic search with embeddings
    // For now, return text search results
    
    return c.json({ success: true, results, query });
  } catch (error: any) {
    console.error('Search error:', error);
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
// Get email analytics for a user
// ============================================
emailRoutes.get('/analytics/summary', async (c) => {
  const { DB } = c.env;
  const userEmail = c.req.query('user') || 'admin@investaycapital.com';
  
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
// ============================================
emailRoutes.post('/drafts/save', async (c) => {
  const { DB } = c.env;
  
  try {
    const { draftId, from, to, subject, body } = await c.req.json();
    
    const now = new Date().toISOString();
    
    if (draftId) {
      // Update existing draft
      await DB.prepare(`
        UPDATE emails 
        SET to_email = ?, subject = ?, body = ?, updated_at = ?
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
// Get all drafts for a user
// ============================================
emailRoutes.get('/drafts', async (c) => {
  const { DB } = c.env;
  const userEmail = c.req.query('user') || 'admin@investaycapital.com';
  
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
// Get all templates for a user
// ============================================
emailRoutes.get('/templates', async (c) => {
  const { DB } = c.env;
  const userId = c.req.query('user') || 'admin@investaycapital.com';
  
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
// NOTE: This MUST be last among GET routes as it's a catch-all
// ============================================
emailRoutes.get('/:id', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('id');
  
  try {
    const email = await DB.prepare(`
      SELECT * FROM emails WHERE id = ?
    `).bind(emailId).first();
    
    if (!email) {
      return c.json({ success: false, error: 'Email not found' }, 404);
    }
    
    // Mark as read
    await DB.prepare(`
      UPDATE emails 
      SET is_read = 1, opened_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(emailId).run();
    
    // Get attachments
    const { results: attachments } = await DB.prepare(`
      SELECT * FROM attachments WHERE email_id = ?
    `).bind(emailId).all();
    
    return c.json({ 
      success: true, 
      email: { ...email, attachments }
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
    
    // Get email details
    const email = await DB.prepare(`
      SELECT id, to_email FROM emails WHERE id = ?
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
    
    // Detect device type
    const deviceType = userAgent.toLowerCase().includes('mobile') ? 'mobile' :
                       userAgent.toLowerCase().includes('tablet') ? 'tablet' : 'desktop';
    
    // Detect email client (basic detection)
    let emailClient = 'unknown';
    if (userAgent.includes('Gmail')) emailClient = 'gmail';
    else if (userAgent.includes('Outlook')) emailClient = 'outlook';
    else if (userAgent.includes('Apple Mail')) emailClient = 'apple-mail';
    else if (userAgent.includes('Thunderbird')) emailClient = 'thunderbird';
    
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

export { emailRoutes }
