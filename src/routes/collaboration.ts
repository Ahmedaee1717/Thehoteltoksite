import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/cloudflare'

const collab = new Hono<{ Bindings: CloudflareBindings }>()

// ===== TEAM NOTES =====

// Get notes for email
collab.get('/notes/:emailId', async (c) => {
  const emailId = c.req.param('emailId')
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM team_notes
      WHERE email_id = ?
      ORDER BY created_at DESC
    `).bind(emailId).all()
    
    return c.json({ notes: results || [] })
  } catch (error: any) {
    console.error('Error fetching notes:', error)
    return c.json({ error: 'Failed to fetch notes', details: error.message }, 500)
  }
})

// Add note to email
collab.post('/notes', async (c) => {
  try {
    const { emailId, userEmail, content, visibility } = await c.req.json()
    
    if (!emailId || !userEmail || !content) {
      return c.json({ error: 'emailId, userEmail and content are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO team_notes (
        email_id, user_email, content, visibility
      ) VALUES (?, ?, ?, ?)
    `).bind(emailId, userEmail, content, visibility || 'team').run()
    
    return c.json({ 
      success: true, 
      noteId: result.meta.last_row_id,
      message: 'Note added successfully' 
    })
  } catch (error: any) {
    console.error('Error adding note:', error)
    return c.json({ error: 'Failed to add note', details: error.message }, 500)
  }
})

// Update note
collab.put('/notes/:id', async (c) => {
  const noteId = c.req.param('id')
  
  try {
    const { content, visibility } = await c.req.json()
    
    const updates: string[] = []
    const params: any[] = []
    
    if (content !== undefined) {
      updates.push('content = ?')
      params.push(content)
    }
    if (visibility !== undefined) {
      updates.push('visibility = ?')
      params.push(visibility)
    }
    
    params.push(noteId)
    
    await c.env.DB.prepare(`
      UPDATE team_notes 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(...params).run()
    
    return c.json({ success: true, message: 'Note updated successfully' })
  } catch (error: any) {
    console.error('Error updating note:', error)
    return c.json({ error: 'Failed to update note', details: error.message }, 500)
  }
})

// Delete note
collab.delete('/notes/:id', async (c) => {
  const noteId = c.req.param('id')
  
  try {
    await c.env.DB.prepare('DELETE FROM team_notes WHERE id = ?').bind(noteId).run()
    return c.json({ success: true, message: 'Note deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting note:', error)
    return c.json({ error: 'Failed to delete note', details: error.message }, 500)
  }
})

// ===== EMAIL DELEGATION =====

// Get delegated emails for user
collab.get('/delegations', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const type = c.req.query('type') // delegated_by_me, delegated_to_me
  
  try {
    let query = `
      SELECT d.*, 
        e.subject, e.from_email, e.created_at as email_created_at,
        from_user.name as from_user_name,
        to_user.name as to_user_name
      FROM email_delegations d
      LEFT JOIN emails e ON d.email_id = e.id
      LEFT JOIN crm_contacts from_user ON d.from_user = from_user.email
      LEFT JOIN crm_contacts to_user ON d.to_user = to_user.email
      WHERE d.status = 'pending'
    `
    const params: any[] = []
    
    if (type === 'delegated_by_me') {
      query += ' AND d.from_user = ?'
      params.push(userEmail)
    } else if (type === 'delegated_to_me') {
      query += ' AND d.to_user = ?'
      params.push(userEmail)
    } else {
      query += ' AND (d.from_user = ? OR d.to_user = ?)'
      params.push(userEmail, userEmail)
    }
    
    query += ' ORDER BY d.created_at DESC'
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({ delegations: results || [] })
  } catch (error: any) {
    console.error('Error fetching delegations:', error)
    return c.json({ error: 'Failed to fetch delegations', details: error.message }, 500)
  }
})

// Delegate email
collab.post('/delegations', async (c) => {
  try {
    const { emailId, fromUser, toUser, message, dueDate, priority } = await c.req.json()
    
    if (!emailId || !fromUser || !toUser) {
      return c.json({ error: 'emailId, fromUser and toUser are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO email_delegations (
        email_id, from_user, to_user, message, due_date, priority, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).bind(emailId, fromUser, toUser, message || '', dueDate || null, priority || 'medium').run()
    
    return c.json({ 
      success: true, 
      delegationId: result.meta.last_row_id,
      message: 'Email delegated successfully' 
    })
  } catch (error: any) {
    console.error('Error delegating email:', error)
    return c.json({ error: 'Failed to delegate email', details: error.message }, 500)
  }
})

// Complete delegation
collab.put('/delegations/:id/complete', async (c) => {
  const delegationId = c.req.param('id')
  
  try {
    const { response } = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE email_delegations 
      SET status = 'completed', response = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(response || '', delegationId).run()
    
    return c.json({ success: true, message: 'Delegation completed' })
  } catch (error: any) {
    console.error('Error completing delegation:', error)
    return c.json({ error: 'Failed to complete delegation', details: error.message }, 500)
  }
})

// ===== APPROVAL WORKFLOWS =====

// Get pending approvals
collab.get('/approvals', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const type = c.req.query('type') // requested_by_me, approval_required
  
  try {
    let query = `
      SELECT a.*, 
        e.subject, e.from_email, e.to_email,
        requester.name as requester_name
      FROM approval_workflows a
      LEFT JOIN emails e ON a.email_id = e.id
      LEFT JOIN crm_contacts requester ON a.requester_email = requester.email
      WHERE a.status = 'pending'
    `
    const params: any[] = []
    
    if (type === 'requested_by_me') {
      query += ' AND a.requester_email = ?'
      params.push(userEmail)
    } else if (type === 'approval_required') {
      query += ' AND a.approver_email = ?'
      params.push(userEmail)
    } else {
      query += ' AND (a.requester_email = ? OR a.approver_email = ?)'
      params.push(userEmail, userEmail)
    }
    
    query += ' ORDER BY a.created_at DESC'
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({ approvals: results || [] })
  } catch (error: any) {
    console.error('Error fetching approvals:', error)
    return c.json({ error: 'Failed to fetch approvals', details: error.message }, 500)
  }
})

// Request approval
collab.post('/approvals', async (c) => {
  try {
    const { emailId, requesterEmail, approverEmail, approvalType, message, priority } = await c.req.json()
    
    if (!emailId || !requesterEmail || !approverEmail) {
      return c.json({ error: 'emailId, requesterEmail and approverEmail are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO approval_workflows (
        email_id, requester_email, approver_email, approval_type, 
        message, priority, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      emailId, requesterEmail, approverEmail, approvalType || 'send', 
      message || '', priority || 'medium'
    ).run()
    
    return c.json({ 
      success: true, 
      approvalId: result.meta.last_row_id,
      message: 'Approval requested successfully' 
    })
  } catch (error: any) {
    console.error('Error requesting approval:', error)
    return c.json({ error: 'Failed to request approval', details: error.message }, 500)
  }
})

// Approve/Reject
collab.put('/approvals/:id', async (c) => {
  const approvalId = c.req.param('id')
  
  try {
    const { status, comments } = await c.req.json()
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return c.json({ error: 'status must be "approved" or "rejected"' }, 400)
    }
    
    await c.env.DB.prepare(`
      UPDATE approval_workflows 
      SET status = ?, comments = ?, processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, comments || '', approvalId).run()
    
    return c.json({ success: true, message: `Approval ${status}` })
  } catch (error: any) {
    console.error('Error processing approval:', error)
    return c.json({ error: 'Failed to process approval', details: error.message }, 500)
  }
})

