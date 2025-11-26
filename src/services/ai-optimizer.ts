/**
 * AI Optimization Service
 * 
 * Handles all AI-related operations for content optimization:
 * - Summary generation
 * - FAQ generation
 * - Schema.org JSON-LD creation
 * - Embeddings for semantic search
 * - Compliance guardrails
 */

interface BlogPost {
  id: number;
  title: string;
  content: string;
  author: string;
  published_at?: string;
  slug: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface AIOptimizationResult {
  ai_summary?: string;
  ai_excerpt?: string;
  ai_faq?: FAQItem[];
  ai_schema_json?: string;
  ai_embedding_vector?: number[];
  ai_primary_topic?: string;
  ai_key_entities?: string[];
  ai_last_processed_at: string;
}

// Compliance guardrails - prohibited terms/phrases
const PROHIBITED_TERMS = [
  /guaranteed returns?/gi,
  /\d+%\s*(APR|APY|yield|return)/gi,
  /investment offering/gi,
  /buy our token/gi,
  /financial advice/gi,
  /we promise/gi,
  /guaranteed profit/gi,
];

/**
 * Apply compliance guardrails to AI-generated text
 */
function applyComplianceFilter(text: string): string {
  let filtered = text;
  
  // Remove prohibited terms
  PROHIBITED_TERMS.forEach(pattern => {
    filtered = filtered.replace(pattern, '[redacted]');
  });
  
  // Ensure neutral, descriptive tone
  filtered = filtered
    .replace(/you should invest/gi, 'potential participants may consider')
    .replace(/we offer returns/gi, 'the framework enables')
    .replace(/buy now/gi, 'learn more');
  
  return filtered;
}

/**
 * Call OpenAI API (or compatible endpoint)
 */
async function callLLM(systemPrompt: string, userPrompt: string, apiKey?: string): Promise<string> {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generate embeddings using OpenAI
 */
async function generateEmbedding(text: string, apiKey?: string): Promise<number[]> {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Limit input length
    }),
  });

  if (!response.ok) {
    throw new Error(`Embeddings API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Extract plain text from HTML content
 */
function extractPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 4000); // Limit length for LLM
}

/**
 * Generate AI Summary and Excerpt
 */
export async function generateSummaryAndExcerpt(post: BlogPost, apiKey?: string): Promise<{ summary: string; excerpt: string; primary_topic: string; key_entities: string[] }> {
  const plainText = extractPlainText(post.content);
  
  const systemPrompt = `You are an AI assistant for Investay Capital, a company focused on hotel tokenization and room-night infrastructure. 
Generate content that is:
- Neutral, factual, and descriptive
- Focused on technology and infrastructure (NOT investment promotion)
- Free from financial promises, guarantees, or performance claims
- Professional and institutional in tone

CRITICAL: Never mention returns, yields, APR, or investment guarantees. Focus on explaining the technology and framework.`;

  const userPrompt = `Article Title: ${post.title}

Article Content: ${plainText}

Please provide:
1. A 2-3 sentence summary that explains what this article covers (neutral, descriptive)
2. A 1-2 sentence excerpt suitable for AI systems to quote
3. The primary topic in 2-4 words (e.g., "hotel tokenization", "room-night infrastructure")
4. 3-5 key entities mentioned (e.g., ["Investay Capital", "hotel tokenization", "blockchain infrastructure"])

Return as JSON:
{
  "summary": "...",
  "excerpt": "...",
  "primary_topic": "...",
  "key_entities": ["...", "..."]
}`;

  const result = await callLLM(systemPrompt, userPrompt, apiKey);
  const parsed = JSON.parse(result);
  
  return {
    summary: applyComplianceFilter(parsed.summary),
    excerpt: applyComplianceFilter(parsed.excerpt),
    primary_topic: parsed.primary_topic,
    key_entities: parsed.key_entities,
  };
}

/**
 * Generate AI FAQ
 */
export async function generateFAQ(post: BlogPost, apiKey?: string): Promise<FAQItem[]> {
  const plainText = extractPlainText(post.content);
  
  const systemPrompt = `You are an AI assistant for Investay Capital. Generate FAQ items that:
- Help AI systems understand the article's key points
- Are factual and descriptive (NOT promotional)
- Focus on "what" and "how" questions
- Avoid financial promises or investment advice
- Use neutral, institutional tone`;

  const userPrompt = `Article Title: ${post.title}

Article Content: ${plainText}

Generate 4-6 FAQ pairs that would help an AI system understand this article's key concepts. Focus on clarity and factual information.

Return as JSON array:
[
  {"question": "What is...", "answer": "..."},
  {"question": "How does...", "answer": "..."}
]`;

  const result = await callLLM(systemPrompt, userPrompt, apiKey);
  const faq = JSON.parse(result);
  
  return faq.map((item: FAQItem) => ({
    question: applyComplianceFilter(item.question),
    answer: applyComplianceFilter(item.answer),
  }));
}

/**
 * Generate Schema.org JSON-LD
 */
export function generateSchemaJSON(post: BlogPost, faq?: FAQItem[]): string {
  const schema: any = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: post.title,
        author: {
          '@type': 'Organization',
          name: post.author,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Investay Capital',
          logo: {
            '@type': 'ImageObject',
            url: 'https://investaycapital.com/static/logo.png',
          },
        },
        datePublished: post.published_at || new Date().toISOString(),
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://investaycapital.com/blog/${post.slug}`,
        },
      },
    ],
  };

  // Add FAQPage if FAQ exists
  if (faq && faq.length > 0) {
    schema['@graph'].push({
      '@type': 'FAQPage',
      mainEntity: faq.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  return JSON.stringify(schema, null, 2);
}

/**
 * Generate embedding vector
 */
export async function generateEmbeddingVector(post: BlogPost, summary?: string, faq?: FAQItem[], apiKey?: string): Promise<number[]> {
  const plainText = extractPlainText(post.content);
  
  // Concatenate all relevant text
  const textToEmbed = [
    post.title,
    summary || '',
    plainText.substring(0, 2000),
    faq ? faq.map(f => `${f.question} ${f.answer}`).join(' ') : '',
  ].join(' ').trim();

  return await generateEmbedding(textToEmbed, apiKey);
}

/**
 * Full AI optimization pipeline
 */
export async function optimizeArticle(post: BlogPost, apiKey?: string): Promise<AIOptimizationResult> {
  try {
    // Step 1: Generate summary, excerpt, and metadata
    const { summary, excerpt, primary_topic, key_entities } = await generateSummaryAndExcerpt(post, apiKey);
    
    // Step 2: Generate FAQ
    const faq = await generateFAQ(post, apiKey);
    
    // Step 3: Generate Schema JSON-LD
    const schema_json = generateSchemaJSON(post, faq);
    
    // Step 4: Generate embedding
    const embedding = await generateEmbeddingVector(post, summary, faq, apiKey);
    
    return {
      ai_summary: summary,
      ai_excerpt: excerpt,
      ai_primary_topic: primary_topic,
      ai_key_entities: key_entities,
      ai_faq: faq,
      ai_schema_json: schema_json,
      ai_embedding_vector: embedding,
      ai_last_processed_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('AI optimization error:', error);
    throw error;
  }
}

/**
 * Cosine similarity for vector search
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Answer question using RAG (Retrieval-Augmented Generation)
 */
export async function answerQuestion(question: string, articles: any[], apiKey?: string): Promise<{ answer: string; sources: any[] }> {
  // Step 1: Embed the question
  const questionEmbedding = await generateEmbedding(question, apiKey);
  
  // Step 2: Find most relevant articles
  const scored = articles
    .filter(a => a.ai_embedding_vector && a.ai_include_in_knowledge_base)
    .map(article => {
      const embedding = JSON.parse(article.ai_embedding_vector);
      const score = cosineSimilarity(questionEmbedding, embedding);
      return { article, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (scored.length === 0) {
    return {
      answer: 'I don\'t have enough information to answer that question yet. Please check back as we add more content.',
      sources: [],
    };
  }

  // Step 3: Build context from top articles
  const context = scored.map(s => 
    `Article: ${s.article.title}\nSummary: ${s.article.ai_summary || ''}\nContent: ${extractPlainText(s.article.content).substring(0, 800)}`
  ).join('\n\n---\n\n');

  // Step 4: Generate answer using LLM
  const systemPrompt = `You are Investay Capital's AI assistant. Answer questions using ONLY the context provided below.

STRICT RULES:
- If the information is not in the context, say "This information is not available in our current content."
- Be factual, neutral, and professional
- Focus on hotel tokenization, room-night infrastructure, and hospitality finance
- NEVER make financial promises, guarantees, or investment recommendations
- Do not mention returns, yields, or specific financial performance
- Keep answers concise (2-4 paragraphs maximum)

Context:
${context}`;

  const answer = await callLLM(systemPrompt, `Question: ${question}`, apiKey);

  return {
    answer: applyComplianceFilter(answer),
    sources: scored.map(s => ({
      title: s.article.title,
      slug: s.article.slug,
      score: Math.round(s.score * 100) / 100,
    })),
  };
}
