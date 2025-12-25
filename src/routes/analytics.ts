import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/cloudflare'

const analytics = new Hono<{ Bindings: CloudflareBindings }>()

// ===== PRODUCTIVITY METRICS =====

// Get productivity dashboard
analytics.get('/productivity', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const period = c.req.query('period') || 'week' // today, week, month, year
  
  try {
    let dateFilter = ''
    if (period === 'today') {
      dateFilter = "AND date(created_at) = date('now')"
    } else if (period === 'week') {
      dateFilter = "AND date(created_at) >= date('now', '-7 days')"
    } else if (period === 'month') {
      dateFilter = "AND date(created_at) >= date('now', '-30 days')"
    } else if (period === 'year') {
      dateFilter = "AND date(created_at) >= date('now', '-365 days')"
    }
    
    // Email stats
    const emailStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_emails,
        SUM(CASE WHEN to_email = ? OR to_email LIKE ? THEN 1 ELSE 0 END) as emails_received,
        SUM(CASE WHEN from_email = ? THEN 1 ELSE 0 END) as emails_sent,
        AVG(CASE WHEN opened_at IS NOT NULL THEN 
          (julianday(opened_at) - julianday(created_at)) * 24 * 60 
        END) as avg_response_time_minutes
      FROM emails
      WHERE (from_email = ? OR to_email = ? OR to_email LIKE ?)
      ${dateFilter}
    `).bind(userEmail, `%${userEmail}%`, userEmail, userEmail, userEmail, `%${userEmail}%`).first()
    
    // Task completion stats
    const taskStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN due_date < datetime('now') AND status != 'completed' THEN 1 ELSE 0 END) as overdue_tasks
      FROM email_tasks
      WHERE user_email = ?
      ${dateFilter}
    `).bind(userEmail).first()
    
    // Meeting stats
    const meetingStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_meetings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_meetings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_meetings
      FROM meeting_proposals
      WHERE user_email = ?
      ${dateFilter}
    `).bind(userEmail).first()
    
    // CRM activity stats
    const crmStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT contact_id) as contacts_contacted,
        COUNT(*) as total_activities,
        SUM(CASE WHEN activity_type = 'email' THEN 1 ELSE 0 END) as email_activities,
        SUM(CASE WHEN activity_type = 'call' THEN 1 ELSE 0 END) as call_activities,
        SUM(CASE WHEN activity_type = 'meeting' THEN 1 ELSE 0 END) as meeting_activities
      FROM crm_activities
      WHERE user_email = ?
      ${dateFilter}
    `).bind(userEmail).first()
    
    return c.json({
      period,
      emails: emailStats,
      tasks: taskStats,
      meetings: meetingStats,
      crm: crmStats
    })
  } catch (error: any) {
    console.error('Error fetching productivity metrics:', error)
    return c.json({ error: 'Failed to fetch productivity metrics', details: error.message }, 500)
  }
})

