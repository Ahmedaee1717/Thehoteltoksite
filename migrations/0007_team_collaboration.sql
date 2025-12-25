-- ============================================
-- ENHANCED TEAM COLLABORATION SYSTEM
-- Features: Internal Comments, Activity Tracking, Collaborative Drafting
-- ============================================

-- ============================================
-- Internal Comments on Emails
-- Private team discussions on email threads
-- ============================================
CREATE TABLE IF NOT EXISTS email_internal_comments (
    id TEXT PRIMARY KEY,
    email_id TEXT NOT NULL,
    thread_id TEXT,
    
    -- Author info
    author_email TEXT NOT NULL,
    author_name TEXT,
    
    -- Comment content
    comment_text TEXT NOT NULL,
    comment_type TEXT DEFAULT 'comment', -- comment, note, task, decision
    
    -- Mentions and tags
    mentions TEXT, -- JSON array of mentioned users
    tags TEXT, -- JSON array of tags
    
    -- Status and metadata
    is_resolved INTEGER DEFAULT 0,
    is_private INTEGER DEFAULT 0, -- private to author only
    priority TEXT, -- low, medium, high, urgent
    
    -- Threading
    parent_comment_id TEXT, -- for nested replies
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    edited_at DATETIME,
    
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_internal_comments_email ON email_internal_comments(email_id);
CREATE INDEX IF NOT EXISTS idx_internal_comments_author ON email_internal_comments(author_email);
CREATE INDEX IF NOT EXISTS idx_internal_comments_thread ON email_internal_comments(thread_id);

-- ============================================
-- Email Activity Tracking
-- Track who viewed, opened, responded to emails
-- ============================================
CREATE TABLE IF NOT EXISTS email_activity_tracking (
    id TEXT PRIMARY KEY,
    email_id TEXT NOT NULL,
    thread_id TEXT,
    
    -- User who performed action
    user_email TEXT NOT NULL,
    user_name TEXT,
    
    -- Activity type
    activity_type TEXT NOT NULL, -- viewed, opened, downloaded, forwarded, replied, archived, deleted, starred, shared
    
    -- Activity details
    activity_data TEXT, -- JSON object with additional context
    user_agent TEXT, -- browser/device info
    ip_address TEXT,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_tracking_email ON email_activity_tracking(email_id);
CREATE INDEX IF NOT EXISTS idx_activity_tracking_user ON email_activity_tracking(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_tracking_type ON email_activity_tracking(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_tracking_created ON email_activity_tracking(created_at);

-- ============================================
-- Real-time Presence Tracking
-- Track who is currently viewing/editing emails
-- ============================================
CREATE TABLE IF NOT EXISTS email_presence (
    id TEXT PRIMARY KEY,
    email_id TEXT NOT NULL,
    
    -- User presence
    user_email TEXT NOT NULL,
    user_name TEXT,
    
    -- Presence type
    presence_type TEXT NOT NULL, -- viewing, editing, composing
    
    -- Current state
    cursor_position INTEGER, -- for collaborative editing
    is_active INTEGER DEFAULT 1,
    
    -- Timestamps
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_presence_unique ON email_presence(email_id, user_email, presence_type);
CREATE INDEX IF NOT EXISTS idx_presence_email ON email_presence(email_id);
CREATE INDEX IF NOT EXISTS idx_presence_user ON email_presence(user_email);
CREATE INDEX IF NOT EXISTS idx_presence_expires ON email_presence(expires_at);

-- ============================================
-- Collaborative Draft Sessions
-- Multi-user draft editing with conflict resolution
-- ============================================
CREATE TABLE IF NOT EXISTS collaborative_draft_sessions (
    id TEXT PRIMARY KEY,
    draft_id TEXT NOT NULL,
    
    -- Session info
    session_name TEXT,
    is_active INTEGER DEFAULT 1,
    
    -- Lock mechanism
    locked_by TEXT, -- user_email who has write lock
    locked_at DATETIME,
    lock_expires_at DATETIME,
    
    -- Version control
    current_version INTEGER DEFAULT 1,
    base_content TEXT, -- original content
    
    -- Metadata
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (draft_id) REFERENCES email_drafts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_draft_sessions_draft ON collaborative_draft_sessions(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_sessions_locked ON collaborative_draft_sessions(locked_by);

-- ============================================
-- Draft Edit History
-- Track all changes made to collaborative drafts
-- ============================================
CREATE TABLE IF NOT EXISTS draft_edit_history (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    draft_id TEXT NOT NULL,
    
    -- Edit info
    editor_email TEXT NOT NULL,
    editor_name TEXT,
    
    -- Change details
    version_number INTEGER NOT NULL,
    change_type TEXT NOT NULL, -- insert, delete, update, format
    content_before TEXT,
    content_after TEXT,
    diff_data TEXT, -- JSON with detailed changes
    
    -- Change metadata
    change_description TEXT,
    change_position INTEGER, -- cursor position
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES collaborative_draft_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (draft_id) REFERENCES email_drafts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_draft_history_session ON draft_edit_history(session_id);
CREATE INDEX IF NOT EXISTS idx_draft_history_draft ON draft_edit_history(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_history_editor ON draft_edit_history(editor_email);
CREATE INDEX IF NOT EXISTS idx_draft_history_version ON draft_edit_history(version_number);

-- ============================================
-- Shared Inbox Assignments
-- Assign emails to team members
-- ============================================
CREATE TABLE IF NOT EXISTS email_shared_assignments (
    id TEXT PRIMARY KEY,
    email_id TEXT NOT NULL,
    
    -- Assignment details
    assigned_to TEXT NOT NULL, -- user_email
    assigned_by TEXT NOT NULL, -- user_email
    
    -- Assignment status
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, declined
    priority TEXT, -- low, medium, high, urgent
    
    -- Assignment metadata
    notes TEXT,
    due_date DATETIME,
    
    -- Timestamps
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    completed_at DATETIME,
    
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assignments_email ON email_shared_assignments(email_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON email_shared_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON email_shared_assignments(status);

-- ============================================
-- Team Shared Inbox Configuration
-- Configure team inboxes and permissions
-- ============================================
CREATE TABLE IF NOT EXISTS team_shared_inboxes (
    id TEXT PRIMARY KEY,
    
    -- Inbox details
    inbox_name TEXT NOT NULL,
    inbox_email TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Settings
    auto_assign INTEGER DEFAULT 0, -- auto-assign to team members
    notification_enabled INTEGER DEFAULT 1,
    
    -- Metadata
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Team Shared Inbox Members
-- Members with access to shared inboxes
-- ============================================
CREATE TABLE IF NOT EXISTS team_inbox_members (
    id TEXT PRIMARY KEY,
    inbox_id TEXT NOT NULL,
    
    -- Member details
    member_email TEXT NOT NULL,
    member_name TEXT,
    member_role TEXT DEFAULT 'member', -- admin, member, viewer
    
    -- Permissions
    can_read INTEGER DEFAULT 1,
    can_write INTEGER DEFAULT 1,
    can_delete INTEGER DEFAULT 0,
    can_assign INTEGER DEFAULT 1,
    
    -- Metadata
    added_by TEXT NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inbox_id) REFERENCES team_shared_inboxes(id) ON DELETE CASCADE,
    UNIQUE(inbox_id, member_email)
);

CREATE INDEX IF NOT EXISTS idx_inbox_members_inbox ON team_inbox_members(inbox_id);
CREATE INDEX IF NOT EXISTS idx_inbox_members_email ON team_inbox_members(member_email);

-- ============================================
-- Email Collaboration Stats
-- Aggregate collaboration metrics
-- ============================================
CREATE TABLE IF NOT EXISTS email_collaboration_stats (
    id TEXT PRIMARY KEY,
    email_id TEXT NOT NULL UNIQUE,
    
    -- View stats
    total_views INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    
    -- Comment stats
    total_comments INTEGER DEFAULT 0,
    unresolved_comments INTEGER DEFAULT 0,
    
    -- Activity stats
    total_activities INTEGER DEFAULT 0,
    last_activity_at DATETIME,
    
    -- Assignment stats
    is_assigned INTEGER DEFAULT 0,
    assignment_status TEXT,
    
    -- Presence
    current_viewers INTEGER DEFAULT 0,
    
    -- Timestamps
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collab_stats_email ON email_collaboration_stats(email_id);
