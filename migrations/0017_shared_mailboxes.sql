-- =============================================
-- SHARED MAILBOXES SYSTEM
-- Enterprise-grade shared email management
-- =============================================

-- Shared Mailboxes Table
-- Stores shared email accounts (info@, support@, sales@)
CREATE TABLE IF NOT EXISTS shared_mailboxes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_address TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  mailbox_type TEXT DEFAULT 'team', -- team, department, project, support
  is_active INTEGER DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  settings TEXT DEFAULT '{}' -- JSON: auto-reply, signature, labels
);

CREATE INDEX IF NOT EXISTS idx_shared_mailboxes_email ON shared_mailboxes(email_address);
CREATE INDEX IF NOT EXISTS idx_shared_mailboxes_active ON shared_mailboxes(is_active);

-- Shared Mailbox Members Table
-- Assigns users to shared mailboxes with permissions
CREATE TABLE IF NOT EXISTS shared_mailbox_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shared_mailbox_id INTEGER NOT NULL,
  user_email TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- admin, member, viewer
  permissions TEXT DEFAULT '["view","send"]', -- JSON array: view, send, delete, manage
  is_active INTEGER DEFAULT 1,
  added_by TEXT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME,
  FOREIGN KEY (shared_mailbox_id) REFERENCES shared_mailboxes(id) ON DELETE CASCADE,
  UNIQUE(shared_mailbox_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_shared_mailbox_members_mailbox ON shared_mailbox_members(shared_mailbox_id);
CREATE INDEX IF NOT EXISTS idx_shared_mailbox_members_user ON shared_mailbox_members(user_email);
CREATE INDEX IF NOT EXISTS idx_shared_mailbox_members_active ON shared_mailbox_members(is_active);

-- Shared Drafts Table
-- Real-time collaborative email drafts
CREATE TABLE IF NOT EXISTS shared_drafts (
  id TEXT PRIMARY KEY,
  shared_mailbox_id INTEGER NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  to_email TEXT,
  cc TEXT,
  bcc TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_edit_timestamp INTEGER, -- Millisecond timestamp for conflict resolution
  is_sent INTEGER DEFAULT 0,
  sent_at DATETIME,
  locked_by TEXT, -- User currently editing (for optimistic locking)
  locked_at DATETIME,
  FOREIGN KEY (shared_mailbox_id) REFERENCES shared_mailboxes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shared_drafts_mailbox ON shared_drafts(shared_mailbox_id);
CREATE INDEX IF NOT EXISTS idx_shared_drafts_created_by ON shared_drafts(created_by);
CREATE INDEX IF NOT EXISTS idx_shared_drafts_is_sent ON shared_drafts(is_sent);

-- Shared Mailbox Activity Log
-- Audit trail for all actions in shared mailboxes
CREATE TABLE IF NOT EXISTS shared_mailbox_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shared_mailbox_id INTEGER NOT NULL,
  user_email TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- email_sent, email_received, draft_created, draft_edited, member_added, member_removed
  entity_type TEXT, -- email, draft, member
  entity_id TEXT,
  details TEXT, -- JSON with activity details
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shared_mailbox_id) REFERENCES shared_mailboxes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shared_mailbox_activity_mailbox ON shared_mailbox_activity(shared_mailbox_id);
CREATE INDEX IF NOT EXISTS idx_shared_mailbox_activity_user ON shared_mailbox_activity(user_email);
CREATE INDEX IF NOT EXISTS idx_shared_mailbox_activity_type ON shared_mailbox_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_shared_mailbox_activity_created ON shared_mailbox_activity(created_at);

-- User Presence Table
-- Track who's currently viewing/editing in shared mailboxes
CREATE TABLE IF NOT EXISTS shared_mailbox_presence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shared_mailbox_id INTEGER NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'viewing', -- viewing, editing, idle
  current_draft_id TEXT,
  last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_id TEXT,
  FOREIGN KEY (shared_mailbox_id) REFERENCES shared_mailboxes(id) ON DELETE CASCADE,
  UNIQUE(shared_mailbox_id, user_email, session_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_mailbox_presence_mailbox ON shared_mailbox_presence(shared_mailbox_id);
CREATE INDEX IF NOT EXISTS idx_shared_mailbox_presence_user ON shared_mailbox_presence(user_email);
CREATE INDEX IF NOT EXISTS idx_shared_mailbox_presence_last_seen ON shared_mailbox_presence(last_seen_at);

-- Email Assignments Table
-- Assign emails to specific team members within shared mailbox
CREATE TABLE IF NOT EXISTS shared_mailbox_email_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id TEXT NOT NULL,
  shared_mailbox_id INTEGER NOT NULL,
  assigned_to TEXT,
  assigned_by TEXT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  due_date DATETIME,
  notes TEXT,
  FOREIGN KEY (shared_mailbox_id) REFERENCES shared_mailboxes(id) ON DELETE CASCADE,
  FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
  UNIQUE(email_id, shared_mailbox_id)
);

CREATE INDEX IF NOT EXISTS idx_email_assignments_email ON shared_mailbox_email_assignments(email_id);
CREATE INDEX IF NOT EXISTS idx_email_assignments_mailbox ON shared_mailbox_email_assignments(shared_mailbox_id);
CREATE INDEX IF NOT EXISTS idx_email_assignments_assigned_to ON shared_mailbox_email_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_email_assignments_status ON shared_mailbox_email_assignments(status);

-- Insert default shared mailboxes
INSERT OR IGNORE INTO shared_mailboxes (email_address, display_name, description, mailbox_type, created_by) VALUES
  ('info@investaycapital.com', 'General Inquiries', 'General information and inquiries', 'team', 'admin@investaycapital.com'),
  ('support@investaycapital.com', 'Customer Support', 'Customer support and help desk', 'support', 'admin@investaycapital.com'),
  ('sales@investaycapital.com', 'Sales Team', 'Sales inquiries and opportunities', 'team', 'admin@investaycapital.com');
