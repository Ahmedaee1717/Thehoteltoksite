import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/cloudflare'

const meetings = new Hono<{ Bindings: CloudflareBindings }>()

// ===== MEETING EXTRACTION =====

// Extract meeting info from email using AI
meetings.post('/extract', async (c) => {
  try {
    const { emailId, userEmail } = await c.req.json()
    
    if (!emailId || !userEmail) {
      return c.json({ error: 'emailId and userEmail are required' }, 400)
    }
    
    // Get email content
    const email = await c.env.DB.prepare(`
      SELECT subject, body FROM emails WHERE id = ?
    `).bind(emailId).first()
    
    if (!email) {
      return c.json({ error: 'Email not found' }, 404)
    }
    
    // Simple extraction logic (in production, use AI/NLP)
    const body = email.body || ''
    const subject = email.subject || ''
    const text = `${subject} ${body}`.toLowerCase()
    
    // Extract potential meeting dates/times
    const datePatterns = [
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}/gi,
      /\b\d{1,2}:\d{2}\s*(am|pm)\b/gi,
      /\b(morning|afternoon|evening|noon)\b/gi
    ]
    
    const extractedDates = []
    for (const pattern of datePatterns) {
      const matches = text.match(pattern)
      if (matches) {
        extractedDates.push(...matches)
      }
    }
    
    // Extract location
    const locationPatterns = [
      /\b(room|conference|office|zoom|teams|meet|location|at)\s+([A-Z0-9][A-Za-z0-9\s-]+)/gi,
      /\bhttps?:\/\/[^\s]+/gi
    ]
    
    const extractedLocations = []
    for (const pattern of locationPatterns) {
      const matches = body.match(pattern)
      if (matches) {
        extractedLocations.push(...matches)
      }
    }
    
    // Extract attendees (email addresses)
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const extractedAttendees = body.match(emailPattern) || []
    
    // Store extraction result
    const result = await c.env.DB.prepare(`
      INSERT INTO meeting_extractions (
        email_id, user_email, extracted_dates, extracted_times,
        extracted_location, extracted_attendees, confidence_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      emailId,
      userEmail,
      extractedDates.join(', '),
      extractedDates.join(', '),
      extractedLocations[0] || '',
      extractedAttendees.join(', '),
      0.75
    ).run()
    
    return c.json({
      success: true,
      extractionId: result.meta.last_row_id,
      extracted: {
        dates: extractedDates,
        location: extractedLocations[0] || '',
        attendees: extractedAttendees,
        confidence: 0.75
      }
    })
  } catch (error: any) {
    console.error('Error extracting meeting info:', error)
    return c.json({ error: 'Failed to extract meeting info', details: error.message }, 500)
  }
})

// Get meeting extractions for email
meetings.get('/extractions/:emailId', async (c) => {
  const emailId = c.req.param('emailId')
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM meeting_extractions
      WHERE email_id = ?
      ORDER BY created_at DESC
    `).bind(emailId).all()
    
    return c.json({ extractions: results || [] })
  } catch (error: any) {
    console.error('Error fetching extractions:', error)
    return c.json({ error: 'Failed to fetch extractions', details: error.message }, 500)
  }
})

// ===== MEETING PROPOSALS =====

// Get all meeting proposals
meetings.get('/proposals', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const status = c.req.query('status') // pending, confirmed, rejected, rescheduled
  
  try {
    let query = `
      SELECT m.*, e.subject as email_subject, e.from_email
      FROM meeting_proposals m
      LEFT JOIN emails e ON m.email_id = e.id
      WHERE m.user_email = ?
    `
    const params: any[] = [userEmail]
    
    if (status) {
      query += ' AND m.status = ?'
      params.push(status)
    }
    
    query += ' ORDER BY m.proposed_date ASC'
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({ proposals: results || [] })
  } catch (error: any) {
    console.error('Error fetching proposals:', error)
    return c.json({ error: 'Failed to fetch proposals', details: error.message }, 500)
  }
})

