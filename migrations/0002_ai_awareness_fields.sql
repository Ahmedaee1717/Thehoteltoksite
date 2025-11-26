-- Migration 0002: Add AI Awareness Fields to blog_posts
-- These fields optimize content for AI systems (LLMs, chatbots, semantic search)

ALTER TABLE blog_posts ADD COLUMN ai_primary_topic TEXT;
ALTER TABLE blog_posts ADD COLUMN ai_key_entities TEXT; -- JSON array
ALTER TABLE blog_posts ADD COLUMN ai_summary TEXT;
ALTER TABLE blog_posts ADD COLUMN ai_excerpt TEXT;
ALTER TABLE blog_posts ADD COLUMN ai_faq TEXT; -- JSON array of {question, answer}
ALTER TABLE blog_posts ADD COLUMN ai_schema_json TEXT; -- Schema.org JSON-LD
ALTER TABLE blog_posts ADD COLUMN ai_embedding_vector TEXT; -- JSON array of floats
ALTER TABLE blog_posts ADD COLUMN ai_last_processed_at DATETIME;
ALTER TABLE blog_posts ADD COLUMN ai_include_in_knowledge_base INTEGER DEFAULT 1;

-- Index for knowledge base queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_ai_kb ON blog_posts(ai_include_in_knowledge_base, status);
