// Force update: 1768338934
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie } from 'hono/cookie'
import { blogRoutes } from './routes/blog'
import { adminRoutes } from './routes/admin'
import { aiAdminRoutes } from './routes/ai-admin'
import { emailRoutes } from './routes/email'
import { authRoutes } from './routes/auth'
import forwardingRoutes from './routes/forwarding'
import tasks from './routes/tasks'
import crm from './routes/crm'
import filebank from './routes/filebank'
import collab from './routes/collaboration'
import analytics from './routes/analytics'
import meetings from './routes/meetings'
import organization from './routes/organization'
import blockchain from './routes/blockchain'
import voice from './routes/voice'
import sharedMailboxRoutes from './routes/shared-mailbox'
import testFormDataRoutes from './routes/test-formdata'
import search from './routes/search'
import publicSignup from './routes/public-signup'
import zoomRoutes from './routes/zoom'
import zoomMeetingRoutes from './routes/zoom-meetings'
import liveAIRoutes from './routes/live-ai'
import atlasBot from './routes/atlas-bot'
import { homePage } from './pages/home'
import { signupPage } from './pages/signup'
import { loginPage } from './pages/login'
import { answerQuestion } from './services/ai-optimizer'

// Force production cache refresh - v2.1.0
const APP_VERSION = '2.1.0';

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
  PERPLEXITY_API_KEY?: string;
  TAVILY_API_KEY?: string;
  R2_BUCKET?: R2Bucket;
  JWT_SECRET?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// 🔍 GLOBAL ERROR HANDLER - Catch ALL unhandled errors
app.onError((err, c) => {
  console.error('🚨 GLOBAL ERROR CAUGHT:', err);
  console.error('🚨 Error message:', err.message);
  console.error('🚨 Error stack:', err.stack);
  console.error('🚨 Request path:', c.req.path);
  console.error('🚨 Request method:', c.req.method);
  
  return c.json({
    success: false,
    error: 'Internal server error',
    details: err.message,
    path: c.req.path
  }, 500);
});

// Redirect bare domain to www (but NOT API routes - needed for Mailgun webhook)
app.use('*', async (c, next) => {
  const host = c.req.header('host') || '';
  const path = c.req.path;
  
  // Skip redirect for API routes (Mailgun webhook needs bare domain)
  if (path.startsWith('/api/')) {
    return next();
  }
  
  // If accessing bare domain, redirect to www
  if (host === 'investaycapital.com') {
    const url = new URL(c.req.url);
    url.host = 'www.investaycapital.com';
    return c.redirect(url.toString(), 301);
  }
  
  await next();
})

// Enable CORS for API routes with credentials support
app.use('/api/*', cors({
  origin: (origin) => origin, // Allow all origins (can be restricted in production)
  credentials: true, // CRITICAL: Allow cookies to be sent/received
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}))

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API routes
app.route('/api/blog', blogRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/ai', aiAdminRoutes)
app.route('/api/email', emailRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/forwarding', forwardingRoutes)
app.route('/api/tasks', tasks)
app.route('/api/crm', crm)
app.route('/api/filebank', filebank)
app.route('/api/collaboration', collab)
app.route('/api/analytics', analytics)
app.route('/api/meetings', meetings)
app.route('/api/organization', organization)
app.route('/api/blockchain', blockchain)
app.route('/api/voice', voice)
app.route('/api/shared-mailboxes', sharedMailboxRoutes)
app.route('/api/test', testFormDataRoutes)
app.route('/api/search', search)
app.route('/api/signup', publicSignup)
app.route('/api/zoom', zoomRoutes)
app.route('/meetings', zoomMeetingRoutes)
app.route('/meetings/api', liveAIRoutes)
app.route('/meetings/api/bot', atlasBot)
app.route('/oauth', zoomMeetingRoutes)

// AI Q&A Endpoint - semantic search and question answering
app.post('/api/ai-answer', async (c) => {
  const { DB, OPENAI_API_KEY } = c.env;
  
  try {
    const { question } = await c.req.json();
    
    if (!question || typeof question !== 'string') {
      return c.json({ 
        success: false, 
        error: 'Question is required and must be a string' 
      }, 400);
    }

    // Fetch all published articles with AI embeddings
    const { results } = await DB.prepare(`
      SELECT id, title, slug, content, ai_summary, ai_excerpt, ai_faq, 
             ai_embedding_vector, ai_include_in_knowledge_base
      FROM blog_posts
      WHERE status = 'published' 
        AND ai_include_in_knowledge_base = 1
        AND ai_embedding_vector IS NOT NULL
    `).all();

    if (!results || results.length === 0) {
      return c.json({
        success: true,
        answer: 'I don\'t have enough information to answer that question yet. Please check back as we add more content.',
        sources: []
      });
    }

    const { answer, sources } = await answerQuestion(question, results, OPENAI_API_KEY);

    return c.json({
      success: true,
      answer,
      sources: sources.map(s => ({
        title: s.title,
        url: `/blog/${s.slug}`,
        relevance: s.score
      }))
    });
  } catch (error: any) {
    console.error('AI answer error:', error);
    
    // Graceful failure - don't expose internal errors to users
    return c.json({
      success: false,
      error: 'Unable to process your question at this time. Please try again later.',
      details: error.message
    }, 500);
  }
})

// Test minimal compose modal
app.get('/mail/test', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Compose Modal</title>
    </head>
    <body>
      <div id="root"></div>
      
      <!-- React Library -->
      <script crossorigin src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
      
      <!-- Minimal Compose Test -->
      <script src="/static/email-app-minimal-compose.js"></script>
    </body>
    </html>
  `)
})

// Email client page - requires login
app.get('/mail', (c) => {
  // Check if user is logged in
  const authToken = getCookie(c, 'auth_token');
  
  if (!authToken) {
    // Not logged in - redirect to login page
    return c.redirect('/login');
  }
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Investay Signal - Professional Email Platform</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet">
      <link href="/static/email-app-complete.css" rel="stylesheet">
    </head>
    <body>
      <div id="email-root"></div>
      
      <!-- React Library -->
      <script crossorigin src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
      
      <!-- ULTRA PREMIUM EMAIL APP - DARK MODE WITH AI -->
      <script src="/static/email-app-premium.js?v=1768939233"></script>
    </body>
    </html>
  `)
})

// Signup page - serve the HTML directly
app.get('/signup', (c) => {
  return c.html(signupPage)
})

// Also support /signup.html for direct access
app.get('/signup.html', (c) => {
  return c.html(signupPage)
})

// Login page
app.get('/login', (c) => {
  return c.html(loginPage)
})

