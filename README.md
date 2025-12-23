# Investay Capital - Institutional Infrastructure Website with Blog System

## Project Overview
- **Name**: Investay Capital
- **Type**: Corporate website with CMS-powered blog system
- **Purpose**: Professional presence for institutional investors and hotel partners with content management
- **Tech Stack**: Hono + Cloudflare Pages + D1 Database + TypeScript

## URLs
- **Development**: https://3000-ivn8as47qxbnu8dje62yt-0e616f0a.sandbox.novita.ai
- **Blog**: https://3000-ivn8as47qxbnu8dje62yt-0e616f0a.sandbox.novita.ai/blog
- **Admin Login**: https://3000-ivn8as47qxbnu8dje62yt-0e616f0a.sandbox.novita.ai/admin
- **Production**: (Deploy with `npm run deploy:prod`)

## 🎉 Currently Completed Features

### ✅ Main Website (All Original Features)
1. **Header**: Sticky navigation with logo and anchor links
2. **Hero Section**: Large headline, subheadline, dual CTAs, credibility statements
3. **About Section**: Corporate messaging about digital frameworks
4. **For Investors Section**: Benefits grid, subsection text, inquiry form
5. **For Hotel Owners Section**: Benefits grid, partnership form
6. **Contact/CTA Section**: Private consultation messaging
7. **Footer**: Copyright and disclaimer text

### ✅ NEW: Blog/News System
1. **Public Blog Listing** (`/blog`)
   - Grid layout of published posts
   - Featured images, excerpts, author, date
   - Responsive design
   - SEO optimized with meta tags and Open Graph

2. **Individual Blog Posts** (`/blog/:slug`)
   - Full article view
   - Featured images
   - Structured data (JSON-LD)
   - SEO meta tags (title, description, keywords)
   - Open Graph tags for social sharing
   - Twitter Card support
   - Canonical URLs

3. **Admin Login System** (`/admin`)
   - Secure SHA-256 password hashing
   - Token-based authentication
   - Default credentials:
     - **Username**: `admin`
     - **Password**: `investay2025`

4. **Admin Dashboard** (`/admin/dashboard`)
   - Full CRUD operations (Create, Read, Update, Delete)
   - Post management interface
   - SEO field management:
     - Meta title
     - Meta description
     - Meta keywords
     - Open Graph image
   - Content fields:
     - Title (with auto-slug generation)
     - Author
     - Excerpt
     - Featured image
     - Content (HTML supported)
   - Status management:
     - Draft
     - Published
     - Archived
   - Real-time post listing
   - Edit and delete functionality

5. **Database Backend (Cloudflare D1)**
   - SQLite-based persistence
   - Proper migrations system
   - Tables:
     - `blog_posts` - All blog content
     - `admin_users` - Admin authentication
     - `blog_categories` - For future categorization
   - Indexes for performance

### ✅ SEO Optimization
- **Meta Tags**: Title, description, keywords for every page
- **Open Graph**: Full OG support for social media sharing
- **Twitter Cards**: Optimized for Twitter sharing
- **Structured Data**: JSON-LD for search engines
- **Canonical URLs**: Proper canonical tags
- **Semantic HTML**: Proper article markup
- **Image Optimization**: Alt tags and proper sizing
- **Sitemap**: XML sitemap at `/sitemap.xml` for search engines
- **Robots.txt**: SEO-friendly robots.txt at `/robots.txt`
- **Analytics Ready**: Placeholders for Google Analytics 4 and Microsoft Clarity

### ✅ **NEW: AI Awareness Features** 🤖
1. **AI Optimization Admin Panel**
   - One-click AI optimization for blog posts
   - Generate AI summaries, excerpts, FAQs, and embeddings
   - Individual or batch AI generation controls
   - Knowledge base toggle for Q&A integration
   - Real-time AI status indicators

2. **AI-Generated Content Fields**
   - `ai_summary`: 2-3 sentence neutral summary for AI systems
   - `ai_excerpt`: 1-2 sentence quotable excerpt
   - `ai_primary_topic`: Main topic classification
   - `ai_key_entities`: Entity extraction for knowledge graphs
   - `ai_faq`: 4-6 Q&A pairs for featured snippets
   - `ai_schema_json`: Auto-generated Schema.org JSON-LD
   - `ai_embedding_vector`: 1536-dimension semantic search vector

3. **AI Q&A Endpoint** (`/api/ai-answer`)
   - Semantic search across published content
   - RAG (Retrieval-Augmented Generation) powered answers
   - Source attribution with relevance scores
   - Compliance guardrails (no financial promises)

4. **Compliance & Guardrails**
   - Automatic filtering of prohibited terms
   - Neutral, factual tone enforcement
   - Focus on technology/infrastructure (not investment promotion)
   - Professional institutional messaging

