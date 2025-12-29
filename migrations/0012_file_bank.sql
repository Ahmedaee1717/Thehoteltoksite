-- ============================================
-- FILE BANK SYSTEM - Complete Implementation
-- ============================================

-- Main file storage table
CREATE TABLE IF NOT EXISTS file_bank_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Virtual path in File Bank (folder structure)
  file_url TEXT NOT NULL, -- Actual storage URL (R2/blob)
  file_type TEXT NOT NULL, -- mime type
  file_size INTEGER NOT NULL, -- bytes
  file_extension TEXT,
  
  -- Organization
  folder_id INTEGER, -- References file_bank_folders
  tags TEXT, -- JSON array of tags
  description TEXT,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_file_id INTEGER, -- Previous version
  is_latest_version INTEGER DEFAULT 1,
  version_notes TEXT,
  
  -- Access control
  visibility TEXT DEFAULT 'private', -- private, team, public
  access_level TEXT DEFAULT 'view', -- view, download, edit
  share_token TEXT UNIQUE, -- For external sharing
  expires_at DATETIME, -- For time-limited shares
  
  -- Metadata
  thumbnail_url TEXT,
  preview_available INTEGER DEFAULT 0,
  is_starred INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  is_template INTEGER DEFAULT 0,
  
  -- Usage tracking
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  last_accessed_at DATETIME,
  
  -- Thread associations
  thread_count INTEGER DEFAULT 0, -- How many threads use this file
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME -- Soft delete
);

CREATE INDEX IF NOT EXISTS idx_file_bank_files_user ON file_bank_files(user_email);
CREATE INDEX IF NOT EXISTS idx_file_bank_files_folder ON file_bank_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_file_bank_files_starred ON file_bank_files(is_starred);
CREATE INDEX IF NOT EXISTS idx_file_bank_files_pinned ON file_bank_files(is_pinned);
CREATE INDEX IF NOT EXISTS idx_file_bank_files_version ON file_bank_files(parent_file_id, version);
CREATE INDEX IF NOT EXISTS idx_file_bank_files_share ON file_bank_files(share_token);
CREATE INDEX IF NOT EXISTS idx_file_bank_files_created ON file_bank_files(created_at DESC);

-- Folders for organization
CREATE TABLE IF NOT EXISTS file_bank_folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  parent_folder_id INTEGER, -- For nested folders
  folder_path TEXT, -- Full path like /Budget Documents/Q4
  
  -- Metadata
  color TEXT, -- Folder color
  icon TEXT, -- Emoji or icon name
  description TEXT,
  is_shared INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  
  -- Stats
  file_count INTEGER DEFAULT 0,
  total_size INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (parent_folder_id) REFERENCES file_bank_folders(id)
);

CREATE INDEX IF NOT EXISTS idx_file_bank_folders_user ON file_bank_folders(user_email);
CREATE INDEX IF NOT EXISTS idx_file_bank_folders_parent ON file_bank_folders(parent_folder_id);

-- File permissions for sharing
CREATE TABLE IF NOT EXISTS file_bank_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  user_email TEXT, -- Null for public links
  access_level TEXT NOT NULL, -- view, download, edit
  granted_by TEXT NOT NULL,
  expires_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (file_id) REFERENCES file_bank_files(id)
);

CREATE INDEX IF NOT EXISTS idx_file_bank_permissions_file ON file_bank_permissions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_bank_permissions_user ON file_bank_permissions(user_email);

-- File usage in threads/emails
CREATE TABLE IF NOT EXISTS file_bank_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  thread_id TEXT,
  email_id INTEGER,
  user_email TEXT NOT NULL,
  
  -- Context
  usage_type TEXT NOT NULL, -- attached, linked, requested
  access_count INTEGER DEFAULT 0,
  last_accessed_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (file_id) REFERENCES file_bank_files(id),
  FOREIGN KEY (email_id) REFERENCES emails(id)
);

CREATE INDEX IF NOT EXISTS idx_file_bank_usage_file ON file_bank_usage(file_id);
CREATE INDEX IF NOT EXISTS idx_file_bank_usage_thread ON file_bank_usage(thread_id);
CREATE INDEX IF NOT EXISTS idx_file_bank_usage_email ON file_bank_usage(email_id);

-- File activity log
CREATE TABLE IF NOT EXISTS file_bank_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  user_email TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- uploaded, viewed, downloaded, shared, updated, deleted
  activity_data TEXT, -- JSON with extra details
  ip_address TEXT,
  user_agent TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (file_id) REFERENCES file_bank_files(id)
);

CREATE INDEX IF NOT EXISTS idx_file_bank_activity_file ON file_bank_activity(file_id);
CREATE INDEX IF NOT EXISTS idx_file_bank_activity_user ON file_bank_activity(user_email);
CREATE INDEX IF NOT EXISTS idx_file_bank_activity_type ON file_bank_activity(activity_type);

-- Smart collections (saved searches/filters)
CREATE TABLE IF NOT EXISTS file_bank_collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  collection_type TEXT NOT NULL, -- smart (dynamic), manual (static)
  
  -- Smart collection rules (JSON)
  filter_rules TEXT, -- { tags: ['budget'], dateRange: 'last7days', ... }
  
  -- Manual collection file list
  file_ids TEXT, -- JSON array of file IDs
  
  icon TEXT,
  color TEXT,
  is_pinned INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_file_bank_collections_user ON file_bank_collections(user_email);

-- Seed default folders
INSERT OR IGNORE INTO file_bank_folders (id, user_email, folder_name, folder_path, icon) VALUES
  (1, 'admin@investaycapital.com', 'My Files', '/My Files', '👤'),
  (2, 'admin@investaycapital.com', 'Team Shared', '/Team Shared', '👥'),
  (3, 'admin@investaycapital.com', 'Templates', '/Team Shared/Templates', '📋'),
  (4, 'admin@investaycapital.com', 'Brand Assets', '/Team Shared/Brand Assets', '🎨');

-- Seed some sample files for testing
INSERT OR IGNORE INTO file_bank_files (id, user_email, filename, original_filename, file_path, file_url, file_type, file_size, file_extension, folder_id, tags, is_starred) VALUES
  (1, 'admin@investaycapital.com', 'budget_q4_2025.pdf', 'budget_q4_2025.pdf', '/My Files/budget_q4_2025.pdf', 'https://example.com/files/budget_q4_2025.pdf', 'application/pdf', 2457600, 'pdf', 1, '["budget","q4","2025"]', 0),
  (2, 'admin@investaycapital.com', 'sow_template.docx', 'sow_template.docx', '/Team Shared/Templates/sow_template.docx', 'https://example.com/files/sow_template.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 126976, 'docx', 3, '["template","sow"]', 1),
  (3, 'admin@investaycapital.com', 'company_logo.png', 'company_logo.png', '/Team Shared/Brand Assets/company_logo.png', 'https://example.com/files/company_logo.png', 'image/png', 46080, 'png', 4, '["brand","logo"]', 0);
