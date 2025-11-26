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
                          <article class="blog-card">
                              <div class="blog-card-image">
                                  <span class="blog-card-category">Insights</span>
                                  ${post.featured_image ? `
                                      <img src="${post.featured_image}" alt="${post.title}" loading="lazy">
                                  ` : `
                                      <div class="blog-card-image-placeholder">
                                          <div class="blog-card-image-text">${post.title.charAt(0)}</div>
                                      </div>
                                  `}
                              </div>
                              <div class="blog-card-content">
                                  <h3 class="blog-card-title">${post.title}</h3>
                                  <div class="blog-card-meta">
                                      <span class="blog-card-author">By ${post.author}</span>
                                      <span class="blog-card-date">${new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                                  ${post.excerpt ? `<p class="blog-card-excerpt">${post.excerpt}</p>` : ''}
                                  <a href="/blog/${post.slug}" class="blog-card-link">Read more</a>
                              </div>
                          </article>
                      `).join('') : `
                          <div class="blog-empty">
                              <p>No posts published yet. Check back soon for insights and updates.</p>
                          </div>
                      `}
                  </div>
                  
                  ${results.length > 0 ? `
                      <div class="blog-pagination">
                          <button class="btn-load-more" disabled>Load more posts</button>
                      </div>
                  ` : ''}
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
              <div class="container blog-post-container">
                  <!-- Main Content Column -->
                  <div class="blog-post-main">
                      <!-- Breadcrumb -->
                      <nav class="breadcrumb">
                          <a href="/">Home</a>
                          <span class="separator">›</span>
                          <a href="/blog">Insights & News</a>
                          <span class="separator">›</span>
                          <span>Insights</span>
                      </nav>
                      
                      <!-- Article Header -->
                      <div class="article-header">
                          <div class="article-category">INSIGHTS</div>
                          <h1 class="article-title">${post.title}</h1>
                          <div class="article-meta">
                              <span>By ${post.author}</span>
                              <span class="meta-separator">·</span>
                              <span>${new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              <span class="meta-separator">·</span>
                              <span>${Math.ceil(post.content.split(' ').length / 200)} min read</span>
                          </div>
                          
                          <!-- Social Share -->
                          <div class="social-share">
                              <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://investaycapital.com/blog/${slug}" target="_blank" class="share-btn" title="Share on LinkedIn">
                                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                              </a>
                              <a href="https://twitter.com/intent/tweet?url=https://investaycapital.com/blog/${slug}&text=${encodeURIComponent(post.title)}" target="_blank" class="share-btn" title="Share on X">
                                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                              </a>
                              <a href="mailto:?subject=${encodeURIComponent(post.title)}&body=Check out this article: https://investaycapital.com/blog/${slug}" class="share-btn" title="Share via Email">
                                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                              </a>
                          </div>
                      </div>
                      
                      <!-- Featured Image -->
                      ${post.featured_image ? `
                          <div class="article-featured-image">
                              <img src="${post.featured_image}" alt="${post.title}">
                          </div>
                      ` : ''}
                      
                      <!-- Article Body -->
                      <div class="article-body">
                          ${post.content}
                      </div>
                      
                      <!-- Author Box -->
                      <div class="author-box">
                          <div class="author-avatar">
                              <span>${post.author.charAt(0)}</span>
                          </div>
                          <div class="author-info">
                              <h3 class="author-name">${post.author}</h3>
                              <p class="author-title">Research & Analysis</p>
                              <p class="author-bio">Delivering institutional-grade insights on digital infrastructure and hospitality asset markets.</p>
                          </div>
                      </div>
                      
                      <!-- Post Navigation -->
                      <div class="post-navigation">
                          <a href="/blog" class="nav-link nav-prev">
                              <span class="nav-label">← Previous Article</span>
                              <span class="nav-title">Return to Insights</span>
                          </a>
                          <a href="/blog" class="nav-link nav-next">
                              <span class="nav-label">Next Article →</span>
                              <span class="nav-title">View More Insights</span>
                          </a>
                      </div>
                  </div>
                  
                  <!-- Sidebar Column -->
                  <aside class="blog-post-sidebar">
                      <!-- Recent Insights Widget -->
                      <div class="sidebar-widget">
                          <h3 class="widget-title">Recent Insights</h3>
                          <div class="recent-posts" id="recent-posts-widget">
                              <p class="widget-loading">Loading...</p>
                          </div>
                      </div>
                      
                      <!-- Categories Widget -->
                      <div class="sidebar-widget">
                          <h3 class="widget-title">Categories</h3>
                          <ul class="category-list">
                              <li><a href="/blog">All Insights</a></li>
                              <li><a href="/blog">Institutional Infrastructure</a></li>
                              <li><a href="/blog">Hospitality Technology</a></li>
                              <li><a href="/blog">Digital Assets</a></li>
                              <li><a href="/blog">Market Analysis</a></li>
                          </ul>
                      </div>
                      
                      <!-- Newsletter Widget -->
                      <div class="sidebar-widget newsletter-widget">
                          <h3 class="widget-title">Stay Informed</h3>
                          <p class="newsletter-desc">Receive institutional insights and analysis delivered to your inbox.</p>
                          <form class="newsletter-form" onsubmit="event.preventDefault(); alert('Newsletter signup coming soon!');">
                              <input type="email" placeholder="Your email" required>
                              <button type="submit" class="btn btn-primary">Subscribe</button>
                          </form>
                      </div>
                  </aside>
              </div>
          </article>
          
          <script>
              // Load recent posts for sidebar
              fetch('/api/blog')
                  .then(res => res.json())
                  .then(data => {
                      const widget = document.getElementById('recent-posts-widget');
                      if (data.success && data.posts.length > 0) {
                          widget.innerHTML = data.posts.slice(0, 5).map(post => \`
                              <a href="/blog/\${post.slug}" class="recent-post-item">
                                  \${post.featured_image ? \`
                                      <img src="\${post.featured_image}" alt="\${post.title}">
                                  \` : \`
                                      <div class="recent-post-placeholder">\${post.title.charAt(0)}</div>
                                  \`}
                                  <div class="recent-post-content">
                                      <h4>\${post.title}</h4>
                                      <span class="recent-post-date">\${new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                              </a>
                          \`).join('');
                      } else {
                          widget.innerHTML = '<p class="widget-empty">No recent posts</p>';
                      }
                  })
                  .catch(() => {
                      document.getElementById('recent-posts-widget').innerHTML = '<p class="widget-error">Failed to load</p>';
                  });
          </script>

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
