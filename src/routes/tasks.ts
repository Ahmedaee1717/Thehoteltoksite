import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/cloudflare'

const tasks = new Hono<{ Bindings: CloudflareBindings }>()

// ===== TASK MANAGEMENT =====

// Get all tasks for user
tasks.get('/', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const status = c.req.query('status') // all, pending, in_progress, completed
  const priority = c.req.query('priority') // low, medium, high, urgent
  
  try {
    let query = `
      SELECT t.*, e.subject as email_subject, e.from_email
      FROM email_tasks t
      LEFT JOIN emails e ON t.email_id = e.id
      WHERE t.user_email = ?
    `
    const params: any[] = [userEmail]
    
    if (status && status !== 'all') {
      query += ' AND t.status = ?'
      params.push(status)
    }
    
    if (priority) {
      query += ' AND t.priority = ?'
      params.push(priority)
    }
    
    query += ' ORDER BY t.due_date ASC, t.priority DESC, t.created_at DESC'
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({ tasks: results || [] })
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    return c.json({ error: 'Failed to fetch tasks', details: error.message }, 500)
  }
})

// Convert email to task
tasks.post('/from-email', async (c) => {
  try {
    const { emailId, userEmail, title, description, dueDate, priority, category } = await c.req.json()
    
    if (!emailId || !userEmail) {
      return c.json({ error: 'emailId and userEmail are required' }, 400)
    }
    
    // Insert task
    const result = await c.env.DB.prepare(`
      INSERT INTO email_tasks (
        email_id, user_email, title, description, 
        due_date, priority, category, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      emailId,
      userEmail,
      title || 'Task from email',
      description || '',
      dueDate || null,
      priority || 'medium',
      category || 'general'
    ).run()
    
    return c.json({ 
      success: true, 
      taskId: result.meta.last_row_id,
      message: 'Email converted to task successfully' 
    })
  } catch (error: any) {
    console.error('Error creating task from email:', error)
    return c.json({ error: 'Failed to create task', details: error.message }, 500)
  }
})

// Create standalone task
tasks.post('/', async (c) => {
  try {
    const { userEmail, title, description, dueDate, priority, category, tags } = await c.req.json()
    
    if (!userEmail || !title) {
      return c.json({ error: 'userEmail and title are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO email_tasks (
        user_email, title, description, 
        due_date, priority, category, tags, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      userEmail,
      title,
      description || '',
      dueDate || null,
      priority || 'medium',
      category || 'general',
      tags || '',
      'pending'
    ).run()
    
    return c.json({ 
      success: true, 
      taskId: result.meta.last_row_id,
      message: 'Task created successfully' 
    })
  } catch (error: any) {
    console.error('Error creating task:', error)
    return c.json({ error: 'Failed to create task', details: error.message }, 500)
  }
})

// Update task
tasks.put('/:id', async (c) => {
  const taskId = c.req.param('id')
  
  try {
    const { title, description, status, priority, dueDate, completedAt } = await c.req.json()
    
    const updates: string[] = []
    const params: any[] = []
    
    if (title !== undefined) {
      updates.push('title = ?')
      params.push(title)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
      if (status === 'completed') {
        updates.push('completed_at = CURRENT_TIMESTAMP')
      }
    }
    if (priority !== undefined) {
      updates.push('priority = ?')
      params.push(priority)
    }
    if (dueDate !== undefined) {
      updates.push('due_date = ?')
      params.push(dueDate)
    }
    
    params.push(taskId)
    
    await c.env.DB.prepare(`
      UPDATE email_tasks 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run()
    
    return c.json({ success: true, message: 'Task updated successfully' })
  } catch (error: any) {
    console.error('Error updating task:', error)
    return c.json({ error: 'Failed to update task', details: error.message }, 500)
  }
})

// Delete task
tasks.delete('/:id', async (c) => {
  const taskId = c.req.param('id')
  
  try {
    await c.env.DB.prepare('DELETE FROM email_tasks WHERE id = ?').bind(taskId).run()
    return c.json({ success: true, message: 'Task deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting task:', error)
    return c.json({ error: 'Failed to delete task', details: error.message }, 500)
  }
})

// ===== FOLLOW-UP REMINDERS =====

// Get all reminders
tasks.get('/reminders', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT r.*, e.subject, e.from_email
      FROM follow_up_reminders r
      LEFT JOIN emails e ON r.email_id = e.id
      WHERE r.user_email = ? AND r.status = 'pending'
      ORDER BY r.remind_at ASC
    `).bind(userEmail).all()
    
    return c.json({ reminders: results || [] })
  } catch (error: any) {
    console.error('Error fetching reminders:', error)
    return c.json({ error: 'Failed to fetch reminders', details: error.message }, 500)
  }
})

// Create reminder
tasks.post('/reminders', async (c) => {
  try {
    const { emailId, userEmail, remindAt, message, reminderType } = await c.req.json()
    
    if (!emailId || !userEmail || !remindAt) {
      return c.json({ error: 'emailId, userEmail and remindAt are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO follow_up_reminders (
        email_id, user_email, remind_at, message, reminder_type, status
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `).bind(
      emailId,
      userEmail,
      remindAt,
      message || 'Follow up on this email',
      reminderType || 'follow_up'
    ).run()
    
    return c.json({ 
      success: true, 
      reminderId: result.meta.last_row_id,
      message: 'Reminder created successfully' 
    })
  } catch (error: any) {
    console.error('Error creating reminder:', error)
    return c.json({ error: 'Failed to create reminder', details: error.message }, 500)
  }
})

// Complete reminder
tasks.put('/reminders/:id/complete', async (c) => {
  const reminderId = c.req.param('id')
  
  try {
    await c.env.DB.prepare(`
      UPDATE follow_up_reminders 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(reminderId).run()
    
    return c.json({ success: true, message: 'Reminder completed' })
  } catch (error: any) {
    console.error('Error completing reminder:', error)
    return c.json({ error: 'Failed to complete reminder', details: error.message }, 500)
  }
})

// Snooze reminder
tasks.put('/reminders/:id/snooze', async (c) => {
  const reminderId = c.req.param('id')
  
  try {
    const { snoozeUntil } = await c.req.json()
    
    if (!snoozeUntil) {
      return c.json({ error: 'snoozeUntil is required' }, 400)
    }
    
    await c.env.DB.prepare(`
      UPDATE follow_up_reminders 
      SET remind_at = ?
      WHERE id = ?
    `).bind(snoozeUntil, reminderId).run()
    
    return c.json({ success: true, message: 'Reminder snoozed' })
  } catch (error: any) {
    console.error('Error snoozing reminder:', error)
    return c.json({ error: 'Failed to snooze reminder', details: error.message }, 500)
  }
})

export default tasks
