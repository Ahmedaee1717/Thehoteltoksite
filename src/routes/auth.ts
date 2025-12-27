// Authentication API Routes
import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  verifyToken,
  generateSecureToken,
  RateLimiter,
  SessionStore,
  getSecurityHeaders,
  sanitizeInput,
  isValidEmail,
  validatePasswordStrength
} from '../lib/auth'

type Bindings = {
  DB: D1Database;
  JWT_SECRET?: string;
}

const authRoutes = new Hono<{ Bindings: Bindings }>()

// Rate limiter for login attempts (5 attempts per 15 minutes)
const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000)

// Session store
const sessionStore = new SessionStore(60 * 60 * 1000) // 1 hour timeout

// Note: Session cleanup in Cloudflare Workers should be done
// periodically through a Cron Trigger or within request handlers
// setInterval is not allowed in Workers global scope

// ============================================
// POST /api/auth/register
// Register new user (for existing email accounts)
// ============================================
authRoutes.post('/register', async (c) => {
  const { DB } = c.env
  const headers = getSecurityHeaders()
  
  try {
    const { email, password } = await c.req.json()
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email).toLowerCase()
    
    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return c.json({ 
        success: false, 
        error: 'Invalid email format' 
      }, { status: 400, headers })
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return c.json({ 
        success: false, 
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors
      }, { status: 400, headers })
    }
    
    // Check if email account exists in email_accounts table
    const account = await DB.prepare(`
      SELECT id, email_address, is_active FROM email_accounts 
      WHERE email_address = ?
    `).bind(sanitizedEmail).first()
    
    if (!account) {
      return c.json({ 
        success: false, 
        error: 'Email account not found. Please contact admin to create an account first.' 
      }, { status: 404, headers })
    }
    
    if (account.is_active !== 1) {
      return c.json({ 
        success: false, 
        error: 'Account is deactivated. Please contact admin.' 
      }, { status: 403, headers })
    }
    
    // Hash password
    const passwordHash = await hashPassword(password)
    
    // Update account with password
    await DB.prepare(`
      UPDATE email_accounts 
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(passwordHash, account.id).run()
    
    return c.json({ 
      success: true, 
      message: 'Account registered successfully. You can now login.' 
    }, { headers })
    
  } catch (error: any) {
    console.error('Registration error:', error)
    return c.json({ 
      success: false, 
      error: 'Registration failed' 
    }, { status: 500, headers })
  }
})

// ============================================
// POST /api/auth/login
// Login with email and password
// ============================================
authRoutes.post('/login', async (c) => {
  const { DB, JWT_SECRET } = c.env
  const headers = getSecurityHeaders()
  
  try {
    const { email, password } = await c.req.json()
    
    // Sanitize email
    const sanitizedEmail = sanitizeInput(email).toLowerCase()
    
    // Rate limiting check
    const rateLimitKey = `login:${sanitizedEmail}`
    const rateLimitCheck = loginRateLimiter.check(rateLimitKey)
    
    if (!rateLimitCheck.allowed) {
      const resetMinutes = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 60000)
      return c.json({ 
        success: false, 
        error: `Too many login attempts. Please try again in ${resetMinutes} minutes.`,
        retryAfter: rateLimitCheck.resetAt
      }, { status: 429, headers })
    }
    
    // Validate inputs
    if (!sanitizedEmail || !password) {
      return c.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400, headers })
    }
    
    // Get account from database
    const account = await DB.prepare(`
      SELECT id, email_address, display_name, password_hash, is_active 
      FROM email_accounts 
      WHERE email_address = ?
    `).bind(sanitizedEmail).first()
    
    if (!account || !account.password_hash) {
      return c.json({ 
        success: false, 
        error: 'Invalid email or password' 
      }, { status: 401, headers })
    }
    
    if (account.is_active !== 1) {
      return c.json({ 
        success: false, 
        error: 'Account is deactivated. Please contact admin.' 
      }, { status: 403, headers })
    }
    
    // Verify password
    const isValid = await verifyPassword(password, account.password_hash as string)
    
    if (!isValid) {
      return c.json({ 
        success: false, 
        error: 'Invalid email or password' 
      }, { status: 401, headers })
    }
    
    // Reset rate limiter on successful login
    loginRateLimiter.reset(rateLimitKey)
    
    // Generate session ID and JWT token
    const sessionId = generateSecureToken(32)
    const jwtSecret = JWT_SECRET || 'default-secret-change-in-production'
    const token = await generateToken(account.id as string, account.email_address as string, jwtSecret)
    
    // Store session
    sessionStore.create(sessionId, account.id as string, account.email_address as string)
    
    // Set secure HTTP-only cookie
    setCookie(c, 'session_id', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    return c.json({ 
      success: true,
      user: {
        id: account.id,
        email: account.email_address,
        displayName: account.display_name
      },
      token
    }, { headers })
    
  } catch (error: any) {
    console.error('Login error:', error)
    return c.json({ 
      success: false, 
      error: 'Login failed' 
    }, { status: 500, headers })
  }
})

// ============================================
// POST /api/auth/logout
// Logout and destroy session
// ============================================
authRoutes.post('/logout', async (c) => {
  const headers = getSecurityHeaders()
  
  try {
    const sessionId = getCookie(c, 'session_id')
    
    if (sessionId) {
      sessionStore.destroy(sessionId)
    }
    
    // Delete cookies
    deleteCookie(c, 'session_id', { path: '/' })
    deleteCookie(c, 'auth_token', { path: '/' })
    
    return c.json({ 
      success: true, 
      message: 'Logged out successfully' 
    }, { headers })
    
  } catch (error: any) {
    console.error('Logout error:', error)
    return c.json({ 
      success: false, 
      error: 'Logout failed' 
    }, { status: 500, headers })
  }
})

// ============================================
// GET /api/auth/me
// Get current user info
// ============================================
authRoutes.get('/me', async (c) => {
  const { DB, JWT_SECRET } = c.env
  const headers = getSecurityHeaders()
  
  try {
    const token = getCookie(c, 'auth_token')
    const sessionId = getCookie(c, 'session_id')
    
    if (!token || !sessionId) {
      return c.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401, headers })
    }
    
    // Verify session
    const session = sessionStore.get(sessionId)
    if (!session) {
      return c.json({ 
        success: false, 
        error: 'Session expired' 
      }, { status: 401, headers })
    }
    
    // Verify JWT token
    const jwtSecret = JWT_SECRET || 'default-secret-change-in-production'
    const payload = await verifyToken(token, jwtSecret)
    
    if (!payload) {
      return c.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401, headers })
    }
    
    // Get fresh user data
    const account = await DB.prepare(`
      SELECT id, email_address, display_name, is_active 
      FROM email_accounts 
      WHERE id = ?
    `).bind(payload.sub).first()
    
    if (!account || account.is_active !== 1) {
      return c.json({ 
        success: false, 
        error: 'Account not found or inactive' 
      }, { status: 401, headers })
    }
    
    return c.json({ 
      success: true,
      user: {
        id: account.id,
        email: account.email_address,
        displayName: account.display_name
      }
    }, { headers })
    
  } catch (error: any) {
    console.error('Auth check error:', error)
    return c.json({ 
      success: false, 
      error: 'Authentication check failed' 
    }, { status: 500, headers })
  }
})

// ============================================
// POST /api/auth/change-password
// Change password (requires current password)
// ============================================
authRoutes.post('/change-password', async (c) => {
  const { DB } = c.env
  const headers = getSecurityHeaders()
  
  try {
    const sessionId = getCookie(c, 'session_id')
    const session = sessionStore.get(sessionId || '')
    
    if (!session) {
      return c.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401, headers })
    }
    
    const { currentPassword, newPassword } = await c.req.json()
    
    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      return c.json({ 
        success: false, 
        error: 'New password does not meet security requirements',
        details: passwordValidation.errors
      }, { status: 400, headers })
    }
    
    // Get account
    const account = await DB.prepare(`
      SELECT id, password_hash FROM email_accounts WHERE id = ?
    `).bind(session.userId).first()
    
    if (!account || !account.password_hash) {
      return c.json({ 
        success: false, 
        error: 'Account not found' 
      }, { status: 404, headers })
    }
    
    // Verify current password
    const isValid = await verifyPassword(currentPassword, account.password_hash as string)
    if (!isValid) {
      return c.json({ 
        success: false, 
        error: 'Current password is incorrect' 
      }, { status: 401, headers })
    }
    
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)
    
    // Update password
    await DB.prepare(`
      UPDATE email_accounts 
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newPasswordHash, session.userId).run()
    
    return c.json({ 
      success: true, 
      message: 'Password changed successfully' 
    }, { headers })
    
  } catch (error: any) {
    console.error('Change password error:', error)
    return c.json({ 
      success: false, 
      error: 'Password change failed' 
    }, { status: 500, headers })
  }
})

