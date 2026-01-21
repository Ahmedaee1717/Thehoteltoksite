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
    const post = await DB.prepare(`
      SELECT *
      FROM blog_posts
      WHERE id = ?
    `).bind(id).first();

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
  
  try {
    // Check if post exists
    const existingPost = await DB.prepare('SELECT status FROM blog_posts WHERE id = ?').bind(id).first();
    
    if (!existingPost) {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

    // Update published_at if status changes to published
    let publishedAt = data.published_at;
    if (data.status === 'published' && existingPost.status !== 'published' && !publishedAt) {
      publishedAt = new Date().toISOString();
    }

    await DB.prepare(`
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
      id
    ).run();

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
