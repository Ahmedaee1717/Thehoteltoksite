import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/cloudflare'

const blockchain = new Hono<{ Bindings: CloudflareBindings }>()

// ===== EMAIL VERIFICATION =====

// Verify email authenticity
blockchain.post('/verify', async (c) => {
  try {
    const { emailId, userEmail } = await c.req.json()
    
    if (!emailId || !userEmail) {
      return c.json({ error: 'emailId and userEmail are required' }, 400)
    }
    
    // Get email
    const email = await c.env.DB.prepare(`
      SELECT * FROM emails WHERE id = ?
    `).bind(emailId).first()
    
    if (!email) {
      return c.json({ error: 'Email not found' }, 404)
    }
    
    // Generate blockchain hash (simplified - in production use actual blockchain)
    const emailData = `${email.from_email}|${email.to_email}|${email.subject}|${email.created_at}`
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(emailData)
    )
    const hashArray = Array.from(new Uint8Array(hash))
    const blockchainHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    // Store verification
    const result = await c.env.DB.prepare(`
      INSERT INTO blockchain_verifications (
        email_id, user_email, blockchain_hash, verification_status
      ) VALUES (?, ?, ?, 'verified')
    `).bind(emailId, userEmail, blockchainHash).run()
    
    return c.json({
      success: true,
      verificationId: result.meta.last_row_id,
      blockchainHash,
      status: 'verified',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error verifying email:', error)
    return c.json({ error: 'Failed to verify email', details: error.message }, 500)
  }
})

// Get verification status
blockchain.get('/verify/:emailId', async (c) => {
  const emailId = c.req.param('emailId')
  
  try {
    const verification = await c.env.DB.prepare(`
      SELECT * FROM blockchain_verifications 
      WHERE email_id = ?
      ORDER BY verified_at DESC
      LIMIT 1
    `).bind(emailId).first()
    
    if (!verification) {
      return c.json({ 
        verified: false, 
        message: 'Email not verified' 
      })
    }
    
    return c.json({
      verified: true,
      verification
    })
  } catch (error: any) {
    console.error('Error checking verification:', error)
    return c.json({ error: 'Failed to check verification', details: error.message }, 500)
  }
})

// Get verification history
blockchain.get('/history', async (c) => {
  const userEmail = c.req.query('userEmail') || 'admin@investaycapital.com'
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT v.*, e.subject, e.from_email, e.to_email
      FROM blockchain_verifications v
      LEFT JOIN emails e ON v.email_id = e.id
      WHERE v.user_email = ?
      ORDER BY v.verified_at DESC
      LIMIT 100
    `).bind(userEmail).all()
    
    return c.json({ verifications: results || [] })
  } catch (error: any) {
    console.error('Error fetching verification history:', error)
    return c.json({ error: 'Failed to fetch verification history', details: error.message }, 500)
  }
})

export default blockchain
