import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/cloudflare'

const organization = new Hono<{ Bindings: CloudflareBindings }>()

// ===== SMART FOLDERS =====

// Get all smart folders for user
organization.get('/folders', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT f.*, COUNT(e.id) as email_count
      FROM smart_folders f
      LEFT JOIN emails e ON (
        (f.filter_type = 'category' AND e.category = f.filter_value)
        OR (f.filter_type = 'sender' AND e.from_email = f.filter_value)
        OR (f.filter_type = 'priority' AND CAST(e.priority AS TEXT) = f.filter_value)
        OR (f.filter_type = 'tag' AND e.tags LIKE '%' || f.filter_value || '%')
      ) AND (e.to_email = ? OR e.to_email LIKE ?)
      WHERE f.user_email = ?
      GROUP BY f.id
      ORDER BY f.folder_order ASC, f.created_at DESC
    `).bind(userEmail, `%${userEmail}%`, userEmail).all()
    
    return c.json({ folders: results || [] })
  } catch (error: any) {
    console.error('Error fetching smart folders:', error)
    return c.json({ error: 'Failed to fetch smart folders', details: error.message }, 500)
  }
})

// Get emails in smart folder
organization.get('/folders/:id/emails', async (c) => {
  const folderId = c.req.param('id')
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = parseInt(c.req.query('offset') || '0')
  
  try {
    // Get folder details
    const folder = await c.env.DB.prepare(`
      SELECT * FROM smart_folders WHERE id = ? AND user_email = ?
    `).bind(folderId, userEmail).first()
    
    if (!folder) {
      return c.json({ error: 'Folder not found' }, 404)
    }
    
    // Build query based on filter
    let emailQuery = `
      SELECT * FROM emails
      WHERE (to_email = ? OR to_email LIKE ?)
    `
    const params: any[] = [userEmail, `%${userEmail}%`]
    
    if (folder.filter_type === 'category') {
      emailQuery += ' AND category = ?'
      params.push(folder.filter_value)
    } else if (folder.filter_type === 'sender') {
      emailQuery += ' AND from_email = ?'
      params.push(folder.filter_value)
    } else if (folder.filter_type === 'priority') {
      emailQuery += ' AND CAST(priority AS TEXT) = ?'
      params.push(folder.filter_value)
    } else if (folder.filter_type === 'tag') {
      emailQuery += ' AND tags LIKE ?'
      params.push(`%${folder.filter_value}%`)
    } else if (folder.filter_type === 'custom') {
      // Custom filter logic based on filter_value JSON
      try {
        const customFilters = JSON.parse(folder.filter_value || '{}')
        if (customFilters.unread) {
          emailQuery += ' AND is_read = 0'
        }
        if (customFilters.starred) {
          emailQuery += ' AND is_starred = 1'
        }
        if (customFilters.hasAttachments) {
          emailQuery += ' AND has_attachments = 1'
        }
      } catch (e) {
        console.error('Error parsing custom filters:', e)
      }
    }
    
    emailQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    const { results } = await c.env.DB.prepare(emailQuery).bind(...params).all()
    
    return c.json({ 
      folder,
      emails: results || [],
      count: results?.length || 0
    })
  } catch (error: any) {
    console.error('Error fetching folder emails:', error)
    return c.json({ error: 'Failed to fetch folder emails', details: error.message }, 500)
  }
})

// Create smart folder
organization.post('/folders', async (c) => {
  try {
    const { userEmail, name, icon, color, filterType, filterValue, autoUpdate } = await c.req.json()
    
    if (!userEmail || !name || !filterType || !filterValue) {
      return c.json({ error: 'userEmail, name, filterType and filterValue are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO smart_folders (
        user_email, name, icon, color, filter_type, 
        filter_value, auto_update
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userEmail, name, icon || '📁', color || '#3B82F6', 
      filterType, filterValue, autoUpdate ? 1 : 0
    ).run()
    
    return c.json({ 
      success: true, 
      folderId: result.meta.last_row_id,
      message: 'Smart folder created successfully' 
    })
  } catch (error: any) {
    console.error('Error creating smart folder:', error)
    return c.json({ error: 'Failed to create smart folder', details: error.message }, 500)
  }
})

// Update smart folder
organization.put('/folders/:id', async (c) => {
  const folderId = c.req.param('id')
  
  try {
    const data = await c.req.json()
    const updates: string[] = []
    const params: any[] = []
    
    const allowedFields = ['name', 'icon', 'color', 'filter_type', 'filter_value', 'auto_update', 'folder_order']
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`)
        params.push(data[field])
      }
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400)
    }
    
    params.push(folderId)
    
    await c.env.DB.prepare(`
      UPDATE smart_folders 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(...params).run()
    
    return c.json({ success: true, message: 'Smart folder updated successfully' })
  } catch (error: any) {
    console.error('Error updating smart folder:', error)
    return c.json({ error: 'Failed to update smart folder', details: error.message }, 500)
  }
})

// Delete smart folder
organization.delete('/folders/:id', async (c) => {
  const folderId = c.req.param('id')
  
  try {
    await c.env.DB.prepare('DELETE FROM smart_folders WHERE id = ?').bind(folderId).run()
    return c.json({ success: true, message: 'Smart folder deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting smart folder:', error)
    return c.json({ error: 'Failed to delete smart folder', details: error.message }, 500)
  }
})

// ===== PRIORITY INBOX =====

// Get priority inbox
organization.get('/priority-inbox', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const limit = parseInt(c.req.query('limit') || '50')
  
  try {
    // Calculate priority score based on multiple factors
    const { results } = await c.env.DB.prepare(`
      SELECT 
        e.*,
        (
          CAST(e.priority AS REAL) * 10 +
          CASE WHEN e.is_starred = 1 THEN 20 ELSE 0 END +
          CASE WHEN e.is_read = 0 THEN 15 ELSE 0 END +
          CASE WHEN e.category IN ('urgent', 'important', 'client') THEN 10 ELSE 0 END +
          CASE WHEN e.has_attachments = 1 THEN 5 ELSE 0 END +
          CASE WHEN LENGTH(e.ai_action_items) > 2 THEN 8 ELSE 0 END -
          (julianday('now') - julianday(e.created_at)) * 2
        ) as priority_score
      FROM emails e
      WHERE (e.to_email = ? OR e.to_email LIKE ?)
      ORDER BY priority_score DESC, e.created_at DESC
      LIMIT ?
    `).bind(userEmail, `%${userEmail}%`, limit).all()
    
    return c.json({ emails: results || [] })
  } catch (error: any) {
    console.error('Error fetching priority inbox:', error)
    return c.json({ error: 'Failed to fetch priority inbox', details: error.message }, 500)
  }
})

// Update priority inbox settings
organization.put('/priority-inbox/settings', async (c) => {
  try {
    const { userEmail, settings } = await c.req.json()
    
    if (!userEmail || !settings) {
      return c.json({ error: 'userEmail and settings are required' }, 400)
    }
    
    // Store settings in a settings table or user preferences
    // For now, return success
    return c.json({ 
      success: true, 
      message: 'Priority inbox settings updated',
      settings 
    })
  } catch (error: any) {
    console.error('Error updating priority settings:', error)
    return c.json({ error: 'Failed to update priority settings', details: error.message }, 500)
  }
})

// ===== AUTO-CATEGORIZATION =====

// Get categorization stats
organization.get('/categorization/stats', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_count,
        AVG(priority) as avg_priority
      FROM emails
      WHERE (to_email = ? OR to_email LIKE ?)
      GROUP BY category
      ORDER BY count DESC
    `).bind(userEmail, `%${userEmail}%`).all()
    
    return c.json({ stats: results || [] })
  } catch (error: any) {
    console.error('Error fetching categorization stats:', error)
    return c.json({ error: 'Failed to fetch categorization stats', details: error.message }, 500)
  }
})