// ===== TEAM INBOXES =====

// Get team inbox emails
collab.get('/team-inboxes/:team', async (c) => {
  const team = c.req.param('team')
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT ti.*, e.subject, e.from_email, e.created_at as email_created_at,
        assignee.name as assignee_name
      FROM team_inboxes ti
      LEFT JOIN emails e ON ti.email_id = e.id
      LEFT JOIN crm_contacts assignee ON ti.assigned_to = assignee.email
      WHERE ti.team_name = ?
      ORDER BY ti.assigned_at DESC
    `).bind(team).all()
    
    return c.json({ emails: results || [] })
  } catch (error: any) {
    console.error('Error fetching team inbox:', error)
    return c.json({ error: 'Failed to fetch team inbox', details: error.message }, 500)
  }
})

// Assign email to team member
collab.post('/team-inboxes/assign', async (c) => {
  try {
    const { emailId, teamName, assignedBy, assignedTo } = await c.req.json()
    
    if (!emailId || !teamName || !assignedBy) {
      return c.json({ error: 'emailId, teamName and assignedBy are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO team_inboxes (
        email_id, team_name, assigned_by, assigned_to, status
      ) VALUES (?, ?, ?, ?, 'pending')
    `).bind(emailId, teamName, assignedBy, assignedTo || null).run()
    
    return c.json({ 
      success: true, 
      assignmentId: result.meta.last_row_id,
      message: 'Email assigned to team' 
    })
  } catch (error: any) {
    console.error('Error assigning to team:', error)
    return c.json({ error: 'Failed to assign to team', details: error.message }, 500)
  }
})

// Update team inbox status
collab.put('/team-inboxes/:id', async (c) => {
  const assignmentId = c.req.param('id')
  
  try {
    const { status, assignedTo } = await c.req.json()
    
    const updates: string[] = []
    const params: any[] = []
    
    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
    }
    if (assignedTo !== undefined) {
      updates.push('assigned_to = ?')
      params.push(assignedTo)
    }
    
    params.push(assignmentId)
    
    await c.env.DB.prepare(`
      UPDATE team_inboxes 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run()
    
    return c.json({ success: true, message: 'Team inbox updated' })
  } catch (error: any) {
    console.error('Error updating team inbox:', error)
    return c.json({ error: 'Failed to update team inbox', details: error.message }, 500)
  }
})

export default collab
