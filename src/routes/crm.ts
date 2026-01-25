import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/cloudflare'
import { sign, verify } from 'hono/jwt'

const crm = new Hono<{ Bindings: CloudflareBindings }>()

// Helper function to get user email from cookie
function getUserEmailFromCookie(c: any): string | null {
  const authToken = c.req.raw.headers.get('cookie')?.split('; ').find(c => c.startsWith('auth_token='))?.split('=')[1]
  
  if (!authToken) {
    return null
  }
  
  try {
    const JWT_SECRET = c.env.JWT_SECRET || 'default-secret-change-in-production'
    const payload = verify(authToken, JWT_SECRET) as any
    return payload.email || null
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// ===== CONTACTS =====

// Get all contacts
crm.get('/contacts', async (c) => {
  const userEmail = getUserEmailFromCookie(c)
  
  if (!userEmail) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  const search = c.req.query('search')
  const type = c.req.query('type') // client, prospect, partner, vendor, other
  
  try {
    let query = `
      SELECT c.*, 
        COUNT(DISTINCT a.id) as activity_count,
        COUNT(DISTINCT d.id) as deal_count
      FROM crm_contacts c
      LEFT JOIN crm_activities a ON c.id = a.contact_id
      LEFT JOIN crm_deals d ON c.id = d.contact_id
      WHERE c.user_email = ?
    `
    const params: any[] = [userEmail]
    
    if (search) {
      query += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.company LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }
    
    if (type) {
      query += ' AND c.contact_type = ?'
      params.push(type)
    }
    
    query += ' GROUP BY c.id ORDER BY c.last_contact_date DESC, c.created_at DESC'
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({ contacts: results || [] })
  } catch (error: any) {
    console.error('Error fetching contacts:', error)
    return c.json({ error: 'Failed to fetch contacts', details: error.message }, 500)
  }
})

// Get single contact with full details
crm.get('/contacts/:id', async (c) => {
  const userEmail = getUserEmailFromCookie(c)
  
  if (!userEmail) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  const contactId = c.req.param('id')
  
  try {
    // Get contact info
    const contact = await c.env.DB.prepare(`
      SELECT * FROM crm_contacts WHERE id = ?
    `).bind(contactId).first()
    
    if (!contact) {
      return c.json({ error: 'Contact not found' }, 404)
    }
    
    // Get recent activities
    const { results: activities } = await c.env.DB.prepare(`
      SELECT * FROM crm_activities 
      WHERE contact_id = ?
      ORDER BY activity_date DESC
      LIMIT 10
    `).bind(contactId).all()
    
    // Get deals
    const { results: deals } = await c.env.DB.prepare(`
      SELECT * FROM crm_deals 
      WHERE contact_id = ?
      ORDER BY created_at DESC
    `).bind(contactId).all()
    
    // Get emails
    const { results: emails } = await c.env.DB.prepare(`
      SELECT id, subject, from_email, created_at, is_read
      FROM emails 
      WHERE from_email = ? OR to_email LIKE ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(contact.email, `%${contact.email}%`).all()
    
    return c.json({ 
      contact,
      activities: activities || [],
      deals: deals || [],
      emails: emails || []
    })
  } catch (error: any) {
    console.error('Error fetching contact:', error)
    return c.json({ error: 'Failed to fetch contact', details: error.message }, 500)
  }
})

// Create contact
crm.post('/contacts', async (c) => {
  const userEmail = getUserEmailFromCookie(c)
  
  if (!userEmail) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  try {
    const { 
      name, email, phone, company, position, 
      contactType, notes, customFields, tags 
    } = await c.req.json()
    
    if (!name || !email) {
      return c.json({ error: 'name and email are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO crm_contacts (
        user_email, name, email, phone, company, position,
        contact_type, notes, custom_fields, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userEmail, name, email, phone || '', company || '', position || '',
      contactType || 'other', notes || '', customFields || '{}', tags || ''
    ).run()
    
    return c.json({ 
      success: true, 
      contactId: result.meta.last_row_id,
      message: 'Contact created successfully' 
    })
  } catch (error: any) {
    console.error('Error creating contact:', error)
    return c.json({ error: 'Failed to create contact', details: error.message }, 500)
  }
})

// Update contact
crm.put('/contacts/:id', async (c) => {
  const userEmail = getUserEmailFromCookie(c)
  
  if (!userEmail) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  const contactId = c.req.param('id')
  
  try {
    const data = await c.req.json()
    const updates: string[] = []
    const params: any[] = []
    
    const allowedFields = ['name', 'email', 'phone', 'company', 'position', 'contact_type', 'notes', 'tags', 'custom_fields']
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`)
        params.push(data[field])
      }
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400)
    }
    
    params.push(contactId)
    
    await c.env.DB.prepare(`
      UPDATE crm_contacts 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(...params).run()
    
    return c.json({ success: true, message: 'Contact updated successfully' })
  } catch (error: any) {
    console.error('Error updating contact:', error)
    return c.json({ error: 'Failed to update contact', details: error.message }, 500)
  }
})

// Delete contact
crm.delete('/contacts/:id', async (c) => {
  const userEmail = getUserEmailFromCookie(c)
  
  if (!userEmail) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  const contactId = c.req.param('id')
  
  try {
    await c.env.DB.prepare('DELETE FROM crm_contacts WHERE id = ?').bind(contactId).run()
    return c.json({ success: true, message: 'Contact deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting contact:', error)
    return c.json({ error: 'Failed to delete contact', details: error.message }, 500)
  }
})

// ===== DEALS =====

// Get all deals
crm.get('/deals', async (c) => {
  const userEmail = getUserEmailFromCookie(c)
  
  if (!userEmail) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  const stage = c.req.query('stage')
  
  try {
    let query = `
      SELECT d.*, c.name as contact_name, c.company as contact_company
      FROM crm_deals d
      LEFT JOIN crm_contacts c ON d.contact_id = c.id
      WHERE d.user_email = ?
    `
    const params: any[] = [userEmail]
    
    if (stage) {
      query += ' AND d.stage = ?'
      params.push(stage)
    }
    
    query += ' ORDER BY d.close_date ASC, d.value DESC'
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({ deals: results || [] })
  } catch (error: any) {
    console.error('Error fetching deals:', error)
    return c.json({ error: 'Failed to fetch deals', details: error.message }, 500)
  }
})

// Get deal pipeline stats
crm.get('/deals/pipeline/stats', async (c) => {
  const userEmail = getUserEmailFromCookie(c)
  
  if (!userEmail) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        stage,
        COUNT(*) as count,
        SUM(value) as total_value,
        AVG(probability) as avg_probability
      FROM crm_deals
      WHERE user_email = ? AND status = 'active'
      GROUP BY stage
    `).bind(userEmail).all()
    
    return c.json({ pipeline: results || [] })
  } catch (error: any) {
    console.error('Error fetching pipeline stats:', error)
    return c.json({ error: 'Failed to fetch pipeline stats', details: error.message }, 500)
  }
})

