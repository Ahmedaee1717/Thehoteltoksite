# Investay Capital - Institutional Infrastructure Website

## Project Overview
- **Name**: Investay Capital
- **Goal**: Professional single-page website for institutional investors and hotel partners
- **Purpose**: Informational presence with contact forms (no financial offerings or performance claims)

## URLs
- **Development**: https://3000-ivn8as47qxbnu8dje62yt-0e616f0a.sandbox.novita.ai
- **Production**: (Deploy with `npm run deploy`)

## Currently Completed Features

### ✅ All Required Sections Implemented
1. **Header**: Sticky navigation with logo and anchor links
2. **Hero Section**: Large headline, subheadline, dual CTAs, credibility statements
3. **About Section**: Corporate messaging about digital frameworks
4. **For Investors Section**: Benefits grid, subsection text, inquiry form
5. **For Hotel Owners Section**: Benefits grid, partnership form
6. **Contact/CTA Section**: Private consultation messaging
7. **Footer**: Copyright and disclaimer text

### ✅ Design & Branding
- Dark, elegant theme (similar to Blackstone, KKR, Brookfield aesthetic)
- Premium minimalistic layout
- Clean serif (Playfair Display) + sans-serif (Inter) typography
- Institutional, discreet, high-end styling
- Fully responsive design

### ✅ Interactive Features
- Smooth scroll navigation
- Form submissions with console logging
- Success message display after form submission
- Parallax effects on hero section
- Fade-in animations on scroll
- Header scroll effects

### ✅ Compliance Requirements Met
- No numbers (returns, minimums, horizons)
- No investment offer language
- No token sale language
- No risk disclosures
- No financial guarantees or performance statements
- Pure informational focus

## Functional Entry URIs

### Main Page
- **Path**: `/`
- **Method**: GET
- **Description**: Single-page application with all sections

### Anchor Navigation
- `#about` - About section
- `#investors` - For Investors section with form
- `#hotels` - For Hotel Owners section with form
- `#contact` - Contact CTA section

### Static Assets
- `/static/styles.css` - Main stylesheet
- `/static/app.js` - Frontend JavaScript

## Data Architecture

### Forms
Two contact forms with client-side handling:

1. **Investor Form** (`#investor-form`)
   - Fields: Name, Work Email, Organisation, Message
   - Action: Console log + success message

2. **Hotel Form** (`#hotel-form`)
   - Fields: Name, Hotel/Group, Email, Location, Message
   - Action: Console log + success message

### Storage
- No database (informational site only)
- Form data logged to browser console
- Ready to integrate with backend API if needed

## Tech Stack
- **Framework**: Hono (Cloudflare Workers)
- **Deployment**: Cloudflare Pages
- **Styling**: Custom CSS with CSS Grid/Flexbox
- **Typography**: Google Fonts (Inter + Playfair Display)
- **Build Tool**: Vite
- **Process Manager**: PM2 (development)

## Features Not Yet Implemented
- [ ] Backend API for form submission storage
- [ ] Email notifications for form submissions
- [ ] CMS integration for content management
- [ ] Multi-language support
- [ ] Analytics integration
- [ ] SEO metadata optimization
- [ ] Mobile navigation menu (hamburger for very small screens)

## Recommended Next Steps

### Short Term
1. **Form Backend**: Integrate form submissions with email service (SendGrid, Mailgun) or store in Cloudflare D1
2. **Analytics**: Add Google Analytics or Plausible for visitor tracking
3. **SEO**: Add meta tags, Open Graph tags, structured data
4. **Favicon**: Add company favicon and app icons

### Medium Term
1. **CMS**: Integrate with headless CMS for easy content updates
2. **Blog Section**: Add insights/news section for thought leadership
3. **Case Studies**: Add detailed case study pages (if approved)
4. **Team Page**: Add team member profiles (if desired)

### Long Term
1. **Investor Portal**: Protected area for existing partners
2. **Document Library**: Secure document sharing for qualified parties
3. **Multi-language**: Support for international audiences
4. **A/B Testing**: Optimize conversion rates

## User Guide

### For Visitors
1. Navigate using the top menu or scroll through sections
2. Click "For Investors" or "For Hotels" CTAs in hero section
3. Fill out relevant inquiry form in your section
4. Check browser console to see form submission data (demo mode)
5. Email directly via info@investaycapital.com link

### For Developers
1. **Local Development**: 
   ```bash
   npm run build
   pm2 start ecosystem.config.cjs
   ```

2. **View Logs**: 
   ```bash
   pm2 logs investay-capital --nostream
   ```

3. **Stop Service**: 
   ```bash
   pm2 stop investay-capital
   ```

4. **Deploy to Production**:
   ```bash
   npm run deploy
   ```

## Deployment

- **Platform**: Cloudflare Pages
- **Status**: ✅ Active (Development)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x+

### Environment Variables
None required for current implementation.

## Project Structure
```
webapp/
├── src/
│   └── index.tsx           # Main Hono application
├── public/
│   └── static/
│       ├── styles.css      # Main stylesheet
│       └── app.js          # Frontend JavaScript
├── dist/                   # Build output
├── ecosystem.config.cjs    # PM2 configuration
├── package.json
├── vite.config.ts
├── wrangler.jsonc         # Cloudflare configuration
└── README.md
```

## Last Updated
2025-11-26

---

**Note**: This is an informational website only. All content is for general information purposes and does not constitute financial advice, investment solicitation, or an offer to sell securities.
