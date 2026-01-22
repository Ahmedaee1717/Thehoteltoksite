import { Hono } from 'hono'
import {
  generateSummaryAndExcerpt,
  generateFAQ,
  generateSchemaJSON,
  generateEmbeddingVector,
  optimizeArticle,
} from '../services/ai-optimizer'

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
}

export const aiAdminRoutes = new Hono<{ Bindings: Bindings }>()

// Generate AI Summary & Excerpt
aiAdminRoutes.post('/posts/:id/generate-summary', async (c) => {
  const { DB, OPENAI_API_KEY } = c.env;
  const id = c.req.param('id');
  
  try {
    // Fetch post
    const post = await DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first();
    
    if (!post) {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

    // Generate summary and excerpt
    const { summary, excerpt, primary_topic, key_entities } = await generateSummaryAndExcerpt(
      post as any,
      OPENAI_API_KEY
    );

    // Update database
    await DB.prepare(`
      UPDATE blog_posts
      SET ai_summary = ?, ai_excerpt = ?, ai_primary_topic = ?, ai_key_entities = ?,
          ai_last_processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      summary,
      excerpt,
      primary_topic,
      JSON.stringify(key_entities),
      id
    ).run();

    return c.json({
      success: true,
      data: { summary, excerpt, primary_topic, key_entities },
      message: 'AI summary and excerpt generated successfully'
    });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to generate summary'
    }, 500);
  }
});

// Generate AI FAQ
aiAdminRoutes.post('/posts/:id/generate-faq', async (c) => {
  const { DB, OPENAI_API_KEY } = c.env;
  const id = c.req.param('id');
  
  try {
    const post = await DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first();
    
    if (!post) {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

    const faq = await generateFAQ(post as any, OPENAI_API_KEY);

    await DB.prepare(`
      UPDATE blog_posts
      SET ai_faq = ?, ai_last_processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(JSON.stringify(faq), id).run();

    return c.json({
      success: true,
      data: { faq },
      message: 'AI FAQ generated successfully'
    });
  } catch (error: any) {
    console.error('Error generating FAQ:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to generate FAQ'
    }, 500);
  }
});

// Generate Schema JSON-LD
aiAdminRoutes.post('/posts/:id/generate-schema', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    const post = await DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first();
    
    if (!post) {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

    const faq = post.ai_faq ? JSON.parse(post.ai_faq as string) : undefined;
    const schemaJSON = generateSchemaJSON(post as any, faq);

    await DB.prepare(`
      UPDATE blog_posts
      SET ai_schema_json = ?, ai_last_processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(schemaJSON, id).run();

    return c.json({
      success: true,
      data: { schema: JSON.parse(schemaJSON) },
      message: 'Schema JSON-LD generated successfully'
    });
  } catch (error: any) {
    console.error('Error generating schema:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to generate schema'
    }, 500);
  }
});

// Generate/Update Embedding
aiAdminRoutes.post('/posts/:id/generate-embedding', async (c) => {
  const { DB, OPENAI_API_KEY } = c.env;
  const id = c.req.param('id');
  
  try {
    const post = await DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first();
    
    if (!post) {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

    const summary = post.ai_summary as string | undefined;
    const faq = post.ai_faq ? JSON.parse(post.ai_faq as string) : undefined;
    
    const embedding = await generateEmbeddingVector(post as any, summary, faq, OPENAI_API_KEY);

    await DB.prepare(`
      UPDATE blog_posts
      SET ai_embedding_vector = ?, ai_last_processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(JSON.stringify(embedding), id).run();

    return c.json({
      success: true,
      data: { dimension: embedding.length },
      message: 'Embedding generated successfully'
    });
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to generate embedding'
    }, 500);
  }
});

