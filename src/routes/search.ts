import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const search = new Hono<{ Bindings: Bindings }>()

// REAL WEB SEARCH - Actually scrapes and finds emails
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
    let companyInfo = {
      abstract: '',
      abstractURL: '',
      website: domain ? `https://${domain}` : null
    }

    // STEP 1: Try to scrape the company website directly
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
          
          // Extract emails from HTML using regex
          const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
          const foundEmails = html.match(emailRegex) || []
          
          // Filter out common false positives
          const validEmails = foundEmails.filter(email => {
            const lower = email.toLowerCase()
            return !lower.includes('example.com') &&
                   !lower.includes('sentry.io') &&
                   !lower.includes('wordpress.org') &&
                   !lower.includes('schema.org') &&
                   !lower.includes('w3.org') &&
                   email.includes(domain.split('.')[0]) // Must contain company name
          })
          
          // Deduplicate and prioritize
          realEmails = Array.from(new Set(validEmails))
          console.log(`✅ Found ${realEmails.length} real emails from website:`, realEmails)
          
          // Extract meta description for context
          const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
          if (metaMatch) {
            companyInfo.abstract = metaMatch[1]
          }
        }
      } catch (websiteError) {
        console.error('Website fetch failed:', websiteError)
      }
    }

    // STEP 2: Try DuckDuckGo for additional context
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

    // STEP 3: Build final email list
    let suggestedEmails: string[] = []
    
    if (realEmails.length > 0) {
      // Use REAL scraped emails first!
      suggestedEmails = realEmails.slice(0, 8)
      console.log('🎯 Using REAL scraped emails:', suggestedEmails)
    } else {
      // Fallback: Generate smart patterns based on domain
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
      scrapedEmails: realEmails.length, // How many were actually found
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
    
    console.log('📧 Final result:', result)
    return c.json(result)
    
  } catch (error) {
    console.error('Search API error:', error)
    return c.json({ 
      error: 'Search failed', 
      details: error.message,
      suggestedEmails: generateEmailSuggestions(c.req.query('q') || '', null)
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
