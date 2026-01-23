import { Hono } from 'hono'

type Bindings = {
  DB: D1Database;
}

export const adminRoutes = new Hono<{ Bindings: Bindings }>()

// Simple authentication helper
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Login endpoint
adminRoutes.post('/login', async (c) => {
  const { DB } = c.env;
  const { username, password } = await c.req.json();
  
  try {
    const passwordHash = await hashPassword(password);
    
    const user = await DB.prepare(`
      SELECT id, username, email
      FROM admin_users
      WHERE username = ? AND password_hash = ?
    `).bind(username, passwordHash).first();

    if (!user) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    // In production, use proper session management with JWT
    // For now, we'll return a simple token
    const token = btoa(JSON.stringify({ userId: user.id, username: user.username, timestamp: Date.now() }));

    return c.json({ 
      success: true, 
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Login failed' }, 500);
  }
});

// Get all posts (including drafts) - admin only
adminRoutes.get('/posts', async (c) => {
  const { DB } = c.env;
  
  try {
    const { results } = await DB.prepare(`
      SELECT id, title, slug, excerpt, author, status, featured_image, published_at, created_at, updated_at
      FROM blog_posts
      ORDER BY created_at DESC
    `).all();

    return c.json({ success: true, posts: results });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return c.json({ success: false, error: 'Failed to fetch posts' }, 500);
  }
});

// Get single post by ID - admin only
adminRoutes.get('/posts/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    // Try to fetch by slug first, then by id
    let post = await DB.prepare(`
      SELECT *
      FROM blog_posts
      WHERE slug = ?
    `).bind(id).first();
    
    // If not found by slug, try by id (numeric)
    if (!post && !isNaN(Number(id))) {
      post = await DB.prepare(`
        SELECT *
        FROM blog_posts
        WHERE id = ?
      `).bind(Number(id)).first();
    }

    if (!post) {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

    return c.json({ success: true, post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return c.json({ success: false, error: 'Failed to fetch post' }, 500);
  }
});

// Create new post
adminRoutes.post('/posts', async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  
  try {
    // Generate slug if not provided
    let slug = data.slug;
    if (!slug) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const publishedAt = data.status === 'published' ? new Date().toISOString() : null;

    const result = await DB.prepare(`
      INSERT INTO blog_posts (
        title, slug, excerpt, content, author, featured_image,
        meta_title, meta_description, meta_keywords, og_image,
        status, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.title,
      slug,
      data.excerpt || null,
      data.content,
      data.author || 'Investay Capital',
      data.featured_image || null,
      data.meta_title || null,
      data.meta_description || null,
      data.meta_keywords || null,
      data.og_image || null,
      data.status || 'draft',
      publishedAt
    ).run();

    return c.json({ 
      success: true, 
      postId: result.meta.last_row_id,
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return c.json({ success: false, error: 'Failed to create post' }, 500);
  }
});

// Update post
adminRoutes.put('/posts/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  const data = await c.req.json();
  
  console.log('PUT /posts/:id - Received data:', JSON.stringify(data, null, 2));
  
  try {
    // Check if post exists - try slug first, then id
    let existingPost = await DB.prepare('SELECT id, status, published_at FROM blog_posts WHERE slug = ?').bind(id).first();
    
    // If not found by slug, try by id
    if (!existingPost && !isNaN(Number(id))) {
      existingPost = await DB.prepare('SELECT id, status, published_at FROM blog_posts WHERE id = ?').bind(Number(id)).first();
    }
    
    console.log('Existing post:', existingPost);
    
    if (!existingPost) {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

    const postId = existingPost.id; // Use the actual numeric id for update

    // Update published_at if status changes to published
    let publishedAt = data.published_at || existingPost.published_at || null;
    if (data.status === 'published' && existingPost.status !== 'published' && !publishedAt) {
      publishedAt = new Date().toISOString();
    }
    
    console.log('Final publishedAt:', publishedAt);
    console.log('About to bind values:', {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      author: data.author,
      status: data.status,
      publishedAt: publishedAt
    });

    const result = await DB.prepare(`
      UPDATE blog_posts
      SET title = ?, slug = ?, excerpt = ?, content = ?, author = ?,
          featured_image = ?, meta_title = ?, meta_description = ?,
          meta_keywords = ?, og_image = ?, status = ?, published_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      data.title,
      data.slug,
      data.excerpt || null,
      data.content,
      data.author,
      data.featured_image || null,
      data.meta_title || null,
      data.meta_description || null,
      data.meta_keywords || null,
      data.og_image || null,
      data.status,
      publishedAt,
      postId
    ).run();
    
    console.log('Update result:', result);

    return c.json({ 
      success: true, 
      message: 'Post updated successfully'
    });
  } catch (error) {
    console.error('Error updating post:', error);
    console.error('Error details:', error.message, error.stack);
    return c.json({ 
      success: false, 
      error: 'Failed to update post', 
      details: error.message 
    }, 500);
  }
});

// Delete post
adminRoutes.delete('/posts/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    await DB.prepare('DELETE FROM blog_posts WHERE id = ?').bind(id).run();
    
    return c.json({ 
      success: true, 
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return c.json({ success: false, error: 'Failed to delete post' }, 500);
  }
});

// Get email signature
adminRoutes.get('/email-signature', async (c) => {
  const { DB } = c.env;
  
  try {
    const signature = await DB.prepare(`
      SELECT * FROM email_signatures 
      WHERE is_global = 1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `).first();
    
    return c.json({ 
      success: true, 
      signature: signature ? {
        company_name: signature.company_name,
        tagline: signature.tagline,
        logo_url: signature.logo_url,
        website: signature.website,
        address: signature.address,
        phone: signature.phone,
        email: signature.email,
        linkedin: signature.linkedin,
        twitter: signature.twitter,
        facebook: signature.facebook,
        enable_animation: signature.enable_animation === 1,
        enable_tracking: signature.enable_tracking === 1
      } : null
    });
  } catch (error) {
    console.error('Error loading signature:', error);
    return c.json({ success: false, error: 'Failed to load signature' }, 500);
  }
});

// Save email signature
adminRoutes.post('/email-signature', async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  
  try {
    const id = `sig_${Date.now()}`;
    
    await DB.prepare(`
      INSERT INTO email_signatures (
        id, company_name, tagline, logo_url, website, address, phone, email,
        linkedin, twitter, facebook, enable_animation, enable_tracking, is_global, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(
      id,
      data.company_name || '',
      data.tagline || '',
      data.logo_url || '',
      data.website || '',
      data.address || '',
      data.phone || '',
      data.email || '',
      data.linkedin || '',
      data.twitter || '',
      data.facebook || '',
      data.enable_animation ? 1 : 0,
      data.enable_tracking ? 1 : 0
    ).run();
    
    return c.json({ 
      success: true, 
      message: 'Email signature saved successfully',
      id
    });
  } catch (error) {
    console.error('Error saving signature:', error);
    return c.json({ success: false, error: 'Failed to save signature' }, 500);
  }
});

// Send test signature email
adminRoutes.post('/test-signature-email', async (c) => {
  const { DB } = c.env;
  const { to } = await c.req.json();
  
  try {
    // Load the current signature
    const signature = await DB.prepare(`
      SELECT * FROM email_signatures 
      WHERE is_global = 1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `).first();
    
    if (!signature) {
      return c.json({ success: false, error: 'No signature configured' }, 400);
    }
    
    // Note: Actual email sending would be implemented here
    // For now, just return success
    
    return c.json({ 
      success: true, 
      message: `Test email would be sent to ${to} with the signature`
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return c.json({ success: false, error: 'Failed to send test email' }, 500);
  }
});

// Analytics endpoint (for future Cloudflare Web Analytics integration)
adminRoutes.get('/analytics', async (c) => {
  const period = c.req.query('period') || '24h';
  
  // For now, return a flag indicating analytics is not yet configured
  // When you enable Cloudflare Web Analytics, you'll:
  // 1. Get your API token and Zone ID from Cloudflare
  // 2. Call: https://api.cloudflare.com/client/v4/accounts/{account_id}/rum/site_info/{site_id}/performance
  // 3. Parse and return the data
  
  return c.json({
    configured: false,
    message: 'Cloudflare Web Analytics not yet configured. See ANALYTICS_SETUP.md for instructions.',
    period: period
  });
  
  /* Future implementation:
  try {
    const CF_API_TOKEN = c.env.CLOUDFLARE_API_TOKEN;
    const CF_ACCOUNT_ID = c.env.CLOUDFLARE_ACCOUNT_ID;
    const CF_SITE_ID = c.env.CLOUDFLARE_SITE_ID;
    
    if (!CF_API_TOKEN || !CF_ACCOUNT_ID || !CF_SITE_ID) {
      return c.json({ configured: false });
    }
    
    // Calculate date range based on period
    const now = new Date();
    const since = new Date();
    if (period === '24h') since.setHours(now.getHours() - 24);
    else if (period === '7d') since.setDate(now.getDate() - 7);
    else since.setDate(now.getDate() - 30);
    
    // Fetch from Cloudflare Web Analytics API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/rum/site_info/${CF_SITE_ID}/performance?since=${since.toISOString()}&until=${now.toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    
    // Transform the data for the frontend
    return c.json({
      configured: true,
      period: period,
      summary: {
        pageviews: data.result.pageviews || 0,
        visitors: data.result.visitors || 0,
        avgTime: data.result.avgSessionDuration || 0,
        bounceRate: data.result.bounceRate || 0,
        changes: {
          pageviews: data.result.pageviewsChange || 0,
          visitors: data.result.visitorsChange || 0,
          avgTime: data.result.avgTimeChange || 0,
          bounceRate: data.result.bounceRateChange || 0
        }
      },
      topPages: data.result.topPages || [],
      trafficSources: data.result.referrers || [],
      countries: data.result.countries || [],
      devices: data.result.devices || [],
      browsers: data.result.browsers || []
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return c.json({ configured: false, error: error.message }, 500);
  }
  */
});

