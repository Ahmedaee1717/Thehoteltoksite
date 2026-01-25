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

// ===== ZAPIER WEBHOOK RECEIVER (Real-time Otter.ai → Zapier → Cloudflare) =====

// Helper function to extract speakers from transcript
function extractSpeakers(transcript: string): any[] {
  const speakers: Set<string> = new Set()
  
  // Pattern 1: "Speaker Name  00:00" format (Otter.ai style)
  const pattern1 = /^([A-Za-z][A-Za-z\s]+?)\s+\d{1,2}:\d{2}/gm
  let match
  while ((match = pattern1.exec(transcript)) !== null) {
    const name = match[1].trim()
    if (name.length > 1 && name.length < 50) {
      speakers.add(name)
    }
  }
  
  // Pattern 2: "Speaker Name:" format
  const pattern2 = /^([A-Za-z][A-Za-z\s]+?):/gm
  while ((match = pattern2.exec(transcript)) !== null) {
    const name = match[1].trim()
    if (name.length > 1 && name.length < 50 && !name.match(/^(SUMMARY|SPEAKERS|TRANSCRIPT|KEYWORDS)/i)) {
      speakers.add(name)
    }
  }
  
  // Pattern 3: Extract from "SPEAKERS" section
  const speakersSection = transcript.match(/SPEAKERS\s*[:\n]+(.*?)(?=\n\n|TRANSCRIPT|##|$)/is)
  if (speakersSection) {
    const speakerNames = speakersSection[1].split(/[,\n]/).map(s => s.trim()).filter(s => s && s.length > 1 && s.length < 50)
    speakerNames.forEach(name => speakers.add(name))
  }
  
  return Array.from(speakers).map(name => ({ name }))
}

// Helper function to generate AI summary (simplified - can be enhanced with actual AI later)
/**
 * Generate OTTER-LEVEL AI-powered summary using OpenAI GPT-4
 * 
 * This generates:
 * - Detailed multi-paragraph summary
 * - Key discussion points
 * - Decisions made
 * - Action items with owners
 * - Next steps
 */
async function generateAISummary(transcript: string, apiKey?: string): Promise<string> {
  if (!apiKey) {
    console.warn('⚠️ OPENAI_API_KEY not configured - using fallback summary')
    return transcript.substring(0, 200).replace(/\s+/g, ' ') + '...'
  }

  try {
    // Limit transcript to 12000 characters for API (more context = better analysis)
    const truncatedTranscript = transcript.substring(0, 12000)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert meeting analyst. Generate comprehensive, professional meeting summaries similar to Otter.ai.

Your summary MUST include:

1. **Overview** (2-3 sentences): High-level meeting purpose and outcome

2. **Key Discussion Points** (bullet points):
   - Main topics discussed
   - Important details mentioned
   - Context and background

3. **Decisions Made** (if any):
   - Explicit decisions reached
   - Who made the decision
   - Rationale if provided

4. **Action Items** (format: "• [Action] - @[Owner]"):
   - Specific tasks mentioned
   - Who is responsible
   - Any deadlines mentioned

5. **Next Steps**:
   - Follow-up meetings
   - Deliverables
   - Timeline

Format clearly with headers. Be specific and detailed. Extract ALL actionable items.`
          },
          {
            role: 'user',
            content: `Analyze this meeting transcript and provide a comprehensive summary:\n\n${truncatedTranscript}`
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const summary = data.choices[0].message.content.trim()
    console.log('✨ AI-generated Otter-level summary:', summary.substring(0, 150) + '...')
    return summary
  } catch (error: any) {
    console.error('❌ Error generating AI summary:', error.message)
    // Fallback to first 200 chars
    return transcript.substring(0, 200).replace(/\s+/g, ' ') + '...'
  }
}

function generateSummary(transcript: string, existingSummary: string): string {
  if (existingSummary && existingSummary.length > 10) {
    return existingSummary
  }
  
  // Extract keywords section if available
  const keywordsMatch = transcript.match(/SUMMARY\s*[:\n]*KEYWORDS\s*[:\n]+(.*?)(?=\n\n|SPEAKERS|$)/is)
  if (keywordsMatch) {
    return keywordsMatch[1].trim().replace(/\s+/g, ' ').substring(0, 2000)
  }
  
  // Fallback: Extract first 200 characters of actual transcript content
  const transcriptStart = transcript.indexOf('TRANSCRIPT')
  if (transcriptStart !== -1) {
    const content = transcript.substring(transcriptStart + 10).trim()
    const firstSentences = content.substring(0, 500).replace(/\s+/g, ' ')
    return `Meeting discussion covering: ${firstSentences.substring(0, 200)}...`
  }
  
  // Final fallback
  return transcript.substring(0, 200).replace(/\s+/g, ' ') + '...'
}

// Webhook endpoint to receive new meetings from Zapier in real-time
meetings.post('/webhook/zapier', async (c) => {
  try {
    console.log('📥 Zapier webhook received!')
    
    const data = await c.req.json()
    console.log('Webhook data:', data)
    
    // Extract fields from Zapier webhook payload
    const recordId = data.id || `zapier_${Date.now()}`
    const title = data.title || data.f1 || 'Untitled Meeting'
    const transcript = data.transcript || data.f2 || ''
    let summary = data.summary || data.f3 || ''
    const meetingUrl = data.meeting_url || data.f4 || ''
    const ownerName = data.owner_name || data.f5 || ''
    const dateCreated = data.date_created || data.f6 || data.created_at || new Date().toISOString()
    
    console.log(`📝 Processing meeting: "${title}"`)
    
    // Extract speakers from transcript
    const speakers = extractSpeakers(transcript)
    console.log(`🎤 Extracted ${speakers.length} speakers:`, speakers.map(s => s.name).join(', '))
    
    // If no speakers found, fall back to owner
    if (speakers.length === 0 && ownerName) {
      speakers.push({ name: ownerName })
    }
    
    // Generate AI summary if not provided
    if (!summary || summary.length < 10) {
      summary = await generateAISummary(transcript, c.env.OPENAI_API_KEY)
    }
    console.log(`📄 Summary: ${summary.substring(0, 100)}...`)
    
    // Check if already exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM otter_transcripts WHERE otter_id = ?
    `).bind(recordId).first()
    
    if (!existing) {
      // Insert new transcript
      const result = await c.env.DB.prepare(`
        INSERT INTO otter_transcripts (
          otter_id, title, summary, start_time, end_time, 
          transcript_text, speakers, duration_seconds, 
          meeting_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        recordId,
        title,
        summary,
        dateCreated,
        dateCreated, // Use same date for end if not provided
        transcript,
        JSON.stringify(speakers),
        0, // Duration not available from Zapier
        meetingUrl
      ).run()
      
      console.log(`✅ New meeting saved! ID: ${result.meta.last_row_id}`)
      
      return c.json({ 
        success: true, 
        message: 'Meeting transcript saved successfully',
        id: result.meta.last_row_id,
        title: title,
        speakers: speakers,
        summary: summary
      })
    } else {
      // Update existing transcript
      await c.env.DB.prepare(`
        UPDATE otter_transcripts 
        SET title = ?, summary = ?, transcript_text = ?, 
            speakers = ?, meeting_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE otter_id = ?
      `).bind(
        title,
        summary,
        transcript,
        JSON.stringify(speakers),
        meetingUrl,
        recordId
      ).run()
      
      console.log(`🔄 Meeting updated! Record ID: ${recordId}`)
      
      return c.json({ 
        success: true, 
        message: 'Meeting transcript updated successfully',
        title: title,
        speakers: speakers,
        summary: summary
      })
    }
  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to process webhook', 
      details: error.message 
    }, 500)
  }
})

// ===== ZAPIER TABLES INTEGRATION (Manual Sync - Backup Method) =====

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

// ===== PDF PARSING FOR MANUAL UPLOAD =====

// Parse PDF transcript and extract meeting details
meetings.post('/parse-pdf', async (c) => {
  try {
    const formData = await c.req.formData()
    const pdfFile = formData.get('pdf')
    
    if (!pdfFile || !(pdfFile instanceof File)) {
      return c.json({ error: 'No PDF file provided' }, 400)
    }
    
    // Save PDF temporarily
    const pdfBytes = await pdfFile.arrayBuffer()
    const tempPath = `/tmp/upload_${Date.now()}.pdf`
    
    // Use Python script to extract PDF (better than manual parsing)
    // For now, do basic extraction as Python execution in Workers is complex
    
    try {
      // Convert bytes to text (basic extraction)
      const decoder = new TextDecoder('utf-8', { fatal: false })
      let text = decoder.decode(pdfBytes)
      
      // Clean up text
      text = text
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      // If text is garbled (binary), return error
      if (text.length < 100 || text.includes('%PDF')) {
        return c.json({
          success: false,
          error: 'PDF contains binary data that cannot be extracted directly. Please copy and paste the text manually.',
          message: 'PDF parsing failed - please use manual entry'
        }, 200)
      }
      
      // Extract title
      let title = pdfFile.name.replace('.pdf', '').replace(/_/g, ' ')
      const titleMatch = text.match(/([A-Z][\w\s]{5,80}?)(?:\n|Mon,|Tue,|Wed,|Thu,|Fri,)/i)
      if (titleMatch) {
        title = titleMatch[1].trim()
      }
      
      // Extract date
      let date = ''
      const dateMatch = text.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\w+\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}[AP]M/i)
      if (dateMatch) {
        try {
          const parsedDate = new Date(dateMatch[0])
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate.toISOString().slice(0, 16)
          }
        } catch (e) {}
      }
      
      // Extract summary
      let summary = ''
      const summaryMatch = text.match(/SUMMARY[:\s]*KEYWORDS([\s\S]{50,1000}?)(?:SPEAKERS|$)/i)
      if (summaryMatch) {
        summary = summaryMatch[1].trim().replace(/\s+/g, ' ')
      }
      
      // Extract speakers
      let owner = ''
      const speakersMatch = text.match(/SPEAKERS([\s\S]{10,200}?)(?:\n\n|##|$)/i)
      if (speakersMatch) {
        const speakers = speakersMatch[1].split(/[,\n]/).map(s => s.trim()).filter(s => s && s.length > 2)
        if (speakers.length > 0) {
          owner = speakers[0]
        }
      }
      
      return c.json({
        success: true,
        title: title.substring(0, 200),
        transcript: text.substring(0, 100000),
        summary: summary.substring(0, 2000),
        owner: owner.substring(0, 100),
        date: date,
        message: 'PDF text extracted. Please review and edit before uploading.'
      })
      
    } catch (parseError: any) {
      console.error('PDF parse error:', parseError)
      return c.json({
        success: false,
        error: 'Failed to parse PDF. Please copy and paste the text manually.',
        details: parseError.message
      }, 200)
    }
    
  } catch (error: any) {
    console.error('PDF upload error:', error)
    return c.json({
      success: false,
      error: 'Failed to process PDF file',
      details: error.message
    }, 500)
  }
})

// ===== UNIVERSAL FILE PARSING (TXT, DOCX, PDF) =====

// Parse transcript file and extract meeting details
meetings.post('/parse-file', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file')
    
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file provided' }, 400)
    }
    
    const fileName = file.name.toLowerCase()
    let text = ''
    
    // TXT file - direct text reading
    if (fileName.endsWith('.txt')) {
      text = await file.text()
    }
    // DOCX file - needs parsing (simplified - return error for now)
    else if (fileName.endsWith('.docx')) {
      return c.json({
        success: false,
        error: 'DOCX parsing requires backend processing. Please convert to TXT or copy/paste manually.',
        message: 'DOCX not supported yet - use TXT or manual entry'
      }, 200)
    }
    // PDF file - basic extraction
    else if (fileName.endsWith('.pdf')) {
      const pdfBytes = await file.arrayBuffer()
      const decoder = new TextDecoder('utf-8', { fatal: false })
      text = decoder.decode(pdfBytes)
      
      // Clean up PDF text
      text = text
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      // If text is garbled (binary), return error
      if (text.length < 100 || text.includes('%PDF')) {
        return c.json({
          success: false,
          error: 'PDF contains binary data that cannot be extracted directly. Please copy and paste the text manually.',
          message: 'PDF parsing failed - please use manual entry'
        }, 200)
      }
    }
    else {
      return c.json({ error: 'Unsupported file type. Please use TXT, DOCX, or PDF.' }, 400)
    }
    
    // Extract metadata from text
    let title = file.name.replace(/\.(txt|docx|pdf)$/i, '').replace(/_/g, ' ')
    const titleMatch = text.match(/([A-Z][\w\s&]{5,80}?)(?:\n|Mon,|Tue,|Wed,|Thu,|Fri,)/i)
    if (titleMatch) {
      title = titleMatch[1].trim()
    }
    
    // Extract date
    let date = ''
    const dateMatch = text.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\w+\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}\s*[AP]M/i)
    if (dateMatch) {
      try {
        const parsedDate = new Date(dateMatch[0])
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString().slice(0, 16)
        }
      } catch (e) {}
    }
    
    // Extract summary (or generate with AI if not present)
    let summary = ''
    const summaryMatch = text.match(/SUMMARY\s*[:\n]*KEYWORDS\s*[:\n]+(.*?)(?=\n\n|SPEAKERS|$)/is)
    if (summaryMatch) {
      summary = summaryMatch[1].trim().replace(/\s+/g, ' ')
    } else {
      // Generate AI summary if none found in the file
      summary = await generateAISummary(text, c.env.OPENAI_API_KEY)
    }
    
    // Extract speakers/owner
    let owner = ''
    const speakersMatch = text.match(/SPEAKERS\s*[:\n]+(.*?)(?=\n\n|TRANSCRIPT|##|$)/is)
    if (speakersMatch) {
      const speakers = speakersMatch[1].split(/[,\n]/).map(s => s.trim()).filter(s => s && s.length > 2 && s.length < 50)
      if (speakers.length > 0) {
        owner = speakers[0]
      }
    }
    
    return c.json({
      success: true,
      title: title.substring(0, 200),
      transcript: text.substring(0, 100000),
      summary: summary.substring(0, 2000),
      owner: owner.substring(0, 100),
      date: date,
      message: 'File text extracted. Please review and edit before uploading.'
    })
    
  } catch (error: any) {
    console.error('File upload error:', error)
    return c.json({
      success: false,
      error: 'Failed to process file',
      details: error.message
    }, 500)
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

// Create/upload new meeting transcript
meetings.post('/otter/transcripts', async (c) => {
  try {
    const body = await c.req.json()
    const { 
      title, 
      transcript_text, 
      summary = '', 
      meeting_url = '', 
      owner_name = 'Unknown',
      date_created,
      speakers: providedSpeakers
    } = body
    
    if (!title || !transcript_text) {
      return c.json({ 
        success: true,
        error: 'Title and transcript_text are required' 
      }, 400)
    }
    
    // Generate unique otter_id
    const otterId = `ott_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Parse date or use current time
    const startTime = date_created ? new Date(date_created).toISOString() : new Date().toISOString()
    
    // Calculate duration from transcript length (rough estimate: 150 words per minute)
    const wordCount = transcript_text.split(/\s+/).length
    const durationSeconds = Math.ceil((wordCount / 150) * 60)
    
    // Auto-extract speakers from transcript format: "Speaker Name 0:00" OR "Speaker Name (Role):"
    const extractSpeakers = (text: string): string => {
      const speakersSet = new Set<string>()
      
      // Pattern 1: "Speaker Name 0:00" or "Speaker Name 0:00:00"
      const timestampPattern = /^([^\d\n]+?)\s+\d+:\d+(?::\d+)?$/gm
      let match
      
      while ((match = timestampPattern.exec(text)) !== null) {
        const name = match[1].trim()
        if (name && name.length > 1 && name.length < 100) {
          // Remove role/title in parentheses if present
          const cleanName = name.replace(/\s*\([^)]+\)\s*:?$/, '').trim()
          if (cleanName.length > 1) {
            speakersSet.add(cleanName)
          }
        }
      }
      
      // Pattern 2: "Speaker Name (Role):" or "Speaker Name:"
      const colonPattern = /^([A-Z][^\n:]+?)(?:\s*\([^)]+\))?\s*:/gm
      
      while ((match = colonPattern.exec(text)) !== null) {
        const name = match[1].trim()
        if (name && name.length > 1 && name.length < 100) {
          // Remove role/title in parentheses if present
          const cleanName = name.replace(/\s*\([^)]+\)\s*$/, '').trim()
          // Exclude common headers
          if (cleanName.length > 1 && !cleanName.match(/^(SPEAKERS?|TRANSCRIPT|SUMMARY|NOTE|MEETING)/i)) {
            speakersSet.add(cleanName)
          }
        }
      }
      
      if (speakersSet.size > 0) {
        const speakersArray = Array.from(speakersSet).map(name => ({ name }))
        return JSON.stringify(speakersArray)
      }
      
      // Fallback: check for SPEAKERS section
      const speakersMatch = text.match(/SPEAKERS\s*[:\n]+(.*?)(?=\n\n|TRANSCRIPT|$)/is)
      if (speakersMatch) {
        const names = speakersMatch[1].trim().split(/,\s*/)
        return JSON.stringify(names.map(name => ({ name: name.trim() })))
      }
      
      // Last fallback: owner_name
      if (owner_name && owner_name !== 'Unknown') {
        return JSON.stringify([{ name: owner_name }])
      }
      
      return JSON.stringify([{ name: 'Unknown' }])
    }
    
    // Use provided speakers if available, otherwise auto-extract from transcript
    let speakers: string
    if (providedSpeakers && typeof providedSpeakers === 'string' && providedSpeakers.length > 0) {
      // Frontend already extracted speakers as JSON string
      speakers = providedSpeakers
    } else {
      // Auto-extract speakers from transcript
      speakers = extractSpeakers(transcript_text)
    }
    
    // Insert into database (id is auto-increment INTEGER)
    const result = await c.env.DB.prepare(`
      INSERT INTO otter_transcripts (
        otter_id, title, summary, start_time, end_time,
        duration_seconds, meeting_url, transcript_text, speakers,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      otterId,
      title,
      summary,
      startTime,
      startTime, // Same as start_time for now
      durationSeconds,
      meeting_url,
      transcript_text,
      speakers,
      startTime,
      startTime
    ).run()
    
    return c.json({ 
      success: true, 
      id: result.meta.last_row_id,
      message: 'Meeting transcript uploaded successfully' 
    })
  } catch (error: any) {
    console.error('Error uploading transcript:', error)
    return c.json({ 
      success: false,
      error: 'Failed to upload transcript', 
      details: error.message 
    }, 500)
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

// Update transcript (e.g., speakers, summary, etc.)
meetings.put('/otter/transcripts/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const body = await c.req.json()
    const { speakers, title, summary, transcript_text, meeting_url } = body
    
    // Build UPDATE query dynamically based on provided fields
    const updates: string[] = []
    const params: any[] = []
    
    if (speakers !== undefined) {
      updates.push('speakers = ?')
      params.push(speakers)
    }
    if (title !== undefined) {
      updates.push('title = ?')
      params.push(title)
    }
    if (summary !== undefined) {
      updates.push('summary = ?')
      params.push(summary)
    }
    if (transcript_text !== undefined) {
      updates.push('transcript_text = ?')
      params.push(transcript_text)
    }
    if (meeting_url !== undefined) {
      updates.push('meeting_url = ?')
      params.push(meeting_url)
    }
    
    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400)
    }
    
    // Always update updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(id)
    
    const query = `
      UPDATE otter_transcripts 
      SET ${updates.join(', ')}
      WHERE id = ?
    `
    
    await c.env.DB.prepare(query).bind(...params).run()
    
    return c.json({ success: true, message: 'Transcript updated successfully' })
  } catch (error: any) {
    console.error('Error updating transcript:', error)
    return c.json({ success: false, error: 'Failed to update transcript', details: error.message }, 500)
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
