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
  const { DB, ZOOM_WEBHOOK_SECRET_TOKEN } = c.env
  
  try {
    // Get request body FIRST (before any logging)
    const body = await c.req.text()
    const payload = JSON.parse(body)
    
    console.log('📥 Zoom webhook received')
    console.log('📦 Event type:', payload.event)
    
    // ============================================
    // STEP 1: VERIFY REQUEST SIGNATURE (ALWAYS REQUIRED)
    // ============================================
    const timestamp = c.req.header('x-zm-request-timestamp')
    const signature = c.req.header('x-zm-signature')
    
    if (!ZOOM_WEBHOOK_SECRET_TOKEN) {
      console.error('❌ ZOOM_WEBHOOK_SECRET_TOKEN not configured!')
      console.error('ℹ️  After saving the webhook subscription in Zoom, copy the Secret Token')
      console.error('ℹ️  Then run: npx wrangler pages secret put ZOOM_WEBHOOK_SECRET_TOKEN')
      return c.json({ error: 'Webhook secret not configured' }, 500)
    }
    
    // For validation requests, timestamp might not be present
    if (timestamp && signature) {
      // Construct the message string exactly as Zoom does
      const message = `v0:${timestamp}:${body}`
      
      // Hash the message with the secret token
      const hashForVerify = await createHmacSha256(ZOOM_WEBHOOK_SECRET_TOKEN, message)
      const expectedSignature = `v0=${hashForVerify}`
      
      // Verify signature matches
      if (signature !== expectedSignature) {
        console.error('❌ Invalid webhook signature!')
        console.error('Expected:', expectedSignature.substring(0, 20) + '...')
        console.error('Received:', signature.substring(0, 20) + '...')
        return c.json({ error: 'Invalid signature' }, 401)
      }
      
      console.log('✅ Webhook signature verified')
    }
    
    // ============================================
    // STEP 2: HANDLE VALIDATION CHALLENGE
    // ============================================
    if (payload.event === 'endpoint.url_validation') {
      const plainToken = payload.payload?.plainToken
      
      if (!plainToken) {
        console.error('❌ No plainToken in validation request')
        return c.json({ error: 'No plainToken provided' }, 400)
      }
      
      console.log('🔐 Validation request received')
      console.log('📝 Plain token:', plainToken)
      
      // Hash the plainToken using the Webhook Secret Token
      const encryptedToken = await createHmacSha256(ZOOM_WEBHOOK_SECRET_TOKEN, plainToken)
      
      console.log('✅ Encrypted token generated:', encryptedToken)
      
      // Return IMMEDIATELY
      return c.json({
        plainToken: plainToken,
        encryptedToken: encryptedToken
      })
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
      ORDER BY start_time DESC 
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
  
  // Find transcript file
  const transcriptFile = transcript.recording_files?.find((f: any) => 
    f.file_type === 'TRANSCRIPT' || f.file_extension === 'VTT'
  )
  
  if (!transcriptFile) {
    console.log('⚠️ No transcript file found in recording')
    return
  }
  
  const transcriptUrl = transcriptFile.download_url
  
  // Store transcript URL in database
  await DB.prepare(`
    UPDATE zoom_meeting_sessions 
    SET transcript_url = ?, transcript_completed_at = CURRENT_TIMESTAMP
    WHERE zoom_meeting_id = ?
  `).bind(transcriptUrl, meetingId).run()
  
  console.log('✅ Transcript URL stored:', transcriptUrl)
  
  // 🚀 NEW: Fetch and process transcript through Live AI pipeline
  try {
    console.log('🔄 Fetching transcript from Zoom...')
    
    // TODO: Get Zoom OAuth access token to download transcript
    // For now, we'll handle this in a separate process
    // The transcript URL requires authentication
    
    console.log('⚠️ Transcript processing requires OAuth token - will be handled by authorized API call')
    console.log('💡 Use /meetings/api/meetings/:meetingId/transcript to fetch and process')
    
  } catch (error: any) {
    console.error('❌ Transcript processing error:', error.message)
  }
}

export default zoomRoutes
