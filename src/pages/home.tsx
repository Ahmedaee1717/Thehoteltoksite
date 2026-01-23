import { Context } from 'hono'

export const homePage = (c: Context) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Investay Capital - Institutional Infrastructure for Hospitality</title>
        <meta name="description" content="Investay Capital builds institutional-grade digital infrastructure for the hospitality sector. Finance-first frameworks for hotel inventory tokenization and room-night digital assets.">
        <meta name="keywords" content="institutional infrastructure, hospitality investment, hotel tokenization, digital assets, blockchain infrastructure, real world assets">
        
        <!-- Open Graph -->
        <meta property="og:title" content="Investay Capital - Institutional Infrastructure for Hospitality">
        <meta property="og:description" content="Building institutional-grade digital infrastructure for hotel groups and institutional partners.">
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://investaycapital.com">
        <meta property="og:image" content="https://investaycapital.com/static/og-default.jpg">
        
        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="Investay Capital - Institutional Infrastructure">
        <meta name="twitter:description" content="Finance-first digital infrastructure for hospitality.">
        
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/static/styles.css">
        <link rel="canonical" href="https://investaycapital.com">
        
        <!-- Cloudflare Web Analytics (Privacy-friendly, no cookies) -->
        <!-- ENABLED: Token will be auto-injected by Cloudflare Pages -->
        <script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
                data-cf-beacon='{"token": "REPLACE_WITH_YOUR_TOKEN"}'></script>
        
        <!-- Alternative: Google Analytics 4 (if you prefer) -->
        <!-- Replace GA_MEASUREMENT_ID with your actual ID -->
        <!-- 
        <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'GA_MEASUREMENT_ID');
        </script>
        -->
        
        <!-- Microsoft Clarity: Replace PROJECT_ID with your actual ID -->
        <!-- 
        <script type="text/javascript">
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "PROJECT_ID");
        </script>
        -->
    </head>
    <body>
        <!-- Animated Background -->
        <div class="background-grid"></div>
        
        <!-- Header -->
        <header id="header" class="premium-header">
            <div class="container">
                <div class="logo">
                    <span class="logo-icon">◆</span>
                    <span class="logo-text">INVESTAY CAPITAL</span>
                </div>
                <nav class="premium-nav">
                    <a href="#about">About</a>
                    <a href="#investors">Investors</a>
                    <a href="#hotels">Hotels</a>
                    <a href="/blog">Insights</a>
                    <a href="#contact" class="nav-cta">Contact</a>
                </nav>
            </div>
        </header>

        <!-- Hero Section -->
        <section id="hero" class="premium-hero">
            <div class="hero-background">
                <div class="hero-overlay"></div>
            </div>
            <div class="container">
                <div class="hero-content">
                    <div class="hero-badge fade-in-up">INSTITUTIONAL INFRASTRUCTURE</div>
                    <h1 class="hero-headline fade-in-up delay-1">
                        Redefining Hospitality<br/>
                        <span class="hero-accent">Asset Infrastructure</span>
                    </h1>
                    <p class="hero-subheadline fade-in-up delay-2">
                        Investay Capital architects institutional-grade digital frameworks that unlock<br/>
                        unprecedented value from hotel room-night inventory through blockchain-enabled infrastructure.
                    </p>
                    <div class="hero-cta fade-in-up delay-3">
                        <a href="#investors" class="btn btn-premium-primary">
                            <span>Investor Relations</span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M1 8h14M8 1l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </a>
                        <a href="#hotels" class="btn btn-premium-secondary">
                            <span>Hotel Partnerships</span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M1 8h14M8 1l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </a>
                    </div>
                </div>
                
                <div class="metrics-row fade-in-up delay-4">
                    <div class="metric">
                        <div class="metric-icon">◆</div>
                        <div class="metric-text">Institutional-Grade Infrastructure</div>
                    </div>
                    <div class="metric">
                        <div class="metric-icon">◆</div>
                        <div class="metric-text">Real Hospitality Assets</div>
                    </div>
                    <div class="metric">
                        <div class="metric-icon">◆</div>
                        <div class="metric-text">Blockchain-Enabled Architecture</div>
                    </div>
                    <div class="metric">
                        <div class="metric-icon">◆</div>
                        <div class="metric-text">Finance-First Design</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- About Section -->
        <section id="about" class="premium-section">
            <div class="container">
                <div class="section-header">
                    <div class="section-label">WHO WE ARE</div>
                    <h2 class="section-title">Institutional Infrastructure<br/>for Digital Hospitality Assets</h2>
                </div>
                
                <div class="about-content">
                    <div class="about-main">
                        <p class="lead-text">
                            Investay Capital creates sophisticated digital frameworks for room-night assets, enabling 
                            hotel groups and institutional partners to access new forms of value and liquidity.
                        </p>
                        <p>
                            We use blockchain technology solely as infrastructure—providing transparency, enforceability, 
                            and transferability without the noise of typical Web3 projects. Our approach combines deep 
                            hospitality expertise, legal-technology integration, and capital markets design.
                        </p>
                        <p>
                            Built for institutional counterparties who demand professional standards, regulatory compliance, 
                            and operational certainty in digital asset frameworks.
                        </p>
                    </div>
                    
                    <div class="about-pillars">
                        <div class="pillar-card">
                            <div class="pillar-number">01</div>
                            <h3>Hospitality Expertise</h3>
                            <p>Deep operational understanding of hotel economics, distribution, and asset management.</p>
                        </div>
                        <div class="pillar-card">
                            <div class="pillar-number">02</div>
                            <h3>Legal Architecture</h3>
                            <p>Enforceable frameworks designed with institutional legal standards and compliance.</p>
                        </div>
                        <div class="pillar-card">
                            <div class="pillar-number">03</div>
                            <h3>Capital Markets</h3>
                            <p>Structured products designed for institutional investors and professional allocators.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- For Investors Section -->
        <section id="investors" class="premium-section dark-section">
            <div class="container">
                <div class="section-header">
                    <div class="section-label">FOR INSTITUTIONAL INVESTORS</div>
                    <h2 class="section-title">Access Real-World Asset<br/>Infrastructure Opportunities</h2>
                </div>
                
                <div class="benefits-grid premium-grid">
                    <div class="premium-card">
                        <div class="card-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <rect x="4" y="4" width="24" height="24" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M4 12h24M12 4v24" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <h3>Hotel-Backed Digital Assets</h3>
                        <p>Frameworks anchored to real hospitality inventory with transparent operational models and verifiable economic structures.</p>
                    </div>
                    <div class="premium-card">
                        <div class="card-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <circle cx="16" cy="16" r="12" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M16 8v8l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <h3>Transparent Infrastructure</h3>
                        <p>Enforceable digital architecture with clear legal foundations, institutional standards, and auditable frameworks.</p>
                    </div>
                    <div class="premium-card">
                        <div class="card-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M8 16l6 6 10-12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <rect x="4" y="4" width="24" height="24" rx="2" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <h3>Institutional Compliance</h3>
                        <p>Built with regulatory awareness, institutional-grade documentation, and legal enforceability at every layer.</p>
                    </div>
                    <div class="premium-card">
                        <div class="card-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M16 4L4 10l12 6 12-6-12-6zM4 22l12 6 12-6M4 16l12 6 12-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h3>Structured RWA Frameworks</h3>
                        <p>Designed for funds and allocators exploring institutional opportunities in the real-world asset space.</p>
                    </div>
                </div>
                
                <div class="cta-box">
                    <div class="cta-box-content">
                        <h3>Institutional Inquiry</h3>
                        <p>Structured room-night models, digital asset architecture, and institutional frameworks for partners evaluating RWA markets.</p>
                    </div>
                    <a href="#investors-form" class="btn btn-premium-outline">Schedule Consultation</a>
                </div>
                
                <div class="form-container premium-form" id="investors-form">
                    <div class="form-header">
                        <h3>Investor Relations</h3>
                        <p>For institutional investors, family offices, and professional allocators</p>
                    </div>
                    <form id="investor-form" class="contact-form">
                        <div class="form-row">
                            <input type="text" name="name" placeholder="Full Name" required>
                            <input type="email" name="email" placeholder="Institutional Email" required>
                        </div>
                        <div class="form-row">
                            <input type="text" name="organisation" placeholder="Organisation / Fund" required>
                            <input type="text" name="role" placeholder="Title / Role" required>
                        </div>
                        <textarea name="message" placeholder="Brief description of interest and investment focus" rows="5" required></textarea>
                        <button type="submit" class="btn btn-premium-primary">
                            <span>Submit Inquiry</span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M1 8h14M8 1l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <div class="form-success" id="investor-success">Thank you. We will be in touch shortly.</div>
                    </form>
                </div>
            </div>
        </section>

        <!-- For Hotel Owners Section -->
        <section id="hotels" class="premium-section">
            <div class="container">
                <div class="section-header">
                    <div class="section-label">FOR HOTEL GROUPS & OPERATORS</div>
                    <h2 class="section-title">Unlock New Value from<br/>Room-Night Inventory</h2>
                </div>
                
                <div class="benefits-grid premium-grid">
                    <div class="premium-card">
                        <div class="card-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                <circle cx="16" cy="16" r="12" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <h3>Additional Value Pathways</h3>
                        <p>Create new value from future room-night inventory without disrupting existing revenue channels or OTA relationships.</p>
                    </div>
                    <div class="premium-card">
                        <div class="card-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <rect x="6" y="6" width="20" height="20" rx="2" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M6 12h20M12 6v20" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <h3>Structured Digital Systems</h3>
                        <p>Flexible distribution frameworks built for institutional partners with operational certainty and brand control.</p>
                    </div>
                    <div class="premium-card">
                        <div class="card-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <rect x="4" y="8" width="24" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M10 8V6a2 2 0 012-2h8a2 2 0 012 2v2" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <h3>Brand Safety & Compliance</h3>
                        <p>Frameworks designed to maintain brand standards, regulatory compliance, and operational integrity.</p>
                    </div>
                    <div class="premium-card">
                        <div class="card-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M8 16l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="16" cy="16" r="12" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <h3>Channel Protection</h3>
                        <p>Does not interfere with existing distribution agreements, OTA contracts, or brand partnership structures.</p>
                    </div>
                </div>
                
                <div class="form-container premium-form">
                    <div class="form-header">
                        <h3>Hotel Partnership Inquiry</h3>
                        <p>For hotel groups, independent properties, and hospitality operators</p>
                    </div>
                    <form id="hotel-form" class="contact-form">
                        <div class="form-row">
                            <input type="text" name="name" placeholder="Full Name" required>
                            <input type="text" name="hotel" placeholder="Hotel / Property Group" required>
                        </div>
                        <div class="form-row">
                            <input type="email" name="email" placeholder="Business Email" required>
                            <input type="text" name="location" placeholder="Primary Location / Market" required>
                        </div>
                        <textarea name="message" placeholder="Brief description of property portfolio and interest in digital frameworks" rows="5" required></textarea>
                        <button type="submit" class="btn btn-premium-primary">
                            <span>Submit Inquiry</span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M1 8h14M8 1l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <div class="form-success" id="hotel-success">Thank you. We will be in touch shortly.</div>
                    </form>
                </div>
            </div>
        </section>

        <!-- Contact Section -->
        <section id="contact" class="premium-section dark-section contact-section">
            <div class="container">
                <div class="contact-cta-premium">
                    <div class="contact-header">
                        <div class="section-label">GET IN TOUCH</div>
                        <h2>Private Consultation</h2>
                        <p>Speak with our team to explore partnership opportunities and institutional frameworks.</p>
                    </div>
                    <div class="contact-methods">
                        <a href="mailto:info@investaycapital.com" class="contact-card">
                            <div class="contact-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
                                    <path d="M2 8l10 6 10-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <div class="contact-info">
                                <div class="contact-label">Email</div>
                                <div class="contact-value">info@investaycapital.com</div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="premium-footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-brand">
                        <div class="footer-logo">
                            <span class="logo-icon">◆</span>
                            <span class="logo-text">INVESTAY CAPITAL</span>
                        </div>
                        <p>Institutional infrastructure for digital hospitality assets.</p>
                    </div>
                    <div class="footer-links">
                        <div class="footer-column">
                            <h4>Company</h4>
                            <a href="#about">About</a>
                            <a href="/blog">Insights</a>
                            <a href="#contact">Contact</a>
                        </div>
                        <div class="footer-column">
                            <h4>Partners</h4>
                            <a href="#investors">Investors</a>
                            <a href="#hotels">Hotels</a>
                        </div>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; 2025 Investay Capital. All rights reserved.</p>
                    <p class="disclaimer">Informational overview only. Not an offering or solicitation.</p>
                </div>
            </div>
        </footer>

        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
}
