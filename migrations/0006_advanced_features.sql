-- ============================================
-- TASK MANAGEMENT SYSTEM
-- ============================================

-- Tasks Table - Convert emails to actionable tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  due_date DATETIME,
  assigned_to TEXT,
  created_from TEXT, -- email, manual, calendar
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_email ON tasks(email_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Task Tags
CREATE TABLE IF NOT EXISTS task_tags (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_tags_task ON task_tags(task_id);

-- ============================================
-- FOLLOW-UP REMINDERS SYSTEM
-- ============================================

-- Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email_id TEXT,
  task_id TEXT,
  title TEXT NOT NULL,
  message TEXT,
  remind_at DATETIME NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, dismissed
  notification_type TEXT DEFAULT 'email', -- email, push, both
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

-- ============================================
-- TEAM COLLABORATION
-- ============================================

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- admin, manager, member, viewer
  avatar_url TEXT,
  status TEXT DEFAULT 'active', -- active, inactive
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- Email Collaboration (co-editing, notes, delegation)
CREATE TABLE IF NOT EXISTS email_collaboration (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  collaboration_type TEXT NOT NULL, -- note, delegation, approval, co_edit
  content TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_collab_email ON email_collaboration(email_id);
CREATE INDEX IF NOT EXISTS idx_email_collab_user ON email_collaboration(user_id);

-- Internal Notes (not visible to email recipient)
CREATE TABLE IF NOT EXISTS email_notes (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  note TEXT NOT NULL,
  is_private INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_notes_email ON email_notes(email_id);

-- Email Delegation
CREATE TABLE IF NOT EXISTS email_delegations (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_email_delegations_email ON email_delegations(email_id);
CREATE INDEX IF NOT EXISTS idx_email_delegations_to ON email_delegations(to_user);

-- Approval Workflows
CREATE TABLE IF NOT EXISTS email_approvals (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  requester_id TEXT NOT NULL,
  approver_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_email_approvals_email ON email_approvals(email_id);
CREATE INDEX IF NOT EXISTS idx_email_approvals_approver ON email_approvals(approver_id);

-- ============================================
-- SMART ORGANIZATION & CRM
-- ============================================

-- Contacts/CRM
CREATE TABLE IF NOT EXISTS crm_contacts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  title TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active', -- active, inactive, lead, client
  tags TEXT, -- JSON array
  notes TEXT,
  last_contacted DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON crm_contacts(company);

-- Deals/Projects
CREATE TABLE IF NOT EXISTS crm_deals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_id TEXT,
  value REAL,
  status TEXT DEFAULT 'prospect', -- prospect, negotiation, closed_won, closed_lost
  stage TEXT,
  probability INTEGER DEFAULT 50,
  expected_close_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_status ON crm_deals(status);

-- Email-Deal Association
CREATE TABLE IF NOT EXISTS email_deals (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  deal_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_deals_email ON email_deals(email_id);
CREATE INDEX IF NOT EXISTS idx_email_deals_deal ON email_deals(deal_id);

-- Smart Folders (auto-updating rules)
CREATE TABLE IF NOT EXISTS smart_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  rules TEXT NOT NULL, -- JSON rules
  color TEXT,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_smart_folders_user ON smart_folders(user_id);

-- ============================================
-- BLOCKCHAIN VERIFICATION
-- ============================================

-- Enhanced blockchain log with verification details
CREATE TABLE IF NOT EXISTS email_blockchain_verification (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  hash TEXT NOT NULL,
  previous_hash TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME,
  verification_status TEXT DEFAULT 'pending', -- pending, verified, failed
  blockchain_tx_id TEXT,
  verification_proof TEXT
);

CREATE INDEX IF NOT EXISTS idx_blockchain_email ON email_blockchain_verification(email_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_hash ON email_blockchain_verification(hash);

-- ============================================
-- ADVANCED ANALYTICS
-- ============================================

-- Email Activity Log
CREATE TABLE IF NOT EXISTS email_activity_log (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL, -- opened, clicked, replied, forwarded, starred
  metadata TEXT, -- JSON
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_email ON email_activity_log(email_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON email_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_time ON email_activity_log(timestamp);

-- User Behavior Analytics
CREATE TABLE IF NOT EXISTS user_behavior (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- response_time, read_time, productivity_score
  metric_value REAL NOT NULL,
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_behavior_user ON user_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_date ON user_behavior(date);

-- ============================================
-- MEETING SCHEDULER
-- ============================================

-- Meeting Proposals from Emails
CREATE TABLE IF NOT EXISTS meeting_proposals (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  proposed_times TEXT NOT NULL, -- JSON array of time slots
  duration INTEGER DEFAULT 60, -- minutes
  attendees TEXT, -- JSON array
  location TEXT,
  status TEXT DEFAULT 'proposed', -- proposed, confirmed, declined, rescheduled
  confirmed_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meeting_proposals_email ON meeting_proposals(email_id);

-- Meeting Responses
CREATE TABLE IF NOT EXISTS meeting_responses (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  selected_times TEXT, -- JSON array
  response TEXT DEFAULT 'pending', -- pending, accepted, declined
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meeting_responses_proposal ON meeting_responses(proposal_id);

-- ============================================
-- VOICE TO EMAIL
-- ============================================

-- Voice Recordings
CREATE TABLE IF NOT EXISTS voice_recordings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration INTEGER, -- seconds
  transcription TEXT,
  email_draft_id TEXT,
  status TEXT DEFAULT 'processing', -- processing, completed, failed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_voice_recordings_user ON voice_recordings(user_id);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default team member (admin)
INSERT OR IGNORE INTO team_members (id, email, name, role, status) VALUES
  ('tm_admin', 'admin@investaycapital.com', 'Admin User', 'admin', 'active');

-- Insert default CRM contact
INSERT OR IGNORE INTO crm_contacts (id, email, name, status) VALUES
  ('contact_admin', 'admin@investaycapital.com', 'Admin User', 'active');

-- Insert default smart folders
INSERT OR IGNORE INTO smart_folders (id, user_id, name, rules, color) VALUES
  ('sf_urgent', 'admin@investaycapital.com', 'Urgent Emails', '{"category": "urgent"}', '#ff4444'),
  ('sf_unread', 'admin@investaycapital.com', 'Unread', '{"is_read": 0}', '#3b82f6'),
  ('sf_today', 'admin@investaycapital.com', 'Today', '{"date": "today"}', '#10b981');