// Create meeting proposal
meetings.post('/proposals', async (c) => {
  try {
    const { 
      emailId, userEmail, title, proposedDate, duration, 
      location, attendees, notes, meetingType 
    } = await c.req.json()
    
    if (!userEmail || !title || !proposedDate) {
      return c.json({ error: 'userEmail, title and proposedDate are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO meeting_proposals (
        email_id, user_email, title, proposed_date, duration_minutes,
        location, attendees, notes, meeting_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      emailId || null,
      userEmail,
      title,
      proposedDate,
      duration || 30,
      location || '',
      attendees || '',
      notes || '',
      meetingType || 'general'
    ).run()
    
    return c.json({ 
      success: true, 
      proposalId: result.meta.last_row_id,
      message: 'Meeting proposal created successfully' 
    })
  } catch (error: any) {
    console.error('Error creating proposal:', error)
    return c.json({ error: 'Failed to create proposal', details: error.message }, 500)
  }
})

// Update meeting proposal
meetings.put('/proposals/:id', async (c) => {
  const proposalId = c.req.param('id')
  
  try {
    const data = await c.req.json()
    const updates: string[] = []
    const params: any[] = []
    
    const allowedFields = ['title', 'proposed_date', 'duration_minutes', 'location', 'attendees', 'notes', 'status', 'confirmed_date']
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`)
        params.push(data[field])
      }
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400)
    }
    
    params.push(proposalId)
    
    await c.env.DB.prepare(`
      UPDATE meeting_proposals 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(...params).run()
    
    return c.json({ success: true, message: 'Proposal updated successfully' })
  } catch (error: any) {
    console.error('Error updating proposal:', error)
    return c.json({ error: 'Failed to update proposal', details: error.message }, 500)
  }
})

// Confirm meeting
meetings.put('/proposals/:id/confirm', async (c) => {
  const proposalId = c.req.param('id')
  
  try {
    const { confirmedDate } = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE meeting_proposals 
      SET status = 'confirmed', confirmed_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(confirmedDate || null, proposalId).run()
    
    return c.json({ success: true, message: 'Meeting confirmed' })
  } catch (error: any) {
    console.error('Error confirming meeting:', error)
    return c.json({ error: 'Failed to confirm meeting', details: error.message }, 500)
  }
})

// Reschedule meeting
meetings.put('/proposals/:id/reschedule', async (c) => {
  const proposalId = c.req.param('id')
  
  try {
    const { newDate, reason } = await c.req.json()
    
    if (!newDate) {
      return c.json({ error: 'newDate is required' }, 400)
    }
    
    await c.env.DB.prepare(`
      UPDATE meeting_proposals 
      SET status = 'rescheduled', proposed_date = ?, 
          notes = COALESCE(notes, '') || ' [Rescheduled: ' || ? || ']',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newDate, reason || 'No reason provided', proposalId).run()
    
    return c.json({ success: true, message: 'Meeting rescheduled' })
  } catch (error: any) {
    console.error('Error rescheduling meeting:', error)
    return c.json({ error: 'Failed to reschedule meeting', details: error.message }, 500)
  }
})

// Cancel meeting
meetings.delete('/proposals/:id', async (c) => {
  const proposalId = c.req.param('id')
  
  try {
    await c.env.DB.prepare(`
      UPDATE meeting_proposals 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(proposalId).run()
    
    return c.json({ success: true, message: 'Meeting cancelled' })
  } catch (error: any) {
    console.error('Error cancelling meeting:', error)
    return c.json({ error: 'Failed to cancel meeting', details: error.message }, 500)
  }
})

// ===== SMART SCHEDULING =====

// Get available time slots
meetings.get('/available-slots', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  const duration = parseInt(c.req.query('duration') || '30')
  
  try {
    if (!startDate || !endDate) {
      return c.json({ error: 'startDate and endDate are required' }, 400)
    }
    
    // Get existing meetings in the date range
    const { results: existingMeetings } = await c.env.DB.prepare(`
      SELECT proposed_date, duration_minutes 
      FROM meeting_proposals
      WHERE user_email = ? 
        AND status IN ('pending', 'confirmed')
        AND proposed_date BETWEEN ? AND ?
      ORDER BY proposed_date ASC
    `).bind(userEmail, startDate, endDate).all()
    
    // Simple slot generation (9 AM - 6 PM, Mon-Fri)
    // In production, this would be more sophisticated
    const availableSlots = []
    const workingHours = { start: 9, end: 18 }
    
    // For demo, generate a few sample slots
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      availableSlots.push({
        start: `${startDate}T${hour.toString().padStart(2, '0')}:00:00`,
        end: `${startDate}T${(hour + Math.floor(duration / 60)).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}:00`,
        duration: duration
      })
    }
    
    return c.json({ 
      slots: availableSlots,
      existingMeetings: existingMeetings || []
    })
  } catch (error: any) {
    console.error('Error fetching available slots:', error)
    return c.json({ error: 'Failed to fetch available slots', details: error.message }, 500)
  }
})

// Get calendar summary
meetings.get('/calendar/summary', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  const period = c.req.query('period') || 'week' // today, week, month
  
  try {
    let dateFilter = ''
    if (period === 'today') {
      dateFilter = "AND date(proposed_date) = date('now')"
    } else if (period === 'week') {
      dateFilter = "AND date(proposed_date) BETWEEN date('now') AND date('now', '+7 days')"
    } else if (period === 'month') {
      dateFilter = "AND date(proposed_date) BETWEEN date('now') AND date('now', '+30 days')"
    }
    
    const summary = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_meetings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(duration_minutes) as total_duration_minutes
      FROM meeting_proposals
      WHERE user_email = ?
      ${dateFilter}
    `).bind(userEmail).first()
    
    return c.json({ summary })
  } catch (error: any) {
    console.error('Error fetching calendar summary:', error)
    return c.json({ error: 'Failed to fetch calendar summary', details: error.message }, 500)
  }
})

// ===== ZAPIER TABLES INTEGRATION (Otter.ai via Zapier) =====

// Sync from Zapier Tables (Otter.ai transcripts)
meetings.post('/zapier/sync', async (c) => {
  try {
    const { zapierApiKey } = await c.req.json()
    
    if (!zapierApiKey) {
      return c.json({ error: 'Zapier API key is required' }, 400)
    }
    
    const TABLE_ID = '01KFP9A1JMZYREQSMBWGGQ726Q'
    
    // Call Zapier Tables API to get all meeting records
    const response = await fetch(`https://api.zapier.com/v1/tables/${TABLE_ID}/records`, {
      headers: {
        'Authorization': `Bearer ${zapierApiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Zapier API error:', error)
      return c.json({ error: 'Failed to fetch from Zapier Tables', details: error }, response.status)
    }
    
    const data = await response.json()
    const meetings = data.records || []
    
    console.log(`📥 Fetched ${meetings.length} meetings from Zapier Tables`)
    
    // Store each meeting transcript in database
    let syncedCount = 0
    for (const meeting of meetings) {
      try {
        const recordId = meeting.id
        const fields = meeting.fields || {}
        
        // Extract fields from Zapier Tables
        const title = fields['Meeting Title'] || fields['title'] || 'Untitled Meeting'
        const transcript = fields['Full Transcript'] || fields['transcript'] || ''
        const summary = fields['Summary'] || fields['summary'] || ''
        const meetingUrl = fields['Meeting URL'] || fields['url'] || ''
        const ownerName = fields['Owner Name'] || fields['owner'] || ''
        const dateCreated = fields['Date Created'] || meeting.created_at || new Date().toISOString()
        
        // Check if already exists
        const existing = await c.env.DB.prepare(`
          SELECT id FROM otter_transcripts WHERE otter_id = ?
        `).bind(recordId).first()
        
        if (!existing) {
          // Insert new transcript
          await c.env.DB.prepare(`
            INSERT INTO otter_transcripts (
              otter_id, title, summary, start_time, end_time, 
              transcript_text, speakers, duration_seconds, 
              meeting_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(
            recordId,
            title,
            summary,
            dateCreated,
            dateCreated, // Use same date for end if not provided
            transcript,
            JSON.stringify([{ name: ownerName }]), // Store owner as speaker
            0, // Duration not available from Zapier
            meetingUrl
          ).run()
          
          syncedCount++
        } else {
          // Update existing transcript
          await c.env.DB.prepare(`
            UPDATE otter_transcripts 
            SET title = ?, summary = ?, transcript_text = ?, 
                meeting_url = ?, updated_at = CURRENT_TIMESTAMP
            WHERE otter_id = ?
          `).bind(
            title,
            summary,
            transcript,
            meetingUrl,
            recordId
          ).run()
        }
      } catch (error: any) {
        console.error(`Error syncing meeting ${meeting.id}:`, error)
      }
    }
    
    return c.json({ 
      success: true, 
      totalMeetings: meetings.length,
      newMeetings: syncedCount,
      message: `Synced ${syncedCount} new meetings from Zapier Tables`
    })
  } catch (error: any) {
    console.error('Error syncing Zapier transcripts:', error)
    return c.json({ error: 'Failed to sync Zapier transcripts', details: error.message }, 500)
  }
})