5. **Public Features**
   - AI-generated Schema.org markup injection
   - FAQ-enhanced structured data
   - Semantic HTML for AI parsing
   - Knowledge base for visitor Q&A

## Functional Entry URIs

### Public Pages
| Path | Method | Description |
|------|--------|-------------|
| `/` | GET | Main landing page |
| `/blog` | GET | Blog listing page (all published posts) |
| `/blog/:slug` | GET | Individual blog post by slug |
| `/#about` | - | About section (anchor) |
| `/#investors` | - | For Investors section (anchor) |
| `/#hotels` | - | For Hotel Owners section (anchor) |
| `/#contact` | - | Contact section (anchor) |

### Admin Pages
| Path | Method | Description |
|------|--------|-------------|
| `/admin` | GET | Admin login page |
| `/admin/dashboard` | GET | Admin dashboard (requires auth) |

### API Endpoints

#### Public API
| Path | Method | Description |
|------|--------|-------------|
| `/api/blog` | GET | Get all published posts (JSON) |
| `/api/blog/:slug` | GET | Get single published post (JSON) |
| `/api/ai-answer` | POST | AI Q&A endpoint (semantic search + RAG) |

#### Admin API
| Path | Method | Description |
|------|--------|-------------|
| `/api/admin/login` | POST | Admin login |
| `/api/admin/posts` | GET | Get all posts (including drafts) |
| `/api/admin/posts` | POST | Create new post |
| `/api/admin/posts/:id` | GET | Get single post by ID |
| `/api/admin/posts/:id` | PUT | Update post |
| `/api/admin/posts/:id` | DELETE | Delete post |

#### AI Optimization API (Admin)
| Path | Method | Description |
|------|--------|-------------|
| `/api/ai/posts/:id/optimize-all` | POST | Full AI optimization (summary, FAQ, schema, embedding) |
| `/api/ai/posts/:id/generate-summary` | POST | Generate AI summary and excerpt |
| `/api/ai/posts/:id/generate-faq` | POST | Generate AI FAQ items |
| `/api/ai/posts/:id/generate-schema` | POST | Generate Schema.org JSON-LD |
| `/api/ai/posts/:id/generate-embedding` | POST | Generate embedding vector |
| `/api/ai/posts/:id/toggle-knowledge-base` | PUT | Toggle knowledge base inclusion |
| `/api/ai/posts/:id/ai-status` | GET | Get AI optimization status |

## Data Architecture

### Database: Cloudflare D1 (SQLite)

#### blog_posts Table
```sql
id              INTEGER PRIMARY KEY
title           TEXT (required)
slug            TEXT UNIQUE (required, URL-friendly)
excerpt         TEXT (optional, for listings)
content         TEXT (required, HTML supported)
author          TEXT (required)
featured_image  TEXT (URL)

-- SEO Fields
meta_title       TEXT
meta_description TEXT (150-160 chars recommended)
meta_keywords    TEXT (comma-separated)
og_image         TEXT (1200x630 recommended)

-- AI Awareness Fields (NEW)
ai_primary_topic          TEXT (2-4 words, e.g. "hotel tokenization")
ai_key_entities           TEXT (JSON array of key entities)
ai_summary                TEXT (2-3 sentence neutral summary)
ai_excerpt                TEXT (1-2 sentence quotable excerpt)
ai_faq                    TEXT (JSON array of Q&A pairs)
ai_schema_json            TEXT (Schema.org JSON-LD)
ai_embedding_vector       TEXT (JSON array, 1536 dimensions)
ai_last_processed_at      DATETIME
ai_include_in_knowledge_base INTEGER (0 or 1, default: 1)

-- Status
status          TEXT (draft|published|archived)
published_at    DATETIME
created_at      DATETIME
updated_at      DATETIME
```

#### admin_users Table
```sql
id            INTEGER PRIMARY KEY
username      TEXT UNIQUE (required)
password_hash TEXT (SHA-256)
email         TEXT
created_at    DATETIME
```

### Storage Services
- **Cloudflare D1**: Primary database for blog posts and users
- **Local Development**: `.wrangler/state/v3/d1/` (auto-created)
- **Production**: Remote D1 database (after deployment)

## User Guide

### For Website Visitors
1. **Homepage**: Navigate using top menu or scroll through sections
2. **Blog**: Click "Insights" in navigation or visit `/blog`
3. **Read Posts**: Click any blog card to read full article
4. **Contact Forms**: Fill out investor or hotel inquiry forms
5. **Email**: Direct email via info@investaycapital.com

### For Admin Users (Content Management)

#### Accessing Admin Dashboard
1. Navigate to `/admin`
2. Login with credentials:
   - Username: `admin`
   - Password: `investay2025`
3. You'll be redirected to `/admin/dashboard`

