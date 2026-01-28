// Zoom Meeting Bot & OAuth Routes
import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  ZOOM_OAUTH_CLIENT_ID?: string
  ZOOM_OAUTH_CLIENT_SECRET?: string
  ZOOM_ACCOUNT_ID?: string
  ZOOM_CLIENT_ID?: string
  ZOOM_CLIENT_SECRET?: string
}

const meetingRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================
// ZOOM OAUTH FLOW
// ============================================

// Step 1: Redirect user to Zoom authorization
meetingRoutes.get('/oauth/authorize', async (c) => {
  const { ZOOM_OAUTH_CLIENT_ID } = c.env
  
  if (!ZOOM_OAUTH_CLIENT_ID) {
    return c.json({ error: 'OAuth not configured' }, 500)
  }
  
  const redirectUri = 'https://www.investaycapital.com/meetings/oauth/redirect'
  const state = Math.random().toString(36).substring(7)
  
  // Store state in session (for CSRF protection)
  // In production, use KV storage or signed cookies
  
  const authUrl = `https://zoom.us/oauth/authorize?` + new URLSearchParams({
    response_type: 'code',
    client_id: ZOOM_OAUTH_CLIENT_ID,
    redirect_uri: redirectUri,
    state: state
  }).toString()
  
  console.log('🔐 Redirecting to Zoom OAuth:', authUrl)
  
  return c.redirect(authUrl)
})

// Step 2: Handle OAuth callback
meetingRoutes.get('/oauth/redirect', async (c) => {
  const { ZOOM_OAUTH_CLIENT_ID, ZOOM_OAUTH_CLIENT_SECRET, DB } = c.env
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')
  
  if (error) {
    console.error('❌ OAuth error:', error)
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authorization Failed</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-900 text-white p-8">
        <div class="max-w-2xl mx-auto">
          <h1 class="text-3xl font-bold text-red-500 mb-4">❌ Authorization Failed</h1>
          <p class="text-gray-300">Error: ${error}</p>
          <a href="/meetings" class="mt-4 inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded">
            Try Again
          </a>
        </div>
      </body>
      </html>
    `)
  }
  
  if (!code) {
    return c.json({ error: 'No authorization code received' }, 400)
  }
  
  try {
    // Exchange code for access token
    const tokenUrl = 'https://zoom.us/oauth/token'
    const redirectUri = 'https://www.investaycapital.com/meetings/oauth/redirect'
    
    const basicAuth = btoa(`${ZOOM_OAUTH_CLIENT_ID}:${ZOOM_OAUTH_CLIENT_SECRET}`)
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }).toString()
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Token exchange failed:', errorText)
      throw new Error('Failed to exchange code for token')
    }
    
    const tokenData = await tokenResponse.json() as {
      access_token: string
      refresh_token: string
      expires_in: number
      scope: string
    }
    
    console.log('✅ Got access token:', tokenData.access_token.substring(0, 20) + '...')
    
    // Get user info
    const userResponse = await fetch('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })
    
    if (!userResponse.ok) {
      throw new Error('Failed to get user info')
    }
    
    const userData = await userResponse.json() as {
      id: string
      email: string
      first_name: string
      last_name: string
    }
    
    console.log('✅ Got user info:', userData.email)
    
    // Store tokens in database
    const userId = `zoom_user_${userData.id}`
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    
    await DB.prepare(`
      INSERT OR REPLACE INTO zoom_oauth_tokens (
        user_id, zoom_user_id, email, access_token, refresh_token, 
        expires_at, scope, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      userData.id,
      userData.email,
      tokenData.access_token,
      tokenData.refresh_token,
      expiresAt,
      tokenData.scope,
      now,
      now
    ).run()
    
    console.log('✅ Stored OAuth tokens for:', userData.email)
    
    // Redirect to meetings dashboard
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authorization Success</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-900 text-white p-8">
        <div class="max-w-2xl mx-auto">
          <h1 class="text-3xl font-bold text-green-500 mb-4">✅ Authorization Successful!</h1>
          <p class="text-gray-300 mb-4">Welcome, ${userData.first_name} ${userData.last_name}</p>
          <p class="text-gray-400 mb-6">Email: ${userData.email}</p>
          <p class="text-gray-300 mb-6">The AI Meeting Bot can now access your meetings for transcription and translation.</p>
          <a href="/meetings/dashboard" class="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-medium">
            Go to Meeting Dashboard →
          </a>
        </div>
      </body>
      </html>
    `)
    
  } catch (error: any) {
    console.error('❌ OAuth callback error:', error)
    return c.json({ 
      error: 'OAuth callback failed',
      message: error.message 
    }, 500)
  }
})

// ============================================
// MEETING APIs
// ============================================

// Get list of meetings for authenticated user
meetingRoutes.get('/api/meetings', async (c) => {
  const { DB } = c.env
  
  try {
    // Get meetings from our database (from webhooks)
    const meetings = await DB.prepare(`
      SELECT 
        m.*,
        (SELECT COUNT(*) FROM zoom_meeting_participants p WHERE p.session_id = m.id) as participant_count
      FROM zoom_meeting_sessions m
      ORDER BY m.start_time DESC
      LIMIT 50
    `).all()
    
    return c.json({
      success: true,
      meetings: meetings.results || []
    })
  } catch (error: any) {
    console.error('❌ Error fetching meetings:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// Get specific meeting details
meetingRoutes.get('/api/meetings/:meetingId', async (c) => {
  const { DB } = c.env
  const meetingId = c.req.param('meetingId')
  
  try {
    // Get meeting details
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
    
    // Get transcript chunks (if any)
    const transcripts = await DB.prepare(`
      SELECT * FROM zoom_transcript_chunks
      WHERE session_id = ?
      ORDER BY timestamp_ms
    `).bind(meeting.id).all()
    
    return c.json({
      success: true,
      meeting,
      participants: participants.results || [],
      transcripts: transcripts.results || []
    })
  } catch (error: any) {
    console.error('❌ Error fetching meeting:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// Get meeting recording and transcript from Zoom API
meetingRoutes.get('/api/meetings/:meetingId/recording', async (c) => {
  const { DB } = c.env
  const meetingId = c.req.param('meetingId')
  
  try {
    // Get OAuth token for any authorized user
    const tokenRecord = await DB.prepare(`
      SELECT * FROM zoom_oauth_tokens
      WHERE expires_at > datetime('now')
      ORDER BY created_at DESC
      LIMIT 1
    `).first() as any
    
    if (!tokenRecord) {
      return c.json({
        success: false,
        error: 'No authorized user found. Please authorize first.'
      }, 401)
    }
    
    // Get recording from Zoom API
    const recordingResponse = await fetch(
      `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
      {
        headers: {
          'Authorization': `Bearer ${tokenRecord.access_token}`
        }
      }
    )
    
    if (!recordingResponse.ok) {
      const errorText = await recordingResponse.text()
      console.error('❌ Failed to get recording:', errorText)
      throw new Error('Failed to get recording from Zoom')
    }
    
    const recordingData = await recordingResponse.json()
    
    return c.json({
      success: true,
      recording: recordingData
    })
  } catch (error: any) {
    console.error('❌ Error fetching recording:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default meetingRoutes
