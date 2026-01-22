-- Email Signatures Table
-- Stores futuristic email signatures with animation and tracking

CREATE TABLE IF NOT EXISTS email_signatures (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    tagline TEXT,
    logo_url TEXT,
    website TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    linkedin TEXT,
    twitter TEXT,
    facebook TEXT,
    enable_animation INTEGER DEFAULT 1,
    enable_tracking INTEGER DEFAULT 1,
    is_global INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_email_signatures_global ON email_signatures(is_global, updated_at DESC);
