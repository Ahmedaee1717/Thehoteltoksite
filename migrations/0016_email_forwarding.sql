-- Migration: Email Forwarding Rules
-- Add support for automatic email forwarding to external addresses

-- ============================================
-- Email Forwarding Rules Table
-- ============================================
CREATE TABLE IF NOT EXISTS email_forwarding_rules (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  forward_to TEXT NOT NULL,
  is_enabled INTEGER DEFAULT 1,
  
  -- Rule conditions (if ALL are null, forward everything)
  match_sender TEXT,           -- Forward emails from specific sender
  match_subject TEXT,          -- Forward emails with subject containing text
  match_keywords TEXT,         -- JSON array of keywords to match in body
  match_category TEXT,         -- Forward specific category (inbox, sent, spam)
  
  -- Forwarding options
  keep_original INTEGER DEFAULT 1,  -- Keep original in inbox (1) or delete (0)
  forward_mode TEXT DEFAULT 'copy', -- 'copy' (as is) or 'redirect' (change from)
  add_prefix INTEGER DEFAULT 1,     -- Add [Fwd: from X] prefix to subject
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_triggered_at DATETIME,
  trigger_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_forwarding_user ON email_forwarding_rules(user_email);
CREATE INDEX IF NOT EXISTS idx_forwarding_enabled ON email_forwarding_rules(is_enabled);

-- ============================================
-- Email Forwarding Log Table
-- Track all forwarded emails for debugging
-- ============================================
CREATE TABLE IF NOT EXISTS email_forwarding_log (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL,
  original_email_id TEXT NOT NULL,
  forwarded_to TEXT NOT NULL,
  forwarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  success INTEGER DEFAULT 1,
  error_message TEXT,
  
  FOREIGN KEY (rule_id) REFERENCES email_forwarding_rules(id),
  FOREIGN KEY (original_email_id) REFERENCES emails(id)
);

CREATE INDEX IF NOT EXISTS idx_forwarding_log_rule ON email_forwarding_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_forwarding_log_email ON email_forwarding_log(original_email_id);
CREATE INDEX IF NOT EXISTS idx_forwarding_log_date ON email_forwarding_log(forwarded_at);