// Retrain categorization model (user feedback)
organization.post('/categorization/feedback', async (c) => {
  try {
    const { emailId, userEmail, correctCategory, wasCorrect } = await c.req.json()
    
    if (!emailId || !userEmail || !correctCategory) {
      return c.json({ error: 'emailId, userEmail and correctCategory are required' }, 400)
    }
    
    // Update email category
    if (!wasCorrect) {
      await c.env.DB.prepare(`
        UPDATE emails 
        SET category = ?
        WHERE id = ?
      `).bind(correctCategory, emailId).run()
    }
    
    // Log feedback for model training
    // In production, this would update ML model
    
    return c.json({ 
      success: true, 
      message: 'Feedback recorded successfully' 
    })
  } catch (error: any) {
    console.error('Error recording feedback:', error)
    return c.json({ error: 'Failed to record feedback', details: error.message }, 500)
  }
})

// ===== PROJECT-BASED ORGANIZATION =====

// Get all projects
organization.get('/projects', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT p.*, COUNT(DISTINCT pe.email_id) as email_count
      FROM email_projects p
      LEFT JOIN project_emails pe ON p.id = pe.project_id
      WHERE p.user_email = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).bind(userEmail).all()
    
    return c.json({ projects: results || [] })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return c.json({ error: 'Failed to fetch projects', details: error.message }, 500)
  }
})

