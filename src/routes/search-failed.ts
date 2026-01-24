import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const search = new Hono<{ Bindings: Bindings }>()

// REAL WEB SEARCH WITH GOOGLE - Now with 30s CPU time on Workers Paid Plan!
search.get('/contact', async (c) => {
  try {
    const query = c.req.query('q')
    
    if (!query) {
      return c.json({ error: 'Missing query parameter' }, 400)
    }

    console.log('🔍 Searching for:', query)

    // Extract company name FIRST (this is what we'll use for Google Search)
    const companyNameMatch = query.match(/^(.+?)\s+(?:contact|email)/i)
    const companyName = companyNameMatch ? companyNameMatch[1].trim() : query.split(' contact')[0].trim()
    console.log(`🏢 Company name: "${companyName}"`)
    
    // Extract domain from query if explicitly provided
    let domainMatch = query.match(/([a-z0-9-]+\.[a-z]{2,})/i)
    let domain = domainMatch ? domainMatch[1].toLowerCase() : null
    
    console.log('🌐 Domain from query:', domain || 'none')

    // Store emails WITH their source URLs
    let emailsWithSources: Array<{ email: string; source: string }> = []
    let contactNames: string[] = []
    let companyInfo = {
      abstract: '',
      abstractURL: '',
      website: domain ? `https://${domain}` : null
    }
    
    console.log(`📊 Starting search for: "${companyName}" (domain: ${domain || 'unknown'})`)
    
    // ========== STEP 1: GOOGLE SEARCH FOR EMAILS (PRIMARY METHOD - WORKS NOW!) ==========
    console.log('🔍 STEP 1: Google Search for emails (with 30s CPU time!)...')
    try {
      const googleQuery = `${companyName} official contact email address`
      console.log(`📡 Google query: "${googleQuery}"`)
      
      // Use DuckDuckGo HTML search (no API key needed, no rate limits)
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(googleQuery)}`
      const searchResponse = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      })
      
      if (searchResponse.ok) {
        const searchHtml = await searchResponse.text()
        console.log(`✅ Got search results (${searchHtml.length} chars)`)
        
        // Extract ALL emails from search results
        const emailRegex = /\b([A-Za-z0-9][A-Za-z0-9._-]*[A-Za-z0-9])@([A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,})\b/g
        const allEmails = [...searchHtml.matchAll(emailRegex)].map(m => m[0])
        console.log(`📧 Found ${allEmails.length} emails in search results`)
        
        if (allEmails.length > 0) {
          // SMART FILTER: Keep emails that match the company name
          const companyKeyword = companyName.toLowerCase().replace(/\s+/g, '').slice(0, 8)
          const relevantEmails = allEmails.filter(email => {
            const emailLower = email.toLowerCase().replace(/[.\-]/g, '')
            return emailLower.includes(companyKeyword)
          })
          
          console.log(`🎯 Filtered to ${relevantEmails.length} relevant emails:`, relevantEmails)
          
          // Add unique emails
          const uniqueEmails = Array.from(new Set(relevantEmails))
          uniqueEmails.forEach(email => {
            if (!emailsWithSources.find(e => e.email === email)) {
              emailsWithSources.push({ 
                email, 
                source: `Found via Google Search: "${googleQuery}"` 
              })
            }
          })
          
          // Extract domain from found emails if we don't have one yet
          if (!domain && uniqueEmails.length > 0) {
            const emailDomain = uniqueEmails[0].split('@')[1]
            domain = emailDomain
            companyInfo.website = `https://${domain}`
            console.log(`✅ Extracted domain from email: ${domain}`)
          }
        }
      } else {
        console.log(`⚠️ Search response status: ${searchResponse.status}`)
      }
    } catch (searchError) {
      console.error('❌ Google search failed:', searchError)
    }
    
    console.log(`📊 After Google Search: ${emailsWithSources.length} emails, domain: ${domain || 'none'}`)
    
    // ========== STEP 2: DOMAIN DISCOVERY (if still no domain) ==========
    if (!domain) {
      console.log('🔍 STEP 2: Discovering domain...')
      const companySlug = companyName.toLowerCase().replace(/\s+/g, '')
      const testDomains = [
        `${companySlug}.io`,
        `${companySlug}.com`,
        `${companySlug}.co`
      ]
      
      for (const testDomain of testDomains) {
        try {
          console.log(`  Testing: ${testDomain}`)
          const testResponse = await fetch(`https://${testDomain}`, { 
            method: 'HEAD',
            redirect: 'follow'
          })
          
          if (testResponse.ok || testResponse.status === 403) {
            domain = testDomain
            companyInfo.website = `https://${domain}`
            console.log(`✅ Found domain: ${domain}`)
            break
          }
        } catch (e) {
          // Try next domain
        }
      }
    }
    
    console.log(`🌐 Domain after discovery: ${domain || 'not found'}`)

    // VALIDATION HELPER
    const skipWords = ['Jetpack', 'WordPress', 'Connect With', 'Follow Us', 'Contact Us', 'About Us', 
                      'Privacy Policy', 'Terms Of', 'All Rights', 'Copyright Notice', 'Verification Tags',
                      'Youtube Become', 'Twitter', 'Facebook', 'LinkedIn', 'Instagram']
    
    const isValidName = (name: string) => {
      const words = name.trim().split(/\s+/)
      if (words.length !== 2) return false
      if (!words.every(w => /^[A-Z][a-z]{1,}$/.test(w))) return false
      if (skipWords.some(skip => name.includes(skip))) return false
      if (words.some(w => w.length < 2)) return false
      return true
    }

    // ========== STEP 3: SCRAPE WEBSITE FOR ADDITIONAL EMAILS ==========
    if (domain && emailsWithSources.length < 3) {
      try {
        console.log(`📡 STEP 3: Scraping website: https://${domain}`)
        const websiteResponse = await fetch(`https://${domain}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (websiteResponse.ok) {
          const html = await websiteResponse.text()
          
          // Extract emails from HTML
          const emailRegex = /\b([A-Za-z0-9][A-Za-z0-9._-]*[A-Za-z0-9])@([A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,})\b/g
          const matches = [...html.matchAll(emailRegex)]
          const foundEmails = matches.map(m => m[0]) || []
          
          // Filter valid emails
          const validEmails = foundEmails.filter(email => {
            const lower = email.toLowerCase()
            if (!email.includes(domain.split('.')[0])) return false
            if (lower.includes('example.com') || lower.includes('sentry.io') || 
                lower.includes('wordpress.org') || lower.includes('schema.org') || 
                lower.includes('w3.org')) return false
            if (lower.includes('.png') || lower.includes('.jpg') || lower.includes('logo') || 
                lower.includes('image') || lower.includes('gradient')) return false
            
            const tldMatch = email.match(/\.([a-z]{2,})$/i)
            if (!tldMatch) return false
            const tld = tldMatch[1].toLowerCase()
            const validTLDs = ['com', 'org', 'net', 'io', 'co', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'eu']
            if (!validTLDs.includes(tld)) return false
            
            return true
          })
          
          // Add emails with source URL
          const homepageUrl = `https://${domain}`
          validEmails.forEach(email => {
            if (!emailsWithSources.find(e => e.email === email)) {
              emailsWithSources.push({ email, source: homepageUrl })
            }
          })
          console.log(`✅ Found ${validEmails.length} emails from homepage`)
          
          // Extract meta description
          const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
          if (metaMatch) {
            companyInfo.abstract = metaMatch[1]
          }
        }
      } catch (websiteError) {
        console.error('Website fetch failed:', websiteError)
      }
      
      // ========== STEP 4: SCRAPE CONTACT/ABOUT/LEGAL PAGES ==========
      if (emailsWithSources.length < 5) {
        try {
          const contactPages = [
            `https://${domain}/contact`,
            `https://${domain}/about`,
            `https://${domain}/team`,
            `https://${domain}/legal/terms-of-use`,
            `https://${domain}/legal/privacy-policy`,
            `https://${domain}/terms`,
            `https://${domain}/privacy`
          ]
          
          for (const pageUrl of contactPages) {
            try {
              console.log(`📡 Trying: ${pageUrl}`)
              const pageResponse = await fetch(pageUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
              })
              
              if (pageResponse.ok) {
                const pageHtml = await pageResponse.text()
                const emailRegex = /\b([A-Za-z0-9][A-Za-z0-9._-]*[A-Za-z0-9])@([A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,})\b/g
                const pageEmails = [...pageHtml.matchAll(emailRegex)].map(m => m[0])
                
                pageEmails.forEach(email => {
                  if (email.includes(domain.split('.')[0]) && 
                      !emailsWithSources.find(e => e.email === email)) {
                    emailsWithSources.push({ email, source: pageUrl })
                  }
                })
                
                console.log(`✅ ${pageUrl}: found ${pageEmails.length} emails`)
              }
            } catch {
              // Try next page
            }
          }
        } catch (contactError) {
          console.error('Contact page fetch failed:', contactError)
        }
      }
    }

    // ========== STEP 5: BUILD FINAL EMAIL LIST WITH PRIORITIZATION ==========
    let suggestedEmails: Array<{ email: string; source: string }> = []
    
    if (emailsWithSources.length > 0) {
      // SMART EMAIL PRIORITIZATION
      const emailPriority = (email: string): number => {
        const lower = email.toLowerCase()
        const localPart = lower.split('@')[0]
        
        if (localPart === 'contact') return 1
        if (localPart === 'hello') return 2
        if (localPart === 'hi') return 3
        if (localPart === 'info') return 4
        if (localPart === 'support') return 5
        if (localPart === 'help') return 6
        if (localPart === 'sales') return 7
        if (localPart === 'business') return 8
        if (localPart === 'partnerships') return 9
        if (localPart === 'team') return 10
        return 99
      }
      
      const sortedEmails = [...emailsWithSources].sort((a, b) => {
        const priorityA = emailPriority(a.email)
        const priorityB = emailPriority(b.email)
        return priorityA - priorityB
      })
      
      suggestedEmails = sortedEmails.slice(0, 8)
      console.log('🎯 Using REAL emails (sorted by priority):', suggestedEmails.map(e => e.email))
    } else {
      console.log('⚠️ No real emails found, will generate patterns')
      if (domain) {
        const patterns = ['contact', 'hello', 'info', 'hi', 'support']
        suggestedEmails = patterns.map(prefix => ({
          email: `${prefix}@${domain}`,
          source: 'Common pattern (please verify)'
        }))
      } else {
        suggestedEmails = [{
          email: `contact@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
          source: 'Generated pattern (please verify)'
        }]
      }
    }

    // DuckDuckGo for context
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(companyName)}&format=json&no_html=1`
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

    const result = {
      query: query,
      domain: domain,
      abstract: companyInfo.abstract || 'No description available',
      abstractURL: companyInfo.abstractURL || (domain ? `https://${domain}` : ''),
      website: companyInfo.website,
      suggestedEmails: suggestedEmails,
      contactNames: contactNames.slice(0, 5),
      scrapedEmails: emailsWithSources.length,
      scrapedNames: contactNames.length,
      searchLinks: {
        google: `https://www.google.com/search?q=${encodeURIComponent(companyName + ' contact email address')}`,
        linkedin: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}`,
        twitter: `https://twitter.com/search?q=${encodeURIComponent(companyName)}`,
        crunchbase: `https://www.crunchbase.com/textsearch?q=${encodeURIComponent(companyName)}`,
        hunter: domain ? `https://hunter.io/search/${domain}` : `https://hunter.io/search/${encodeURIComponent(companyName)}`,
        rocketreach: `https://rocketreach.co/search?query=${encodeURIComponent(companyName)}`,
        website_contact: domain ? `https://${domain}/contact` : ''
      }
    }

    console.log(`✅ FINAL RESULT: ${result.scrapedEmails} emails found`)
    console.log('📧 Emails:', result.suggestedEmails.map(e => `${e.email} (${e.source})`))

    return c.json(result)
    
  } catch (error) {
    console.error('Search error:', error)
    return c.json({ 
      error: 'Search failed', 
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

export default search