// Logout page
app.get('/logout', async (c) => {
  // Call logout API
  await fetch(c.req.url.replace('/logout', '/api/auth/logout'), {
    method: 'POST',
    headers: c.req.raw.headers
  });
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Logged Out - Investay Signal</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-align: center;
        }
        
        .logout-container {
          background: linear-gradient(135deg, rgba(26, 31, 58, 0.8) 0%, rgba(15, 20, 41, 0.8) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 48px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        
        h1 {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        h2 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #c9a962 0%, #f4e4c1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        p {
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 32px;
          font-size: 15px;
        }
        
        .btn {
          display: inline-block;
          padding: 16px 32px;
          background: linear-gradient(135deg, #c9a962 0%, #f4e4c1 100%);
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          color: #0f1419;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(201, 169, 98, 0.4);
        }
      </style>
    </head>
    <body>
      <div class="logout-container">
        <h1>👋</h1>
        <h2>You've been logged out</h2>
        <p>Your session has ended. See you next time!</p>
        <a href="/login" class="btn">Sign In Again</a>
      </div>
      
      <script>
        // Clear auth token cookie
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Clear localStorage
        localStorage.clear();
      </script>
    </body>
    </html>
  `)
})

// DEBUG: Check timer emails without auth
app.get('/api/debug/timer-emails', async (c) => {
  const { DB } = c.env;
  try {
    const { results } = await DB.prepare(`
      SELECT id, subject, expiry_type, expires_at, created_at
      FROM emails
      WHERE to_email = 'admin@investaycapital.com'
      AND category = 'inbox'
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
    
    return c.json({ success: true, emails: results, count: results.length });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
})

// DEBUG: Show Mailgun configuration (masked)
app.get('/api/debug/mailgun-config', async (c) => {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM_EMAIL, MAILGUN_REGION } = c.env;
  
  return c.json({
    configured: !!MAILGUN_API_KEY && !!MAILGUN_DOMAIN,
    domain: MAILGUN_DOMAIN || 'NOT SET',
    fromEmail: MAILGUN_FROM_EMAIL || 'NOT SET',
    region: MAILGUN_REGION || 'NOT SET',
    apiKey: MAILGUN_API_KEY ? `${MAILGUN_API_KEY.substring(0, 8)}...${MAILGUN_API_KEY.substring(MAILGUN_API_KEY.length - 4)}` : 'NOT SET'
  });
})

// Email Admin page - Manage email accounts
app.get('/admin/email-accounts', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Account Management - Investay Signal Admin</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body>
      <div id="root"></div>
      
      <!-- React -->
      <script crossorigin src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
      
      <!-- HTM for JSX-like syntax -->
      <script src="https://unpkg.com/htm@3.1.1/dist/htm.js"></script>
      <script>
        window.htm = window.htm.bind(window.React.createElement);
      </script>
      
      <!-- Email Admin App -->
      <script src="/static/email-admin.js"></script>
    </body>
    </html>
  `)
})

// Home page
app.get('/', homePage)

// Cookie test page - for debugging
app.get('/test-cookies', (c) => {
  const sessionCookie = getCookie(c, 'session_id')
  const authCookie = getCookie(c, 'auth_token')
  
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cookie Test - Investay</title>
      <style>
        body { font-family: monospace; padding: 40px; background: #1a1a1a; color: #fff; }
        .status { padding: 20px; margin: 10px 0; border-radius: 8px; }
        .success { background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; }
        .error { background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; }
        .info { background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; }
        button { padding: 12px 24px; background: #D4AF37; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; margin: 10px 5px; }
        pre { background: #000; padding: 15px; border-radius: 8px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>🍪 Cookie Test Page</h1>
      
      <div class="status ${sessionCookie || authCookie ? 'success' : 'error'}">
        <h2>Server-Side Cookie Status:</h2>
        <p><strong>session_id:</strong> ${sessionCookie ? '✅ Found' : '❌ Not found'}</p>
        <p><strong>auth_token:</strong> ${authCookie ? '✅ Found' : '❌ Not found'}</p>
      </div>
      
      <div class="status info">
        <h2>Actions:</h2>
        <button onclick="testLogin()">Test Login API</button>
        <button onclick="location.reload()">Refresh Page</button>
        <button onclick="checkJSCookies()">Check JS Cookies</button>
        <a href="/login"><button>Go to Login Page</button></a>
      </div>
      
      <div id="result"></div>
      
      <script>
        function checkJSCookies() {
          const cookies = document.cookie;
          const result = document.getElementById('result');
          result.innerHTML = '<div class="status info"><h3>JavaScript document.cookie:</h3><pre>' + 
            (cookies || '(empty)') + '</pre></div>';
        }
        
        async function testLogin() {
          const result = document.getElementById('result');
          result.innerHTML = '<div class="status info">Testing login...</div>';
          
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                email: 'test1@investaycapital.com',
                password: 'Test123456'
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              result.innerHTML = '<div class="status success"><h3>✅ Login Success!</h3><pre>' + 
                JSON.stringify(data, null, 2) + '</pre>' +
                '<p>Now refresh this page to check if cookies were set.</p></div>';
            } else {
              result.innerHTML = '<div class="status error"><h3>❌ Login Failed</h3><pre>' + 
                JSON.stringify(data, null, 2) + '</pre></div>';
            }
          } catch (err) {
            result.innerHTML = '<div class="status error"><h3>❌ Error</h3><pre>' + 
              err.message + '</pre></div>';
          }
        }
      </script>
    </body>
    </html>
  `)
})

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

    // Get featured post (most recent)
    const featuredPost = results[0];
    const otherPosts = results.slice(1);

    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Insights - Investay Capital</title>
          <meta name="description" content="Latest insights on institutional infrastructure, hospitality digital frameworks, and real-world asset markets from Investay Capital.">
          <meta name="keywords" content="hospitality infrastructure, digital assets, institutional investment, blockchain, real estate technology">
          
          <!-- Open Graph -->
          <meta property="og:title" content="Insights - Investay Capital">
          <meta property="og:description" content="Latest insights on institutional infrastructure and hospitality digital frameworks.">
          <meta property="og:type" content="website">
          <meta property="og:url" content="https://investaycapital.com/blog">
          <meta property="og:image" content="https://investaycapital.com/static/og-blog.jpg">
          
          <!-- Twitter Card -->
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="Insights - Investay Capital">
          <meta name="twitter:description" content="Latest insights on institutional infrastructure and hospitality digital frameworks.">
          
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="/static/styles.css">
          <link rel="stylesheet" href="/static/blog.css">
          <link rel="canonical" href="https://investaycapital.com/blog">
      </head>
      <body class="blog-page">
          <!-- Header -->
          <header id="header" class="premium-header blog-header">
              <div class="container">
                  <div class="logo">
                      <a href="/">
                          <span class="logo-icon">◆</span>
                          <span class="logo-text">INVESTAY CAPITAL</span>
                      </a>
                  </div>
                  <nav class="premium-nav">
                      <a href="/#about">About</a>
                      <a href="/#investors">Investors</a>
                      <a href="/#hotels">Hotels</a>
                      <a href="/blog" class="active">Insights</a>
                      <a href="/#contact" class="nav-cta">Contact</a>
                  </nav>
              </div>
          </header>

          <!-- Blog Hero Section -->
          <section class="blog-hero">
              <div class="container">
                  <div class="blog-hero-content">
                      <div class="hero-badge">INSIGHTS</div>
                      <h1 class="blog-hero-title">
                          <span class="title-gradient">Institutional Intelligence</span>
                      </h1>
                      <p class="blog-hero-subtitle">
                          Perspectives on digital infrastructure, hospitality asset markets,
                          <br>and the evolution of institutional frameworks.
                      </p>
                  </div>
              </div>
          </section>

          <!-- Featured Article -->
          ${featuredPost ? `
          <section class="featured-article">
              <div class="container">
                  <a href="/blog/${featuredPost.slug}" class="featured-article-card">
                      <div class="featured-article-image">
                          ${featuredPost.featured_image ? `
                              <img src="${featuredPost.featured_image}" alt="${featuredPost.title}" loading="lazy">
                          ` : `
                              <div class="featured-article-placeholder">
                                  <span class="featured-article-icon">◆</span>
                              </div>
                          `}
                          <div class="featured-article-overlay">
                              <span class="featured-badge">FEATURED</span>
                          </div>
                      </div>
                      <div class="featured-article-content">
                          <div class="featured-article-meta">
                              <span class="featured-article-category">BUSINESS CREATORS</span>
                              <span class="featured-article-date">${new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <h2 class="featured-article-title">${featuredPost.title}</h2>
                          ${featuredPost.excerpt ? `<p class="featured-article-excerpt">${featuredPost.excerpt}</p>` : ''}
                          <div class="featured-article-cta">
                              <span class="cta-text">Read Article</span>
                              <svg class="cta-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                  <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                          </div>
                      </div>
                  </a>
              </div>
          </section>
          ` : ''}

          <!-- Article Grid -->
          <section class="article-grid-section">
              <div class="container">
                  <div class="section-header">
                      <h2 class="section-title">Latest Publications</h2>
                      <p class="section-subtitle">
                          Research and analysis on institutional infrastructure and digital asset frameworks
                      </p>
                  </div>

                  <div class="article-grid">
                      ${otherPosts.length > 0 ? otherPosts.map((post: any, index: number) => `
                          <article class="article-card" data-category="creators">
                              <a href="/blog/${post.slug}" class="article-card-link">
                                  <div class="article-card-image">
                                      ${post.featured_image ? `
                                          <img src="${post.featured_image}" alt="${post.title}" loading="lazy">
                                      ` : `
                                          <div class="article-card-placeholder">
                                              <span class="article-card-icon">◆</span>
                                          </div>
                                      `}
                                      <span class="article-card-badge">CREATORS</span>
                                  </div>
                                  <div class="article-card-content">
                                      <h3 class="article-card-title">${post.title}</h3>
                                      <div class="article-card-meta">
                                          <span class="article-card-author">${post.author}</span>
                                          <span class="article-card-date">${new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      </div>
                                  </div>
                              </a>
                          </article>
                      `).join('') : `
                          <div class="article-empty">
                              <p>More articles coming soon. Stay tuned for insights and updates.</p>
                          </div>
                      `}
                  </div>

                  ${otherPosts.length > 0 ? `
                  <div class="article-grid-cta">
                      <button class="btn btn-secondary-outline">Read All Articles</button>
                  </div>
                  ` : ''}
              </div>
          </section>

          <!-- Footer -->
          <footer class="premium-footer">
              <div class="container">
                  <div class="footer-content">
                      <div class="footer-brand">
                          <span class="logo-icon">◆</span>
                          <span class="logo-text">INVESTAY CAPITAL</span>
                      </div>
                      <div class="footer-links">
                          <a href="/#about">About</a>
                          <a href="/#investors">Investors</a>
                          <a href="/#hotels">Hotels</a>
                          <a href="/blog">Insights</a>
                          <a href="/#contact">Contact</a>
                      </div>
                  </div>
                  <div class="footer-bottom">
                      <p>&copy; 2025 Investay Capital. All rights reserved.</p>
                      <p class="disclaimer">Informational overview only.</p>
                  </div>
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

    // Use content as-is (TinyMCE editor already provides proper HTML)
    const processedContent = post.content;

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
          
          <!-- Structured Data (AI-generated or default) -->
          <script type="application/ld+json">
          ${post.ai_schema_json || `{
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
          }`}
          </script>
          
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="/static/styles.css">
          <link rel="stylesheet" href="/static/blog.css">
          <link rel="stylesheet" href="/static/article.css">
          <link rel="canonical" href="https://investaycapital.com/blog/${slug}">
      </head>
      <body class="article-page">
          <!-- Progress Bar -->
          <div class="reading-progress-bar"></div>

          <!-- Header -->
          <header id="header" class="premium-header article-header">
              <div class="container">
                  <div class="logo">
                      <a href="/">
                          <span class="logo-icon">◆</span>
                          <span class="logo-text">INVESTAY CAPITAL</span>
                      </a>
                  </div>
                  <nav class="premium-nav">
                      <a href="/#about">About</a>
                      <a href="/#investors">Investors</a>
                      <a href="/#hotels">Hotels</a>
                      <a href="/blog" class="active">Insights</a>
                      <a href="/#contact" class="nav-cta">Contact</a>
                  </nav>
              </div>
          </header>

          <!-- Article Hero -->
          <section class="article-hero">
              <div class="article-hero-container">
                  <nav class="breadcrumb">
                      <a href="/">Home</a>
                      <span class="separator">›</span>
                      <a href="/blog">Insights</a>
                      <span class="separator">›</span>
                      <span>Article</span>
                  </nav>
                  
                  <div class="article-hero-content">
                      <div class="article-category-badge">INSIGHTS</div>
                      <h1 class="article-hero-title">${post.title}</h1>
                      ${post.excerpt ? `<p class="article-hero-excerpt">${post.excerpt}</p>` : ''}
                      
                      <div class="article-hero-meta">
                          <div class="author-meta">
                              <div class="author-avatar-small">
                                  <span>${post.author.charAt(0)}</span>
                              </div>
                              <div class="author-details">
                                  <span class="author-name">${post.author}</span>
                                  <span class="author-date">${new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} · ${Math.ceil(post.content.split(' ').length / 200)} min read</span>
                              </div>
                          </div>
                          
                          <div class="social-share-buttons">
                              <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://investaycapital.com/blog/${slug}" target="_blank" class="share-button" title="Share on LinkedIn">
                                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                              </a>
                              <a href="https://twitter.com/intent/tweet?url=https://investaycapital.com/blog/${slug}&text=${encodeURIComponent(post.title)}" target="_blank" class="share-button" title="Share on X">
                                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                              </a>
                              <a href="mailto:?subject=${encodeURIComponent(post.title)}&body=Check out this article: https://investaycapital.com/blog/${slug}" class="share-button" title="Share via Email">
                                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                              </a>
                          </div>
                      </div>
                  </div>
              </div>
          </section>

          <!-- Featured Image -->
          ${post.featured_image ? `
          <section class="article-featured-image-section">
              <div class="article-featured-image-container">
                  <img src="${post.featured_image}" alt="${post.title}" class="article-featured-image">
              </div>
          </section>
          ` : ''}

          <!-- Article Content -->
          <article class="article-content-section">
              <div class="article-content-container">
                  <div class="article-content-wrapper">
                      <!-- Main Content -->
                      <div class="article-main-content">
                          <div class="article-body prose">
                              ${processedContent}
                          </div>

                          <!-- AI FAQ Section (if available) -->
                          ${post.ai_faq ? `
                          <div class="article-faq-section">
                              <h2 class="faq-title">Frequently Asked Questions</h2>
                              <div class="faq-list">
                                  ${JSON.parse(post.ai_faq).map((faq: any) => `
                                      <details class="faq-item">
                                          <summary class="faq-question">
                                              <span>${faq.question}</span>
                                              <svg class="faq-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                  <path d="M5 7.5l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                              </svg>
                                          </summary>
                                          <div class="faq-answer">
                                              <p>${faq.answer}</p>
                                          </div>
                                      </details>
                                  `).join('')}
                              </div>
                          </div>
                          ` : ''}

                          <!-- Author Box -->
                          <div class="article-author-box">
                              <div class="author-box-avatar">
                                  <span>${post.author.charAt(0)}</span>
                              </div>
                              <div class="author-box-info">
                                  <h3 class="author-box-name">${post.author}</h3>
                                  <p class="author-box-title">Research & Analysis Team</p>
                                  <p class="author-box-bio">Delivering institutional-grade insights on digital infrastructure, hospitality asset markets, and real-world tokenization frameworks.</p>
                              </div>
                          </div>

                          <!-- Post Navigation -->
                          <div class="article-navigation">
                              <a href="/blog" class="article-nav-link">
                                  <div class="nav-direction">
                                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                          <path d="M12.5 15l-5-5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                      </svg>
                                      <span>Back to Insights</span>
                                  </div>
                                  <span class="nav-title">View All Articles</span>
                              </a>
                          </div>
                      </div>

                      <!-- Sidebar (Desktop) -->
                      <aside class="article-sidebar">
                          <!-- Share Widget -->
                          <div class="sidebar-widget sticky-widget">
                              <h3 class="widget-title">Share Article</h3>
                              <div class="widget-share-buttons">
                                  <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://investaycapital.com/blog/${slug}" target="_blank" class="widget-share-btn linkedin">
                                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                      <span>LinkedIn</span>
                                  </a>
                                  <a href="https://twitter.com/intent/tweet?url=https://investaycapital.com/blog/${slug}&text=${encodeURIComponent(post.title)}" target="_blank" class="widget-share-btn twitter">
                                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                      <span>X (Twitter)</span>
                                  </a>
                                  <a href="mailto:?subject=${encodeURIComponent(post.title)}&body=Check out this article: https://investaycapital.com/blog/${slug}" class="widget-share-btn email">
                                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                                      <span>Email</span>
                                  </a>
                              </div>
                          </div>

                          <!-- Table of Contents (optional) -->
                          <div class="sidebar-widget">
                              <h3 class="widget-title">In This Article</h3>
                              <ul class="widget-toc">
                                  <li><a href="#" class="toc-link">Introduction</a></li>
                                  <li><a href="#" class="toc-link">Key Insights</a></li>
                                  <li><a href="#" class="toc-link">Analysis</a></li>
                                  <li><a href="#" class="toc-link">Conclusion</a></li>
                              </ul>
                          </div>
                      </aside>
                  </div>
              </div>
          </article>

          <!-- Related Articles (placeholder) -->
          <section class="related-articles-section">
              <div class="container">
                  <h2 class="related-title">Continue Reading</h2>
                  <p class="related-subtitle">Explore more insights on institutional infrastructure and hospitality frameworks</p>
                  <div class="related-cta">
                      <a href="/blog" class="btn btn-primary-outline">View All Insights</a>
                  </div>
              </div>
          </section>

          <!-- Footer -->
          <footer class="premium-footer">
              <div class="container">
                  <div class="footer-content">
                      <div class="footer-brand">
                          <span class="logo-icon">◆</span>
                          <span class="logo-text">INVESTAY CAPITAL</span>
                      </div>
                      <div class="footer-links">
                          <a href="/#about">About</a>
                          <a href="/#investors">Investors</a>
                          <a href="/#hotels">Hotels</a>
                          <a href="/blog">Insights</a>
                          <a href="/#contact">Contact</a>
                      </div>
                  </div>
                  <div class="footer-bottom">
                      <p>&copy; 2025 Investay Capital. All rights reserved.</p>
                      <p class="disclaimer">Informational overview only.</p>
                  </div>
              </div>
          </footer>

          <script src="/static/app.js"></script>
          <script src="/static/article.js"></script>
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
                    <a href="#" class="admin-nav-item" data-view="analytics">📊 Analytics</a>
                    <a href="#" class="admin-nav-item" data-view="posts">Blog Posts</a>
                    <a href="#" class="admin-nav-item" data-view="new-post">New Post</a>
                    <a href="/admin/email-accounts" class="admin-nav-item">📧 Email Management</a>
                    <a href="#" class="admin-nav-item" data-view="email-settings">✉️ Email Settings</a>
                    <a href="#" class="admin-nav-item" data-view="settings">Settings</a>
                    <a href="/blog" class="admin-nav-item" target="_blank">View Blog</a>
                </nav>
                <button id="logout-btn" class="admin-logout">Logout</button>
            </aside>
            
            <main class="admin-main">
                <!-- Analytics View -->
                <div id="analytics-view" class="admin-view active">
                    <div class="admin-header">
                        <h1>📊 Website Analytics</h1>
                        <div class="analytics-period-selector">
                            <button class="period-btn active" data-period="24h">24 Hours</button>
                            <button class="period-btn" data-period="7d">7 Days</button>
                            <button class="period-btn" data-period="30d">30 Days</button>
                        </div>
                    </div>
                    
                    <!-- Setup Notice (shown if not configured) -->
                    <div id="analytics-setup-notice" class="analytics-notice" style="display: none;">
                        <div class="notice-icon">⚠️</div>
                        <div class="notice-content">
                            <h3>Analytics Not Set Up</h3>
                            <p>To start tracking website analytics, you need to enable Cloudflare Web Analytics:</p>
                            <ol>
                                <li>Go to <a href="https://dash.cloudflare.com" target="_blank">Cloudflare Dashboard</a></li>
                                <li>Select your domain: <strong>investaycapital.com</strong></li>
                                <li>Click <strong>Analytics → Web Analytics → Add Site</strong></li>
                                <li>Copy your token and add it to the website code</li>
                            </ol>
                            <p>See <code>ANALYTICS_SETUP.md</code> for detailed instructions.</p>
                        </div>
                    </div>
                    
                    <!-- Analytics Dashboard (shown when configured) -->
                    <div id="analytics-dashboard">
                        <!-- Summary Cards -->
                        <div class="analytics-summary">
                            <div class="analytics-card">
                                <div class="card-icon">👁️</div>
                                <div class="card-content">
                                    <div class="card-label">Page Views</div>
                                    <div class="card-value" id="stat-pageviews">-</div>
                                    <div class="card-change" id="stat-pageviews-change">-</div>
                                </div>
                            </div>
                            
                            <div class="analytics-card">
                                <div class="card-icon">👥</div>
                                <div class="card-content">
                                    <div class="card-label">Unique Visitors</div>
                                    <div class="card-value" id="stat-visitors">-</div>
                                    <div class="card-change" id="stat-visitors-change">-</div>
                                </div>
                            </div>
                            
                            <div class="analytics-card">
                                <div class="card-icon">⏱️</div>
                                <div class="card-content">
                                    <div class="card-label">Avg. Time on Site</div>
                                    <div class="card-value" id="stat-avgtime">-</div>
                                    <div class="card-change" id="stat-avgtime-change">-</div>
                                </div>
                            </div>
                            
                            <div class="analytics-card">
                                <div class="card-icon">📈</div>
                                <div class="card-content">
                                    <div class="card-label">Bounce Rate</div>
                                    <div class="card-value" id="stat-bounce">-</div>
                                    <div class="card-change" id="stat-bounce-change">-</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Top Pages -->
                        <div class="analytics-section">
                            <h2>📄 Top Pages</h2>
                            <div class="analytics-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Page</th>
                                            <th>Views</th>
                                            <th>Visitors</th>
                                            <th>Avg. Time</th>
                                        </tr>
                                    </thead>
                                    <tbody id="top-pages-table">
                                        <tr><td colspan="4" class="loading">Loading data...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Traffic Sources -->
                        <div class="analytics-section">
                            <h2>🌐 Traffic Sources</h2>
                            <div class="analytics-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Source</th>
                                            <th>Visitors</th>
                                            <th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody id="traffic-sources-table">
                                        <tr><td colspan="3" class="loading">Loading data...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Countries -->
                        <div class="analytics-section">
                            <h2>🌍 Top Countries</h2>
                            <div class="analytics-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Country</th>
                                            <th>Visitors</th>
                                            <th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody id="countries-table">
                                        <tr><td colspan="3" class="loading">Loading data...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Devices & Browsers -->
                        <div class="analytics-grid">
                            <div class="analytics-section">
                                <h2>📱 Devices</h2>
                                <div id="devices-chart" class="chart-container">
                                    <div class="loading">Loading...</div>
                                </div>
                            </div>
                            
                            <div class="analytics-section">
                                <h2>🌐 Browsers</h2>
                                <div id="browsers-chart" class="chart-container">
                                    <div class="loading">Loading...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Posts List View -->
                <div id="posts-view" class="admin-view">
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
                                <label for="post-content">Content *</label>
                                <input id="post-content" type="hidden" name="content" required>
                                <trix-editor input="post-content" class="trix-content"></trix-editor>
                                <small>Rich text editor with formatting, headings, lists, links, images, and more. Press Enter for new paragraph.</small>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3>SEO Optimization</h3>
                            <div class="ai-seo-button-container">
                                <button type="button" id="ai-seo-optimize-btn" class="ai-seo-button">
                                    <span class="ai-seo-button-bg"></span>
                                    <span class="ai-seo-button-glow"></span>
                                    <span class="ai-seo-button-particles"></span>
                                    <span class="ai-seo-button-content">
                                        <span class="ai-seo-icon">✨</span>
                                        <span class="ai-seo-text">AI AUTO-FILL SEO FIELDS</span>
                                        <span class="ai-seo-subtext">Neural analysis • Quantum optimization • Instant results</span>
                                    </span>
                                </button>
                            </div>
                            
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
                            <h3>AI Optimization</h3>
                            <p class="section-description">Automatically optimize content for AI systems, LLMs, and semantic search engines.</p>
                            
                            <div id="ai-status-box" class="ai-status-box" style="display: none;">
                                <div class="ai-status-item">
                                    <span class="ai-status-label">Summary:</span>
                                    <span id="ai-status-summary" class="ai-status-value">Not generated</span>
                                </div>
                                <div class="ai-status-item">
                                    <span class="ai-status-label">FAQ:</span>
                                    <span id="ai-status-faq" class="ai-status-value">Not generated</span>
                                </div>
                                <div class="ai-status-item">
                                    <span class="ai-status-label">Schema:</span>
                                    <span id="ai-status-schema" class="ai-status-value">Not generated</span>
                                </div>
                                <div class="ai-status-item">
                                    <span class="ai-status-label">Embedding:</span>
                                    <span id="ai-status-embedding" class="ai-status-value">Not generated</span>
                                </div>
                                <div class="ai-status-item">
                                    <span class="ai-status-label">Last Processed:</span>
                                    <span id="ai-status-processed" class="ai-status-value">Never</span>
                                </div>
                            </div>
                            
                            <div class="ai-actions">
                                <div class="ai-primary-action">
                                    <button type="button" id="ai-optimize-all-btn" class="ai-quantum-button ai-primary">
                                        <span class="ai-quantum-bg"></span>
                                        <span class="ai-quantum-glow"></span>
                                        <span class="ai-quantum-content">
                                            <span class="ai-quantum-icon">🤖</span>
                                            <span class="ai-quantum-text">ONE-CLICK AI OPTIMIZATION</span>
                                        </span>
                                    </button>
                                </div>
                                <div class="ai-individual-actions">
                                    <button type="button" id="ai-generate-summary-btn" class="ai-quantum-button ai-secondary">
                                        <span class="ai-quantum-bg"></span>
                                        <span class="ai-quantum-glow"></span>
                                        <span class="ai-quantum-content">
                                            <span class="ai-quantum-text">GENERATE SUMMARY</span>
                                        </span>
                                    </button>
                                    <button type="button" id="ai-generate-faq-btn" class="ai-quantum-button ai-secondary">
                                        <span class="ai-quantum-bg"></span>
                                        <span class="ai-quantum-glow"></span>
                                        <span class="ai-quantum-content">
                                            <span class="ai-quantum-text">GENERATE FAQ</span>
                                        </span>
                                    </button>
                                    <button type="button" id="ai-generate-schema-btn" class="ai-quantum-button ai-secondary">
                                        <span class="ai-quantum-bg"></span>
                                        <span class="ai-quantum-glow"></span>
                                        <span class="ai-quantum-content">
                                            <span class="ai-quantum-text">GENERATE SCHEMA</span>
                                        </span>
                                    </button>
                                    <button type="button" id="ai-generate-embedding-btn" class="ai-quantum-button ai-secondary">
                                        <span class="ai-quantum-bg"></span>
                                        <span class="ai-quantum-glow"></span>
                                        <span class="ai-quantum-content">
                                            <span class="ai-quantum-text">GENERATE EMBEDDING</span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="form-group" style="margin-top: 20px;">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="ai-include-kb" name="ai_include_in_knowledge_base">
                                    Include in Knowledge Base (for AI Q&A)
                                </label>
                                <small>When enabled, this content will be used to answer visitor questions via AI.</small>
                            </div>
                            
                            <div id="ai-result-box" class="ai-result-box" style="display: none;">
                                <h4>AI Optimization Result</h4>
                                <pre id="ai-result-text"></pre>
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
                
                <!-- Email Settings View -->
                <div id="email-settings-view" class="admin-view">
                    <div class="admin-header">
                        <h1>✉️ Email Signature Settings</h1>
                        <p style="margin-top: 8px; color: rgba(255,255,255,0.7); font-size: 14px;">Create a futuristic email signature that will amaze your recipients</p>
                    </div>
                    
                    <div class="signature-editor-container">
                        <div class="signature-editor">
                            <h2 class="section-title">🎨 Signature Builder</h2>
                            
                            <form id="signature-form" class="signature-form">
                                <div class="form-group">
                                    <label for="sig-company-name">Company Name *</label>
                                    <input type="text" id="sig-company-name" name="company_name" placeholder="Investay Capital" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="sig-tagline">Company Tagline</label>
                                    <input type="text" id="sig-tagline" name="tagline" placeholder="Investing in tomorrow's innovations">
                                </div>
                                
                                <div class="form-group">
                                    <label for="sig-logo-url">Logo URL *</label>
                                    <input type="url" id="sig-logo-url" name="logo_url" placeholder="https://example.com/logo.png" required>
                                    <small>⚡ Logo loads are tracked for read receipts (complementing email pixel tracking)</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="sig-website">Website URL</label>
                                    <input type="url" id="sig-website" name="website" placeholder="https://www.investaycapital.com">
                                </div>
                                
                                <div class="form-group">
                                    <label for="sig-address">Company Address</label>
                                    <textarea id="sig-address" name="address" rows="2" placeholder="123 Innovation Street, Tech City, TC 12345"></textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label for="sig-phone">Phone Number</label>
                                    <input type="tel" id="sig-phone" name="phone" placeholder="+1 (555) 123-4567">
                                </div>
                                
                                <div class="form-group">
                                    <label for="sig-email">Contact Email</label>
                                    <input type="email" id="sig-email" name="email" placeholder="info@investaycapital.com">
                                </div>
                                
                                <div class="form-group">
                                    <label>Social Media Links</label>
                                    <div class="social-inputs">
                                        <input type="url" id="sig-linkedin" name="linkedin" placeholder="LinkedIn URL">
                                        <input type="url" id="sig-twitter" name="twitter" placeholder="Twitter/X URL">
                                        <input type="url" id="sig-facebook" name="facebook" placeholder="Facebook URL">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="sig-enable-animation" name="enable_animation" checked>
                                        <span>Enable futuristic animations (holographic effects, particle system)</span>
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="sig-enable-tracking" name="enable_tracking" checked>
                                        <span>Enable logo tracking for read receipts (complements email pixel)</span>
                                    </label>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="button" id="preview-signature-btn" class="btn btn-secondary">👁️ Preview Signature</button>
                                    <button type="submit" id="save-signature-btn" class="btn btn-primary">💾 Save Global Signature</button>
                                </div>
                            </form>
                        </div>
                        
                        <div class="signature-preview-panel">
                            <h2 class="section-title">🔮 Live Preview</h2>
                            <div id="signature-preview-container" class="signature-preview">
                                <div class="preview-placeholder">
                                    <p>Fill in the form to see your futuristic signature preview</p>
                                </div>
                            </div>
                            
                            <div class="preview-actions">
                                <button type="button" id="copy-signature-btn" class="btn btn-secondary">📋 Copy HTML</button>
                                <button type="button" id="test-signature-btn" class="btn btn-secondary">📧 Send Test Email</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Settings View -->
                <div id="settings-view" class="admin-view">
                    <div class="admin-header">
                        <h1>⚙️ Settings</h1>
                    </div>
                    <div class="settings-content">
                        <div class="settings-section">
                            <h2 class="settings-section-title">User Permissions & Collaboration Access</h2>
                            <p class="settings-section-desc">Manage user roles and grant access to the Collaboration Center and blog posting features</p>
                            
                            <div id="user-permissions-list" class="user-permissions-grid">
                                <div class="loading">Loading users...</div>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h2 class="settings-section-title">Role Legend</h2>
                            <div class="role-legend">
                                <div class="role-legend-item">
                                    <span class="role-badge-admin">Admin</span>
                                    <span class="role-desc">Full access - manage users, create/edit/delete all posts, access admin dashboard</span>
                                </div>
                                <div class="role-legend-item">
                                    <span class="role-badge-publisher">Publisher</span>
                                    <span class="role-desc">Create and publish posts, edit own posts, access collaboration center</span>
                                </div>
                                <div class="role-legend-item">
                                    <span class="role-badge-editor">Editor</span>
                                    <span class="role-desc">Edit posts, cannot publish or delete, view collaboration center</span>
                                </div>
                                <div class="role-legend-item">
                                    <span class="role-badge-viewer">Viewer</span>
                                    <span class="role-desc">View-only access, no editing permissions, limited collaboration access</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
        
        <!-- Trix Rich Text Editor (Free, No API Key) -->
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/trix@2.0.8/dist/trix.css">
        <script type="text/javascript" src="https://unpkg.com/trix@2.0.8/dist/trix.umd.min.js"></script>
        
        <!-- Admin Dashboard JS -->
        <script src="/static/admin-dashboard.js?v=${Date.now()}"></script>
    </body>
    </html>
  `);
});

// ✨ COLLABORATION CENTER - Year 2070 Design
app.get('/collaborate', (c) => {
  // Check if user is logged in
  const authToken = getCookie(c, 'auth_token');
  
  if (!authToken) {
    return c.redirect('/login');
  }
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Collaboration Center - Investay Capital</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/static/styles.css?v=20260126-1">
        <link rel="stylesheet" href="/static/admin.css?v=20260126-1">
        <link rel="stylesheet" href="/static/collaboration.css?v=20260126-1">
    </head>
    <body class="collab-body">
        <div class="collab-container">
            <!-- 🌌 QUANTUM HEADER -->
            <header class="collab-header">
                <div class="collab-header-bg"></div>
                <div class="collab-header-content">
                    <div class="collab-logo">
                        <span class="collab-logo-icon">◆</span>
                        <span class="collab-logo-text">COLLABORATION CENTER</span>
                    </div>
                    <div class="collab-user-info">
                        <span id="user-email" class="user-email">Loading...</span>
                        <button id="back-to-mail-btn" class="quantum-btn quantum-btn-secondary">
                            <span class="btn-icon">↩</span>
                            <span class="btn-text">Back to Email</span>
                        </button>
                    </div>
                </div>
            </header>

            <!-- 🚀 MAIN CONTENT -->
            <main class="collab-main">
                <!-- SIDEBAR NAVIGATION -->
                <aside class="collab-sidebar">
                    <nav class="collab-nav">
                        <button class="collab-nav-item active" data-view="live-board">
                            <span class="nav-icon">🔴</span>
                            <span class="nav-label">LIVE BOARD</span>
                            <span class="nav-count" id="live-board-count">0</span>
                        </button>
                        <button class="collab-nav-item" data-view="my-posts">
                            <span class="nav-icon">📝</span>
                            <span class="nav-label">My Posts</span>
                            <span class="nav-count" id="my-posts-count">0</span>
                        </button>
                        <button class="collab-nav-item" data-view="all-posts">
                            <span class="nav-icon">📚</span>
                            <span class="nav-label">All Posts</span>
                            <span class="nav-count" id="all-posts-count">0</span>
                        </button>
                        <button class="collab-nav-item" data-view="new-post">
                            <span class="nav-icon">✨</span>
                            <span class="nav-label">New Post</span>
                        </button>
                        <button class="collab-nav-item" data-view="meetings">
                            <span class="nav-icon">🎙️</span>
                            <span class="nav-label">Meetings</span>
                            <span class="nav-count" id="meetings-count">0</span>
                        </button>
                        <button class="collab-nav-item" data-view="tasks">
                            <span class="nav-icon">✅</span>
                            <span class="nav-label">Tasks</span>
                            <span class="nav-count" id="tasks-count">0</span>
                        </button>
                        <button class="collab-nav-item" data-view="activity">
                            <span class="nav-icon">📊</span>
                            <span class="nav-label">Activity</span>
                        </button>
                        <button class="collab-nav-item" data-view="settings" id="settings-nav-btn" style="display: none;">
                            <span class="nav-icon">⚙️</span>
                            <span class="nav-label">Settings</span>
                        </button>
                    </nav>
                </aside>

                <!-- CONTENT AREA -->
                <div class="collab-content">
                    <!-- LIVE BOARD VIEW -->
                    <div id="live-board-view" class="collab-view">
                        <div class="view-header">
                            <h1 class="view-title">🔴 LIVE BOARD</h1>
                            <p class="view-subtitle">Real-time team updates and collaboration feed</p>
                        </div>
                        
                        <!-- POST COMPOSER -->
                        <div class="live-board-composer">
                            <div class="composer-header">
                                <div class="composer-user-avatar" id="composer-avatar">
                                    <span id="composer-avatar-text">U</span>
                                </div>
                                <div class="composer-input-wrapper">
                                    <textarea 
                                        id="live-board-input" 
                                        class="composer-input" 
                                        placeholder="Share an update, link, or idea with the team..."
                                        rows="1"
                                    ></textarea>
                                </div>
                            </div>
                            <div class="composer-footer" id="composer-footer" style="display: none;">
                                <div class="composer-actions">
                                    <button class="composer-action-btn" id="attach-link-btn" title="Attach link">
                                        <span>🔗</span>
                                        <span>Link</span>
                                    </button>
                                    <button class="composer-action-btn" id="attach-media-btn" title="Attach media">
                                        <span>📷</span>
                                        <span>Media</span>
                                    </button>
                                    <button class="composer-action-btn" id="mention-user-btn" title="Mention user">
                                        <span>@</span>
                                        <span>Mention</span>
                                    </button>
                                </div>
                                <div class="composer-submit">
                                    <button class="composer-cancel-btn" id="cancel-post-btn">Cancel</button>
                                    <button class="composer-post-btn" id="submit-post-btn">
                                        <span>📤</span>
                                        <span>Post</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- FEED FILTERS -->
                        <div class="live-board-filters">
                            <button class="feed-filter-btn active" data-filter="all">
                                <span>🌐</span>
                                <span>All Updates</span>
                            </button>
                            <button class="feed-filter-btn" data-filter="my">
                                <span>👤</span>
                                <span>My Posts</span>
                            </button>
                            <button class="feed-filter-btn" data-filter="mentions">
                                <span>@</span>
                                <span>Mentions</span>
                            </button>
                            <button class="feed-filter-btn" data-filter="links">
                                <span>🔗</span>
                                <span>Links</span>
                            </button>
                        </div>
                        
                        <!-- LIVE FEED -->
                        <div id="live-board-feed" class="live-board-feed">
                            <div class="loading-quantum">
                                <div class="loading-spinner"></div>
                                <p>Loading live board...</p>
                            </div>
                        </div>
                    </div>

                    <!-- MY POSTS VIEW -->
                    <div id="my-posts-view" class="collab-view">
                        <div class="view-header">
                            <h1 class="view-title">My Posts</h1>
                            <p class="view-subtitle">Your authored and collaborated posts</p>
                        </div>
                        <div id="my-posts-list" class="posts-grid">
                            <div class="loading-quantum">
                                <div class="loading-spinner"></div>
                                <p>Loading posts...</p>
                            </div>
                        </div>
                    </div>

                    <!-- ALL POSTS VIEW -->
                    <div id="all-posts-view" class="collab-view">
                        <div class="view-header">
                            <h1 class="view-title">All Posts</h1>
                            <p class="view-subtitle">Browse all blog posts</p>
                        </div>
                        <div id="all-posts-list" class="posts-grid">
                            <div class="loading-quantum">
                                <div class="loading-spinner"></div>
                                <p>Loading posts...</p>
                            </div>
                        </div>
                    </div>

                    <!-- NEW POST VIEW -->
                    <div id="new-post-view" class="collab-view">
                        <div class="view-header">
                            <h1 class="view-title">Create New Post</h1>
                            <p class="view-subtitle">Write and publish content</p>
                        </div>
                        <div class="permission-check-box">
                            <p id="permission-status">Checking permissions...</p>
                        </div>
                    </div>
                    
                    <!-- Trix Editor CSS/JS (loaded for Collab Center) -->
                    <link rel="stylesheet" type="text/css" href="https://unpkg.com/trix@2.0.8/dist/trix.css">
                    <script type="text/javascript" src="https://unpkg.com/trix@2.0.8/dist/trix.umd.min.js"></script>

                    <!-- MEETINGS VIEW (OTTER.AI TRANSCRIPTS VIA ZAPIER WEBHOOK) -->
                    <div id="meetings-view" class="collab-view">
                        <div class="view-header">
                            <h1 class="view-title">🎙️ Meeting Transcripts</h1>
                            <p class="view-subtitle">Auto-synced from Otter.ai via Zapier webhook (real-time)</p>
                            <div style="display: flex; gap: 12px;">
                                <button id="manual-upload-btn" class="collab-btn-primary">
                                    <span>📤</span>
                                    Upload Historical Meeting
                                </button>
                                <button id="sync-otter-btn" class="collab-btn-primary" style="opacity: 0.7;">
                                    <span>🔄</span>
                                    Manual Sync (Backup)
                                </button>
                            </div>
                        </div>
                        
                        <!-- Search Bar -->
                        <div class="meetings-search-bar">
                            <input 
                                type="text" 
                                id="meetings-search-input" 
                                placeholder="🔍 Search meetings, transcripts, speakers..." 
                            />
                        </div>
                        
                        <div id="meetings-list" class="meetings-grid">
                            <div class="loading-quantum">
                                <div class="loading-spinner"></div>
                                <p>Loading meetings...</p>
                            </div>
                        </div>
                    </div>

                    <!-- TASKS VIEW -->
                    <div id="tasks-view" class="collab-view">
                        <div class="view-header">
                            <h1 class="view-title">✅ Tasks</h1>
                            <p class="view-subtitle">Action items from meetings and manual tasks</p>
                            <button id="create-task-btn" class="collab-btn-primary">
                                <span>➕</span>
                                Create Task
                            </button>
                        </div>
                        
                        <!-- Filter Bar -->
                        <div class="tasks-filter-bar" style="display: flex; gap: 12px; margin-bottom: 20px;">
                            <button class="filter-btn active" data-filter="all">All</button>
                            <button class="filter-btn" data-filter="pending">Pending</button>
                            <button class="filter-btn" data-filter="in_progress">In Progress</button>
                            <button class="filter-btn" data-filter="completed">Completed</button>
                        </div>
                        
                        <div id="tasks-list" class="tasks-grid">
                            <div class="loading-quantum">
                                <div class="loading-spinner"></div>
                                <p>Loading tasks...</p>
                            </div>
                        </div>
                    </div>

                    <!-- ACTIVITY VIEW -->
                    <div id="activity-view" class="collab-view">
                        <div class="view-header">
                            <h1 class="view-title">Recent Activity</h1>
                            <p class="view-subtitle">Track changes and updates</p>
                        </div>
                        <div id="activity-list" class="activity-timeline">
                            <div class="loading-quantum">
                                <div class="loading-spinner"></div>
                                <p>Loading activity...</p>
                            </div>
                        </div>
                    </div>

                    <!-- SETTINGS VIEW (Admin Only) -->
                    <div id="settings-view" class="collab-view">
                        <div class="view-header">
                            <h1 class="view-title">⚙️ Settings</h1>
                            <p class="view-subtitle">Manage users and permissions</p>
                        </div>
                        
                        <div class="settings-section">
                            <h2 class="settings-section-title">User Permissions</h2>
                            <p class="settings-section-desc">Grant or revoke access to the Collaboration Center and admin features</p>
                            
                            <div id="user-permissions-list" class="user-permissions-grid">
                                <div class="loading-quantum">
                                    <div class="loading-spinner"></div>
                                    <p>Loading users...</p>
                                </div>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h2 class="settings-section-title">Role Legend</h2>
                            <div class="role-legend">
                                <div class="role-legend-item">
                                    <span class="role-badge admin">Admin</span>
                                    <span class="role-desc">Full access - manage users, create/edit/delete all posts</span>
                                </div>
                                <div class="role-legend-item">
                                    <span class="role-badge publisher">Publisher</span>
                                    <span class="role-desc">Create and publish posts, edit own posts</span>
                                </div>
                                <div class="role-legend-item">
                                    <span class="role-badge editor">Editor</span>
                                    <span class="role-desc">Edit posts, cannot publish or delete</span>
                                </div>
                                <div class="role-legend-item">
                                    <span class="role-badge viewer">Viewer</span>
                                    <span class="role-desc">View-only access, no editing permissions</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <script src="/static/collaboration.js?v=20260126-1"></script>
        
        <!-- 🌟 NOVA - AI Entity (Year 2070) -->
        <link rel="stylesheet" href="/static/nova-ai.css?v=2070">
        <script src="/static/nova-ai.js?v=2070"></script>
    </body>
    </html>
  `);
});

