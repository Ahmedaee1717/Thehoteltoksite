-- Add AI Optimization Fields to blog_posts table
-- Migration: 0002_add_ai_optimization_fields.sql

-- AI Primary Topic
ALTER TABLE blog_posts ADD COLUMN ai_primary_topic TEXT;

-- AI Key Entities (stored as JSON array)
ALTER TABLE blog_posts ADD COLUMN ai_key_entities TEXT; -- JSON array

-- AI Summary (2-3 sentences)
ALTER TABLE blog_posts ADD COLUMN ai_summary TEXT;

-- AI Excerpt (1-2 sentences for quick quote)
ALTER TABLE blog_posts ADD COLUMN ai_excerpt TEXT;

-- AI FAQ (stored as JSON array of Q&A pairs)
ALTER TABLE blog_posts ADD COLUMN ai_faq TEXT; -- JSON array of {question, answer}

-- AI Schema JSON-LD
ALTER TABLE blog_posts ADD COLUMN ai_schema_json TEXT; -- Full JSON-LD block

-- AI Embedding Vector (stored as JSON array of floats)
ALTER TABLE blog_posts ADD COLUMN ai_embedding_vector TEXT; -- JSON array of floats

-- AI Processing Metadata
ALTER TABLE blog_posts ADD COLUMN ai_last_processed_at DATETIME;
ALTER TABLE blog_posts ADD COLUMN ai_include_in_knowledge_base INTEGER DEFAULT 1; -- Boolean: 1 = true, 0 = false

-- Indexes for AI search
CREATE INDEX IF NOT EXISTS idx_blog_posts_ai_include ON blog_posts(ai_include_in_knowledge_base);
CREATE INDEX IF NOT EXISTS idx_blog_posts_ai_processed ON blog_posts(ai_last_processed_at);
