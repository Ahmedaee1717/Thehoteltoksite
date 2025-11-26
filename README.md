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
| Path | Method | Description |
|------|--------|-------------|
| `/api/blog` | GET | Get all published posts (JSON) |
| `/api/blog/:slug` | GET | Get single published post (JSON) |
| `/api/admin/login` | POST | Admin login |
| `/api/admin/posts` | GET | Get all posts (including drafts) |
| `/api/admin/posts` | POST | Create new post |
| `/api/admin/posts/:id` | GET | Get single post by ID |
| `/api/admin/posts/:id` | PUT | Update post |
| `/api/admin/posts/:id` | DELETE | Delete post |

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

## Recommended Next Steps

### Short Term (Immediate)
1. **Content Creation**: Create 3-5 initial blog posts via admin
2. **SEO Audit**: Ensure all meta tags are properly filled
3. **Image Assets**: Prepare featured images for posts (1200x630px)
4. **Admin Security**: Change default admin password
5. **Production Deployment**: Deploy to Cloudflare Pages

### Medium Term (1-2 weeks)
1. **Rich Text Editor**: Integrate TinyMCE or Quill for easier content editing
2. **Image Upload**: Add Cloudflare R2 integration for image storage
3. **Categories**: Implement blog categorization
4. **Search**: Add blog post search functionality
5. **Analytics**: Integrate Google Analytics or Plausible
6. **Email Integration**: Connect contact forms to email service

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
None required for current implementation. All configuration in `wrangler.jsonc`.

## Admin Credentials
- **Username**: `admin`
- **Password**: `investay2025`
- **⚠️ IMPORTANT**: Change password after first login!

## Last Updated
2025-11-26

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
