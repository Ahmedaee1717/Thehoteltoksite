// Zoom Webhook & Meeting Bot Routes
import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  ZOOM_ACCOUNT_ID?: string
  ZOOM_CLIENT_ID?: string
  ZOOM_CLIENT_SECRET?: string
  ZOOM_WEBHOOK_SECRET_TOKEN?: string
  ZOOM_WEBHOOK_VERIFICATION_SECRET?: string
}

const zoomRoutes = new Hono<{ Bindings: Bindings }>()

// Helper function to create HMAC using Web Crypto API
async function createHmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ============================================
// POST /api/zoom/webhook
// Zoom Event Webhook Endpoint
// ============================================
zoomRoutes.post('/webhook', async (c) => {
  const { DB, ZOOM_WEBHOOK_SECRET_TOKEN, ZOOM_WEBHOOK_VERIFICATION_SECRET } = c.env
  
  try {
    // Get request body FIRST (before any logging)
    const body = await c.req.text()
    const payload = JSON.parse(body)
    
    // ============================================
    // STEP 1: HANDLE VALIDATION CHALLENGE IMMEDIATELY
    // ============================================
    if (payload.event === 'endpoint.url_validation') {
      const plainToken = payload.payload?.plainToken
      
      if (!plainToken) {
        console.error('❌ No plainToken in validation request')
        return c.json({ error: 'No plainToken provided' }, 400)
      }
      
      console.log('🔐 Validation request received')
      console.log('📝 Plain token:', plainToken)
      console.log('📋 All headers:', JSON.stringify(Object.fromEntries(c.req.raw.headers.entries())))
      
      // ============================================
      // OPTION 1: Custom Header Authentication (RECOMMENDED)
      // ============================================
      // Check if Zoom sent a custom header: x-zoom-webhook-secret OR zoom-webhook-secret
      const customSecret = c.req.header('x-zoom-webhook-secret') || c.req.header('zoom-webhook-secret')
      
      if (customSecret) {
        console.log('🔑 Custom header found:', customSecret.substring(0, 10) + '...')
        
        // Verify custom header matches our expected value
        const expectedCustomSecret = ZOOM_WEBHOOK_VERIFICATION_SECRET || 'md4m8ttp8hnoj846ew2e0zb5gstw46ut'
        
        if (customSecret === expectedCustomSecret) {
          console.log('✅ Custom header valid - generating encrypted token')
          const encryptedToken = await createHmacSha256(customSecret, plainToken)
          
          return c.json({
            plainToken: plainToken,
            encryptedToken: encryptedToken
          })
        } else {
          console.error('❌ Custom header mismatch!')
          console.error('Expected:', expectedCustomSecret.substring(0, 10) + '...')
          console.error('Received:', customSecret.substring(0, 10) + '...')
          return c.json({ error: 'Invalid custom header' }, 401)
        }
      }
      
      // ============================================
      // OPTION 2: Default Header Provided by Zoom
      // ============================================
      console.log('ℹ️  No custom header - checking for ZOOM_WEBHOOK_SECRET_TOKEN')
      
      const secret = ZOOM_WEBHOOK_SECRET_TOKEN
      
      if (!secret) {
        console.warn('⚠️  No ZOOM_WEBHOOK_SECRET_TOKEN configured')
        console.log('ℹ️  SOLUTION 1: Use Custom Header in Zoom:')
        console.log('     - Key: x-zoom-webhook-secret')
        console.log('     - Value: md4m8ttp8hnoj846ew2e0zb5gstw46ut')
        console.log('ℹ️  SOLUTION 2: Save subscription in Zoom first, copy Secret Token, then run:')
        console.log('     npx wrangler pages secret put ZOOM_WEBHOOK_SECRET_TOKEN')
        
        return c.json({ 
          error: 'No authentication configured. Use Custom Header or configure ZOOM_WEBHOOK_SECRET_TOKEN.'
        }, 401)
      }
      
      console.log('🔑 Using ZOOM_WEBHOOK_SECRET_TOKEN')
      
      // Create HMAC signature using Web Crypto API
      const encryptedToken = await createHmacSha256(secret, plainToken)
      
      console.log('✅ Encrypted token generated')
      
      // Return IMMEDIATELY with minimal response
      return c.json({
        plainToken: plainToken,
        encryptedToken: encryptedToken
      })
    }
    
    // Log after validation (don't slow down the response)
    console.log('📥 Zoom webhook received')
    console.log('🔍 Headers:', Object.fromEntries(c.req.raw.headers.entries()))
    console.log('📦 Webhook event type:', payload.event)
    
    // ============================================
    // STEP 2: VERIFY WEBHOOK SIGNATURE
    // ============================================
    const signature = c.req.header('x-zm-signature')
    const timestamp = c.req.header('x-zm-request-timestamp')
    
    if (signature && timestamp) {
      const message = `v0:${timestamp}:${body}`
      const secret = ZOOM_WEBHOOK_VERIFICATION_SECRET || 'md4m8ttp8hnoj846ew2e0zb5gstw46ut'
      const hash = await createHmacSha256(secret, message)
      const expectedSignature = `v0=${hash}`
      
      if (signature !== expectedSignature) {
        console.error('❌ Invalid webhook signature')
        return c.json({ error: 'Invalid signature' }, 401)
      }
      
      console.log('✅ Webhook signature verified')
    }
    
    // ============================================
    // STEP 3: HANDLE DIFFERENT EVENT TYPES
    // ============================================
    const event = payload.event
    
    switch (event) {
      case 'meeting.started':
        await handleMeetingStarted(DB, payload)
        break
        
      case 'meeting.ended':
        await handleMeetingEnded(DB, payload)
        break
        
      case 'meeting.participant_joined':
        await handleParticipantJoined(DB, payload)
        break
        
      case 'meeting.participant_left':
        await handleParticipantLeft(DB, payload)
        break
        
      case 'recording.completed':
        await handleRecordingCompleted(DB, payload)
        break
        
      case 'recording.transcript_completed':
        await handleTranscriptCompleted(DB, payload)
        break
        
      default:
        console.log('ℹ️ Unhandled event type:', event)
    }
    
    return c.json({ success: true, event })
    
  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// ============================================
// GET /api/zoom/meetings
// Get all meeting sessions
// ============================================
zoomRoutes.get('/meetings', async (c) => {
  const { DB } = c.env
  
  try {
    const meetings = await DB.prepare(`
      SELECT * FROM zoom_meeting_sessions 
      ORDER BY started_at DESC 
      LIMIT 50
    `).all()
    
    return c.json({ 
      success: true, 
      meetings: meetings.results || [] 
    })
  } catch (error: any) {
    console.error('Error fetching meetings:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// ============================================
// GET /api/zoom/meetings/:meetingId
// Get specific meeting details
// ============================================
zoomRoutes.get('/meetings/:meetingId', async (c) => {
  const { DB } = c.env
  const meetingId = c.req.param('meetingId')
  
  try {
    const meeting = await DB.prepare(`
      SELECT * FROM zoom_meeting_sessions 
      WHERE zoom_meeting_id = ?
    `).bind(meetingId).first()
    
    if (!meeting) {
      return c.json({ 
        success: false, 
        error: 'Meeting not found' 
      }, 404)
    }
    
    // Get participants
    const participants = await DB.prepare(`
      SELECT * FROM zoom_meeting_participants 
      WHERE session_id = ?
      ORDER BY joined_at
    `).bind(meeting.id).all()
    
    return c.json({ 
      success: true, 
      meeting,
      participants: participants.results || []
    })
  } catch (error: any) {
    console.error('Error fetching meeting:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// ============================================
// HELPER FUNCTIONS
// ============================================

async function handleMeetingStarted(DB: D1Database, payload: any) {
  console.log('🎬 Meeting started:', payload.payload?.object?.id)
  
  const meeting = payload.payload?.object
  const sessionId = `zoom_${meeting.id}_${Date.now()}`
  
  // Create meeting session record
  await DB.prepare(`
    INSERT INTO zoom_meeting_sessions (
      id, zoom_meeting_id, topic, host_id, start_time, status, created_at
    ) VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
  `).bind(
    sessionId,
    meeting.id,
    meeting.topic || 'Zoom Meeting',
    meeting.host_id,
    meeting.start_time
  ).run()
  
  console.log('✅ Meeting session created:', sessionId)
}

async function handleMeetingEnded(DB: D1Database, payload: any) {
  console.log('🏁 Meeting ended:', payload.payload?.object?.id)
  
  const meeting = payload.payload?.object
  
  // Update meeting session
  await DB.prepare(`
    UPDATE zoom_meeting_sessions 
    SET status = 'ended', end_time = ?, duration = ?
    WHERE zoom_meeting_id = ?
  `).bind(
    meeting.end_time,
    meeting.duration,
    meeting.id
  ).run()
  
  console.log('✅ Meeting session updated')
}

async function handleParticipantJoined(DB: D1Database, payload: any) {
  console.log('👋 Participant joined:', payload.payload?.object?.participant?.user_name)
  
  const participant = payload.payload?.object?.participant
  const meetingId = payload.payload?.object?.id
  
  // Find session
  const session = await DB.prepare(`
    SELECT id FROM zoom_meeting_sessions 
    WHERE zoom_meeting_id = ?
  `).bind(meetingId).first()
  
  if (!session) {
    console.error('❌ Session not found for meeting:', meetingId)
    return
  }
  
  // Create participant record
  const participantId = `part_${participant.id}_${Date.now()}`
  
  await DB.prepare(`
    INSERT INTO zoom_meeting_participants (
      id, session_id, participant_id, user_name, email, joined_at
    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    participantId,
    session.id,
    participant.id,
    participant.user_name,
    participant.email || null
  ).run()
  
  console.log('✅ Participant recorded:', participant.user_name)
}

async function handleParticipantLeft(DB: D1Database, payload: any) {
  console.log('👋 Participant left:', payload.payload?.object?.participant?.user_name)
  
  const participant = payload.payload?.object?.participant
  const meetingId = payload.payload?.object?.id
  
  // Update participant record
  await DB.prepare(`
    UPDATE zoom_meeting_participants 
    SET left_at = CURRENT_TIMESTAMP
    WHERE participant_id = ? 
    AND session_id IN (
      SELECT id FROM zoom_meeting_sessions WHERE zoom_meeting_id = ?
    )
  `).bind(participant.id, meetingId).run()
  
  console.log('✅ Participant updated:', participant.user_name)
}

async function handleRecordingCompleted(DB: D1Database, payload: any) {
  console.log('📹 Recording completed:', payload.payload?.object?.id)
  
  const recording = payload.payload?.object
  const meetingId = recording.meeting_id || recording.id
  
  // Store recording info
  await DB.prepare(`
    UPDATE zoom_meeting_sessions 
    SET recording_url = ?, recording_completed_at = CURRENT_TIMESTAMP
    WHERE zoom_meeting_id = ?
  `).bind(
    recording.recording_files?.[0]?.download_url || null,
    meetingId
  ).run()
  
  console.log('✅ Recording info stored')
}

async function handleTranscriptCompleted(DB: D1Database, payload: any) {
  console.log('📝 Transcript completed:', payload.payload?.object?.id)
  
  const transcript = payload.payload?.object
  const meetingId = transcript.meeting_id || transcript.id
  
  // Store transcript info
  await DB.prepare(`
    UPDATE zoom_meeting_sessions 
    SET transcript_url = ?, transcript_completed_at = CURRENT_TIMESTAMP
    WHERE zoom_meeting_id = ?
  `).bind(
    transcript.recording_files?.[0]?.download_url || null,
    meetingId
  ).run()
  
  console.log('✅ Transcript info stored')
}

export default zoomRoutes
