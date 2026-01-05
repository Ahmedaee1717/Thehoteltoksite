import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  MAILGUN_REGION?: string;
  MAILGUN_FROM_EMAIL?: string;
  JWT_SECRET?: string;
};

const forwardingRoutes = new Hono<{ Bindings: Bindings }>();

// Helper to generate IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================
// GET /api/forwarding/rules
// Get all forwarding rules for current user
// ============================================
forwardingRoutes.get('/rules', async (c) => {
  const { DB } = c.env;
  const userEmail = c.get('userEmail');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const { results: rules } = await DB.prepare(`
      SELECT * FROM email_forwarding_rules
      WHERE user_email = ?
      ORDER BY created_at DESC
    `).bind(userEmail).all();
    
    return c.json({ success: true, rules });
  } catch (error: any) {
    console.error('Get forwarding rules error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// POST /api/forwarding/rules
// Create new forwarding rule
// ============================================
forwardingRoutes.post('/rules', async (c) => {
  const { DB } = c.env;
  const userEmail = c.get('userEmail');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const body = await c.req.json();
    const {
      forward_to,
      match_sender,
      match_subject,
      match_keywords,
      match_category,
      keep_original = 1,
      forward_mode = 'copy',
      add_prefix = 1
    } = body;
    
    // Validate forward_to email
    if (!forward_to || !forward_to.includes('@')) {
      return c.json({ success: false, error: 'Invalid forwarding email address' }, 400);
    }
    
    const ruleId = generateId('fwd');
    
    await DB.prepare(`
      INSERT INTO email_forwarding_rules (
        id, user_email, forward_to,
        match_sender, match_subject, match_keywords, match_category,
        keep_original, forward_mode, add_prefix
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      ruleId, userEmail, forward_to,
      match_sender || null,
      match_subject || null,
      match_keywords ? JSON.stringify(match_keywords) : null,
      match_category || null,
      keep_original,
      forward_mode,
      add_prefix
    ).run();
    
    console.log(`✅ Created forwarding rule ${ruleId} for ${userEmail} → ${forward_to}`);
    
    return c.json({ success: true, rule_id: ruleId });
  } catch (error: any) {
    console.error('Create forwarding rule error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// PATCH /api/forwarding/rules/:id
// Update forwarding rule (enable/disable or edit)
// ============================================
forwardingRoutes.patch('/rules/:id', async (c) => {
  const { DB } = c.env;
  const userEmail = c.get('userEmail');
  const ruleId = c.req.param('id');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const body = await c.req.json();
    const updates: string[] = [];
    const values: any[] = [];
    
    // Build dynamic update query
    if (body.is_enabled !== undefined) {
      updates.push('is_enabled = ?');
      values.push(body.is_enabled ? 1 : 0);
    }
    if (body.forward_to) {
      updates.push('forward_to = ?');
      values.push(body.forward_to);
    }
    if (body.match_sender !== undefined) {
      updates.push('match_sender = ?');
      values.push(body.match_sender || null);
    }
    if (body.match_subject !== undefined) {
      updates.push('match_subject = ?');
      values.push(body.match_subject || null);
    }
    if (body.match_keywords !== undefined) {
      updates.push('match_keywords = ?');
      values.push(body.match_keywords ? JSON.stringify(body.match_keywords) : null);
    }
    if (body.match_category !== undefined) {
      updates.push('match_category = ?');
      values.push(body.match_category || null);
    }
    if (body.keep_original !== undefined) {
      updates.push('keep_original = ?');
      values.push(body.keep_original ? 1 : 0);
    }
    if (body.add_prefix !== undefined) {
      updates.push('add_prefix = ?');
      values.push(body.add_prefix ? 1 : 0);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    await DB.prepare(`
      UPDATE email_forwarding_rules
      SET ${updates.join(', ')}
      WHERE id = ? AND user_email = ?
    `).bind(...values, ruleId, userEmail).run();
    
    console.log(`✅ Updated forwarding rule ${ruleId}`);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Update forwarding rule error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// DELETE /api/forwarding/rules/:id
// Delete forwarding rule
// ============================================
forwardingRoutes.delete('/rules/:id', async (c) => {
  const { DB } = c.env;
  const userEmail = c.get('userEmail');
  const ruleId = c.req.param('id');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    await DB.prepare(`
      DELETE FROM email_forwarding_rules
      WHERE id = ? AND user_email = ?
    `).bind(ruleId, userEmail).run();
    
    console.log(`🗑️ Deleted forwarding rule ${ruleId}`);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete forwarding rule error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// POST /api/forwarding/forward-email/:email_id
// Manually forward a specific email
// ============================================
forwardingRoutes.post('/forward-email/:email_id', async (c) => {
  const { DB, MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_REGION } = c.env;
  const userEmail = c.get('userEmail');
  const emailId = c.req.param('email_id');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const body = await c.req.json();
    const { forward_to, add_note } = body;
    
    if (!forward_to || !forward_to.includes('@')) {
      return c.json({ success: false, error: 'Invalid forwarding email address' }, 400);
    }
    
    // Get original email
    const email = await DB.prepare(`
      SELECT * FROM emails WHERE id = ?
    `).bind(emailId).first() as any;
    
    if (!email) {
      return c.json({ success: false, error: 'Email not found' }, 404);
    }
    
    // Check if user owns this email
    if (email.from_email !== userEmail && email.to_email !== userEmail) {
      return c.json({ success: false, error: 'Access denied' }, 403);
    }
    
    // Forward via Mailgun
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      return c.json({ success: false, error: 'Mailgun not configured' }, 500);
    }
    
    const formData = new FormData();
    formData.append('from', `${userEmail}`);
    formData.append('to', forward_to);
    formData.append('subject', `Fwd: ${email.subject}`);
    
    let forwardBody = `---------- Forwarded message ---------\nFrom: ${email.from_email}\nDate: ${email.sent_at || email.created_at}\nSubject: ${email.subject}\nTo: ${email.to_email}\n\n${email.body_text}`;
    
    if (add_note) {
      forwardBody = `${add_note}\n\n${forwardBody}`;
    }
    
    formData.append('text', forwardBody);
    
    const mailgunUrl = MAILGUN_REGION === 'EU' 
      ? `https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`
      : `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
    
    const response = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Mailgun error: ${response.statusText}`);
    }
    
    console.log(`✅ Manually forwarded email ${emailId} to ${forward_to}`);
    
    return c.json({ success: true, message: 'Email forwarded successfully' });
  } catch (error: any) {
    console.error('Forward email error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// GET /api/forwarding/logs
// Get forwarding logs for debugging
// ============================================
forwardingRoutes.get('/logs', async (c) => {
  const { DB } = c.env;
  const userEmail = c.get('userEmail');
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  
  try {
    const { results: logs } = await DB.prepare(`
      SELECT 
        l.*,
        r.forward_to,
        e.subject,
        e.from_email
      FROM email_forwarding_log l
      JOIN email_forwarding_rules r ON l.rule_id = r.id
      JOIN emails e ON l.original_email_id = e.id
      WHERE r.user_email = ?
      ORDER BY l.forwarded_at DESC
      LIMIT 100
    `).bind(userEmail).all();
    
    return c.json({ success: true, logs });
  } catch (error: any) {
    console.error('Get forwarding logs error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default forwardingRoutes;
