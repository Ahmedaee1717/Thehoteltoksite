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
