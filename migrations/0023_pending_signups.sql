-- Pending signups table for email verification
CREATE TABLE IF NOT EXISTS pending_signups (
  email TEXT PRIMARY KEY,
  verification_email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  company TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_signups_code ON pending_signups(verification_code);
CREATE INDEX IF NOT EXISTS idx_pending_signups_expires ON pending_signups(expires_at);
