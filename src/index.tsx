import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { blogRoutes } from './routes/blog'
import { adminRoutes } from './routes/admin'
import { homePage } from './pages/home'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API routes
app.route('/api/blog', blogRoutes)
app.route('/api/admin', adminRoutes)

// Home page
app.get('/', homePage)

// Blog listing page
app.get('/blog', async (c) => {
  const { DB } = c.env;
  
  try {
    const { results } = await DB.prepare(`
      SELECT id, title, slug, excerpt, author, featured_image, published_at, created_at
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC, created_at DESC
    `).all();

    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Insights & News - Investay Capital</title>
          <meta name="description" content="Latest insights on institutional infrastructure, hospitality digital frameworks, and real-world asset markets from Investay Capital.">
          <meta name="keywords" content="hospitality infrastructure, digital assets, institutional investment, blockchain, real estate technology">
          
          <!-- Open Graph -->
          <meta property="og:title" content="Insights & News - Investay Capital">
          <meta property="og:description" content="Latest insights on institutional infrastructure and hospitality digital frameworks.">
          <meta property="og:type" content="website">
          <meta property="og:url" content="https://investaycapital.com/blog">
          <meta property="og:image" content="https://investaycapital.com/static/og-blog.jpg">
          
          <!-- Twitter Card -->
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="Insights & News - Investay Capital">
          <meta name="twitter:description" content="Latest insights on institutional infrastructure and hospitality digital frameworks.">
          
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="/static/styles.css">
          <link rel="canonical" href="https://investaycapital.com/blog">
      </head>
      <body>
          <!-- Header -->
          <header id="header">
              <div class="container">
                  <a href="/" class="logo">Investay Capital</a>
                  <nav>
                      <a href="/#about">About</a>
                      <a href="/#investors">For Investors</a>
                      <a href="/#hotels">For Hotel Owners</a>
                      <a href="/blog">Insights</a>
                      <a href="/#contact">Contact</a>
                  </nav>
              </div>
          </header>

          <!-- Blog Listing -->
          <section id="blog-listing">
              <div class="container">
                  <div class="blog-header">
                      <h1>Insights & News</h1>
                      <p class="blog-intro">
                          Perspectives on institutional infrastructure, digital frameworks, 
                          and the evolution of hospitality asset markets.
                      </p>
                  </div>
                  
                  <div class="blog-grid">
                      ${results.length > 0 ? results.map((post: any) => `
                          <a href="/blog/${post.slug}" class="blog-card">
                              ${post.featured_image ? `
                                  <div class="blog-card-image">
                                      <img src="${post.featured_image}" alt="${post.title}" loading="lazy">
                                  </div>
                              ` : `
                                  <div class="blog-card-image blog-card-image-placeholder">
                                      <div class="blog-card-image-text">${post.title.charAt(0)}</div>
                                  </div>
                              `}
                              <div class="blog-card-content">
                                  <div class="blog-card-meta">
                                      <span class="blog-card-author">${post.author}</span>
                                      <span class="blog-card-date">${new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                                  <h2 class="blog-card-title">${post.title}</h2>
                                  ${post.excerpt ? `<p class="blog-card-excerpt">${post.excerpt}</p>` : ''}
                              </div>
                          </a>
                      `).join('') : `
                          <div class="blog-empty">
                              <p>No posts published yet. Check back soon for insights and updates.</p>
                          </div>
                      `}
                  </div>
              </div>
          </section>

          <!-- Footer -->
          <footer>
              <div class="container">
                  <p>&copy; 2025 Investay Capital. All rights reserved.</p>
                  <p class="disclaimer">Informational overview only.</p>
              </div>
          </footer>

          <script src="/static/app.js"></script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Blog listing error:', error);
    return c.html('<h1>Error loading blog posts</h1>', 500);
  }
});