// Get project details with emails
organization.get('/projects/:id', async (c) => {
  const projectId = c.req.param('id')
  
  try {
    // Get project info
    const project = await c.env.DB.prepare(`
      SELECT * FROM email_projects WHERE id = ?
    `).bind(projectId).first()
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }
    
    // Get project emails
    const { results: emails } = await c.env.DB.prepare(`
      SELECT e.*, pe.added_at
      FROM emails e
      INNER JOIN project_emails pe ON e.id = pe.email_id
      WHERE pe.project_id = ?
      ORDER BY pe.added_at DESC
    `).bind(projectId).all()
    
    return c.json({ 
      project,
      emails: emails || []
    })
  } catch (error: any) {
    console.error('Error fetching project:', error)
    return c.json({ error: 'Failed to fetch project', details: error.message }, 500)
  }
})

// Create project
organization.post('/projects', async (c) => {
  try {
    const { userEmail, name, description, color, status } = await c.req.json()
    
    if (!userEmail || !name) {
      return c.json({ error: 'userEmail and name are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO email_projects (
        user_email, name, description, color, status
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      userEmail, name, description || '', 
      color || '#3B82F6', status || 'active'
    ).run()
    
    return c.json({ 
      success: true, 
      projectId: result.meta.last_row_id,
      message: 'Project created successfully' 
    })
  } catch (error: any) {
    console.error('Error creating project:', error)
    return c.json({ error: 'Failed to create project', details: error.message }, 500)
  }
})

// Add email to project
organization.post('/projects/:id/emails', async (c) => {
  const projectId = c.req.param('id')
  
  try {
    const { emailId } = await c.req.json()
    
    if (!emailId) {
      return c.json({ error: 'emailId is required' }, 400)
    }
    
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO project_emails (project_id, email_id)
      VALUES (?, ?)
    `).bind(projectId, emailId).run()
    
    return c.json({ success: true, message: 'Email added to project' })
  } catch (error: any) {
    console.error('Error adding email to project:', error)
    return c.json({ error: 'Failed to add email to project', details: error.message }, 500)
  }
})

// Remove email from project
organization.delete('/projects/:id/emails/:emailId', async (c) => {
  const projectId = c.req.param('id')
  const emailId = c.req.param('emailId')
  
  try {
    await c.env.DB.prepare(`
      DELETE FROM project_emails 
      WHERE project_id = ? AND email_id = ?
    `).bind(projectId, emailId).run()
    
    return c.json({ success: true, message: 'Email removed from project' })
  } catch (error: any) {
    console.error('Error removing email from project:', error)
    return c.json({ error: 'Failed to remove email from project', details: error.message }, 500)
  }
})

export default organization
