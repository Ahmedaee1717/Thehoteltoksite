-- Collaboration System: Roles & Permissions for Blog Publishing
-- ============================================================

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer', -- viewer, editor, publisher, admin
  permissions TEXT, -- JSON array of specific permissions
  assigned_by TEXT, -- email of admin who assigned role
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Blog Collaboration Table
CREATE TABLE IF NOT EXISTS blog_collaborations (
  id TEXT PRIMARY KEY,
  post_id INTEGER NOT NULL,
  collaborator_email TEXT NOT NULL,
  role TEXT NOT NULL, -- author, editor, reviewer, viewer
  invited_by TEXT NOT NULL,
  invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME,
  status TEXT DEFAULT 'pending' -- pending, accepted, declined
);

-- Blog Activity Log
CREATE TABLE IF NOT EXISTS blog_activity_log (
  id TEXT PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL, -- created, edited, published, unpublished, deleted, commented
  action_details TEXT, -- JSON with details
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Blog Comments/Feedback
CREATE TABLE IF NOT EXISTS blog_comments (
  id TEXT PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_email TEXT NOT NULL,
  comment TEXT NOT NULL,
  parent_comment_id TEXT, -- for threaded comments
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(user_email);
CREATE INDEX IF NOT EXISTS idx_blog_collaborations_post ON blog_collaborations(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_collaborations_email ON blog_collaborations(collaborator_email);
CREATE INDEX IF NOT EXISTS idx_blog_activity_post ON blog_activity_log(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);

-- Insert default admin role for main account
INSERT OR IGNORE INTO user_roles (id, user_email, role, permissions, assigned_by)
VALUES 
  ('role_admin_1', 'admin@investaycapital.com', 'admin', '["all"]', 'system'),
  ('role_admin_2', 'test1@investaycapital.com', 'admin', '["all"]', 'system');
