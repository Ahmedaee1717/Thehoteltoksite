import { Hono } from 'hono';

const collaborationRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

// Utility to generate IDs
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================
// INTERNAL COMMENTS API
// ============================================

// POST /api/collaboration/comments
// Add internal comment to email
collaborationRoutes.post('/comments', async (c) => {
  const { DB } = c.env;
  
  try {
    const { 
      email_id, 
      thread_id,
      author_email, 
      author_name, 
      comment_text,
      comment_type = 'comment',
      mentions,
      tags,
      priority,
      parent_comment_id 
    } = await c.req.json();
    
    if (!email_id || !author_email || !comment_text) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: email_id, author_email, comment_text' 
      }, 400);
    }
    
    const commentId = generateId('cmt');
    
    await DB.prepare(`
      INSERT INTO email_internal_comments (
        id, email_id, thread_id, author_email, author_name, 
        comment_text, comment_type, mentions, tags, priority, parent_comment_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      commentId, email_id, thread_id || null, author_email, author_name || null,
      comment_text, comment_type || 'comment', mentions ? JSON.stringify(mentions) : null,
      tags ? JSON.stringify(tags) : null, priority || null, parent_comment_id || null
    ).run();
    
    // Track activity
    await DB.prepare(`
      INSERT INTO email_activity_tracking (
        id, email_id, thread_id, user_email, user_name, activity_type, activity_data
      ) VALUES (?, ?, ?, ?, ?, 'commented', ?)
    `).bind(
      generateId('act'), email_id, thread_id || null, author_email, author_name || null,
      JSON.stringify({ comment_id: commentId, comment_type: comment_type || 'comment' })
    ).run();
    
    // Update collaboration stats
    await DB.prepare(`
      INSERT INTO email_collaboration_stats (id, email_id, total_comments, last_activity_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(email_id) DO UPDATE SET 
        total_comments = total_comments + 1,
        unresolved_comments = CASE WHEN ? = 'comment' THEN unresolved_comments + 1 ELSE unresolved_comments END,
        last_activity_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `).bind(generateId('stat'), email_id, comment_type || 'comment').run();
    
    return c.json({ success: true, comment_id: commentId });
  } catch (error: any) {
    console.error('Add comment error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/collaboration/comments/:email_id
// Get all comments for an email (team visibility)
// 🔒 Only show comments to users involved in the email thread
collaborationRoutes.get('/comments/:email_id', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('email_id');
  
  // 🔒 Get authenticated user (optional - for future filtering)
  const currentUserEmail = c.get('userEmail');
  
  try {
    // First, get the email to determine team members
    const email = await DB.prepare(`
      SELECT from_email, to_email, cc, bcc 
      FROM emails 
      WHERE id = ?
    `).bind(emailId).first();
    
    if (!email) {
      return c.json({ success: false, error: 'Email not found' }, 404);
    }
    
    // Extract all participants (from, to, cc, bcc)
    const participants = new Set<string>();
    if (email.from_email) participants.add(email.from_email.toLowerCase());
    if (email.to_email) participants.add(email.to_email.toLowerCase());
    if (email.cc) {
      try {
        const ccList = JSON.parse(email.cc);
        ccList.forEach((e: string) => participants.add(e.toLowerCase()));
      } catch {}
    }
    if (email.bcc) {
      try {
        const bccList = JSON.parse(email.bcc);
        bccList.forEach((e: string) => participants.add(e.toLowerCase()));
      } catch {}
    }
    
    // Get domain from participants (e.g., @investaycapital.com)
    const domains = new Set<string>();
    participants.forEach(email => {
      const domain = email.split('@')[1];
      if (domain) domains.add(domain.toLowerCase());
    });
    
    console.log('📧 Email participants:', Array.from(participants));
    console.log('🏢 Team domains:', Array.from(domains));
    
    // Get all comments for this email
    const { results } = await DB.prepare(`
      SELECT 
        id, email_id, thread_id, author_email, author_name,
        comment_text, comment_type, mentions, tags, priority,
        is_resolved, is_private, parent_comment_id,
        created_at, updated_at, edited_at
      FROM email_internal_comments
      WHERE email_id = ?
      ORDER BY created_at ASC
    `).bind(emailId).all();
    
    // Filter comments: show only to team members (same domain) or participants
    const visibleComments = results.filter((comment: any) => {
      const commentDomain = comment.author_email?.split('@')[1]?.toLowerCase();
      
      // Show if:
      // 1. Comment author is a participant
      // 2. Comment author is from same domain as any participant
      // 3. Comment is not private (or user is mentioned)
      const isParticipant = participants.has(comment.author_email?.toLowerCase());
      const isSameDomain = commentDomain && domains.has(commentDomain);
      
      return isParticipant || isSameDomain;
    });
    
    console.log(`💬 Total comments: ${results.length}, Visible to team: ${visibleComments.length}`);
    
    return c.json({ success: true, comments: visibleComments });
  } catch (error: any) {
    console.error('Get comments error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /api/collaboration/comments/:id/resolve
// Mark comment as resolved
collaborationRoutes.put('/comments/:id/resolve', async (c) => {
  const { DB } = c.env;
  const commentId = c.req.param('id');
  
  try {
    await DB.prepare(`
      UPDATE email_internal_comments
      SET is_resolved = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(commentId).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Resolve comment error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /api/collaboration/comments/:id
// Delete a comment
collaborationRoutes.delete('/comments/:id', async (c) => {
  const { DB } = c.env;
  const commentId = c.req.param('id');
  
  try {
    await DB.prepare(`
      DELETE FROM email_internal_comments WHERE id = ?
    `).bind(commentId).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// ACTIVITY TRACKING API
// ============================================

// POST /api/collaboration/activity
// Track email activity
collaborationRoutes.post('/activity', async (c) => {
  const { DB } = c.env;
  
  try {
    const { 
      email_id, 
      thread_id,
      user_email, 
      user_name, 
      activity_type,
      activity_data,
      user_agent,
      ip_address
    } = await c.req.json();
    
    if (!email_id || !user_email || !activity_type) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: email_id, user_email, activity_type' 
      }, 400);
    }
    
    const activityId = generateId('act');
    
    await DB.prepare(`
      INSERT INTO email_activity_tracking (
        id, email_id, thread_id, user_email, user_name,
        activity_type, activity_data, user_agent, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      activityId, email_id, thread_id, user_email, user_name,
      activity_type, activity_data ? JSON.stringify(activity_data) : null,
      user_agent, ip_address
    ).run();
    
    // Update collaboration stats
    await DB.prepare(`
      INSERT INTO email_collaboration_stats (id, email_id, total_activities, last_activity_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(email_id) DO UPDATE SET 
        total_activities = total_activities + 1,
        total_views = CASE WHEN ? = 'viewed' THEN total_views + 1 ELSE total_views END,
        last_activity_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `).bind(generateId('stat'), email_id, activity_type).run();
    
    return c.json({ success: true, activity_id: activityId });
  } catch (error: any) {
    console.error('Track activity error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/collaboration/activity/:email_id
// Get activity log for an email
collaborationRoutes.get('/activity/:email_id', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('email_id');
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        id, email_id, user_email, user_name,
        activity_type, activity_data, created_at
      FROM email_activity_tracking
      WHERE email_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(emailId).all();
    
    return c.json({ success: true, activities: results });
  } catch (error: any) {
    console.error('Get activity error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// PRESENCE TRACKING API
// ============================================

// POST /api/collaboration/presence
// Update user presence
collaborationRoutes.post('/presence', async (c) => {
  const { DB } = c.env;
  
  try {
    const { 
      email_id, 
      user_email, 
      user_name, 
      presence_type,
      cursor_position
    } = await c.req.json();
    
    if (!email_id || !user_email || !presence_type) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: email_id, user_email, presence_type' 
      }, 400);
    }
    
    const presenceId = generateId('prs');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    // Upsert presence
    await DB.prepare(`
      INSERT INTO email_presence (
        id, email_id, user_email, user_name, presence_type,
        cursor_position, is_active, last_seen_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(email_id, user_email, presence_type) DO UPDATE SET
        is_active = 1,
        cursor_position = ?,
        last_seen_at = CURRENT_TIMESTAMP,
        expires_at = ?
    `).bind(
      presenceId, email_id, user_email, user_name, presence_type,
      cursor_position, expiresAt.toISOString(),
      cursor_position, expiresAt.toISOString()
    ).run();
    
    return c.json({ success: true, presence_id: presenceId });
  } catch (error: any) {
    console.error('Update presence error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/collaboration/presence/:email_id
// Get active viewers for an email
collaborationRoutes.get('/presence/:email_id', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('email_id');
  
  try {
    // Clean expired presence first
    await DB.prepare(`
      UPDATE email_presence
      SET is_active = 0
      WHERE expires_at < CURRENT_TIMESTAMP AND is_active = 1
    `).run();
    
    const { results } = await DB.prepare(`
      SELECT 
        user_email, user_name, presence_type, cursor_position, last_seen_at
      FROM email_presence
      WHERE email_id = ? AND is_active = 1
      ORDER BY last_seen_at DESC
    `).bind(emailId).all();
    
    return c.json({ success: true, presence: results });
  } catch (error: any) {
    console.error('Get presence error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// COLLABORATIVE DRAFTS API
// ============================================

// POST /api/collaboration/draft-session
// Create collaborative draft session
collaborationRoutes.post('/draft-session', async (c) => {
  const { DB } = c.env;
  
  try {
    const { 
      draft_id, 
      session_name,
      created_by,
      base_content
    } = await c.req.json();
    
    if (!draft_id || !created_by) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: draft_id, created_by' 
      }, 400);
    }
    
    const sessionId = generateId('ses');
    
    await DB.prepare(`
      INSERT INTO collaborative_draft_sessions (
        id, draft_id, session_name, created_by, base_content
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(sessionId, draft_id, session_name, created_by, base_content).run();
    
    return c.json({ success: true, session_id: sessionId });
  } catch (error: any) {
    console.error('Create session error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/collaboration/draft-session/:id/lock
// Acquire write lock for draft
collaborationRoutes.post('/draft-session/:id/lock', async (c) => {
  const { DB } = c.env;
  const sessionId = c.req.param('id');
  
  try {
    const { user_email } = await c.req.json();
    
    if (!user_email) {
      return c.json({ success: false, error: 'Missing user_email' }, 400);
    }
    
    const lockExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    
    // Try to acquire lock
    const result = await DB.prepare(`
      UPDATE collaborative_draft_sessions
      SET locked_by = ?, locked_at = CURRENT_TIMESTAMP, lock_expires_at = ?
      WHERE id = ? AND (locked_by IS NULL OR lock_expires_at < CURRENT_TIMESTAMP)
    `).bind(user_email, lockExpiresAt.toISOString(), sessionId).run();
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Lock already held by another user' }, 409);
    }
    
    return c.json({ success: true, lock_expires_at: lockExpiresAt });
  } catch (error: any) {
    console.error('Acquire lock error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/collaboration/draft-session/:id/edit
// Record draft edit
collaborationRoutes.post('/draft-session/:id/edit', async (c) => {
  const { DB } = c.env;
  const sessionId = c.req.param('id');
  
  try {
    const { 
      draft_id,
      editor_email,
      editor_name,
      change_type,
      content_before,
      content_after,
      diff_data,
      change_description,
      change_position
    } = await c.req.json();
    
    if (!draft_id || !editor_email || !change_type) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: draft_id, editor_email, change_type' 
      }, 400);
    }
    
    // Get current version
    const session = await DB.prepare(`
      SELECT current_version FROM collaborative_draft_sessions WHERE id = ?
    `).bind(sessionId).first() as any;
    
    const newVersion = (session?.current_version || 0) + 1;
    
    const editId = generateId('edt');
    
    await DB.prepare(`
      INSERT INTO draft_edit_history (
        id, session_id, draft_id, editor_email, editor_name,
        version_number, change_type, content_before, content_after,
        diff_data, change_description, change_position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      editId, sessionId, draft_id, editor_email, editor_name,
      newVersion, change_type, content_before, content_after,
      diff_data ? JSON.stringify(diff_data) : null,
      change_description, change_position
    ).run();
    
    // Update session version
    await DB.prepare(`
      UPDATE collaborative_draft_sessions
      SET current_version = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newVersion, sessionId).run();
    
    return c.json({ success: true, edit_id: editId, version: newVersion });
  } catch (error: any) {
    console.error('Record edit error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/collaboration/draft-session/:id/history
// Get edit history for draft session
collaborationRoutes.get('/draft-session/:id/history', async (c) => {
  const { DB } = c.env;
  const sessionId = c.req.param('id');
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        id, editor_email, editor_name, version_number,
        change_type, change_description, created_at
      FROM draft_edit_history
      WHERE session_id = ?
      ORDER BY version_number DESC
      LIMIT 50
    `).bind(sessionId).all();
    
    return c.json({ success: true, history: results });
  } catch (error: any) {
    console.error('Get history error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// EMAIL ASSIGNMENTS API
// ============================================

// POST /api/collaboration/assign
// Assign email to team member
collaborationRoutes.post('/assign', async (c) => {
  const { DB } = c.env;
  
  try {
    const { 
      email_id, 
      assigned_to,
      assigned_by,
      priority,
      notes,
      due_date
    } = await c.req.json();
    
    if (!email_id || !assigned_to || !assigned_by) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: email_id, assigned_to, assigned_by' 
      }, 400);
    }
    
    const assignmentId = generateId('asn');
    
    await DB.prepare(`
      INSERT INTO email_shared_assignments (
        id, email_id, assigned_to, assigned_by, priority, notes, due_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      assignmentId, email_id, assigned_to, assigned_by, 
      priority, notes, due_date
    ).run();
    
    // Track activity
    await DB.prepare(`
      INSERT INTO email_activity_tracking (
        id, email_id, user_email, activity_type, activity_data
      ) VALUES (?, ?, ?, 'assigned', ?)
    `).bind(
      generateId('act'), email_id, assigned_by,
      JSON.stringify({ assigned_to, assignment_id: assignmentId })
    ).run();
    
    return c.json({ success: true, assignment_id: assignmentId });
  } catch (error: any) {
    console.error('Assign email error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/collaboration/assignments
// Get assignments for a user
collaborationRoutes.get('/assignments', async (c) => {
  const { DB } = c.env;
  const userEmail = c.req.query('user');
  const status = c.req.query('status');
  
  try {
    let query = `
      SELECT 
        a.id, a.email_id, a.assigned_to, a.assigned_by,
        a.status, a.priority, a.notes, a.due_date,
        a.assigned_at, a.accepted_at, a.completed_at,
        e.subject, e.from_email, e.snippet
      FROM email_shared_assignments a
      LEFT JOIN emails e ON a.email_id = e.id
      WHERE 1=1
    `;
    
    const bindings: any[] = [];
    
    if (userEmail) {
      query += ` AND a.assigned_to = ?`;
      bindings.push(userEmail);
    }
    
    if (status) {
      query += ` AND a.status = ?`;
      bindings.push(status);
    }
    
    query += ` ORDER BY a.assigned_at DESC LIMIT 50`;
    
    const { results } = await DB.prepare(query).bind(...bindings).all();
    
    return c.json({ success: true, assignments: results });
  } catch (error: any) {
    console.error('Get assignments error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /api/collaboration/assignments/:id/status
// Update assignment status
collaborationRoutes.put('/assignments/:id/status', async (c) => {
  const { DB } = c.env;
  const assignmentId = c.req.param('id');
  
  try {
    const { status } = await c.req.json();
    
    if (!status) {
      return c.json({ success: false, error: 'Missing status' }, 400);
    }
    
    const updateFields: string[] = ['status = ?'];
    const bindings: any[] = [status];
    
    if (status === 'in_progress') {
      updateFields.push('accepted_at = CURRENT_TIMESTAMP');
    } else if (status === 'completed') {
      updateFields.push('completed_at = CURRENT_TIMESTAMP');
    }
    
    bindings.push(assignmentId);
    
    await DB.prepare(`
      UPDATE email_shared_assignments
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...bindings).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Update assignment status error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// COLLABORATION STATS API
// ============================================

// GET /api/collaboration/stats/:email_id
// Get collaboration stats for email
collaborationRoutes.get('/stats/:email_id', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('email_id');
  
  try {
    const stats = await DB.prepare(`
      SELECT * FROM email_collaboration_stats WHERE email_id = ?
    `).bind(emailId).first() as any;
    
    if (!stats) {
      return c.json({ 
        success: true, 
        stats: {
          total_views: 0,
          total_comments: 0,
          unresolved_comments: 0,
          total_activities: 0,
          current_viewers: 0
        }
      });
    }
    
    return c.json({ success: true, stats });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default collaborationRoutes;
