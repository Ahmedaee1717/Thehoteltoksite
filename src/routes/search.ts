import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const search = new Hono<{ Bindings: Bindings }>()

// REAL WEB SEARCH - Scrapes emails AND finds contact names automatically
search.get('/contact', async (c) => {
  try {
    const query = c.req.query('q')
    
    if (!query) {
      return c.json({ error: 'Missing query parameter' }, 400)
    }

    console.log('🔍 Searching for:', query)

    // Extract domain from query
    const domainMatch = query.match(/([a-z0-9-]+\.[a-z]{2,})/i)
    const domain = domainMatch ? domainMatch[1].toLowerCase() : null
    
    console.log('🌐 Extracted domain:', domain)

    let realEmails: string[] = []
    let contactNames: string[] = []
    let companyInfo = {
      abstract: '',
      abstractURL: '',
      website: domain ? `https://${domain}` : null
    }

    // VALIDATION HELPER - Define outside so it's reusable
    const skipWords = ['Jetpack', 'WordPress', 'Connect With', 'Follow Us', 'Contact Us', 'About Us', 
                      'Privacy Policy', 'Terms Of', 'All Rights', 'Copyright Notice', 'Verification Tags',
                      'Youtube Become', 'Twitter', 'Facebook', 'LinkedIn', 'Instagram']
    
    const isValidName = (name: string) => {
      // Must be exactly 2 words (First Last)
      const words = name.trim().split(/\s+/)
      if (words.length !== 2) return false
      
      // Each word must start with capital and have lowercase letters
      if (!words.every(w => /^[A-Z][a-z]{1,}$/.test(w))) return false
      
      // No skip words
      if (skipWords.some(skip => name.includes(skip))) return false
      
      // Each word must be at least 2 chars
      if (words.some(w => w.length < 2)) return false
      
      return true
    }

    // STEP 1: Scrape the company website for emails AND contact names
    if (domain) {
      try {
        console.log(`📡 Fetching website: https://${domain}`)
        const websiteResponse = await fetch(`https://${domain}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (websiteResponse.ok) {
          const html = await websiteResponse.text()
          
          // Extract emails from HTML with STRICT validation
          const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
          const foundEmails = html.match(emailRegex) || []
          
          // Filter out false positives with STRICT rules
          const validEmails = foundEmails.filter(email => {
            const lower = email.toLowerCase()
            
            // Must contain the domain name
            if (!email.includes(domain.split('.')[0])) return false
            
            // Block common false positives
            if (lower.includes('example.com') ||
                lower.includes('sentry.io') ||
                lower.includes('wordpress.org') ||
                lower.includes('schema.org') ||
                lower.includes('w3.org')) return false
            
            // Block image files and assets (CRITICAL FIX)
            if (lower.includes('.png') ||
                lower.includes('.jpg') ||
                lower.includes('.jpeg') ||
                lower.includes('.gif') ||
                lower.includes('.svg') ||
                lower.includes('.webp') ||
                lower.includes('.ico') ||
                lower.includes('logo') ||
                lower.includes('image') ||
                lower.includes('gradient') ||
                lower.includes('@2x') ||
                lower.includes('@3x')) return false
            
            // Must have valid TLD
            const tldMatch = email.match(/\.([a-z]{2,})$/i)
            if (!tldMatch) return false
            const tld = tldMatch[1].toLowerCase()
            const validTLDs = ['com', 'org', 'net', 'io', 'co', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'eu']
            if (!validTLDs.includes(tld)) return false
            
            return true
          })
          
          realEmails = Array.from(new Set(validEmails))
          console.log(`✅ Found ${realEmails.length} real emails:`, realEmails)
          
          // EXTRACT CONTACT NAMES with STRICT validation
          // Pattern 1: Look near email addresses for names (most reliable)
          realEmails.forEach(email => {
            const emailContext = html.substring(html.indexOf(email) - 150, html.indexOf(email) + 150)
            const nearbyNames = emailContext.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g) || []
            nearbyNames.forEach(name => {
              if (isValidName(name) && !contactNames.includes(name)) {
                contactNames.push(name)
              }
            })
          })
          
          // Pattern 2: Look for CEO, Founder, CTO, etc.
          const titlePattern = /(?:CEO|CTO|CFO|Founder|Co-founder|Director|Manager|Head of)\s*[:\-–]?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/gi
          const titleMatches = [...html.matchAll(titlePattern)]
          titleMatches.forEach(match => {
            if (match[1] && isValidName(match[1]) && !contactNames.includes(match[1])) {
              contactNames.push(match[1])
            }
          })
          
          console.log(`👤 Found ${contactNames.length} contact names:`, contactNames)
          
          // Extract meta description
          const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
          if (metaMatch) {
            companyInfo.abstract = metaMatch[1]
          }
        }
      } catch (websiteError) {
        console.error('Website fetch failed:', websiteError)
      }
      
      // STEP 2: Try to scrape the /contact or /about page
      if (contactNames.length === 0 || realEmails.length === 0) {
        try {
          const contactPages = [`https://${domain}/contact`, `https://${domain}/about`, `https://${domain}/team`]
          
          for (const pageUrl of contactPages) {
            try {
              console.log(`📡 Trying contact page: ${pageUrl}`)
              const contactResponse = await fetch(pageUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
              })
              
              if (contactResponse.ok) {
                const contactHtml = await contactResponse.text()
                
                // Extract more emails
                const moreEmails = contactHtml.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || []
                moreEmails.forEach(email => {
                  if (!realEmails.includes(email) && email.includes(domain.split('.')[0])) {
                    realEmails.push(email)
                  }
                })
                
                // Extract more names with validation
                const moreNames = contactHtml.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g) || []
                moreNames.slice(0, 10).forEach(name => {
                  if (isValidName(name) && !contactNames.includes(name)) {
                    contactNames.push(name)
                  }
                })
                
                console.log(`✅ Contact page found: ${realEmails.length} emails, ${contactNames.length} names`)
              }
            } catch (pageError) {
              // Try next page
            }
          }
        } catch (contactError) {
          console.error('Contact page fetch failed:', contactError)
        }
      }
    }

    // STEP 3: DuckDuckGo for additional context
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
      const ddgResponse = await fetch(ddgUrl)
      const ddgData = await ddgResponse.json()
      
      if (ddgData.Abstract && !companyInfo.abstract) {
        companyInfo.abstract = ddgData.Abstract
      }
      if (ddgData.AbstractURL && !companyInfo.abstractURL) {
        companyInfo.abstractURL = ddgData.AbstractURL
      }
    } catch (ddgError) {
      console.error('DuckDuckGo fetch failed:', ddgError)
    }

    // STEP 4: Build final email list with smart patterns
    let suggestedEmails: string[] = []
    
    if (realEmails.length > 0) {
      suggestedEmails = realEmails.slice(0, 8)
      console.log('🎯 Using REAL scraped emails:', suggestedEmails)
    } else {
      console.log('⚠️ No real emails found, generating patterns')
      suggestedEmails = generateEmailSuggestions(query, domain)
    }

    const result = {
      query: query,
      domain: domain,
      abstract: companyInfo.abstract || 'No description available',
      abstractURL: companyInfo.abstractURL || (domain ? `https://${domain}` : ''),
      website: companyInfo.website,
      suggestedEmails: suggestedEmails,
      contactNames: contactNames.slice(0, 5), // Return up to 5 contact names
      scrapedEmails: realEmails.length,
      scrapedNames: contactNames.length,
      searchLinks: {
        google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        linkedin: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(domain || query.split(' ')[0])}`,
        twitter: `https://twitter.com/search?q=${encodeURIComponent(domain || query)}`,
        crunchbase: `https://www.crunchbase.com/textsearch?q=${encodeURIComponent(query)}`,
        hunter: domain ? `https://hunter.io/search/${domain}` : `https://hunter.io/search/${encodeURIComponent(query)}`,
        rocketreach: `https://rocketreach.co/search?query=${encodeURIComponent(query)}`,
        website: domain ? `https://${domain}/contact` : null
      }
    }
    
    console.log('📧 Final result:', { emails: result.suggestedEmails.length, names: result.contactNames.length })
    return c.json(result)
    
  } catch (error) {
    console.error('Search API error:', error)
    return c.json({ 
      error: 'Search failed', 
      details: error.message,
      suggestedEmails: generateEmailSuggestions(c.req.query('q') || '', null),
      contactNames: []
    }, 500)
  }
})

// Helper function to generate smart email patterns (fallback only)
function generateEmailSuggestions(query: string, domain: string | null): string[] {
  const suggestions: string[] = []
  
  if (domain) {
    // Priority emails for business domains
    suggestions.push(`hello@${domain}`)
    suggestions.push(`contact@${domain}`)
    suggestions.push(`info@${domain}`)
    suggestions.push(`partnerships@${domain}`)
    suggestions.push(`events@${domain}`)
    suggestions.push(`support@${domain}`)
    suggestions.push(`team@${domain}`)
    suggestions.push(`sales@${domain}`)
    return suggestions
  }
  
  // Extract name/company from query
  const words = query.toLowerCase().split(' ').filter(w => 
    !['contact', 'email', 'address', 'phone', 'info', 'the', 'at'].includes(w)
  )
  
  if (words.length > 0) {
    const mainWord = words[0]
    
    suggestions.push(`hello@${mainWord}.com`)
    suggestions.push(`contact@${mainWord}.com`)
    suggestions.push(`info@${mainWord}.com`)
    suggestions.push(`${mainWord}@${mainWord}.com`)
  }
  
  return suggestions
}

export default search
