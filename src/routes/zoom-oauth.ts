import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/cloudflare'

const zoomOAuth = new Hono<{ Bindings: CloudflareBindings }>()

// ===== ZOOM OAUTH FLOW =====

// Step 1: Redirect user to Zoom OAuth authorization page
zoomOAuth.get('/authorize', (c) => {
  const clientId = c.env.ZOOM_OAUTH_CLIENT_ID
  const redirectUri = 'https://www.investaycapital.com/api/zoom-oauth/callback'
  const state = crypto.randomUUID() // CSRF protection
  
  const authUrl = new URL('https://zoom.us/oauth/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)
  
  return c.redirect(authUrl.toString())
})

// Step 2: Handle OAuth callback from Zoom
zoomOAuth.get('/callback', async (c) => {
  try {
    const code = c.req.query('code')
    const state = c.req.query('state')
    const error = c.req.query('error')
    
    if (error) {
      return c.html(`
        <html>
          <body>
            <h1>Authorization Failed</h1>
            <p>Error: ${error}</p>
            <a href="/api/zoom-oauth/authorize">Try Again</a>
          </body>
        </html>
      `)
    }
    
    if (!code) {
      return c.html(`
        <html>
          <body>
            <h1>Authorization Failed</h1>
            <p>No authorization code received</p>
            <a href="/api/zoom-oauth/authorize">Try Again</a>
          </body>
        </html>
      `)
    }
    
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${c.env.ZOOM_OAUTH_CLIENT_ID}:${c.env.ZOOM_OAUTH_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://www.investaycapital.com/api/zoom-oauth/callback'
      })
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return c.html(`
        <html>
          <body>
            <h1>Token Exchange Failed</h1>
            <p>Could not exchange authorization code for access token</p>
            <pre>${errorText}</pre>
            <a href="/api/zoom-oauth/authorize">Try Again</a>
          </body>
        </html>
      `)
    }
    
    const tokenData = await tokenResponse.json()
    
    // Get user info
    const userResponse = await fetch('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error('User info fetch failed:', errorText)
      return c.html(`
        <html>
          <body>
            <h1>User Info Fetch Failed</h1>
            <p>Could not fetch user information</p>
            <pre>${errorText}</pre>
          </body>
        </html>
      `)
    }
    
    const userData = await userResponse.json()
    
    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
    
    // Store tokens in database
    await c.env.DB.prepare(`
      INSERT INTO zoom_oauth_tokens (
        user_id, zoom_user_id, email, access_token, refresh_token,
        expires_at, scope, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        expires_at = excluded.expires_at,
        scope = excluded.scope,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      userData.id,
      userData.id,
      userData.email,
      tokenData.access_token,
      tokenData.refresh_token,
      expiresAt,
      tokenData.scope
    ).run()
    
    console.log('✅ Zoom OAuth successful for user:', userData.email)
    
    return c.html(`
      <html>
        <head>
          <title>Zoom Authorization Successful</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 flex items-center justify-center min-h-screen">
          <div class="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
            <div class="mb-4">
              <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-800 mb-4">Authorization Successful! ✅</h1>
            <p class="text-gray-600 mb-2">Your Zoom account has been connected:</p>
            <p class="text-lg font-semibold text-blue-600 mb-6">${userData.email}</p>
            <div class="space-y-3">
              <a href="/meetings-dashboard" class="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                Go to Meetings Dashboard
              </a>
              <button onclick="window.close()" class="block w-full text-gray-600 hover:text-gray-800">
                Close Window
              </button>
            </div>
          </div>
        </body>
      </html>
    `)
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return c.html(`
      <html>
        <body>
          <h1>Authorization Error</h1>
          <p>${error.message}</p>
          <a href="/api/zoom-oauth/authorize">Try Again</a>
        </body>
      </html>
    `)
  }
})

// Helper: Get valid access token (refresh if expired)
async function getValidAccessToken(c: any, userEmail: string): Promise<string | null> {
  // Get stored token
  const tokenData = await c.env.DB.prepare(`
    SELECT * FROM zoom_oauth_tokens WHERE email = ?
  `).bind(userEmail).first()
  
  if (!tokenData) {
    return null
  }
  
  // Check if token is expired
  const expiresAt = new Date(tokenData.expires_at as string)
  const now = new Date()
  
  // If token expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('🔄 Token expired or expiring soon, refreshing...')
    
    const refreshResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${c.env.ZOOM_OAUTH_CLIENT_ID}:${c.env.ZOOM_OAUTH_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token as string
      })
    })
    
    if (!refreshResponse.ok) {
      console.error('Token refresh failed')
      return null
    }
    
    const newTokenData = await refreshResponse.json()
    const newExpiresAt = new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString()
    
    // Update tokens in database
    await c.env.DB.prepare(`
      UPDATE zoom_oauth_tokens
      SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `).bind(
      newTokenData.access_token,
      newTokenData.refresh_token,
      newExpiresAt,
      userEmail
    ).run()
    
    console.log('✅ Token refreshed successfully')
    return newTokenData.access_token
  }
  
  return tokenData.access_token as string
}

// ===== ZOOM MEETINGS API =====

// Get all meetings for user
zoomOAuth.get('/meetings', async (c) => {
  try {
    const userEmail = c.req.query('userEmail') || 'ahmed.enin@virgingates.com'
    const type = c.req.query('type') || 'scheduled' // scheduled, live, upcoming, previous
    
    const accessToken = await getValidAccessToken(c, userEmail)
    if (!accessToken) {
      return c.json({ error: 'Not authorized. Please connect your Zoom account first.' }, 401)
    }
    
    // Fetch meetings from Zoom API
    const meetingsResponse = await fetch(`https://api.zoom.us/v2/users/me/meetings?type=${type}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!meetingsResponse.ok) {
      const errorText = await meetingsResponse.text()
      console.error('Failed to fetch meetings:', errorText)
      return c.json({ error: 'Failed to fetch meetings from Zoom', details: errorText }, meetingsResponse.status)
    }
    
    const meetingsData = await meetingsResponse.json()
    
    // Merge with our database data
    const { results: dbMeetings } = await c.env.DB.prepare(`
      SELECT 
        session_id, meeting_id, topic, host_email, start_time, end_time, 
        duration_minutes, status, participant_count
      FROM zoom_meeting_sessions
      ORDER BY start_time DESC
      LIMIT 50
    `).all()
    
    return c.json({
      zoomMeetings: meetingsData.meetings || [],
      dbMeetings: dbMeetings || [],
      total: meetingsData.total_records || 0
    })
  } catch (error: any) {
    console.error('Get meetings error:', error)
    return c.json({ error: 'Failed to fetch meetings', details: error.message }, 500)
  }
})

