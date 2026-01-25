import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyToken } from '../lib/auth'

type Bindings = {
  DB: D1Database;
  JWT_SECRET?: string;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Helper to extract user email from cookie token
async function getUserEmailFromCookie(c: any): Promise<string | null> {
  try {
    const token = getCookie(c, 'auth_token');
    
    if (!token) {
      console.log('❌ No auth_token cookie found');
      return null;
    }
    
    const secret = c.env.JWT_SECRET || 'default-secret-change-in-production';
    const payload = await verifyToken(token, secret);
    
    if (!payload || !payload.email) {
      console.log('❌ Token verification failed');
      return null;
    }
    
    console.log('✅ Collaboration auth successful for:', payload.email);
    return payload.email;
  } catch (error) {
    console.error('Error extracting email from cookie:', error);
    return null;
  }
}

export const collaborationRoutes = new Hono<{ Bindings: Bindings }>()

// Get user's role and permissions
collaborationRoutes.get('/my-role', async (c) => {
  const { DB } = c.env;
  const userEmail = await getUserEmailFromCookie(c);
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  try {
    const role = await DB.prepare(`
      SELECT * FROM user_roles WHERE user_email = ?
    `).bind(userEmail).first();
    
    return c.json({
      success: true,
      role: role ? role.role : 'viewer'
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get all users with their roles (admin only)
collaborationRoutes.get('/users', async (c) => {
  const { DB } = c.env;
  
  try {
    // Get all users from email_accounts with their roles
    const emailUsers = await DB.prepare(`
      SELECT 
        ea.email_address as email,
        ea.display_name,
        COALESCE(ur.role, 'viewer') as role,
        COALESCE(ur.permissions, '[]') as permissions,
        ur.assigned_at,
        ur.assigned_by
      FROM email_accounts ea
      LEFT JOIN user_roles ur ON ea.email_address = ur.user_email
      WHERE ea.is_active = 1
      ORDER BY ea.email_address
    `).all();
    
    return c.json({ success: true, users: emailUsers.results || [] });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update user role (admin only)
collaborationRoutes.put('/users/:email/role', async (c) => {
  const { DB } = c.env;
  const targetEmail = c.req.param('email');
  
  // Extract admin email from cookie
  const adminEmail = await getUserEmailFromCookie(c);
  
  if (!adminEmail) {
    return c.json({ success: false, error: 'Unauthorized - invalid token' }, 401);
  }
  
  const { role, permissions } = await c.req.json();
  
  try {
    const roleId = generateId('role');
    
    await DB.prepare(`
      INSERT INTO user_roles (id, user_email, role, permissions, assigned_by, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_email) DO UPDATE SET
        role = excluded.role,
        permissions = excluded.permissions,
        assigned_by = excluded.assigned_by,
        updated_at = CURRENT_TIMESTAMP
    `).bind(roleId, targetEmail, role, JSON.stringify(permissions || []), adminEmail).run();
    
    return c.json({ success: true, message: 'Role updated successfully' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get blog posts accessible to user
collaborationRoutes.get('/blog-posts', async (c) => {
  const { DB } = c.env;
  const userEmail = await getUserEmailFromCookie(c);
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  try {
    // Check user role
    const userRole = await DB.prepare(`
      SELECT role FROM user_roles WHERE user_email = ?
    `).bind(userEmail).first() as any;
    
    const role = userRole?.role || 'viewer';
    
    let posts;
    if (role === 'admin' || role === 'publisher') {
      // Admins and publishers see all posts
      posts = await DB.prepare(`
        SELECT id, title, slug, excerpt, status, author, created_at, updated_at, published_at
        FROM blog_posts
        ORDER BY created_at DESC
      `).all();
    } else if (role === 'editor') {
      // Editors see posts they're collaborating on + drafts
      posts = await DB.prepare(`
        SELECT DISTINCT bp.id, bp.title, bp.slug, bp.excerpt, bp.status, bp.author, bp.created_at, bp.updated_at, bp.published_at
        FROM blog_posts bp
        LEFT JOIN blog_collaborations bc ON bp.id = bc.post_id AND bc.collaborator_email = ?
        WHERE bp.status = 'draft' OR bc.id IS NOT NULL
        ORDER BY bp.created_at DESC
      `).bind(userEmail).all();
    } else {
      // Viewers see only published posts they're invited to
      posts = await DB.prepare(`
        SELECT DISTINCT bp.id, bp.title, bp.slug, bp.excerpt, bp.status, bp.author, bp.created_at, bp.updated_at, bp.published_at
        FROM blog_posts bp
        INNER JOIN blog_collaborations bc ON bp.id = bc.post_id
        WHERE bc.collaborator_email = ? AND bc.status = 'accepted'
        ORDER BY bp.created_at DESC
      `).bind(userEmail).all();
    }
    
    return c.json({ success: true, posts: posts.results, role });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// EMAIL COLLABORATION - COMMENTS & STATS
// ============================================

// Get comments for an email
collaborationRoutes.get('/comments/:emailId', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('emailId');
  const userEmail = await getUserEmailFromCookie(c);
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  try {
    const comments = await DB.prepare(`
      SELECT 
        id,
        email_id,
        thread_id,
        author_email,
        author_name,
        comment_text,
        is_resolved,
        created_at,
        updated_at
      FROM email_comments
      WHERE email_id = ?
      ORDER BY created_at ASC
    `).bind(emailId).all();
    
    return c.json({ success: true, comments: comments.results || [] });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get collaboration stats for an email
collaborationRoutes.get('/stats/:emailId', async (c) => {
  const { DB } = c.env;
  const emailId = c.req.param('emailId');
  const userEmail = await getUserEmailFromCookie(c);
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  try {
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_comments,
        SUM(CASE WHEN is_resolved = 0 THEN 1 ELSE 0 END) as open_comments,
        SUM(CASE WHEN is_resolved = 1 THEN 1 ELSE 0 END) as resolved_comments
      FROM email_comments
      WHERE email_id = ?
    `).bind(emailId).first();
    
    return c.json({ success: true, stats: stats || { total_comments: 0, open_comments: 0, resolved_comments: 0 } });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create a comment on an email
collaborationRoutes.post('/comments', async (c) => {
  const { DB } = c.env;
  const userEmail = await getUserEmailFromCookie(c);
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  try {
    const { email_id, thread_id, author_name, comment_text } = await c.req.json();
    
    if (!email_id || !comment_text) {
      return c.json({ success: false, error: 'email_id and comment_text are required' }, 400);
    }
    
    const commentId = generateId('cmt');
    
    await DB.prepare(`
      INSERT INTO email_comments (
        id, email_id, thread_id, author_email, author_name, comment_text, is_resolved, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(commentId, email_id, thread_id || null, userEmail, author_name || userEmail, comment_text).run();
    
    return c.json({ success: true, commentId, message: 'Comment added successfully' });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Resolve a comment
collaborationRoutes.put('/comments/:id/resolve', async (c) => {
  const { DB } = c.env;
  const commentId = c.req.param('id');
  const userEmail = await getUserEmailFromCookie(c);
  
  if (!userEmail) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  try {
    await DB.prepare(`
      UPDATE email_comments
      SET is_resolved = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(commentId).run();
    
    return c.json({ success: true, message: 'Comment resolved' });
  } catch (error: any) {
    console.error('Error resolving comment:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get activity log for collaboration center dashboard
collaborationRoutes.get('/activity', async (c) => {
  const { DB } = c.env;
  
  try {
    const activity = await DB.prepare(`
      SELECT 
        bal.id,
        bal.post_id,
        bal.user_email,
        bal.action,
        bal.created_at,
        bp.title as post_title,
        ea.display_name as user_name
      FROM blog_activity_log bal
      LEFT JOIN blog_posts bp ON bal.post_id = bp.id
      LEFT JOIN email_accounts ea ON bal.user_email = ea.email
      ORDER BY bal.created_at DESC
      LIMIT 50
    `).all();
    
    return c.json({ success: true, activity: activity.results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Log activity
export async function logBlogActivity(
  DB: D1Database,
  postId: number,
  userEmail: string,
  action: string,
  details?: any
) {
  const activityId = generateId('act');
  await DB.prepare(`
    INSERT INTO blog_activity_log (id, post_id, user_email, action, action_details)
    VALUES (?, ?, ?, ?, ?)
  `).bind(activityId, postId, userEmail, action, details ? JSON.stringify(details) : null).run();
}

export default collaborationRoutes;
