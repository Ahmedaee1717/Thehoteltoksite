// Shared Mailbox API Routes
// Enterprise shared email management with real-time collaboration
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyToken } from '../lib/auth'
import type { CloudflareBindings } from '../types/cloudflare'

type Variables = {
  userEmail: string
}

const sharedMailboxRoutes = new Hono<{ Bindings: CloudflareBindings; Variables: Variables }>()

// Helper: Generate ID
function generateId(prefix: string = 'sm'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Auth middleware - Apply to all routes
sharedMailboxRoutes.use('/*', async (c, next) => {
  const { JWT_SECRET } = c.env
  const authToken = getCookie(c, 'auth_token')
  
  if (!authToken || !JWT_SECRET) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  try {
    const payload = await verifyToken(authToken, JWT_SECRET)
    if (!payload || !payload.email) {
      return c.json({ error: 'Invalid token' }, 401)
    }
    
    // Set userEmail in context for routes to use
    c.set('userEmail', payload.email)
    await next()
  } catch (error) {
    console.error('Auth error:', error)
    return c.json({ error: 'Authentication failed' }, 401)
  }
})

// ===== SHARED MAILBOX MANAGEMENT =====

// GET /api/shared-mailboxes - List all shared mailboxes user has access to
sharedMailboxRoutes.get('/', async (c) => {
  try {
    const userEmail = c.get('userEmail')
    const { DB } = c.env
    
    if (!userEmail) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    // Get ALL active shared mailboxes (simplified - show to all users)
    // In production, you'd filter by membership
    const mailboxes = await DB.prepare(`
      SELECT 
        sm.*,
        smm.role,
        smm.permissions,
        (SELECT COUNT(*) FROM shared_mailbox_members WHERE shared_mailbox_id = sm.id AND is_active = 1) as member_count
      FROM shared_mailboxes sm
      LEFT JOIN shared_mailbox_members smm ON sm.id = smm.shared_mailbox_id AND smm.user_email = ? AND smm.is_active = 1
      WHERE sm.is_active = 1
      ORDER BY sm.created_at DESC
    `).bind(userEmail).all()
    
    return c.json({ mailboxes: mailboxes.results || [] })
  } catch (error: any) {
    console.error('Error fetching shared mailboxes:', error)
    return c.json({ error: 'Failed to fetch shared mailboxes', details: error.message }, 500)
  }
})

// GET /api/shared-mailboxes/:id - Get shared mailbox details
sharedMailboxRoutes.get('/:id', async (c) => {
  try {
    const userEmail = c.get('userEmail')
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    
    if (!userEmail) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    // Get mailbox details with user's role
    const mailbox = await DB.prepare(`
      SELECT sm.*, smm.role, smm.permissions
      FROM shared_mailboxes sm
      LEFT JOIN shared_mailbox_members smm ON sm.id = smm.shared_mailbox_id AND smm.user_email = ?
      WHERE sm.id = ? AND sm.is_active = 1
    `).bind(userEmail, mailboxId).first()
    
    if (!mailbox) {
      return c.json({ error: 'Shared mailbox not found' }, 404)
    }
    
    // Get members
    const members = await DB.prepare(`
      SELECT user_email, role, permissions, added_at, last_active_at
      FROM shared_mailbox_members
      WHERE shared_mailbox_id = ? AND is_active = 1
      ORDER BY added_at ASC
    `).bind(mailboxId).all()
    
    return c.json({
      mailbox,
      members: members.results || []
    })
  } catch (error: any) {
    console.error('Error fetching mailbox details:', error)
    return c.json({ error: 'Failed to fetch mailbox details', details: error.message }, 500)
  }
})

// POST /api/shared-mailboxes - Create new shared mailbox (Admin only)
sharedMailboxRoutes.post('/', async (c) => {
  try {
    const userEmail = c.get('userEmail')
    const { DB } = c.env
    
    if (!userEmail) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    // Check if user is admin
    if (!userEmail.includes('admin')) {
      return c.json({ error: 'Admin access required' }, 403)
    }
    
    const { email_address, display_name, description, mailbox_type, settings } = await c.req.json()
    
    if (!email_address || !display_name) {
      return c.json({ error: 'email_address and display_name are required' }, 400)
    }
    
    const result = await DB.prepare(`
      INSERT INTO shared_mailboxes (email_address, display_name, description, mailbox_type, created_by, settings)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      email_address,
      display_name,
      description || '',
      mailbox_type || 'team',
      userEmail,
      settings ? JSON.stringify(settings) : '{}'
    ).run()
    
    return c.json({
      success: true,
      mailboxId: result.meta.last_row_id,
      message: 'Shared mailbox created successfully'
    })
  } catch (error: any) {
    console.error('Error creating shared mailbox:', error)
    return c.json({ error: 'Failed to create shared mailbox', details: error.message }, 500)
  }
})

// PUT /api/shared-mailboxes/:id - Update shared mailbox (Admin only)
sharedMailboxRoutes.put('/:id', async (c) => {
  try {
    const userEmail = c.get('userEmail')
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    
    if (!userEmail) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    const { display_name, description, mailbox_type, is_active, settings } = await c.req.json()
    
    const updates: string[] = []
    const params: any[] = []
    
    if (display_name) {
      updates.push('display_name = ?')
      params.push(display_name)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    if (mailbox_type) {
      updates.push('mailbox_type = ?')
      params.push(mailbox_type)
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?')
      params.push(is_active ? 1 : 0)
    }
    if (settings) {
      updates.push('settings = ?')
      params.push(JSON.stringify(settings))
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(mailboxId)
    
    await DB.prepare(`
      UPDATE shared_mailboxes
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run()
    
    return c.json({ success: true, message: 'Shared mailbox updated successfully' })
  } catch (error: any) {
    console.error('Error updating shared mailbox:', error)
    return c.json({ error: 'Failed to update shared mailbox', details: error.message }, 500)
  }
})

// ===== MEMBER MANAGEMENT =====

// GET /api/shared-mailboxes/:id/members - Get mailbox members
sharedMailboxRoutes.get('/:id/members', async (c) => {
  try {
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    
    const members = await DB.prepare(`
      SELECT smm.*, ea.display_name
      FROM shared_mailbox_members smm
      LEFT JOIN email_accounts ea ON smm.user_email = ea.email_address
      WHERE smm.shared_mailbox_id = ? AND smm.is_active = 1
      ORDER BY smm.added_at ASC
    `).bind(mailboxId).all()
    
    return c.json({ members: members.results || [] })
  } catch (error: any) {
    console.error('Error fetching members:', error)
    return c.json({ error: 'Failed to fetch members', details: error.message }, 500)
  }
})

// POST /api/shared-mailboxes/:id/members - Add member to shared mailbox
sharedMailboxRoutes.post('/:id/members', async (c) => {
  try {
    const userEmail = c.get('userEmail')
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    
    if (!userEmail) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    const { user_email, role, permissions } = await c.req.json()
    
    if (!user_email) {
      return c.json({ error: 'user_email is required' }, 400)
    }
    
    const result = await DB.prepare(`
      INSERT INTO shared_mailbox_members (shared_mailbox_id, user_email, role, permissions, added_by)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      mailboxId,
      user_email,
      role || 'member',
      JSON.stringify(permissions || ['view', 'send']),
      userEmail
    ).run()
    
    // Log activity
    await DB.prepare(`
      INSERT INTO shared_mailbox_activity (shared_mailbox_id, user_email, activity_type, entity_type, entity_id, details)
      VALUES (?, ?, 'member_added', 'member', ?, ?)
    `).bind(
      mailboxId,
      userEmail,
      user_email,
      JSON.stringify({ added_user: user_email, role, permissions })
    ).run()
    
    return c.json({
      success: true,
      memberId: result.meta.last_row_id,
      message: 'Member added successfully'
    })
  } catch (error: any) {
    console.error('Error adding member:', error)
    return c.json({ error: 'Failed to add member', details: error.message }, 500)
  }
})

// DELETE /api/shared-mailboxes/:id/members/:memberEmail - Remove member
sharedMailboxRoutes.delete('/:id/members/:memberEmail', async (c) => {
  try {
    const userEmail = c.get('userEmail')
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    const memberEmail = c.req.param('memberEmail')
    
    if (!userEmail) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    await DB.prepare(`
      UPDATE shared_mailbox_members
      SET is_active = 0
      WHERE shared_mailbox_id = ? AND user_email = ?
    `).bind(mailboxId, memberEmail).run()
    
    // Log activity
    await DB.prepare(`
      INSERT INTO shared_mailbox_activity (shared_mailbox_id, user_email, activity_type, entity_type, entity_id, details)
      VALUES (?, ?, 'member_removed', 'member', ?, ?)
    `).bind(
      mailboxId,
      userEmail,
      memberEmail,
      JSON.stringify({ removed_user: memberEmail })
    ).run()
    
    return c.json({ success: true, message: 'Member removed successfully' })
  } catch (error: any) {
    console.error('Error removing member:', error)
    return c.json({ error: 'Failed to remove member', details: error.message }, 500)
  }
})

// ===== COLLABORATIVE DRAFTS =====

// GET /api/shared-mailboxes/:id/drafts - Get shared drafts
sharedMailboxRoutes.get('/:id/drafts', async (c) => {
  try {
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    
    const drafts = await DB.prepare(`
      SELECT sd.*, ea.display_name as created_by_name
      FROM shared_drafts sd
      LEFT JOIN email_accounts ea ON sd.created_by = ea.email_address
      WHERE sd.shared_mailbox_id = ? AND sd.is_sent = 0
      ORDER BY sd.updated_at DESC
    `).bind(mailboxId).all()
    
    return c.json({ drafts: drafts.results || [] })
  } catch (error: any) {
    console.error('Error fetching drafts:', error)
    return c.json({ error: 'Failed to fetch drafts', details: error.message }, 500)
  }
})

// POST /api/shared-mailboxes/:id/drafts - Create shared draft
sharedMailboxRoutes.post('/:id/drafts', async (c) => {
  try {
    const userEmail = c.get('userEmail')
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    
    if (!userEmail) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    const { subject, body_text, to_email, cc, bcc } = await c.req.json()
    
    const draftId = generateId('draft')
    const timestamp = Date.now()
    
    await DB.prepare(`
      INSERT INTO shared_drafts (id, shared_mailbox_id, subject, body_text, to_email, cc, bcc, created_by, last_edit_timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      draftId,
      mailboxId,
      subject || '',
      body_text || '',
      to_email || '',
      cc || '',
      bcc || '',
      userEmail,
      timestamp
    ).run()
    
    return c.json({
      success: true,
      draftId,
      message: 'Draft created successfully'
    })
  } catch (error: any) {
    console.error('Error creating draft:', error)
    return c.json({ error: 'Failed to create draft', details: error.message }, 500)
  }
})

// PUT /api/shared-mailboxes/:id/drafts/:draftId - Update shared draft (real-time collaboration)
sharedMailboxRoutes.put('/:id/drafts/:draftId', async (c) => {
  try {
    const userEmail = c.get('userEmail')
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    const draftId = c.req.param('draftId')
    
    if (!userEmail) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    const { subject, body_text, to_email, cc, bcc, last_edit_timestamp } = await c.req.json()
    
    const currentTimestamp = Date.now()
    
    // Optimistic locking: check if draft was modified by someone else
    const currentDraft = await DB.prepare(`
      SELECT last_edit_timestamp FROM shared_drafts WHERE id = ?
    `).bind(draftId).first()
    
    if (currentDraft && last_edit_timestamp && currentDraft.last_edit_timestamp > last_edit_timestamp) {
      return c.json({
        success: false,
        conflict: true,
        message: 'Draft was modified by another user',
        latest_timestamp: currentDraft.last_edit_timestamp
      }, 409)
    }
    
    const updates: string[] = []
    const params: any[] = []
    
    if (subject !== undefined) {
      updates.push('subject = ?')
      params.push(subject)
    }
    if (body_text !== undefined) {
      updates.push('body_text = ?')
      params.push(body_text)
    }
    if (to_email !== undefined) {
      updates.push('to_email = ?')
      params.push(to_email)
    }
    if (cc !== undefined) {
      updates.push('cc = ?')
      params.push(cc)
    }
    if (bcc !== undefined) {
      updates.push('bcc = ?')
      params.push(bcc)
    }
    
    updates.push('updated_by = ?', 'updated_at = CURRENT_TIMESTAMP', 'last_edit_timestamp = ?')
    params.push(userEmail, currentTimestamp, draftId)
    
    await DB.prepare(`
      UPDATE shared_drafts
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run()
    
    return c.json({
      success: true,
      last_edit_timestamp: currentTimestamp,
      message: 'Draft updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating draft:', error)
    return c.json({ error: 'Failed to update draft', details: error.message }, 500)
  }
})

// ===== PRESENCE & ACTIVITY =====

// POST /api/shared-mailboxes/:id/presence - Update user presence
sharedMailboxRoutes.post('/:id/presence', async (c) => {
  try {
    const userEmail = c.get('userEmail')
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    
    if (!userEmail) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    const { status, current_draft_id, session_id } = await c.req.json()
    
    // Update or insert presence
    await DB.prepare(`
      INSERT INTO shared_mailbox_presence (shared_mailbox_id, user_email, status, current_draft_id, session_id, last_seen_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(shared_mailbox_id, user_email, session_id)
      DO UPDATE SET status = ?, current_draft_id = ?, last_seen_at = CURRENT_TIMESTAMP
    `).bind(mailboxId, userEmail, status || 'viewing', current_draft_id, session_id, status || 'viewing', current_draft_id).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('Error updating presence:', error)
    return c.json({ error: 'Failed to update presence', details: error.message }, 500)
  }
})

// GET /api/shared-mailboxes/:id/presence - Get active users
sharedMailboxRoutes.get('/:id/presence', async (c) => {
  try {
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    
    // Get users active in last 5 minutes
    const activeUsers = await DB.prepare(`
      SELECT smp.*, ea.display_name
      FROM shared_mailbox_presence smp
      LEFT JOIN email_accounts ea ON smp.user_email = ea.email_address
      WHERE smp.shared_mailbox_id = ?
        AND smp.last_seen_at >= datetime('now', '-5 minutes')
      ORDER BY smp.last_seen_at DESC
    `).bind(mailboxId).all()
    
    return c.json({ activeUsers: activeUsers.results || [] })
  } catch (error: any) {
    console.error('Error fetching presence:', error)
    return c.json({ error: 'Failed to fetch presence', details: error.message }, 500)
  }
})

// GET /api/shared-mailboxes/:id/activity - Get activity feed
sharedMailboxRoutes.get('/:id/activity', async (c) => {
  try {
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    const limit = parseInt(c.req.query('limit') || '50')
    
    const activities = await DB.prepare(`
      SELECT sma.*, ea.display_name as user_name
      FROM shared_mailbox_activity sma
      LEFT JOIN email_accounts ea ON sma.user_email = ea.email_address
      WHERE sma.shared_mailbox_id = ?
      ORDER BY sma.created_at DESC
      LIMIT ?
    `).bind(mailboxId, limit).all()
    
    return c.json({ activities: activities.results || [] })
  } catch (error: any) {
    console.error('Error fetching activity:', error)
    return c.json({ error: 'Failed to fetch activity', details: error.message }, 500)
  }
})

// GET /api/shared-mailboxes/:id/emails - Get emails for shared mailbox
sharedMailboxRoutes.get('/:id/emails', async (c) => {
  try {
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    const folder = c.req.query('folder') || 'inbox'
    
    // Get the shared mailbox email address
    const mailbox = await DB.prepare(`
      SELECT email_address FROM shared_mailboxes WHERE id = ?
    `).bind(mailboxId).first()
    
    if (!mailbox) {
      return c.json({ error: 'Mailbox not found' }, 404)
    }
    
    // Build query based on folder
    let query = `
      SELECT 
        e.id, e.thread_id, e.from_email, e.from_name, e.to_email,
        e.subject, e.body_text, e.body_html, e.snippet,
        e.category, e.priority, e.sentiment, e.is_read, e.is_starred,
        e.is_archived, e.labels, e.received_at, e.sent_at,
        e.ai_summary, e.action_items, e.created_at, e.updated_at
      FROM emails e
      WHERE 1=1
    `
    
    const emailAddress = mailbox.email_address
    
    if (folder === 'inbox') {
      query += ` AND e.to_email = '${emailAddress}' AND e.category NOT IN ('spam', 'trash') AND e.is_archived = 0`
    } else if (folder === 'sent') {
      query += ` AND e.from_email = '${emailAddress}'`
    } else if (folder === 'spam') {
      query += ` AND e.to_email = '${emailAddress}' AND e.category = 'spam'`
    } else if (folder === 'trash') {
      query += ` AND (e.to_email = '${emailAddress}' OR e.from_email = '${emailAddress}') AND e.category = 'trash'`
    } else if (folder === 'archived') {
      query += ` AND e.to_email = '${emailAddress}' AND e.is_archived = 1`
    }
    
    query += ` ORDER BY e.received_at DESC, e.created_at DESC LIMIT 100`
    
    const result = await DB.prepare(query).all()
    
    return c.json({ 
      success: true,
      emails: result.results || [],
      count: result.results?.length || 0
    })
  } catch (error: any) {
    console.error('Error fetching shared mailbox emails:', error)
    return c.json({ error: 'Failed to fetch emails', details: error.message }, 500)
  }
})

// POST /api/shared-mailboxes/:id/emails/:emailId/read - Mark email as read
sharedMailboxRoutes.post('/:id/emails/:emailId/read', async (c) => {
  try {
    const { DB } = c.env
    const userEmail = c.get('userEmail')
    const mailboxId = c.req.param('id')
    const emailId = c.req.param('emailId')
    
    // Insert or ignore (unique constraint handles duplicates)
    await DB.prepare(`
      INSERT OR IGNORE INTO shared_mailbox_read_receipts (email_id, shared_mailbox_id, user_email)
      VALUES (?, ?, ?)
    `).bind(emailId, mailboxId, userEmail).run()
    
    return c.json({ 
      success: true,
      message: 'Read receipt recorded'
    })
  } catch (error: any) {
    console.error('Error recording read receipt:', error)
    return c.json({ error: 'Failed to record read receipt', details: error.message }, 500)
  }
})

// GET /api/shared-mailboxes/:id/emails/:emailId/readers - Get who read the email
sharedMailboxRoutes.get('/:id/emails/:emailId/readers', async (c) => {
  try {
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    const emailId = c.req.param('emailId')
    
    const readers = await DB.prepare(`
      SELECT 
        rr.user_email,
        rr.read_at,
        ea.display_name
      FROM shared_mailbox_read_receipts rr
      LEFT JOIN email_accounts ea ON rr.user_email = ea.email_address
      WHERE rr.email_id = ? AND rr.shared_mailbox_id = ?
      ORDER BY rr.read_at DESC
    `).bind(emailId, mailboxId).all()
    
    return c.json({ 
      success: true,
      readers: readers.results || [],
      count: readers.results?.length || 0
    })
  } catch (error: any) {
    console.error('Error fetching readers:', error)
    return c.json({ error: 'Failed to fetch readers', details: error.message }, 500)
  }
})

// GET /api/shared-mailboxes/:id/emails/read-receipts - Get read receipts for multiple emails
sharedMailboxRoutes.get('/:id/emails/read-receipts', async (c) => {
  try {
    const { DB } = c.env
    const mailboxId = c.req.param('id')
    const emailIds = c.req.query('emailIds') // Comma-separated list
    
    if (!emailIds) {
      return c.json({ success: true, receipts: {} })
    }
    
    // email_id is TEXT (e.g., 'eml_xxx'), not INTEGER - don't parse as int!
    const ids = emailIds.split(',').map(id => id.trim())
    const placeholders = ids.map(() => '?').join(',')
    
    console.log(`📊 Loading read receipts for ${ids.length} emails in mailbox ${mailboxId}`);
    
    const receipts = await DB.prepare(`
      SELECT 
        rr.email_id,
        rr.user_email,
        rr.read_at,
        ea.display_name
      FROM shared_mailbox_read_receipts rr
      LEFT JOIN email_accounts ea ON rr.user_email = ea.email_address
      WHERE rr.email_id IN (${placeholders}) AND rr.shared_mailbox_id = ?
      ORDER BY rr.read_at DESC
    `).bind(...ids, mailboxId).all()
    
    console.log(`📬 Found ${receipts.results?.length || 0} read receipt records`);
    
    // Group by email_id
    const grouped: Record<string, any[]> = {}
    for (const receipt of (receipts.results || [])) {
      const emailId = (receipt as any).email_id
      if (!grouped[emailId]) {
        grouped[emailId] = []
      }
      grouped[emailId].push(receipt)
    }
    
    console.log(`✅ Grouped into ${Object.keys(grouped).length} emails with readers`);
    
    return c.json({ 
      success: true,
      receipts: grouped
    })
  } catch (error: any) {
    console.error('❌ Error fetching read receipts:', error)
    return c.json({ error: 'Failed to fetch read receipts', details: error.message }, 500)
  }
})

export default sharedMailboxRoutes
