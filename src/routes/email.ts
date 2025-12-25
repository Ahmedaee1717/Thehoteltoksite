// Email API Routes
import { Hono } from 'hono'
import { generateId } from '../utils/id'
import { generateEmbedding, categorizeEmail, summarizeEmail, extractActionItems } from '../services/ai-email'

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
  R2_BUCKET?: R2Bucket;
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
// GET /api/email/:id
// Get single email by ID
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
// POST /api/email/send
// Send a new email
// ============================================
emailRoutes.post('/send', async (c) => {
  const { DB, OPENAI_API_KEY } = c.env;
  
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
      body, // TODO: Convert to HTML
      body.substring(0, 150),
      category,
      aiSummary,
      aiActionItems ? JSON.stringify(aiActionItems) : null,
      embeddingVector ? JSON.stringify(embeddingVector) : null
    ).run();
    
    // TODO: Actually send email via Mailgun/Resend
    // For now, just store in database
    
    // Track analytics
    await DB.prepare(`
      INSERT INTO email_analytics (id, user_email, event_type, email_id)
      VALUES (?, ?, 'sent', ?)
    `).bind(generateId('anl'), from, emailId).run();
    
    return c.json({ 
      success: true, 
      emailId,
      message: 'Email sent successfully' 
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

export { emailRoutes }