// Full AI Optimization (All at once)
aiAdminRoutes.post('/posts/:id/optimize-all', async (c) => {
  const { DB, OPENAI_API_KEY } = c.env;
  const id = c.req.param('id');
  
  try {
    const post = await DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first();
    
    if (!post) {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

    const result = await optimizeArticle(post as any, OPENAI_API_KEY);

    await DB.prepare(`
      UPDATE blog_posts
      SET ai_summary = ?, ai_excerpt = ?, ai_primary_topic = ?, ai_key_entities = ?,
          ai_faq = ?, ai_schema_json = ?, ai_embedding_vector = ?,
          ai_last_processed_at = ?
      WHERE id = ?
    `).bind(
      result.ai_summary,
      result.ai_excerpt,
      result.ai_primary_topic,
      JSON.stringify(result.ai_key_entities),
      JSON.stringify(result.ai_faq),
      result.ai_schema_json,
      JSON.stringify(result.ai_embedding_vector),
      result.ai_last_processed_at,
      id
    ).run();

    return c.json({
      success: true,
      message: 'Full AI optimization completed successfully',
      data: {
        summary: result.ai_summary,
        excerpt: result.ai_excerpt,
        primary_topic: result.ai_primary_topic,
        entities: result.ai_key_entities,
        faq_count: result.ai_faq?.length,
        embedding_dimension: result.ai_embedding_vector?.length,
      }
    });
  } catch (error: any) {
    console.error('Error optimizing article:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to optimize article'
    }, 500);
  }
});

// Toggle AI Knowledge Base Inclusion
aiAdminRoutes.put('/posts/:id/toggle-knowledge-base', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  const { include } = await c.req.json();
  
  try {
    await DB.prepare(`
      UPDATE blog_posts
      SET ai_include_in_knowledge_base = ?
      WHERE id = ?
    `).bind(include ? 1 : 0, id).run();

    return c.json({
      success: true,
      message: `Knowledge base inclusion ${include ? 'enabled' : 'disabled'}`
    });
  } catch (error: any) {
    console.error('Error toggling knowledge base:', error);
    return c.json({
      success: false,
      error: 'Failed to update setting'
    }, 500);
  }
});

// Get AI optimization status for a post
aiAdminRoutes.get('/posts/:id/ai-status', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    const post = await DB.prepare(`
      SELECT ai_summary, ai_excerpt, ai_primary_topic, ai_key_entities,
             ai_faq, ai_schema_json, ai_embedding_vector,
             ai_last_processed_at, ai_include_in_knowledge_base
      FROM blog_posts
      WHERE id = ?
    `).bind(id).first();

    if (!post) {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        has_summary: !!post.ai_summary,
        has_excerpt: !!post.ai_excerpt,
        has_primary_topic: !!post.ai_primary_topic,
        has_entities: !!post.ai_key_entities,
        has_faq: !!post.ai_faq,
        has_schema: !!post.ai_schema_json,
        has_embedding: !!post.ai_embedding_vector,
        last_processed: post.ai_last_processed_at,
        in_knowledge_base: !!post.ai_include_in_knowledge_base,
        summary: post.ai_summary,
        excerpt: post.ai_excerpt,
        primary_topic: post.ai_primary_topic,
        key_entities: post.ai_key_entities ? JSON.parse(post.ai_key_entities as string) : null,
        faq: post.ai_faq ? JSON.parse(post.ai_faq as string) : null,
      }
    });
  } catch (error: any) {
    console.error('Error fetching AI status:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch AI status'
    }, 500);
  }
});

// AI SEO Auto-Fill
aiAdminRoutes.post('/seo-optimize', async (c) => {
  const { OPENAI_API_KEY } = c.env;
  const { title, content } = await c.req.json();
  
  try {
    if (!title || !content) {
      return c.json({ success: false, error: 'Title and content are required' }, 400);
    }

    // Strip HTML tags from content for analysis
    const plainContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Call OpenAI to generate SEO fields
    const prompt = `Analyze this blog post and generate SEO-optimized fields:

Title: ${title}
Content: ${plainContent.substring(0, 3000)}

Generate:
1. meta_title: SEO-optimized title (50-60 characters, include primary keyword)
2. meta_description: Compelling description for search results (150-160 characters)
3. meta_keywords: 5-7 relevant keywords (comma-separated)
4. excerpt: Brief summary for blog listings (120-150 characters)

Return as JSON with keys: meta_title, meta_description, meta_keywords, excerpt`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an SEO expert. Always respond with valid JSON only, no markdown or extra text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    // Parse JSON response (remove markdown code blocks if present)
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)```/) || aiResponse.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
    const seoFields = JSON.parse(jsonStr);

    return c.json({
      success: true,
      ...seoFields
    });
  } catch (error: any) {
    console.error('SEO optimization error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to generate SEO fields'
    }, 500);
  }
});