// 🚀 REVOLUTIONARY FILE BANK - Year 2070 Design
app.get('/files', (c) => {
  // Check if user is logged in
  const authToken = getCookie(c, 'auth_token');
  
  if (!authToken) {
    return c.redirect('/login');
  }
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File Bank - Investay Capital</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/static/filebank-revolution.css">
    </head>
    <body class="filebank-revolution">
        <!-- 🌌 TOP BAR -->
        <div class="filebank-container">
            <div class="filebank-topbar">
                <div class="filebank-logo">
                    <span class="filebank-logo-icon">📁</span>
                    <span>FILE BANK</span>
                </div>

                <div class="filebank-search-container">
                    <span class="filebank-search-icon">🔍</span>
                    <input 
                        type="text" 
                        id="filebank-search" 
                        class="filebank-search" 
                        placeholder="Search files by name, tags, or content..."
                    >
                    <button id="filebank-search-clear" class="filebank-search-clear">✕</button>
                </div>

                <div class="filebank-actions">
                    <div class="filebank-view-toggle">
                        <button class="filebank-view-btn active" data-view="grid" title="Grid View">⊞</button>
                        <button class="filebank-view-btn" data-view="list" title="List View">☰</button>
                        <button class="filebank-view-btn" data-view="columns" title="Columns View">▦</button>
                    </div>

                    <button id="filebank-collab-btn" class="filebank-action-btn">
                        <span>✨</span>
                        <span>Collaborate</span>
                    </button>

                    <button id="filebank-new-folder-btn" class="filebank-action-btn">
                        <span>📁</span>
                        <span>New Folder</span>
                    </button>

                    <button id="filebank-upload-btn" class="filebank-action-btn primary">
                        <span>📤</span>
                        <span>Upload</span>
                    </button>

                    <button id="filebank-back-btn" class="filebank-action-btn">
                        <span>↩</span>
                        <span>Email</span>
                    </button>
                </div>
            </div>

            <!-- 🎨 WORKSPACE -->
            <div class="filebank-workspace">
                <!-- 🗂️ SIDEBAR -->
                <div class="filebank-sidebar">
                    <div class="filebank-sidebar-section">
                        <div class="filebank-sidebar-title">Quick Access</div>
                        
                        <div class="filebank-sidebar-item active" data-filter="all">
                            <span class="filebank-sidebar-icon">🏠</span>
                            <span class="filebank-sidebar-label">All Files</span>
                            <span class="filebank-sidebar-count">0</span>
                        </div>

                        <div class="filebank-sidebar-item" data-filter="recent">
                            <span class="filebank-sidebar-icon">🕒</span>
                            <span class="filebank-sidebar-label">Recent</span>
                            <span class="filebank-sidebar-count">0</span>
                        </div>

                        <div class="filebank-sidebar-item" data-filter="starred">
                            <span class="filebank-sidebar-icon">⭐</span>
                            <span class="filebank-sidebar-label">Starred</span>
                            <span class="filebank-sidebar-count">0</span>
                        </div>

                        <div class="filebank-sidebar-item" data-filter="shared">
                            <span class="filebank-sidebar-icon">👥</span>
                            <span class="filebank-sidebar-label">Shared</span>
                            <span class="filebank-sidebar-count">0</span>
                        </div>
                    </div>

                    <div class="filebank-sidebar-section">
                        <div class="filebank-sidebar-title">File Types</div>
                        
                        <div class="filebank-sidebar-item" data-filter="images">
                            <span class="filebank-sidebar-icon">🖼️</span>
                            <span class="filebank-sidebar-label">Images</span>
                        </div>

                        <div class="filebank-sidebar-item" data-filter="documents">
                            <span class="filebank-sidebar-icon">📄</span>
                            <span class="filebank-sidebar-label">Documents</span>
                        </div>
                    </div>

                    <div class="filebank-sidebar-section">
                        <div class="filebank-sidebar-title">Folders</div>
                        <div id="filebank-folders-list" class="filebank-folders-list">
                            <!-- Populated by JS -->
                        </div>
                    </div>
                </div>

                <!-- 🏖️ MAIN CANVAS -->
                <div id="filebank-canvas" class="filebank-canvas">
                    <!-- Breadcrumb -->
                    <div id="filebank-breadcrumb" class="filebank-breadcrumb">
                        <div class="filebank-breadcrumb-item">
                            🏠 All Files
                        </div>
                    </div>

                    <!-- File Grid -->
                    <div id="filebank-grid" class="filebank-grid">
                        <div class="filebank-loading">
                            <div class="filebank-loading-spinner"></div>
                            <div class="filebank-loading-text">Loading your files...</div>
                        </div>
                    </div>

                    <!-- Drag & Drop Zone -->
                    <div id="filebank-dropzone" class="filebank-dropzone">
                        <div class="filebank-dropzone-icon">📤</div>
                        <div class="filebank-dropzone-text">Drop files here</div>
                        <div class="filebank-dropzone-subtext">or click upload button</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Context Menu -->
        <div id="filebank-context-menu" class="filebank-context-menu">
            <div class="filebank-context-item" onclick="FileBankRevolution.openFile(this.closest('.filebank-context-menu').dataset.fileId)">
                <span>📂</span>
                <span>Open</span>
            </div>
            <div class="filebank-context-item" onclick="FileBankRevolution.downloadFile(this.closest('.filebank-context-menu').dataset.fileId)">
                <span>📥</span>
                <span>Download</span>
            </div>
            <div class="filebank-context-item" onclick="FileBankRevolution.toggleStar(this.closest('.filebank-context-menu').dataset.fileId)">
                <span>⭐</span>
                <span>Star/Unstar</span>
            </div>
            <div class="filebank-context-divider"></div>
            <div class="filebank-context-item" onclick="FileBankRevolution.emailFile(this.closest('.filebank-context-menu').dataset.fileId)">
                <span>📧</span>
                <span>Send via Email</span>
            </div>
            <div class="filebank-context-item" onclick="FileBankRevolution.toggleShareFile(this.closest('.filebank-context-menu').dataset.fileId)">
                <span>🌐</span>
                <span>Share/Unshare</span>
            </div>
            <div class="filebank-context-divider"></div>
            <div class="filebank-context-item danger" onclick="FileBankRevolution.deleteFile(this.closest('.filebank-context-menu').dataset.fileId)">
                <span>🗑️</span>
                <span>Delete (Owner Only)</span>
            </div>
        </div>

        <!-- Preview Modal -->
        <div id="filebank-preview-modal" class="filebank-modal-overlay">
            <div class="filebank-modal">
                <div class="filebank-modal-header">
                    <div class="filebank-modal-title">File Preview</div>
                    <button class="filebank-modal-close" onclick="document.getElementById('filebank-preview-modal').classList.remove('active')">✕</button>
                </div>
                <div class="filebank-modal-body" style="text-align: center;">
                    <img class="filebank-preview-image" style="max-width: 100%; max-height: 60vh; border-radius: 12px;">
                </div>
            </div>
        </div>

        <script src="/static/filebank-revolution.js"></script>
        <script src="/static/filebank-complete.js"></script>
    </body>
    </html>
  `);
});

// Sitemap for SEO
app.get('/sitemap.xml', async (c) => {
  const { DB } = c.env;
  
  try {
    const { results } = await DB.prepare(`
      SELECT slug, published_at, created_at
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC, created_at DESC
    `).all();

    const baseUrl = 'https://investaycapital.com';
    const now = new Date().toISOString().split('T')[0];
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Home Page -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Blog Listing -->
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Blog Posts -->
  ${results?.map((post: any) => {
    const lastmod = post.published_at || post.created_at;
    return `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod.split(' ')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n')}
</urlset>`;

    c.header('Content-Type', 'application/xml');
    return c.body(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return c.text('Error generating sitemap', 500);
  }
});

// Robots.txt for SEO
app.get('/robots.txt', (c) => {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /blog
Allow: /blog/*
Disallow: /admin
Disallow: /admin/*
Disallow: /api/*

Sitemap: https://investaycapital.com/sitemap.xml`;

  c.header('Content-Type', 'text/plain');
  return c.body(robotsTxt);
});

export default app
// FORCE CACHE BUST: 1768339539673108300
300
