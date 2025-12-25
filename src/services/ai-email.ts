// AI Email Services
// Functions for AI-powered email features

export async function summarizeEmail(body: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at summarizing emails concisely. Summarize in 2-3 sentences.'
          },
          {
            role: 'user',
            content: `Summarize this email:\n\n${body}`
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to summarize');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Summarize error:', error);
    return '';
  }
}

export async function categorizeEmail(text: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at categorizing emails. Return ONE word only from: urgent, important, work, personal, finance, marketing, social, update, notification'
          },
          {
            role: 'user',
            content: `Categorize this email:\n\n${text}`
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to categorize');
    }
    
    return data.choices[0].message.content.toLowerCase().trim();
  } catch (error) {
    console.error('Categorize error:', error);
    return 'inbox';
  }
}

export async function extractActionItems(body: string, apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting action items from emails. Return a JSON array of strings. If no action items, return empty array.'
          },
          {
            role: 'user',
            content: `Extract action items from this email:\n\n${body}`
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to extract action items');
    }
    
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      // If not valid JSON, return empty array
      return [];
    }
  } catch (error) {
    console.error('Extract action items error:', error);
    return [];
  }
}

export async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000) // Limit to 8000 chars
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate embedding');
    }
    
    return data.data[0].embedding;
  } catch (error) {
    console.error('Generate embedding error:', error);
    return [];
  }
}

export async function analyzeSentiment(text: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing email sentiment. Return ONE word only: positive, neutral, negative, or urgent'
          },
          {
            role: 'user',
            content: `Analyze sentiment:\n\n${text}`
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to analyze sentiment');
    }
    
    return data.choices[0].message.content.toLowerCase().trim();
  } catch (error) {
    console.error('Analyze sentiment error:', error);
    return 'neutral';
  }
}

export async function generateSmartReplies(emailBody: string, apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at generating quick email replies. Generate 3 short, professional reply suggestions as a JSON array.'
          },
          {
            role: 'user',
            content: `Generate 3 quick reply suggestions for this email:\n\n${emailBody}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate replies');
    }
    
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      // If not valid JSON, return default replies
      return [
        'Thank you for your email. I will review and get back to you shortly.',
        'Received, will look into this.',
        'Thanks for the update!'
      ];
    }
  } catch (error) {
    console.error('Generate smart replies error:', error);
    return [];
  }
}
