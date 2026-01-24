import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const search = new Hono<{ Bindings: Bindings }>()

// Web search endpoint - searches for contact information
search.get('/contact', async (c) => {
  try {
    const query = c.req.query('q')
    
    if (!query) {
      return c.json({ error: 'Missing query parameter' }, 400)
    }

    // For now, we'll use DuckDuckGo's instant answer API which doesn't require authentication
    // This is a simple solution that works for basic searches
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
    
    try {
      const response = await fetch(ddgUrl)
      const data = await response.json()
      
      // Extract useful information
      const result = {
        query: query,
        abstract: data.Abstract || '',
        abstractSource: data.AbstractSource || '',
        abstractURL: data.AbstractURL || '',
        relatedTopics: data.RelatedTopics?.slice(0, 5) || [],
        
        // Generate common email patterns based on the search query
        suggestedEmails: generateEmailSuggestions(query),
        
        // Provide useful search links
        searchLinks: {
          google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          linkedin: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query.split(' ')[0])}`,
          twitter: `https://twitter.com/search?q=${encodeURIComponent(query)}`,
          crunchbase: `https://www.crunchbase.com/textsearch?q=${encodeURIComponent(query)}`,
          hunter: `https://hunter.io/search/${encodeURIComponent(query.split(' ')[0])}`,
          rocketreach: `https://rocketreach.co/search?query=${encodeURIComponent(query)}`
        }
      }
      
      return c.json(result)
    } catch (fetchError) {
      console.error('DuckDuckGo API error:', fetchError)
      
      // Fallback: Return basic structure with suggestions
      return c.json({
        query: query,
        abstract: 'Unable to fetch search results at this time.',
        suggestedEmails: generateEmailSuggestions(query),
        searchLinks: {
          google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          linkedin: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query.split(' ')[0])}`,
          twitter: `https://twitter.com/search?q=${encodeURIComponent(query)}`,
          crunchbase: `https://www.crunchbase.com/textsearch?q=${encodeURIComponent(query)}`,
          hunter: `https://hunter.io/search/${encodeURIComponent(query.split(' ')[0])}`,
          rocketreach: `https://rocketreach.co/search?query=${encodeURIComponent(query)}`
        }
      })
    }
    
  } catch (error) {
    console.error('Search API error:', error)
    return c.json({ error: 'Search failed', details: error.message }, 500)
  }
})

// Helper function to generate likely email addresses
function generateEmailSuggestions(query: string): string[] {
  const suggestions: string[] = []
  
  // Check if query contains a domain (e.g., "rawsummit.io")
  const domainMatch = query.match(/([a-z0-9-]+\.[a-z]{2,})/i)
  
  if (domainMatch) {
    // We have a domain! Use it directly
    const domain = domainMatch[1].toLowerCase()
    
    suggestions.push(`hello@${domain}`)
    suggestions.push(`contact@${domain}`)
    suggestions.push(`info@${domain}`)
    suggestions.push(`support@${domain}`)
    suggestions.push(`partnerships@${domain}`)
    suggestions.push(`events@${domain}`)
    
    return suggestions
  }
  
  // Extract name/company from query
  const words = query.toLowerCase().split(' ').filter(w => 
    !['contact', 'email', 'address', 'phone', 'info', 'the', 'at'].includes(w)
  )
  
  if (words.length > 0) {
    const mainWord = words[0]
    
    // Common email patterns
    suggestions.push(`hello@${mainWord}.com`)
    suggestions.push(`contact@${mainWord}.com`)
    suggestions.push(`info@${mainWord}.com`)
    suggestions.push(`support@${mainWord}.com`)
    
    // If it looks like a person's name (2+ words)
    if (words.length >= 2) {
      const firstName = words[0]
      const lastName = words[1]
      
      suggestions.push(`${firstName}@${lastName}.com`)
      suggestions.push(`${firstName}.${lastName}@gmail.com`)
      suggestions.push(`${firstName[0]}${lastName}@${mainWord}.com`)
    }
  }
  
  return suggestions
}

export default search
