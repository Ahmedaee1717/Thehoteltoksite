-- ============================================
-- CRM SYSTEM ENHANCEMENT
-- Update CRM tables to match comprehensive API requirements
-- ============================================

-- Drop all old CRM-related tables first
DROP TABLE IF EXISTS email_deals;

-- Now drop crm tables in the right order (children first)
DROP TABLE IF EXISTS crm_activities;
DROP TABLE IF EXISTS crm_deals;
DROP TABLE IF EXISTS crm_contacts;
DROP TABLE IF EXISTS tasks;

-- ============================================
-- CRM CONTACTS
-- Enhanced with more fields and better structure
-- ============================================
CREATE TABLE crm_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  position TEXT,
  contact_type TEXT DEFAULT 'other',
  notes TEXT,
  custom_fields TEXT,
  tags TEXT,
  last_contact_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crm_contacts_user ON crm_contacts(user_email);
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX idx_crm_contacts_company ON crm_contacts(company);
CREATE INDEX idx_crm_contacts_type ON crm_contacts(contact_type);

-- ============================================
-- CRM DEALS
-- Sales pipeline and deal tracking
-- ============================================
CREATE TABLE crm_deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  contact_id INTEGER,
  title TEXT NOT NULL,
  value REAL DEFAULT 0,
  stage TEXT DEFAULT 'lead',
  probability INTEGER DEFAULT 50,
  close_date DATE,
  notes TEXT,
  custom_fields TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crm_deals_user ON crm_deals(user_email);
CREATE INDEX idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX idx_crm_deals_status ON crm_deals(status);

-- ============================================
-- CRM ACTIVITIES
-- Activity log for contacts and deals
-- ============================================
CREATE TABLE crm_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  contact_id INTEGER,
  deal_id INTEGER,
  email_id TEXT,
  activity_type TEXT NOT NULL,
  subject TEXT,
  notes TEXT,
  activity_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crm_activities_user ON crm_activities(user_email);
CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_deal ON crm_activities(deal_id);
CREATE INDEX idx_crm_activities_type ON crm_activities(activity_type);
CREATE INDEX idx_crm_activities_date ON crm_activities(activity_date);

-- ============================================
-- TASKS SYSTEM
-- Task management integrated with emails and CRM
-- ============================================
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  email_id TEXT,
  contact_id INTEGER,
  deal_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE INDEX idx_tasks_user ON tasks(user_email);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_email ON tasks(email_id);
CREATE INDEX idx_tasks_contact ON tasks(contact_id);
CREATE INDEX idx_tasks_deal ON tasks(deal_id);
