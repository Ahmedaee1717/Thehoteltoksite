import { Hono } from 'hono'

type Bindings = {
  DB: D1Database;
}

export const blogRoutes = new Hono<{ Bindings: Bindings }>()

// Get all published blog posts
blogRoutes.get('/', async (c) => {
  const { DB } = c.env;
  
  try {
    const { results } = await DB.prepare(`
      SELECT id, title, slug, excerpt, author, featured_image, published_at, created_at
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC, created_at DESC
    `).all();

    return c.json({ success: true, posts: results });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return c.json({ success: false, error: 'Failed to fetch blog posts' }, 500);
  }
});

// Get single blog post by slug
blogRoutes.get('/:slug', async (c) => {
  const { DB } = c.env;
  const slug = c.req.param('slug');
  
  try {
    const post = await DB.prepare(`
      SELECT *
      FROM blog_posts
      WHERE slug = ? AND status = 'published'
    `).bind(slug).first();

    if (!post) {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

    return c.json({ success: true, post });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return c.json({ success: false, error: 'Failed to fetch blog post' }, 500);
  }
});
