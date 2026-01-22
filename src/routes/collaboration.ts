import { Hono } from 'hono'

type Bindings = {
  DB: D1Database;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Helper to extract user email from JWT token
function getUserEmailFromToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || null;
  } catch (error) {
    console.error('Error extracting email from token:', error);
    return null;
  }
}

export const collaborationRoutes = new Hono<{ Bindings: Bindings }>()

// Get user's role and permissions
collaborationRoutes.get('/my-role', async (c) => {
  const { DB } = c.env;
  const authHeader = c.req.header('Authorization');
  const userEmail = getUserEmailFromToken(authHeader);
  
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
  
  // Extract admin email from Authorization header
  const authHeader = c.req.header('Authorization');
  const adminEmail = getUserEmailFromToken(authHeader);
  
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
  const authHeader = c.req.header('Authorization');
  const userEmail = getUserEmailFromToken(authHeader);
  
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
        SELECT id, title, status, author, created_at, updated_at, published_at
        FROM blog_posts
        ORDER BY created_at DESC
      `).all();
    } else if (role === 'editor') {
      // Editors see posts they're collaborating on + drafts
      posts = await DB.prepare(`
        SELECT DISTINCT bp.id, bp.title, bp.status, bp.author, bp.created_at, bp.updated_at, bp.published_at
        FROM blog_posts bp
        LEFT JOIN blog_collaborations bc ON bp.id = bc.post_id AND bc.collaborator_email = ?
        WHERE bp.status = 'draft' OR bc.id IS NOT NULL
        ORDER BY bp.created_at DESC
      `).bind(userEmail).all();
    } else {
      // Viewers see only published posts they're invited to
      posts = await DB.prepare(`
        SELECT DISTINCT bp.id, bp.title, bp.status, bp.author, bp.created_at, bp.updated_at, bp.published_at
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
