import { Hono } from 'hono'

const search = new Hono()

// 🔍 REAL AI WEB SEARCH FOR CONTACT EMAILS
// Uses Cloudflare AI Workers or external API (Perplexity, Tavily, etc.)
search.get('/contact', async (c) => {
  try {
    const query = c.req.query('q')
    
    if (!query) {
      return c.json({ error: 'Query parameter required' }, 400)
    }

    console.log('🔍 AI Web Search for:', query)

    // Option 1: Use Perplexity AI Search API (if available)
    // Option 2: Use Tavily Search API (if available)
    // Option 3: Use Cloudflare AI + Web scraping
    // For now, use a simple web search approach

    const SEARCH_API_KEY = c.env.PERPLEXITY_API_KEY || c.env.TAVILY_API_KEY
    
    if (!SEARCH_API_KEY) {
      console.warn('⚠️ No AI search API key configured')
      return c.json({
        success: false,
        suggestedEmails: [],
        companyWebsite: null,
        message: 'AI search not configured. Please add PERPLEXITY_API_KEY or TAVILY_API_KEY to environment.'
      })
    }

    // Use Perplexity AI for real web search
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SEARCH_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a professional contact research assistant. Search the web and find REAL, VERIFIED contact email addresses for companies. 
            
CRITICAL RULES:
- ONLY return emails you find from actual web sources
- DO NOT generate or guess emails
- DO NOT use patterns like "hello@", "info@", "contact@" unless you found them on the company's actual website
- Prefer specific contact emails (support@, sales@, partnerships@) over generic ones
- Include the source URL where you found each email
- If you cannot find real emails, say so honestly

Return a JSON array of objects with this exact format:
[
  {"email": "real.person@company.com", "source": "https://company.com/contact"},
  {"email": "support@company.com", "source": "https://company.com/support"}
]

If no emails found, return empty array: []`
          },
          {
            role: 'user',
            content: `Find REAL contact email addresses for: ${query}

Search the web thoroughly. Check:
- Company website contact pages
- LinkedIn company pages
- Public directories
- Press releases
- Team pages

Only return emails you actually found with sources. Do not guess.`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    console.log('🤖 AI Search Response:', aiResponse)

    // Parse the AI response to extract emails
    let emails: Array<{ email: string; source: string }> = []
    
    try {
      // Try to parse as JSON first
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        emails = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.warn('Could not parse JSON, trying text extraction')
      
      // Fallback: extract emails and sources from text
      const emailMatches = aiResponse.matchAll(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi)
      const sourceMatches = aiResponse.matchAll(/(https?:\/\/[^\s]+)/gi)
      
      const foundEmails = Array.from(emailMatches).map(m => m[1])
      const foundSources = Array.from(sourceMatches).map(m => m[1])
      
      emails = foundEmails.map((email, i) => ({
        email,
        source: foundSources[i] || 'Web search result'
      }))
    }

    // Filter out generic patterns if no source is provided
    const verifiedEmails = emails.filter(item => {
      const email = item.email.toLowerCase()
      
      // If source is provided, trust it
      if (item.source && item.source.startsWith('http')) {
        return true
      }
      
      // Otherwise, filter out obvious patterns
      const genericPatterns = ['hello@', 'info@', 'contact@', 'admin@', 'support@']
      const isGeneric = genericPatterns.some(pattern => email.startsWith(pattern))
      
      // Only keep generic if it has a real source
      return !isGeneric || item.source !== 'Web search result'
    })

    // Extract company website from sources
    const companyWebsite = emails.length > 0 && emails[0].source 
      ? new URL(emails[0].source).origin 
      : null

    return c.json({
      success: true,
      suggestedEmails: verifiedEmails,
      companyWebsite,
      query,
      note: verifiedEmails.length === 0 
        ? 'No verified email addresses found through web search. Try LinkedIn or company website directly.'
        : `Found ${verifiedEmails.length} verified email(s) from web search.`
    })

  } catch (error: any) {
    console.error('❌ Search error:', error)
    return c.json({
      success: false,
      error: 'Search failed',
      details: error.message,
      suggestedEmails: [],
      companyWebsite: null
    }, 500)
  }
})

export default search
