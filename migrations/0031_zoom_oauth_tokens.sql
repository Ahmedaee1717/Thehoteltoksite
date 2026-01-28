-- Migration: Zoom OAuth Tokens Storage
-- Store OAuth access tokens and refresh tokens for Zoom users

CREATE TABLE IF NOT EXISTS zoom_oauth_tokens (
  user_id TEXT PRIMARY KEY,
  zoom_user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  scope TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_zoom_oauth_tokens_email ON zoom_oauth_tokens(email);
CREATE INDEX IF NOT EXISTS idx_zoom_oauth_tokens_expires ON zoom_oauth_tokens(expires_at);
