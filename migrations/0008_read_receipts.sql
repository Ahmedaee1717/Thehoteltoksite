-- ============================================
-- EMAIL READ RECEIPTS & OPEN TRACKING
-- Track when recipients open emails
-- ============================================

-- ============================================
-- Email Read Receipts
-- Track email opens with timestamps
-- ============================================
CREATE TABLE IF NOT EXISTS email_read_receipts (
    id TEXT PRIMARY KEY,
    email_id TEXT NOT NULL,
    
    -- Recipient info
    recipient_email TEXT NOT NULL,
    
    -- Tracking info
    opened_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT, -- desktop, mobile, tablet
    email_client TEXT, -- gmail, outlook, apple mail, etc.
    
    -- Location (optional)
    country TEXT,
    city TEXT,
    
    -- Multiple opens tracking
    open_count INTEGER DEFAULT 1,
    last_opened_at DATETIME,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_read_receipts_email ON email_read_receipts(email_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_recipient ON email_read_receipts(recipient_email);
CREATE INDEX IF NOT EXISTS idx_read_receipts_opened ON email_read_receipts(opened_at);

-- ============================================
-- Add read tracking fields to emails table
-- ============================================
-- Note: These are for sent emails tracking
-- ALTER TABLE emails ADD COLUMN tracking_enabled INTEGER DEFAULT 1;
-- ALTER TABLE emails ADD COLUMN tracking_pixel_id TEXT;
-- ALTER TABLE emails ADD COLUMN first_opened_at DATETIME;
-- ALTER TABLE emails ADD COLUMN total_opens INTEGER DEFAULT 0;
-- ALTER TABLE emails ADD COLUMN is_read_by_recipient INTEGER DEFAULT 0;

-- For safety, we'll add these in a separate migration if the columns don't exist
-- Using IF NOT EXISTS pattern for D1 compatibility
