# Investay Capital Blog Admin Guide

## Quick Access

### URLs
- **Main Website**: https://3000-ivn8as47qxbnu8dje62yt-0e616f0a.sandbox.novita.ai
- **Blog Listing**: https://3000-ivn8as47qxbnu8dje62yt-0e616f0a.sandbox.novita.ai/blog
- **Admin Login**: https://3000-ivn8as47qxbnu8dje62yt-0e616f0a.sandbox.novita.ai/admin

### Admin Credentials
- **Username**: `admin`
- **Password**: `investay2025`

---

## Admin Dashboard Features

### Main Menu
- **Blog Posts**: View all posts (drafts, published, archived)
- **New Post**: Create a new blog post
- **Settings**: Future settings management
- **View Blog**: Opens public blog in new tab
- **Logout**: Sign out of admin panel

---

## Creating a Blog Post

### Step 1: Access Dashboard
1. Go to `/admin`
2. Login with credentials above
3. Click "Create New Post" or "New Post" in sidebar

### Step 2: Basic Information
| Field | Required | Description |
|-------|----------|-------------|
| **Title** | ✅ Yes | Main headline for the post |
| **Slug** | ✅ Yes | Auto-generated URL-friendly version |
| **Author** | ✅ Yes | Default: "Investay Capital" |
| **Excerpt** | ❌ No | Short summary (shown on listing pages) |
| **Featured Image** | ❌ No | URL to header image |

**Title Tips:**
- Clear, descriptive headlines
- 50-60 characters ideal
- Include key topic/keywords

**Slug Tips:**
- Auto-generated from title
- Can be edited for SEO
- Use hyphens, no spaces
- Keep short and descriptive

### Step 3: Content
| Field | Required | Description |
|-------|----------|-------------|
| **Content** | ✅ Yes | Full article text (HTML supported) |

**Content Tips:**
- HTML tags are supported
- Use `<h2>` for section headings
- Use `<h3>` for sub-headings
- Use `<p>` for paragraphs
- Use `<ul>` and `<li>` for lists
- Use `<strong>` for bold text
- Use `<em>` for italic text
- Use `<a href="...">` for links

**Example Content:**
```html
<h2>Introduction</h2>
<p>This is the opening paragraph of the article.</p>

<h2>Key Points</h2>
<ul>
  <li>First important point</li>
  <li>Second important point</li>
  <li>Third important point</li>
</ul>

<h3>Detailed Analysis</h3>
<p>More detailed information here with <strong>important terms</strong> highlighted.</p>

<p>Learn more about our <a href="/about">approach</a>.</p>
```

### Step 4: SEO Optimization
| Field | Required | Description | Recommendations |
|-------|----------|-------------|-----------------|
| **Meta Title** | ❌ No | Search result title | 50-60 chars, include keywords |
| **Meta Description** | ❌ No | Search result summary | 150-160 chars, compelling copy |
| **Meta Keywords** | ❌ No | Search keywords | 5-10 keywords, comma-separated |
| **OG Image** | ❌ No | Social media image | 1200x630px recommended |

**SEO Best Practices:**

1. **Meta Title**:
   - If empty, uses post title
   - Should be unique per post
   - Include primary keyword
   - Example: "Institutional Infrastructure for Hospitality - Key Insights"

2. **Meta Description**:
   - If empty, uses excerpt or first 155 chars of content
   - Write compelling copy that encourages clicks
   - Include call-to-action
   - Example: "Discover how institutional-grade digital frameworks are transforming hospitality asset management. Learn about blockchain infrastructure, tokenization, and new value pathways."

3. **Meta Keywords**:
   - Comma-separated list
   - Include synonyms and related terms
   - Don't stuff keywords
   - Example: "hospitality infrastructure, hotel tokenization, digital assets, blockchain, institutional investment, RWA, real estate technology"

4. **OG Image**:
   - If empty, uses featured image
   - Optimal size: 1200x630 pixels
   - Shows when shared on social media
   - Use high-quality, professional images

### Step 5: Publishing
| Status | Description |
|--------|-------------|
| **Draft** | Not visible to public, work in progress |
| **Published** | Live on website, visible to everyone |
| **Archived** | Hidden but preserved for future reference |

**Publishing Workflow:**
1. Start as **Draft** while writing
2. Fill in all SEO fields
3. Preview content formatting
4. Change status to **Published**
5. Click "Save Post"
6. Visit `/blog` to see live post

---

## Managing Existing Posts

### Viewing All Posts
1. From dashboard, click "Blog Posts" in sidebar
2. See all posts with:
   - Title
   - Author
   - Date created
   - Status badge (Draft/Published/Archived)
   - Edit and Delete buttons

