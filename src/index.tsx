import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Investay Capital - Institutional Infrastructure for Hospitality</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/static/styles.css">
    </head>
    <body>
        <!-- Header -->
        <header id="header">
            <div class="container">
                <div class="logo">Investay Capital</div>
                <nav>
                    <a href="#about">About</a>
                    <a href="#investors">For Investors</a>
                    <a href="#hotels">For Hotel Owners</a>
                    <a href="#contact">Contact</a>
                </nav>
            </div>
        </header>

        <!-- Hero Section -->
        <section id="hero">
            <div class="container">
                <h1 class="hero-headline">Institutional Infrastructure for the Future of Hospitality.</h1>
                <p class="hero-subheadline">
                    Investay Capital builds digital systems that allow hotel groups and institutional partners 
                    to unlock new value from room-night inventory using blockchain-enabled infrastructure.
                </p>
                <div class="hero-cta">
                    <a href="#investors" class="btn btn-primary">For Investors</a>
                    <a href="#hotels" class="btn btn-secondary">For Hotels</a>
                </div>
                <div class="credibility-row">
                    <div class="credibility-item">
                        <span>Real hospitality assets</span>
                    </div>
                    <div class="credibility-item">
                        <span>Legally enforceable digital frameworks</span>
                    </div>
                    <div class="credibility-item">
                        <span>Finance-first, crypto-enabled</span>
                    </div>
                    <div class="credibility-item">
                        <span>Built for institutional scale</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- About Section -->
        <section id="about">
            <div class="container">
                <div class="section-content">
                    <h2>About Investay Capital</h2>
                    <div class="about-text">
                        <p>
                            Investay Capital creates digital frameworks for room-night assets, enabling hotel 
                            groups and institutional partners to access new forms of value and liquidity.
                        </p>
                        <p>
                            We use blockchain technology solely as infrastructure—providing transparency, 
                            enforceability, and transferability without the noise of typical Web3 projects.
                        </p>
                        <p>
                            Our approach combines deep hospitality expertise, legal-technology integration, 
                            and capital markets design to deliver institutional-grade solutions built for 
                            professional counterparties.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- For Investors Section -->
        <section id="investors">
            <div class="container">
                <div class="section-content">
                    <h2>For Investors</h2>
                    <div class="benefits-grid">
                        <div class="benefit-card">
                            <h3>Hotel-Backed Digital Assets</h3>
                            <p>Access to frameworks backed by real hospitality inventory and operational models.</p>
                        </div>
                        <div class="benefit-card">
                            <h3>Transparent Infrastructure</h3>
                            <p>Enforceable digital architecture with clear legal foundations and institutional standards.</p>
                        </div>
                        <div class="benefit-card">
                            <h3>Institutional Legal Principles</h3>
                            <p>Built with compliance, enforceability, and institutional-grade documentation.</p>
                        </div>
                        <div class="benefit-card">
                            <h3>Real-World Asset Frameworks</h3>
                            <p>Designed for funds exploring structured opportunities in the RWA space.</p>
                        </div>
                    </div>
                    <div class="subsection">
                        <p class="subsection-text">
                            We provide structured room-night models, digital asset architecture, and 
                            institutional-grade frameworks for partners evaluating real-world asset markets.
                        </p>
                    </div>
                    <div class="form-container">
                        <h3>Investor Inquiry</h3>
                        <form id="investor-form" class="contact-form">
                            <input type="text" name="name" placeholder="Name" required>
                            <input type="email" name="email" placeholder="Work Email" required>
                            <input type="text" name="organisation" placeholder="Organisation" required>
                            <textarea name="message" placeholder="Message" rows="4" required></textarea>
                            <button type="submit" class="btn btn-primary">Submit Inquiry</button>
                            <div class="form-success" id="investor-success">Message received.</div>
                        </form>
                    </div>
                </div>
            </div>
        </section>

        <!-- For Hotel Owners Section -->
        <section id="hotels">
            <div class="container">
                <div class="section-content">
                    <h2>For Hotel Owners</h2>
                    <div class="benefits-grid">
                        <div class="benefit-card">
                            <h3>Unlock Additional Value</h3>
                            <p>Create new value pathways from future room-night inventory without diluting existing channels.</p>
                        </div>
                        <div class="benefit-card">
                            <h3>Structured Digital Systems</h3>
                            <p>Flexible distribution frameworks built for institutional partners and operational certainty.</p>
                        </div>
                        <div class="benefit-card">
                            <h3>Compliance & Brand Safety</h3>
                            <p>Frameworks designed to maintain brand standards and regulatory compliance.</p>
                        </div>
                        <div class="benefit-card">
                            <h3>Existing Agreements Protected</h3>
                            <p>Does not interfere with current OTA relationships or brand distribution agreements.</p>
                        </div>
                    </div>
                    <div class="form-container">
                        <h3>Hotel Partnership Inquiry</h3>
                        <form id="hotel-form" class="contact-form">
                            <input type="text" name="name" placeholder="Name" required>
                            <input type="text" name="hotel" placeholder="Hotel / Group" required>
                            <input type="email" name="email" placeholder="Email" required>
                            <input type="text" name="location" placeholder="Location" required>
                            <textarea name="message" placeholder="Message" rows="4" required></textarea>
                            <button type="submit" class="btn btn-primary">Submit Inquiry</button>
                            <div class="form-success" id="hotel-success">Message received.</div>
                        </form>
                    </div>
                </div>
            </div>
        </section>

        <!-- Contact/CTA Section -->
        <section id="contact">
            <div class="container">
                <div class="contact-cta">
                    <h2>Private Consultation</h2>
                    <p>Speak with our team to explore partnership opportunities.</p>
                    <a href="mailto:info@investaycapital.com" class="btn btn-primary">info@investaycapital.com</a>
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
  `)
})

export default app