// Get all Otter transcripts
meetings.get('/otter/transcripts', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = parseInt(c.req.query('offset') || '0')
  const search = c.req.query('search') || ''
  
  try {
    let query = `
      SELECT 
        id, otter_id, title, summary, start_time, end_time,
        duration_seconds, meeting_url, created_at, updated_at,
        LENGTH(transcript_text) as transcript_length,
        speakers
      FROM otter_transcripts
    `
    const params: any[] = []
    
    if (search) {
      query += ` WHERE title LIKE ? OR summary LIKE ? OR transcript_text LIKE ?`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    
    query += ` ORDER BY start_time DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    // Get total count
    const countQuery = search 
      ? `SELECT COUNT(*) as total FROM otter_transcripts WHERE title LIKE ? OR summary LIKE ? OR transcript_text LIKE ?`
      : `SELECT COUNT(*) as total FROM otter_transcripts`
    const countParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []
    const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first()
    
    return c.json({ 
      transcripts: results || [],
      total: totalResult?.total || 0,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Error fetching Otter transcripts:', error)
    return c.json({ error: 'Failed to fetch transcripts', details: error.message }, 500)
  }
})

// Get single transcript with full text
meetings.get('/otter/transcripts/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const transcript = await c.env.DB.prepare(`
      SELECT * FROM otter_transcripts WHERE id = ?
    `).bind(id).first()
    
    if (!transcript) {
      return c.json({ error: 'Transcript not found' }, 404)
    }
    
    return c.json({ transcript })
  } catch (error: any) {
    console.error('Error fetching transcript:', error)
    return c.json({ error: 'Failed to fetch transcript', details: error.message }, 500)
  }
})

// Delete transcript
meetings.delete('/otter/transcripts/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    await c.env.DB.prepare(`
      DELETE FROM otter_transcripts WHERE id = ?
    `).bind(id).run()
    
    return c.json({ success: true, message: 'Transcript deleted' })
  } catch (error: any) {
    console.error('Error deleting transcript:', error)
    return c.json({ error: 'Failed to delete transcript', details: error.message }, 500)
  }
})

// Search transcripts (full-text search)
meetings.get('/otter/search', async (c) => {
  const query = c.req.query('q') || ''
  const limit = parseInt(c.req.query('limit') || '20')
  
  try {
    if (!query) {
      return c.json({ results: [] })
    }
    
    const { results } = await c.env.DB.prepare(`
      SELECT 
        id, otter_id, title, summary, start_time,
        substr(transcript_text, 1, 500) as transcript_preview
      FROM otter_transcripts
      WHERE title LIKE ? OR summary LIKE ? OR transcript_text LIKE ?
      ORDER BY start_time DESC
      LIMIT ?
    `).bind(`%${query}%`, `%${query}%`, `%${query}%`, limit).all()
    
    return c.json({ results: results || [] })
  } catch (error: any) {
    console.error('Error searching transcripts:', error)
    return c.json({ error: 'Failed to search transcripts', details: error.message }, 500)
  }
})

export default meetings