### Editing a Post
1. Click "Edit" button on any post
2. Modify any fields
3. Click "Save Post"
4. Post updates immediately

### Deleting a Post
1. Click "Edit" button on post
2. Scroll to bottom
3. Click "Delete Post" (red button)
4. Confirm deletion
5. Post permanently removed

---

## Content Guidelines

### Tone & Style
- **Professional**: Institutional, corporate tone
- **Discreet**: Avoid hype, focus on substance
- **Finance-First**: Emphasize financial infrastructure, not technology
- **Credible**: Use specific examples, avoid vague claims

### Compliance Rules
- ❌ **NO** investment performance numbers
- ❌ **NO** guaranteed returns or promises
- ❌ **NO** token sale language
- ❌ **NO** financial advice
- ✅ **YES** to educational content
- ✅ **YES** to industry insights
- ✅ **YES** to framework explanations
- ✅ **YES** to market observations

### Content Topics (Approved)
- Institutional infrastructure frameworks
- Hospitality technology integration
- Digital asset architecture
- Legal-technology frameworks
- Market observations and trends
- Partnership announcements
- Company updates
- Industry analysis

### Content Topics (Avoid)
- Specific investment returns
- Token price speculation
- Regulatory workarounds
- Competitive attacks
- Unverified claims
- Technical jargon without explanation

---

## Image Best Practices

### Featured Images
- **Dimensions**: 1200x800px minimum
- **Format**: JPG or PNG
- **Size**: Under 500KB
- **Subject**: Professional, high-quality photos
- **Sources**: Stock photos (Unsplash, Pexels) or custom photography

### Recommended Image Topics
- Modern architecture
- Hotel interiors (luxury)
- Business meetings
- Financial charts (abstract)
- City skylines
- Professional settings
- Technology infrastructure (clean, minimal)

### Free Image Sources
- Unsplash: https://unsplash.com
- Pexels: https://pexels.com
- Pixabay: https://pixabay.com

### Using Images
1. Find image on stock site
2. Copy image URL (right-click → Copy Image Address)
3. Paste into "Featured Image URL" field
4. Same URL can be used for "OG Image"

---

## Common Tasks

### Create Standard Blog Post
1. Login to admin
2. Click "Create New Post"
3. Title: "Your Blog Title"
4. Content: Write or paste HTML content
5. Excerpt: 1-2 sentence summary
6. Featured Image: Paste image URL
7. Meta Description: Write compelling 150-char summary
8. Meta Keywords: Add 5-10 relevant keywords
9. Status: Published
10. Click "Save Post"

### Update Existing Post
1. Go to "Blog Posts"
2. Find post to edit
3. Click "Edit"
4. Make changes
5. Click "Save Post"

### Hide Post Temporarily
1. Edit the post
2. Change Status from "Published" to "Draft"
3. Click "Save Post"
4. Post removed from public site but preserved

### Archive Old Post
1. Edit the post
2. Change Status to "Archived"
3. Click "Save Post"
4. Post hidden but available for future reference

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save Post | Ctrl+S (when form focused) |
| Cancel Edit | Esc |

---

## Troubleshooting

### Can't Login
- Verify username: `admin`
- Verify password: `investay2025`
- Check caps lock is off
- Clear browser cache
- Try incognito/private window

### Post Not Showing on Blog
- Check Status is set to "Published"
- Save post after changing status
- Refresh browser on `/blog` page
- Check slug doesn't conflict with existing post

### SEO Fields Not Working
- Meta fields are optional
- If empty, system uses defaults
- Changes take effect immediately on save
- Check page source to verify

### Images Not Displaying
- Verify URL is complete (starts with http:// or https://)
- Test image URL in browser
- Ensure image is publicly accessible
- Try different image URL

---

## Support & Questions

For technical support or questions about the blog system:
- Review full README.md in project root
- Check browser console for errors (F12)
- Verify database is connected (check PM2 logs)

---

## Quick Reference Card

**Admin Access**: `/admin`
**Credentials**: admin / investay2025

**Create Post**: Dashboard → New Post → Fill fields → Set Published → Save
**Edit Post**: Blog Posts → Edit → Modify → Save
**Delete Post**: Edit Post → Delete Post button (bottom)

**Required Fields**: Title, Content, Author, Status
**Recommended Fields**: Excerpt, Featured Image, Meta Description, Meta Keywords

**Status Options**: Draft (hidden) | Published (live) | Archived (hidden)

---

Last Updated: 2025-11-26