// Create deal
crm.post('/deals', async (c) => {
  const userEmail = getUserEmailFromCookie(c)
  
  if (!userEmail) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  try {
    const { 
      contactId, title, value, stage, 
      probability, closeDate, notes, customFields 
    } = await c.req.json()
    
    if (!title) {
      return c.json({ error: 'title is required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO crm_deals (
        user_email, contact_id, title, value, stage,
        probability, close_date, notes, custom_fields, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).bind(
      userEmail, contactId || null, title, value || 0, stage || 'lead',
      probability || 50, closeDate || null, notes || '', customFields || '{}'
    ).run()
    
    return c.json({ 
      success: true, 
      dealId: result.meta.last_row_id,
      message: 'Deal created successfully' 
    })
  } catch (error: any) {
    console.error('Error creating deal:', error)
    return c.json({ error: 'Failed to create deal', details: error.message }, 500)
  }
})

// Update deal
crm.put('/deals/:id', async (c) => {
  const userEmail = getUserEmailFromCookie(c)
  
  if (!userEmail) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  const dealId = c.req.param('id')
  
  try {
    const data = await c.req.json()
    const updates: string[] = []
    const params: any[] = []
    
    const allowedFields = ['title', 'value', 'stage', 'probability', 'close_date', 'notes', 'status', 'custom_fields']
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`)
        params.push(data[field])
      }
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400)
    }
    
    params.push(dealId)
    
    await c.env.DB.prepare(`
      UPDATE crm_deals 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(...params).run()
    
    return c.json({ success: true, message: 'Deal updated successfully' })
  } catch (error: any) {
    console.error('Error updating deal:', error)
    return c.json({ error: 'Failed to update deal', details: error.message }, 500)
  }
})

// ===== ACTIVITIES =====

// Log activity
crm.post('/activities', async (c) => {
  const userEmail = getUserEmailFromCookie(c)
  
  if (!userEmail) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  try {
    const { 
      contactId, dealId, emailId, activityType, 
      subject, notes, activityDate 
    } = await c.req.json()
    
    if (!activityType) {
      return c.json({ error: 'activityType is required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO crm_activities (
        user_email, contact_id, deal_id, email_id, activity_type,
        subject, notes, activity_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userEmail, contactId || null, dealId || null, emailId || null, 
      activityType, subject || '', notes || '', 
      activityDate || new Date().toISOString()
    ).run()
    
    // Update last contact date on contact
    if (contactId) {
      await c.env.DB.prepare(`
        UPDATE crm_contacts 
        SET last_contact_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(contactId).run()
    }
    
    return c.json({ 
      success: true, 
      activityId: result.meta.last_row_id,
      message: 'Activity logged successfully' 
    })
  } catch (error: any) {
    console.error('Error logging activity:', error)
    return c.json({ error: 'Failed to log activity', details: error.message }, 500)
  }
})

export default crm
