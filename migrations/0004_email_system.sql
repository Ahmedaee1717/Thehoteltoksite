-- Email System Database Schema
-- Migration: 0003_email_system.sql

-- ============================================
-- EMAILS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    thread_id TEXT,
    
    -- Sender & Recipients
    from_email TEXT NOT NULL,
    from_name TEXT,
    to_email TEXT NOT NULL,
    to_name TEXT,
    cc TEXT, -- JSON array of email addresses
    bcc TEXT, -- JSON array of email addresses
    reply_to TEXT,
    
    -- Content
    subject TEXT NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT,
    snippet TEXT, -- First 150 chars for preview
    
    -- AI Features
    category TEXT, -- inbox, sent, drafts, archive, spam, trash
    priority INTEGER DEFAULT 0, -- 0-100 score
    sentiment TEXT, -- positive, neutral, negative, urgent
    ai_summary TEXT, -- AI-generated summary
    action_items TEXT, -- JSON array of extracted tasks
    embedding_vector TEXT, -- 1536 dimensions for semantic search
    
    -- Metadata
    is_read INTEGER DEFAULT 0,
    is_starred INTEGER DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    is_draft INTEGER DEFAULT 0,
    labels TEXT, -- JSON array of label IDs
    
    -- Blockchain (for verification)
    blockchain_hash TEXT,
    ipfs_hash TEXT,
    verified_at DATETIME,
    
    -- Tracking
    opened_at DATETIME,
    replied_at DATETIME,
    
    -- Timestamps
    sent_at DATETIME,
    received_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for emails
CREATE INDEX IF NOT EXISTS idx_emails_to ON emails(to_email);
CREATE INDEX IF NOT EXISTS idx_emails_from ON emails(from_email);
CREATE INDEX IF NOT EXISTS idx_emails_thread ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(category);
CREATE INDEX IF NOT EXISTS idx_emails_received ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_sent ON emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_starred ON emails(is_starred);
CREATE INDEX IF NOT EXISTS idx_emails_archived ON emails(is_archived);

-- ============================================
-- ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    email_id TEXT NOT NULL,
    
    -- File info
    filename TEXT NOT NULL,
    content_type TEXT,
    size INTEGER, -- in bytes
    
    -- Storage
    r2_key TEXT, -- Cloudflare R2 storage key
    r2_url TEXT, -- Public URL
    thumbnail_url TEXT,
    
    -- AI features
    ocr_text TEXT, -- Extracted text from images/PDFs
    embedding_vector TEXT, -- For semantic search in attachments
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_email ON attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_attachments_type ON attachments(content_type);

-- ============================================
-- THREADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_threads (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    participant_emails TEXT, -- JSON array
    message_count INTEGER DEFAULT 0,
    
    -- AI features
    summary TEXT,
    category TEXT,
    priority INTEGER DEFAULT 0,
    
    -- Timestamps
    last_message_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_threads_last_message ON email_threads(last_message_at DESC);

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_contacts (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    company TEXT,
    avatar_url TEXT,
    
    -- Stats
    email_count INTEGER DEFAULT 0, -- Total emails exchanged
    last_contact_at DATETIME,
    
    -- AI insights
    avg_response_time INTEGER, -- in seconds
    relationship_score REAL DEFAULT 0, -- 0-100
    
    -- Metadata
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_email ON email_contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contact ON email_contacts(last_contact_at DESC);

-- ============================================
-- LABELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_labels (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    
    -- Label info
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6b7280',
    icon TEXT,
    
    -- Smart folder rules
    is_smart INTEGER DEFAULT 0,
    rules TEXT, -- JSON rules for smart folders
    
    -- Stats
    email_count INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_labels_user ON email_labels(user_email);

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_user_settings (
    user_email TEXT PRIMARY KEY,
    
    -- Display preferences
    theme TEXT DEFAULT 'light', -- light, dark, auto
    layout TEXT DEFAULT 'three-column', -- three-column, kanban, conversation
    density TEXT DEFAULT 'comfortable', -- compact, comfortable, relaxed
    
    -- AI preferences
    ai_compose_enabled INTEGER DEFAULT 1,
    ai_auto_categorize INTEGER DEFAULT 1,
    ai_priority_inbox INTEGER DEFAULT 1,
    ai_smart_replies INTEGER DEFAULT 1,
    ai_summarization INTEGER DEFAULT 1,
    
    -- Notification preferences
    desktop_notifications INTEGER DEFAULT 1,
    email_notifications INTEGER DEFAULT 0,
    notification_sound INTEGER DEFAULT 1,
    
    -- Signature
    signature_html TEXT,
    signature_enabled INTEGER DEFAULT 0,
    
    -- Other settings
    auto_archive_days INTEGER DEFAULT 30,
    conversation_view INTEGER DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_analytics (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    
    -- Event tracking
    event_type TEXT NOT NULL, -- sent, received, opened, replied, starred, etc.
    email_id TEXT,
    
    -- Metadata
    event_data TEXT, -- JSON for additional data
    
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_user ON email_analytics(user_email);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON email_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON email_analytics(timestamp DESC);

-- ============================================
-- DRAFTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_drafts (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    
    -- Draft content
    to_email TEXT,
    cc TEXT, -- JSON array
    bcc TEXT, -- JSON array
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    
    -- Attachments
    attachments TEXT, -- JSON array of attachment IDs
    
    -- AI assistance
    ai_suggestions TEXT, -- JSON array of AI suggestions
    
    -- Metadata
    last_edited_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drafts_user ON email_drafts(user_email);
CREATE INDEX IF NOT EXISTS idx_drafts_edited ON email_drafts(last_edited_at DESC);

-- ============================================
-- TEAM INBOXES TABLE (Shared Inboxes)
-- ============================================
CREATE TABLE IF NOT EXISTS team_inboxes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "Support", "Sales"
    email TEXT UNIQUE NOT NULL, -- e.g., support@investaycapital.com
    description TEXT,
    
    -- Members
    members TEXT, -- JSON array of user emails
    
    -- Settings
    auto_assign INTEGER DEFAULT 0,
    assignment_strategy TEXT DEFAULT 'round-robin', -- round-robin, load-balanced, manual
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_inboxes_email ON team_inboxes(email);

-- ============================================
-- EMAIL ASSIGNMENTS (For team inboxes)
-- ============================================
CREATE TABLE IF NOT EXISTS email_assignments (
    id TEXT PRIMARY KEY,
    email_id TEXT NOT NULL,
    team_inbox_id TEXT NOT NULL,
    assigned_to TEXT, -- User email
    
    -- Status
    status TEXT DEFAULT 'open', -- open, in-progress, resolved, closed
    
    -- Notes
    internal_notes TEXT, -- JSON array of notes
    
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
    FOREIGN KEY (team_inbox_id) REFERENCES team_inboxes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assignments_email ON email_assignments(email_id);
CREATE INDEX IF NOT EXISTS idx_assignments_team ON email_assignments(team_inbox_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON email_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON email_assignments(status);

-- ============================================
-- BLOCKCHAIN VERIFICATION LOG
-- ============================================
CREATE TABLE IF NOT EXISTS email_blockchain_log (
    id TEXT PRIMARY KEY,
    email_id TEXT NOT NULL,
    
    -- Blockchain info
    block_hash TEXT NOT NULL,
    transaction_hash TEXT,
    block_number INTEGER,
    
    -- Verification
    verified INTEGER DEFAULT 1,
    verification_method TEXT, -- hash, ipfs, blockchain
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_blockchain_email ON email_blockchain_log(email_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_hash ON email_blockchain_log(block_hash);