// Get email activity timeline
analytics.get('/activity/timeline', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const days = parseInt(c.req.query('days') || '30')
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as email_count,
        SUM(CASE WHEN from_email = ? THEN 1 ELSE 0 END) as sent_count,
        SUM(CASE WHEN to_email = ? OR to_email LIKE ? THEN 1 ELSE 0 END) as received_count
      FROM emails
      WHERE (from_email = ? OR to_email = ? OR to_email LIKE ?)
        AND date(created_at) >= date('now', '-' || ? || ' days')
      GROUP BY date(created_at)
      ORDER BY date(created_at) DESC
    `).bind(userEmail, userEmail, `%${userEmail}%`, userEmail, userEmail, `%${userEmail}%`, days).all()
    
    return c.json({ timeline: results || [] })
  } catch (error: any) {
    console.error('Error fetching activity timeline:', error)
    return c.json({ error: 'Failed to fetch activity timeline', details: error.message }, 500)
  }
})

// Get category distribution
analytics.get('/categories/distribution', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const period = c.req.query('period') || 'month'
  
  try {
    let dateFilter = ''
    if (period === 'week') {
      dateFilter = "AND date(created_at) >= date('now', '-7 days')"
    } else if (period === 'month') {
      dateFilter = "AND date(created_at) >= date('now', '-30 days')"
    }
    
    const { results } = await c.env.DB.prepare(`
      SELECT 
        category,
        COUNT(*) as count,
        AVG(priority) as avg_priority,
        SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count
      FROM emails
      WHERE (to_email = ? OR to_email LIKE ?)
      ${dateFilter}
      GROUP BY category
      ORDER BY count DESC
    `).bind(userEmail, `%${userEmail}%`).all()
    
    return c.json({ distribution: results || [] })
  } catch (error: any) {
    console.error('Error fetching category distribution:', error)
    return c.json({ error: 'Failed to fetch category distribution', details: error.message }, 500)
  }
})

// Get response time analysis
analytics.get('/response-time', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const period = c.req.query('period') || 'month'
  
  try {
    let dateFilter = ''
    if (period === 'week') {
      dateFilter = "AND date(created_at) >= date('now', '-7 days')"
    } else if (period === 'month') {
      dateFilter = "AND date(created_at) >= date('now', '-30 days')"
    }
    
    const { results } = await c.env.DB.prepare(`
      SELECT 
        category,
        COUNT(*) as total,
        AVG((julianday(opened_at) - julianday(created_at)) * 24 * 60) as avg_response_minutes,
        MIN((julianday(opened_at) - julianday(created_at)) * 24 * 60) as min_response_minutes,
        MAX((julianday(opened_at) - julianday(created_at)) * 24 * 60) as max_response_minutes
      FROM emails
      WHERE (to_email = ? OR to_email LIKE ?)
        AND opened_at IS NOT NULL
      ${dateFilter}
      GROUP BY category
      ORDER BY avg_response_minutes ASC
    `).bind(userEmail, `%${userEmail}%`).all()
    
    return c.json({ responseTime: results || [] })
  } catch (error: any) {
    console.error('Error fetching response time:', error)
    return c.json({ error: 'Failed to fetch response time', details: error.message }, 500)
  }
})

// Get top senders/recipients
analytics.get('/top-contacts', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const type = c.req.query('type') || 'senders' // senders or recipients
  const limit = parseInt(c.req.query('limit') || '10')
  
  try {
    let query = ''
    if (type === 'senders') {
      query = `
        SELECT 
          from_email as email,
          COUNT(*) as count,
          MAX(created_at) as last_email_date
        FROM emails
        WHERE (to_email = ? OR to_email LIKE ?)
          AND from_email != ?
        GROUP BY from_email
        ORDER BY count DESC
        LIMIT ?
      `
    } else {
      query = `
        SELECT 
          to_email as email,
          COUNT(*) as count,
          MAX(created_at) as last_email_date
        FROM emails
        WHERE from_email = ?
        GROUP BY to_email
        ORDER BY count DESC
        LIMIT ?
      `
    }
    
    const params = type === 'senders' 
      ? [userEmail, `%${userEmail}%`, userEmail, limit]
      : [userEmail, limit]
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({ contacts: results || [] })
  } catch (error: any) {
    console.error('Error fetching top contacts:', error)
    return c.json({ error: 'Failed to fetch top contacts', details: error.message }, 500)
  }
})

// ===== AI INSIGHTS =====

// Get AI-generated insights
analytics.get('/insights', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const category = c.req.query('category') // productivity, engagement, workload, sentiment
  
  try {
    let query = `
      SELECT * FROM ai_insights
      WHERE user_email = ?
    `
    const params: any[] = [userEmail]
    
    if (category) {
      query += ' AND insight_category = ?'
      params.push(category)
    }
    
    query += ' ORDER BY generated_at DESC LIMIT 20'
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({ insights: results || [] })
  } catch (error: any) {
    console.error('Error fetching insights:', error)
    return c.json({ error: 'Failed to fetch insights', details: error.message }, 500)
  }
})

// Generate new insight
analytics.post('/insights/generate', async (c) => {
  try {
    const { userEmail, insightType, title, description, actionable, priority } = await c.req.json()
    
    if (!userEmail || !insightType || !title) {
      return c.json({ error: 'userEmail, insightType and title are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO ai_insights (
        user_email, insight_category, title, description, 
        actionable, priority, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).bind(
      userEmail, insightType, title, description || '',
      actionable ? 1 : 0, priority || 'medium'
    ).run()
    
    return c.json({ 
      success: true, 
      insightId: result.meta.last_row_id,
      message: 'Insight generated successfully' 
    })
  } catch (error: any) {
    console.error('Error generating insight:', error)
    return c.json({ error: 'Failed to generate insight', details: error.message }, 500)
  }
})

// Dismiss insight
analytics.put('/insights/:id/dismiss', async (c) => {
  const insightId = c.req.param('id')
  
  try {
    await c.env.DB.prepare(`
      UPDATE ai_insights 
      SET status = 'dismissed'
      WHERE id = ?
    `).bind(insightId).run()
    
    return c.json({ success: true, message: 'Insight dismissed' })
  } catch (error: any) {
    console.error('Error dismissing insight:', error)
    return c.json({ error: 'Failed to dismiss insight', details: error.message }, 500)
  }
})

// ===== SENTIMENT ANALYSIS =====

// Get sentiment trends
analytics.get('/sentiment/trends', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const days = parseInt(c.req.query('days') || '30')
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        date(created_at) as date,
        AVG(CASE 
          WHEN sentiment = 'positive' THEN 3
          WHEN sentiment = 'neutral' THEN 2
          WHEN sentiment = 'negative' THEN 1
          ELSE 2
        END) as avg_sentiment_score,
        COUNT(*) as email_count,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive_count,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral_count,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_count
      FROM emails
      WHERE (to_email = ? OR to_email LIKE ?)
        AND date(created_at) >= date('now', '-' || ? || ' days')
        AND sentiment IS NOT NULL
      GROUP BY date(created_at)
      ORDER BY date(created_at) DESC
    `).bind(userEmail, `%${userEmail}%`, days).all()
    
    return c.json({ trends: results || [] })
  } catch (error: any) {
    console.error('Error fetching sentiment trends:', error)
    return c.json({ error: 'Failed to fetch sentiment trends', details: error.message }, 500)
  }
})

// Get sentiment by contact
analytics.get('/sentiment/by-contact', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const limit = parseInt(c.req.query('limit') || '20')
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        from_email,
        COUNT(*) as total_emails,
        AVG(CASE 
          WHEN sentiment = 'positive' THEN 3
          WHEN sentiment = 'neutral' THEN 2
          WHEN sentiment = 'negative' THEN 1
          ELSE 2
        END) as avg_sentiment_score,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive_count,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral_count,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_count
      FROM emails
      WHERE (to_email = ? OR to_email LIKE ?)
        AND sentiment IS NOT NULL
        AND from_email != ?
      GROUP BY from_email
      ORDER BY total_emails DESC
      LIMIT ?
    `).bind(userEmail, `%${userEmail}%`, userEmail, limit).all()
    
    return c.json({ contacts: results || [] })
  } catch (error: any) {
    console.error('Error fetching sentiment by contact:', error)
    return c.json({ error: 'Failed to fetch sentiment by contact', details: error.message }, 500)
  }
})

export default analytics