// Individual blog post page
app.get('/blog/:slug', async (c) => {
  const { DB } = c.env;
  const slug = c.req.param('slug');
  
  try {
    const post = await DB.prepare(`
      SELECT *
      FROM blog_posts
      WHERE slug = ? AND status = 'published'
    `).bind(slug).first();

    if (!post) {
      return c.html('<h1>Post not found</h1>', 404);
    }

    const metaTitle = post.meta_title || post.title;
    const metaDescription = post.meta_description || post.excerpt || post.content.substring(0, 155);
    const ogImage = post.og_image || post.featured_image || 'https://investaycapital.com/static/og-default.jpg';
    const publishedDate = new Date(post.published_at || post.created_at).toISOString();

    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${metaTitle} - Investay Capital</title>
          <meta name="description" content="${metaDescription}">
          ${post.meta_keywords ? `<meta name="keywords" content="${post.meta_keywords}">` : ''}
          <meta name="author" content="${post.author}">
          
          <!-- Open Graph -->
          <meta property="og:title" content="${metaTitle}">
          <meta property="og:description" content="${metaDescription}">
          <meta property="og:type" content="article">
          <meta property="og:url" content="https://investaycapital.com/blog/${slug}">
          <meta property="og:image" content="${ogImage}">
          <meta property="article:published_time" content="${publishedDate}">
          <meta property="article:author" content="${post.author}">
          
          <!-- Twitter Card -->
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${metaTitle}">
          <meta name="twitter:description" content="${metaDescription}">
          <meta name="twitter:image" content="${ogImage}">
          
          <!-- Structured Data -->
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "${post.title.replace(/"/g, '\\"')}",
            "description": "${metaDescription.replace(/"/g, '\\"')}",
            "image": "${ogImage}",
            "datePublished": "${publishedDate}",
            "dateModified": "${new Date(post.updated_at).toISOString()}",
            "author": {
              "@type": "Organization",
              "name": "${post.author}"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Investay Capital",
              "logo": {
                "@type": "ImageObject",
                "url": "https://investaycapital.com/static/logo.png"
              }
            }
          }
          </script>
          
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="/static/styles.css">
          <link rel="canonical" href="https://investaycapital.com/blog/${slug}">
      </head>
      <body>
          <!-- Header -->
          <header id="header">
              <div class="container">
                  <a href="/" class="logo">Investay Capital</a>
                  <nav>
                      <a href="/#about">About</a>
                      <a href="/#investors">For Investors</a>
                      <a href="/#hotels">For Hotel Owners</a>
                      <a href="/blog">Insights</a>
                      <a href="/#contact">Contact</a>
                  </nav>
              </div>
          </header>

          <!-- Blog Post -->
          <article id="blog-post">
              <div class="container">
                  <div class="blog-post-header">
                      <div class="blog-post-meta">
                          <a href="/blog" class="back-link">← Back to Insights</a>
                          <div class="blog-post-info">
                              <span class="blog-post-author">${post.author}</span>
                              <span class="blog-post-date">${new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                      </div>
                      <h1 class="blog-post-title">${post.title}</h1>
                      ${post.excerpt ? `<p class="blog-post-excerpt">${post.excerpt}</p>` : ''}
                  </div>
                  
                  ${post.featured_image ? `
                      <div class="blog-post-featured-image">
                          <img src="${post.featured_image}" alt="${post.title}">
                      </div>
                  ` : ''}
                  
                  <div class="blog-post-content">
                      ${post.content}
                  </div>
              </div>
          </article>

          <!-- Footer -->
          <footer>
              <div class="container">
                  <p>&copy; 2025 Investay Capital. All rights reserved.</p>
                  <p class="disclaimer">Informational overview only.</p>
              </div>
          </footer>

          <script src="/static/app.js"></script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Blog post error:', error);
    return c.html('<h1>Error loading blog post</h1>', 500);
  }
});