// Get meeting recordings
zoomOAuth.get('/meetings/:meetingId/recordings', async (c) => {
  try {
    const meetingId = c.req.param('meetingId')
    const userEmail = c.req.query('userEmail') || 'ahmed.enin@virgingates.com'
    
    const accessToken = await getValidAccessToken(c, userEmail)
    if (!accessToken) {
      return c.json({ error: 'Not authorized. Please connect your Zoom account first.' }, 401)
    }
    
    // Fetch recordings from Zoom API
    const recordingsResponse = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!recordingsResponse.ok) {
      const errorText = await recordingsResponse.text()
      console.error('Failed to fetch recordings:', errorText)
      return c.json({ error: 'Failed to fetch recordings from Zoom', details: errorText }, recordingsResponse.status)
    }
    
    const recordingsData = await recordingsResponse.json()
    
    return c.json(recordingsData)
  } catch (error: any) {
    console.error('Get recordings error:', error)
    return c.json({ error: 'Failed to fetch recordings', details: error.message }, 500)
  }
})

// Download transcript
zoomOAuth.get('/meetings/:meetingId/transcript', async (c) => {
  try {
    const meetingId = c.req.param('meetingId')
    const userEmail = c.req.query('userEmail') || 'ahmed.enin@virgingates.com'
    
    const accessToken = await getValidAccessToken(c, userEmail)
    if (!accessToken) {
      return c.json({ error: 'Not authorized. Please connect your Zoom account first.' }, 401)
    }
    
    // First get the recordings to find transcript file
    const recordingsResponse = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!recordingsResponse.ok) {
      return c.json({ error: 'Failed to fetch recordings' }, recordingsResponse.status)
    }
    
    const recordingsData = await recordingsResponse.json()
    
    // Find transcript file
    const transcriptFile = recordingsData.recording_files?.find((file: any) => 
      file.file_type === 'TRANSCRIPT' || file.recording_type === 'audio_transcript'
    )
    
    if (!transcriptFile) {
      return c.json({ error: 'No transcript available for this meeting' }, 404)
    }
    
    // Download transcript
    const transcriptResponse = await fetch(transcriptFile.download_url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!transcriptResponse.ok) {
      return c.json({ error: 'Failed to download transcript' }, transcriptResponse.status)
    }
    
    const transcriptText = await transcriptResponse.text()
    
    // Store in our database
    await c.env.DB.prepare(`
      INSERT INTO zoom_meeting_transcripts (
        session_id, meeting_id, transcript_text, language, created_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(session_id) DO UPDATE SET
        transcript_text = excluded.transcript_text,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      `zoom_${meetingId}_${Date.now()}`,
      meetingId,
      transcriptText,
      'en'
    ).run()
    
    return c.json({
      transcript: transcriptText,
      meetingId: meetingId,
      stored: true
    })
  } catch (error: any) {
    console.error('Get transcript error:', error)
    return c.json({ error: 'Failed to fetch transcript', details: error.message }, 500)
  }
})

// Check OAuth status
zoomOAuth.get('/status', async (c) => {
  try {
    const userEmail = c.req.query('userEmail') || 'ahmed.enin@virgingates.com'
    
    const tokenData = await c.env.DB.prepare(`
      SELECT user_id, zoom_user_id, email, expires_at, scope, created_at
      FROM zoom_oauth_tokens
      WHERE email = ?
    `).bind(userEmail).first()
    
    if (!tokenData) {
      return c.json({
        authorized: false,
        message: 'Zoom account not connected'
      })
    }
    
    const expiresAt = new Date(tokenData.expires_at as string)
    const now = new Date()
    const isExpired = expiresAt < now
    
    return c.json({
      authorized: true,
      email: tokenData.email,
      zoomUserId: tokenData.zoom_user_id,
      connectedAt: tokenData.created_at,
      expiresAt: tokenData.expires_at,
      isExpired: isExpired,
      scope: tokenData.scope
    })
  } catch (error: any) {
    console.error('Status check error:', error)
    return c.json({ error: 'Failed to check OAuth status', details: error.message }, 500)
  }
})

// Revoke authorization
zoomOAuth.post('/revoke', async (c) => {
  try {
    const { userEmail } = await c.req.json()
    
    if (!userEmail) {
      return c.json({ error: 'userEmail is required' }, 400)
    }
    
    // Delete tokens from database
    await c.env.DB.prepare(`
      DELETE FROM zoom_oauth_tokens WHERE email = ?
    `).bind(userEmail).run()
    
    return c.json({
      success: true,
      message: 'Zoom authorization revoked successfully'
    })
  } catch (error: any) {
    console.error('Revoke error:', error)
    return c.json({ error: 'Failed to revoke authorization', details: error.message }, 500)
  }
})

export default zoomOAuth
