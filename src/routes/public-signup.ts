import { Hono } from 'hono'
import { generateVerificationCode, hashPassword } from '../lib/auth'
import { sendVerificationEmail } from '../lib/mailgun'

type Bindings = {
  DB: D1Database
  MAILGUN_API_KEY?: string
  MAILGUN_DOMAIN?: string
  JWT_SECRET?: string
}

const publicSignup = new Hono<{ Bindings: Bindings }>()

// Allowed domains for signup
const ALLOWED_DOMAINS = ['mattereum.com', 'sharmdreamsgroup.com', 'virgingates.com']

// Step 1: Request signup - sends verification email
publicSignup.post('/request', async (c) => {
  try {
    const { username, fullName, company, verificationEmail } = await c.req.json()
    
    if (!username || !fullName || !company || !verificationEmail) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    // Validate domain
    const domain = company.toLowerCase()
    if (!ALLOWED_DOMAINS.includes(domain)) {
      return c.json({ 
        error: 'Invalid domain. Only Mattereum, Sharm Dreams Group, and Virgin Gates employees can sign up.' 
      }, 403)
    }

    // Validate that verification email matches the company domain
    const verificationEmailDomain = verificationEmail.toLowerCase().split('@')[1]
    if (verificationEmailDomain !== domain) {
      return c.json({ 
        error: `Verification email must be from ${domain}` 
      }, 400)
    }

    const email = `${username}@investaycapital.com`

    // Check if email already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM email_accounts WHERE email_address = ?'
    ).bind(email).first()

    if (existing) {
      return c.json({ error: 'Email already registered' }, 409)
    }

    // Generate verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store pending signup
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO pending_signups (email, verification_email, verification_code, full_name, company, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(email, verificationEmail, verificationCode, fullName, domain, expiresAt.toISOString()).run()

    // Send verification email with futuristic design
    const verificationHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      padding: 40px 0;
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
      border-radius: 20px 20px 0 0;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
      animation: pulse 3s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
    .logo {
      width: 200px;
      height: auto;
      position: relative;
      z-index: 1;
      filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.5));
    }
    .content {
      background: #1a1a1a;
      padding: 50px 40px;
      color: #ffffff;
    }
    .title {
      font-size: 32px;
      font-weight: 700;
      text-align: center;
      margin: 0 0 20px 0;
      background: linear-gradient(135deg, #D4AF37 0%, #F4E5B0 50%, #D4AF37 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 2px;
    }
    .subtitle {
      text-align: center;
      font-size: 16px;
      color: #999;
      margin: 0 0 40px 0;
    }
    .code-container {
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%);
      border: 2px solid #D4AF37;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      margin: 30px 0;
      position: relative;
      overflow: hidden;
    }
    .code-container::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.1), transparent);
      animation: shine 3s infinite;
    }
    @keyframes shine {
      0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
      100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
    }
    .code-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #D4AF37;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .code {
      font-size: 56px;
      font-weight: 900;
      letter-spacing: 16px;
      color: #ffffff;
      font-family: 'Courier New', monospace;
      text-shadow: 0 0 30px rgba(212, 175, 55, 0.8);
      position: relative;
      z-index: 1;
    }
    .timer {
      font-size: 14px;
      color: #999;
      margin-top: 15px;
    }
    .info {
      background: rgba(212, 175, 55, 0.05);
      border-left: 4px solid #D4AF37;
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
    }
    .info-title {
      font-size: 14px;
      font-weight: 600;
      color: #D4AF37;
      margin: 0 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .info-text {
      font-size: 14px;
      color: #ccc;
      line-height: 1.6;
      margin: 0;
    }
    .footer {
      background: #000000;
      padding: 30px 40px;
      text-align: center;
      color: #666;
      font-size: 12px;
      border-radius: 0 0 20px 20px;
    }
    .footer-logo {
      width: 40px;
      height: auto;
      opacity: 0.3;
      margin-bottom: 15px;
    }
    .security-badge {
      display: inline-block;
      background: rgba(212, 175, 55, 0.1);
      border: 1px solid rgba(212, 175, 55, 0.3);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 11px;
      color: #D4AF37;
      margin-top: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://www.investaycapital.com/static/investay-logo-full.png" alt="iNVESTAY CAPITAL" class="logo">
    </div>
    
    <div class="content">
      <h1 class="title">VERIFICATION REQUIRED</h1>
      <p class="subtitle">Welcome to the future of capital management</p>
      
      <div class="code-container">
        <div class="code-label">Your Verification Code</div>
        <div class="code">${verificationCode}</div>
        <div class="timer">⏱ Expires in 10 minutes</div>
      </div>
      
      <div class="info">
        <div class="info-title">🔒 Security Notice</div>
        <p class="info-text">
          You are registering for <strong>${email}</strong><br>
          Verification sent to <strong>${verificationEmail}</strong><br>
          Company: <strong>${fullName}</strong>
        </p>
      </div>
      
      <div class="info">
        <div class="info-title">📋 Next Steps</div>
        <p class="info-text">
          1. Copy the 6-digit code above<br>
          2. Return to the signup page<br>
          3. Paste the code to complete registration<br>
          4. Create your secure password
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 40px;">
        <span class="security-badge">🛡️ Enterprise-Grade Security</span>
      </div>
    </div>
    
    <div class="footer">
      <img src="https://www.investaycapital.com/static/investay-logo-icon.png" alt="" class="footer-logo">
      <p>© 2026 iNVESTAY CAPITAL. All rights reserved.</p>
      <p style="margin-top: 10px; color: #444;">
        This is an automated message. Please do not reply.<br>
        If you did not request this verification, please ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
    `

    try {
      await sendVerificationEmail(
        c.env.MAILGUN_API_KEY!,
        c.env.MAILGUN_DOMAIN!,
        verificationEmail,
        'iNVESTAY CAPITAL - Verification Code',
        verificationHtml
      )
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      return c.json({ error: 'Failed to send verification email' }, 500)
    }

    return c.json({ 
      success: true, 
      message: 'Verification code sent',
      verificationEmail,
      expiresIn: 600 // 10 minutes in seconds
    })

  } catch (error) {
    console.error('Signup request error:', error)
    return c.json({ error: 'Signup failed' }, 500)
  }
})

// Step 2: Verify code and complete signup
publicSignup.post('/verify', async (c) => {
  try {
    const { username, code, password, company } = await c.req.json()
    
    if (!username || !code || !password || !company) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const email = `${username}@investaycapital.com`

    // Find pending signup
    const pending = await c.env.DB.prepare(`
      SELECT * FROM pending_signups 
      WHERE email = ? AND verification_code = ? AND company = ?
    `).bind(email, code, company.toLowerCase()).first()

    if (!pending) {
      return c.json({ error: 'Invalid verification code' }, 400)
    }

    // Check expiration
    const expiresAt = new Date(pending.expires_at as string)
    if (expiresAt < new Date()) {
      return c.json({ error: 'Verification code expired' }, 400)
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create account
    await c.env.DB.prepare(`
      INSERT INTO email_accounts (email_address, display_name, password_hash, is_admin, created_at, updated_at)
      VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(email, pending.full_name, passwordHash).run()

    // Delete pending signup
    await c.env.DB.prepare('DELETE FROM pending_signups WHERE email = ?').bind(email).run()

    // Send welcome email
    const welcomeHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #000000;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      padding: 60px 40px;
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
      border-radius: 20px;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: glow 4s ease-in-out infinite;
    }
    @keyframes glow {
      0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
    }
    .logo {
      width: 250px;
      position: relative;
      z-index: 1;
      filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.6));
    }
    .welcome-text {
      font-size: 48px;
      font-weight: 900;
      text-align: center;
      margin: 40px 0 20px 0;
      background: linear-gradient(135deg, #D4AF37 0%, #F4E5B0 50%, #D4AF37 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: 4px;
    }
    .subtitle {
      text-align: center;
      font-size: 18px;
      color: #999;
      margin: 0 0 40px 0;
    }
    .content {
      background: #1a1a1a;
      padding: 40px;
      border-radius: 20px;
      margin-top: 30px;
      color: #ffffff;
    }
    .feature {
      display: flex;
      align-items: flex-start;
      margin: 25px 0;
      padding: 20px;
      background: rgba(212, 175, 55, 0.05);
      border-radius: 12px;
      border-left: 4px solid #D4AF37;
    }
    .feature-icon {
      font-size: 32px;
      margin-right: 20px;
      flex-shrink: 0;
    }
    .feature-title {
      font-size: 18px;
      font-weight: 700;
      color: #D4AF37;
      margin: 0 0 8px 0;
    }
    .feature-text {
      font-size: 14px;
      color: #ccc;
      margin: 0;
      line-height: 1.6;
    }
    .cta {
      text-align: center;
      margin: 40px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #D4AF37 0%, #F4E5B0 50%, #D4AF37 100%);
      color: #000000;
      padding: 18px 48px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 2px;
      box-shadow: 0 10px 40px rgba(212, 175, 55, 0.4);
      transition: all 0.3s ease;
    }
    .footer {
      text-align: center;
      padding: 40px 20px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://www.investaycapital.com/static/investay-logo-full.png" alt="iNVESTAY CAPITAL" class="logo">
    </div>
    
    <h1 class="welcome-text">WELCOME</h1>
    <p class="subtitle">Your account is now active</p>
    
    <div class="content">
      <div class="feature">
        <div class="feature-icon">📧</div>
        <div>
          <div class="feature-title">Your Email Address</div>
          <p class="feature-text">${email}</p>
        </div>
      </div>
      
      <div class="feature">
        <div class="feature-icon">🚀</div>
        <div>
          <div class="feature-title">Enterprise Email Platform</div>
          <p class="feature-text">Access advanced email management, AI-powered features, and seamless collaboration tools.</p>
        </div>
      </div>
      
      <div class="feature">
        <div class="feature-icon">🔒</div>
        <div>
          <div class="feature-title">Military-Grade Security</div>
          <p class="feature-text">Your emails are encrypted at rest with AES-256-GCM. All communications are protected.</p>
        </div>
      </div>
      
      <div class="feature">
        <div class="feature-icon">🤖</div>
        <div>
          <div class="feature-title">AI Assistant</div>
          <p class="feature-text">Smart categorization, spam detection, and intelligent email summaries powered by AI.</p>
        </div>
      </div>
      
      <div class="cta">
        <a href="https://www.investaycapital.com/mail" class="button">Access Your Inbox</a>
      </div>
    </div>
    
    <div class="footer">
      <p>© 2026 iNVESTAY CAPITAL</p>
      <p style="margin-top: 15px; color: #444;">
        Need help? Contact support@investaycapital.com
      </p>
    </div>
  </div>
</body>
</html>
    `

    try {
      await sendVerificationEmail(
        c.env.MAILGUN_API_KEY!,
        c.env.MAILGUN_DOMAIN!,
        email,
        'Welcome to iNVESTAY CAPITAL 🎉',
        welcomeHtml
      )
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
    }

    return c.json({ 
      success: true, 
      message: 'Account created successfully',
      email
    })

  } catch (error) {
    console.error('Verification error:', error)
    return c.json({ error: 'Verification failed' }, 500)
  }
})

// Check if code is still valid
publicSignup.post('/check-code', async (c) => {
  try {
    const { username, code, company } = await c.req.json()
    const email = `${username}@investaycapital.com`

    const pending = await c.env.DB.prepare(`
      SELECT expires_at FROM pending_signups 
      WHERE email = ? AND verification_code = ? AND company = ?
    `).bind(email, code, company.toLowerCase()).first()

    if (!pending) {
      return c.json({ valid: false, error: 'Invalid code' })
    }

    const expiresAt = new Date(pending.expires_at as string)
    if (expiresAt < new Date()) {
      return c.json({ valid: false, error: 'Code expired' })
    }

    return c.json({ 
      valid: true,
      timeRemaining: Math.floor((expiresAt.getTime() - Date.now()) / 1000)
    })
  } catch (error) {
    return c.json({ valid: false, error: 'Check failed' })
  }
})

export default publicSignup