// Admin login page
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Login - Investay Capital</title>
        <meta name="robots" content="noindex, nofollow">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/static/styles.css">
        <link rel="stylesheet" href="/static/admin.css">
    </head>
    <body>
        <div class="admin-login-container">
            <div class="admin-login-box">
                <h1>Admin Login</h1>
                <p class="admin-login-subtitle">Investay Capital</p>
                <form id="admin-login-form">
                    <input type="text" name="username" placeholder="Username" required autocomplete="username">
                    <input type="password" name="password" placeholder="Password" required autocomplete="current-password">
                    <button type="submit" class="btn btn-primary">Login</button>
                    <div id="login-error" class="login-error"></div>
                </form>
                <p class="admin-login-hint">Default: admin / investay2025</p>
            </div>
        </div>
        <script src="/static/admin-login.js"></script>
    </body>
    </html>
  `);
});

// Admin dashboard
app.get('/admin/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Dashboard - Investay Capital</title>
        <meta name="robots" content="noindex, nofollow">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/static/styles.css">
        <link rel="stylesheet" href="/static/admin.css">
    </head>
    <body>
        <div class="admin-container">
            <aside class="admin-sidebar">
                <div class="admin-logo">Investay Capital</div>
                <nav class="admin-nav">
                    <a href="#" class="admin-nav-item active" data-view="posts">Blog Posts</a>
                    <a href="#" class="admin-nav-item" data-view="new-post">New Post</a>
                    <a href="#" class="admin-nav-item" data-view="settings">Settings</a>
                    <a href="/blog" class="admin-nav-item" target="_blank">View Blog</a>
                </nav>
                <button id="logout-btn" class="admin-logout">Logout</button>
            </aside>
            
            <main class="admin-main">
                <!-- Posts List View -->
                <div id="posts-view" class="admin-view active">
                    <div class="admin-header">
                        <h1>Blog Posts</h1>
                        <button id="new-post-btn" class="btn btn-primary">Create New Post</button>
                    </div>
                    <div id="posts-list" class="posts-list">
                        <p class="loading">Loading posts...</p>
                    </div>
                </div>
                
                <!-- New/Edit Post View -->
                <div id="new-post-view" class="admin-view">
                    <div class="admin-header">
                        <h1 id="post-form-title">Create New Post</h1>
                        <button id="cancel-post-btn" class="btn btn-secondary">Cancel</button>
                    </div>
                    <form id="post-form" class="post-form">
                        <input type="hidden" id="post-id" name="id">
                        
                        <div class="form-section">
                            <h3>Basic Information</h3>
                            <div class="form-group">
                                <label for="post-title">Title *</label>
                                <input type="text" id="post-title" name="title" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="post-slug">Slug *</label>
                                <input type="text" id="post-slug" name="slug" required>
                                <small>URL-friendly version (auto-generated from title)</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="post-author">Author *</label>
                                <input type="text" id="post-author" name="author" value="Investay Capital" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="post-excerpt">Excerpt</label>
                                <textarea id="post-excerpt" name="excerpt" rows="3"></textarea>
                                <small>Short summary for listing pages</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="post-featured-image">Featured Image URL</label>
                                <input type="url" id="post-featured-image" name="featured_image">
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3>Content</h3>
                            <div class="form-group">
                                <label for="post-content">Content * (HTML supported)</label>
                                <textarea id="post-content" name="content" rows="15" required></textarea>
                                <small>You can use HTML tags for formatting</small>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3>SEO Optimization</h3>
                            <div class="form-group">
                                <label for="post-meta-title">Meta Title</label>
                                <input type="text" id="post-meta-title" name="meta_title">
                                <small>Leave empty to use post title</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="post-meta-description">Meta Description</label>
                                <textarea id="post-meta-description" name="meta_description" rows="2"></textarea>
                                <small>150-160 characters recommended</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="post-meta-keywords">Meta Keywords</label>
                                <input type="text" id="post-meta-keywords" name="meta_keywords">
                                <small>Comma-separated keywords</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="post-og-image">Open Graph Image URL</label>
                                <input type="url" id="post-og-image" name="og_image">
                                <small>Image for social media sharing (1200x630 recommended)</small>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3>Publishing</h3>
                            <div class="form-group">
                                <label for="post-status">Status *</label>
                                <select id="post-status" name="status" required>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save Post</button>
                            <button type="button" id="delete-post-btn" class="btn btn-danger" style="display: none;">Delete Post</button>
                        </div>
                    </form>
                </div>
                
                <!-- Settings View -->
                <div id="settings-view" class="admin-view">
                    <div class="admin-header">
                        <h1>Settings</h1>
                    </div>
                    <div class="settings-content">
                        <p>Settings management coming soon.</p>
                    </div>
                </div>
            </main>
        </div>
        
        <script src="/static/admin-dashboard.js"></script>
    </body>
    </html>
  `);
});

export default app
