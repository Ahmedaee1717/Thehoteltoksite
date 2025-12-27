-- Migration: Inbox = Now (Zero-History Inbox)
-- The killer feature that destroys Gmail's DNA

-- Add expires_at timestamp for email expiration
ALTER TABLE emails ADD COLUMN expires_at DATETIME;

-- Add expiry_type for quick filters (24h, 7d, 30d, keep)
ALTER TABLE emails ADD COLUMN expiry_type TEXT DEFAULT '30d';

-- Add is_expired flag for quick filtering
ALTER TABLE emails ADD COLUMN is_expired INTEGER DEFAULT 0;

-- Add expiry_summary for AI-generated summaries when expired
ALTER TABLE emails ADD COLUMN expiry_summary TEXT;

-- Create index for efficient expiry queries
CREATE INDEX IF NOT EXISTS idx_emails_expires_at ON emails(expires_at);
CREATE INDEX IF NOT EXISTS idx_emails_expiry_type ON emails(expiry_type);
CREATE INDEX IF NOT EXISTS idx_emails_is_expired ON emails(is_expired);

-- Set default expires_at for existing emails (30 days from received_at)
UPDATE emails 
SET expires_at = datetime(received_at, '+30 days'),
    expiry_type = '30d'
WHERE expires_at IS NULL AND category != 'trash';