#### Creating a New Blog Post
1. Click "Create New Post" or "New Post" in sidebar
2. Fill in required fields:
   - **Title**: Main headline (slug auto-generated)
   - **Author**: Default is "Investay Capital"
   - **Content**: HTML supported for formatting
3. Optional fields:
   - **Excerpt**: Short summary for listing pages
   - **Featured Image**: URL to header image
4. **SEO Fields** (recommended):
   - **Meta Title**: Custom title for search results
   - **Meta Description**: 150-160 character summary
   - **Meta Keywords**: Comma-separated keywords
   - **OG Image**: Social sharing image (1200x630px)
5. Set **Status**:
   - `Draft`: Not visible to public
   - `Published`: Live on website
   - `Archived`: Hidden but preserved
6. Click "Save Post"

#### Editing a Post
1. From "Blog Posts" view, click "Edit" on any post
2. Modify fields as needed
3. Click "Save Post"

#### Deleting a Post
1. Click "Edit" on the post
2. Scroll to bottom and click "Delete Post"
3. Confirm deletion

#### SEO Best Practices
- **Meta Description**: Write compelling 150-160 character summaries
- **Meta Keywords**: Include 5-10 relevant keywords
- **Featured Images**: Use high-quality images (recommended: 1200x630px)
- **OG Images**: Same as featured image or custom for social media
- **Content**: Use proper HTML headings (h2, h3) for structure
- **URLs**: Slugs should be short, descriptive, and keyword-rich

### For Developers

#### Local Development Setup
```bash
# Install dependencies (already done)
cd /home/user/webapp
npm install

# Build the project
npm run build

# Apply database migrations (local)
npm run db:migrate:local

# Start development server with PM2
pm2 start ecosystem.config.cjs

# Or use npm script
npm run dev:sandbox

# Test the server
curl http://localhost:3000
```

#### Database Management
```bash
# Apply migrations locally
npm run db:migrate:local

# Apply migrations to production (requires Cloudflare auth)
npm run db:migrate:prod

# Query local database
npm run db:console:local
# Then run SQL: SELECT * FROM blog_posts;

# Query production database (requires Cloudflare auth)
npm run db:console:prod

# Example queries:
wrangler d1 execute webapp-production --local --command="SELECT * FROM blog_posts WHERE status='published'"
wrangler d1 execute webapp-production --local --command="SELECT * FROM admin_users"
```

#### PM2 Management
```bash
# View all services
pm2 list

# View logs
pm2 logs investay-capital --nostream

# Restart service
fuser -k 3000/tcp 2>/dev/null || true
pm2 restart investay-capital

# Stop service
pm2 stop investay-capital

# Delete service
pm2 delete investay-capital
```

#### Production Deployment

**Prerequisites:**
1. Set up Cloudflare API key in Deploy tab
2. Create production D1 database
3. Update `wrangler.jsonc` with database ID

**Steps:**
```bash
# 1. Create production D1 database (one time)
npx wrangler d1 create webapp-production
# Copy the database_id from output

# 2. Update wrangler.jsonc with the database_id
# Edit: "database_id": "your-actual-id-here"

# 3. Apply migrations to production
npm run db:migrate:prod

# 4. Build and deploy
npm run deploy:prod
```

## Features Not Yet Implemented
- [ ] Rich text editor (WYSIWYG) for blog content
- [ ] Image upload functionality (currently uses external URLs)
- [ ] Blog categories and tags
- [ ] Search functionality for blog posts
- [ ] Comments system
- [ ] Email notifications for form submissions
- [ ] Newsletter subscription
- [ ] Multi-author support with profiles
- [ ] Draft preview before publishing
- [ ] Scheduled post publishing
- [ ] Post analytics (views, engagement)
- [ ] **Automatic AI optimization hooks** (currently manual via button)
- [ ] Rate limiting for AI Q&A endpoint
- [ ] AI optimization cost tracking

## Recommended Next Steps

### 🚀 Immediate Actions (Do This Week!)
1. **Enable OpenAI API Billing**: Activate AI optimization features → https://platform.openai.com/account/billing
2. **Set Up Analytics**: 
   - Google Analytics 4 → https://analytics.google.com
   - Microsoft Clarity → https://clarity.microsoft.com
   - Cloudflare Web Analytics (built-in)
3. **Submit Sitemaps**:
   - Google Search Console → https://search.google.com/search-console
   - Bing Webmaster Tools → https://www.bing.com/webmasters
   - Sitemap URL: `https://investaycapital.com/sitemap.xml`
4. **Test AI Optimization**: Use admin panel to optimize existing 2 blog posts
5. **Change Admin Password**: Update default password for security

### 📊 Marketing & Promotion (Week 1-2)
See **TOOLS_AND_MARKETING_GUIDE.md** for comprehensive strategy including:
- Free tools for analytics, SEO, email, and social media
- Content marketing calendar (2 posts/week)
- LinkedIn B2B strategy (primary channel)
- Twitter/X engagement tactics
- Hotel industry event opportunities
- Investor outreach strategies
- Partnership opportunities
- Paid advertising recommendations

