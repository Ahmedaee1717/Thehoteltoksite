import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/cloudflare'

const voice = new Hono<{ Bindings: CloudflareBindings }>()

// ===== VOICE-TO-EMAIL =====

// Start voice recording session
voice.post('/sessions/start', async (c) => {
  try {
    const { userEmail } = await c.req.json()
    
    if (!userEmail) {
      return c.json({ error: 'userEmail is required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO voice_to_email (
        user_email, status
      ) VALUES (?, 'recording')
    `).bind(userEmail).run()
    
    return c.json({
      success: true,
      sessionId: result.meta.last_row_id,
      status: 'recording',
      message: 'Voice recording session started'
    })
  } catch (error: any) {
    console.error('Error starting voice session:', error)
    return c.json({ error: 'Failed to start voice session', details: error.message }, 500)
  }
})

// Upload audio and transcribe
voice.post('/sessions/:id/upload', async (c) => {
  const sessionId = c.req.param('id')
  
  try {
    const { audioUrl, duration } = await c.req.json()
    
    if (!audioUrl) {
      return c.json({ error: 'audioUrl is required' }, 400)
    }
    
    // In production, this would:
    // 1. Download audio from URL
    // 2. Send to speech-to-text API (Whisper, Google Speech, etc.)
    // 3. Get transcription
    // 4. Store results
    
    // For demo, simulate transcription
    const mockTranscription = "Hi, I wanted to follow up on our meeting last week. Can we schedule another call next Tuesday at 2 PM? Thanks!"
    
    await c.env.DB.prepare(`
      UPDATE voice_to_email 
      SET audio_url = ?, 
          duration_seconds = ?,
          transcription = ?,
          status = 'transcribed',
          transcribed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(audioUrl, duration || 0, mockTranscription, sessionId).run()
    
    return c.json({
      success: true,
      transcription: mockTranscription,
      status: 'transcribed'
    })
  } catch (error: any) {
    console.error('Error uploading audio:', error)
    return c.json({ error: 'Failed to upload audio', details: error.message }, 500)
  }
})

// Convert transcription to email draft
voice.post('/sessions/:id/to-draft', async (c) => {
  const sessionId = c.req.param('id')
  
  try {
    // Get session
    const session = await c.env.DB.prepare(`
      SELECT * FROM voice_to_email WHERE id = ?
    `).bind(sessionId).first()
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }
    
    if (!session.transcription) {
      return c.json({ error: 'No transcription available' }, 400)
    }
    
    // In production, use AI to:
    // 1. Extract subject, recipients, body from transcription
    // 2. Format as proper email
    // 3. Generate AI suggestions
    
    // For demo, create simple draft
    const draft = {
      subject: 'Follow-up Meeting Request',
      body: session.transcription,
      to: '',
      from: session.user_email
    }
    
    // Update session
    await c.env.DB.prepare(`
      UPDATE voice_to_email 
      SET email_draft = ?,
          status = 'draft_created'
      WHERE id = ?
    `).bind(JSON.stringify(draft), sessionId).run()
    
    // Create draft in email_drafts table
    const draftResult = await c.env.DB.prepare(`
      INSERT INTO email_drafts (
        user_email, subject, body, recipients
      ) VALUES (?, ?, ?, ?)
    `).bind(
      session.user_email,
      draft.subject,
      draft.body,
      draft.to
    ).run()
    
    return c.json({
      success: true,
      draft,
      draftId: draftResult.meta.last_row_id,
      message: 'Email draft created from voice'
    })
  } catch (error: any) {
    console.error('Error creating draft:', error)
    return c.json({ error: 'Failed to create draft', details: error.message }, 500)
  }
})

// Get voice session
voice.get('/sessions/:id', async (c) => {
  const sessionId = c.req.param('id')
  
  try {
    const session = await c.env.DB.prepare(`
      SELECT * FROM voice_to_email WHERE id = ?
    `).bind(sessionId).first()
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }
    
    return c.json({ session })
  } catch (error: any) {
    console.error('Error fetching session:', error)
    return c.json({ error: 'Failed to fetch session', details: error.message }, 500)
  }
})

// Get user's voice sessions
voice.get('/sessions', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM voice_to_email
      WHERE user_email = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(userEmail).all()
    
    return c.json({ sessions: results || [] })
  } catch (error: any) {
    console.error('Error fetching sessions:', error)
    return c.json({ error: 'Failed to fetch sessions', details: error.message }, 500)
  }
})

// Delete voice session
voice.delete('/sessions/:id', async (c) => {
  const sessionId = c.req.param('id')
  
  try {
    await c.env.DB.prepare(`
      DELETE FROM voice_to_email WHERE id = ?
    `).bind(sessionId).run()
    
    return c.json({ 
      success: true, 
      message: 'Voice session deleted' 
    })
  } catch (error: any) {
    console.error('Error deleting session:', error)
    return c.json({ error: 'Failed to delete session', details: error.message }, 500)
  }
})

export default voice
