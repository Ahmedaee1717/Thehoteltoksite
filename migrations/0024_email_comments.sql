-- Email Collaboration Comments System
-- Allows team members to comment on emails for better collaboration

CREATE TABLE IF NOT EXISTS email_comments (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  thread_id TEXT,
  author_email TEXT NOT NULL,
  author_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  is_resolved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_comments_email_id ON email_comments(email_id);
CREATE INDEX IF NOT EXISTS idx_email_comments_thread_id ON email_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_comments_author ON email_comments(author_email);
CREATE INDEX IF NOT EXISTS idx_email_comments_created ON email_comments(created_at DESC);