### Medium Term (1-2 weeks)
1. **Rich Text Editor**: Integrate TinyMCE or Quill for easier content editing
2. **Image Upload**: Add Cloudflare R2 integration for image storage
3. **Categories**: Implement blog categorization
4. **Search**: Add blog post search functionality
5. **Email Integration**: Connect contact forms to email service (Formspree/Mailchimp)

### Long Term (1+ months)
1. **CMS Expansion**: Add more content types (case studies, whitepapers)
2. **Multi-language**: Support for international audiences
3. **Comments**: Add moderated comment system
4. **Newsletter**: Email subscription and newsletter management
5. **API Documentation**: Create public API docs
6. **Performance**: Implement caching and CDN optimization

## Project Structure
```
webapp/
├── src/
│   ├── index.tsx              # Main Hono app with all routes
│   ├── pages/
│   │   └── home.tsx           # Homepage component
│   └── routes/
│       ├── blog.ts            # Public blog API routes
│       └── admin.ts           # Admin API routes (CRUD + auth)
├── public/
│   └── static/
│       ├── styles.css         # Main stylesheet
│       ├── admin.css          # Admin-specific styles
│       ├── app.js             # Frontend JavaScript
│       ├── admin-login.js     # Admin login handler
│       └── admin-dashboard.js # Admin dashboard logic
├── migrations/
│   └── 0001_initial_blog_schema.sql  # Database schema
├── .wrangler/
│   └── state/v3/d1/           # Local D1 database files
├── dist/                      # Build output
├── ecosystem.config.cjs       # PM2 configuration
├── package.json               # Dependencies and scripts
├── wrangler.jsonc            # Cloudflare configuration
└── README.md                  # This file
```

## Security Considerations

### Admin Authentication
- ✅ Password hashing with SHA-256
- ✅ Token-based authentication
- ✅ Login page hidden from search engines (noindex)
- ⚠️ **Default password**: Change immediately in production!

### Recommended Security Improvements
1. **Change Default Password**:
   ```bash
   # Generate new password hash
   echo -n "your-new-password" | sha256sum
   
   # Update in database
   wrangler d1 execute webapp-production --local --command="UPDATE admin_users SET password_hash = 'new-hash' WHERE username = 'admin'"
   ```

2. **Use Environment Variables**: Store sensitive data in `.dev.vars` (local) and Cloudflare Secrets (production)

3. **Implement JWT**: Upgrade from basic token to proper JWT with expiration

4. **Add Rate Limiting**: Prevent brute force attacks on login

5. **HTTPS Only**: Cloudflare Pages provides this automatically

## Deployment Status
- **Platform**: Cloudflare Pages
- **Status**: ✅ Ready to Deploy
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x+
- **Database**: D1 (requires setup before deployment)

## Environment Variables

### Required for AI Features
- `OPENAI_API_KEY` - Your OpenAI API key for AI optimization features

### Setup

**Local Development** (`.dev.vars` file):
```bash
OPENAI_API_KEY=sk-...your-key-here...
```

**Production** (Cloudflare Pages Secrets):
```bash
npx wrangler pages secret put OPENAI_API_KEY --project-name webapp
```

**Note**: AI features are optional. Without `OPENAI_API_KEY`, blog system works normally but AI optimization will fail gracefully.

## Admin Credentials
- **Username**: `admin`
- **Password**: `investay2025`
- **⚠️ IMPORTANT**: Change password after first login!

## Last Updated
2025-12-23

## 📚 Additional Documentation
- **AI_FEATURES_GUIDE.md** - Complete guide to AI optimization features
- **AI_IMPLEMENTATION_SUMMARY.md** - Technical implementation details
- **TOOLS_AND_MARKETING_GUIDE.md** - Comprehensive marketing and promotion strategy
- **MARKETING_STRATEGY.md** - Strategic marketing approach
- **TESTING_GUIDE.md** - Testing procedures for all features

---

## Quick Start Guide

### First Time Setup
```bash
cd /home/user/webapp
npm install
npm run build
npm run db:migrate:local
pm2 start ecosystem.config.cjs
```

### Access Points
- Main site: http://localhost:3000
- Blog: http://localhost:3000/blog
- Admin: http://localhost:3000/admin

### Create Your First Post
1. Go to http://localhost:3000/admin
2. Login: admin / investay2025
3. Click "Create New Post"
4. Fill in title, content, and SEO fields
5. Set status to "Published"
6. Click "Save Post"
7. Visit /blog to see your post!

---

**Note**: This is an institutional-grade website with full CMS capabilities. All content is professionally designed for financial and hospitality sectors. The blog system provides enterprise-level SEO optimization out of the box.