// ============================================
// POST /api/auth/forgot-password
// Request password reset email
// ============================================
authRoutes.post('/forgot-password', async (c) => {
  const { DB } = c.env
  const headers = getSecurityHeaders()
  
  try {
    const { email } = await c.req.json()
    const sanitizedEmail = sanitizeInput(email).toLowerCase()
    
    // Validate email
    if (!isValidEmail(sanitizedEmail)) {
      return c.json({ 
        success: false, 
        error: 'Invalid email format' 
      }, { status: 400, headers })
    }
    
    // Check if account exists
    const account = await DB.prepare(`
      SELECT id, email_address FROM email_accounts 
      WHERE email_address = ? AND is_active = 1
    `).bind(sanitizedEmail).first()
    
    // Always return success to prevent email enumeration
    if (!account) {
      return c.json({ 
        success: true, 
        message: 'If the email exists, a password reset link has been sent.' 
      }, { headers })
    }
    
    // Generate reset token
    const resetToken = generateSecureToken(32)
    const tokenId = generateSecureToken(16)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    // Store reset token
    await DB.prepare(`
      INSERT INTO password_reset_tokens (id, email, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(tokenId, sanitizedEmail, resetToken, expiresAt.toISOString()).run()
    
    // In production, send email here
    // For now, return token in response (DEV ONLY)
    console.log('Password reset token:', resetToken)
    console.log('Reset link: /reset-password?token=' + resetToken)
    
    return c.json({ 
      success: true, 
      message: 'If the email exists, a password reset link has been sent.',
      // DEV ONLY - remove in production
      resetToken,
      resetLink: `/reset-password?token=${resetToken}`
    }, { headers })
    
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return c.json({ 
      success: false, 
      error: 'Password reset request failed' 
    }, { status: 500, headers })
  }
})

// ============================================
// POST /api/auth/reset-password
// Reset password with token
// ============================================
authRoutes.post('/reset-password', async (c) => {
  const { DB } = c.env
  const headers = getSecurityHeaders()
  
  try {
    const { token, newPassword } = await c.req.json()
    
    if (!token || !newPassword) {
      return c.json({ 
        success: false, 
        error: 'Token and new password are required' 
      }, { status: 400, headers })
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      return c.json({ 
        success: false, 
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors
      }, { status: 400, headers })
    }
    
    // Find valid token
    const resetToken = await DB.prepare(`
      SELECT id, email, expires_at, used 
      FROM password_reset_tokens 
      WHERE token = ? AND used = 0
    `).bind(token).first()
    
    if (!resetToken) {
      return c.json({ 
        success: false, 
        error: 'Invalid or expired reset token' 
      }, { status: 400, headers })
    }
    
    // Check if expired
    const expiresAt = new Date(resetToken.expires_at as string)
    if (expiresAt < new Date()) {
      return c.json({ 
        success: false, 
        error: 'Reset token has expired' 
      }, { status: 400, headers })
    }
    
    // Hash new password
    const passwordHash = await hashPassword(newPassword)
    
    // Update password
    await DB.prepare(`
      UPDATE email_accounts 
      SET password_hash = ?, first_login = 0, updated_at = datetime('now')
      WHERE email_address = ?
    `).bind(passwordHash, resetToken.email).run()
    
    // Mark token as used
    await DB.prepare(`
      UPDATE password_reset_tokens 
      SET used = 1, used_at = datetime('now')
      WHERE id = ?
    `).bind(resetToken.id).run()
    
    return c.json({ 
      success: true, 
      message: 'Password reset successfully. You can now login.' 
    }, { headers })
    
  } catch (error: any) {
    console.error('Reset password error:', error)
    return c.json({ 
      success: false, 
      error: 'Password reset failed' 
    }, { status: 500, headers })
  }
})

// ============================================
// POST /api/auth/first-login-setup
// Set password on first login
// ============================================
authRoutes.post('/first-login-setup', async (c) => {
  const { DB } = c.env
  const headers = getSecurityHeaders()
  
  try {
    const { email, temporaryToken, newPassword } = await c.req.json()
    const sanitizedEmail = sanitizeInput(email).toLowerCase()
    
    // Validate inputs
    if (!email || !newPassword) {
      return c.json({ 
        success: false, 
        error: 'Email and new password are required' 
      }, { status: 400, headers })
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      return c.json({ 
        success: false, 
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors
      }, { status: 400, headers })
    }
    
    // Get account
    const account = await DB.prepare(`
      SELECT id, email_address, password_hash, first_login, is_active 
      FROM email_accounts 
      WHERE email_address = ?
    `).bind(sanitizedEmail).first()
    
    if (!account) {
      return c.json({ 
        success: false, 
        error: 'Account not found' 
      }, { status: 404, headers })
    }
    
    if (account.is_active !== 1) {
      return c.json({ 
        success: false, 
        error: 'Account is deactivated' 
      }, { status: 403, headers })
    }
    
    // Check if already has password
    if (account.password_hash && account.first_login !== 1) {
      return c.json({ 
        success: false, 
        error: 'Account already has a password. Use login or forgot password.' 
      }, { status: 400, headers })
    }
    
    // Hash password
    const passwordHash = await hashPassword(newPassword)
    
    // Update account
    await DB.prepare(`
      UPDATE email_accounts 
      SET password_hash = ?, first_login = 0, updated_at = datetime('now')
      WHERE id = ?
    `).bind(passwordHash, account.id).run()
    
    return c.json({ 
      success: true, 
      message: 'Password set successfully! You can now login.' 
    }, { headers })
    
  } catch (error: any) {
    console.error('First login setup error:', error)
    return c.json({ 
      success: false, 
      error: 'Password setup failed' 
    }, { status: 500, headers })
  }
})

export { authRoutes }
