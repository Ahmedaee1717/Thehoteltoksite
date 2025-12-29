-- Migration: Add shared folder support
-- Created: 2025-12-29

-- Update file_bank_folders to support shared folders
ALTER TABLE file_bank_folders ADD COLUMN is_team_shared INTEGER DEFAULT 0;
ALTER TABLE file_bank_folders ADD COLUMN shared_with TEXT; -- JSON array of user emails

-- Create default Team Shared folder (accessible to all users in organization)
INSERT INTO file_bank_folders (
  user_email, 
  folder_name, 
  folder_path, 
  icon, 
  color,
  description,
  is_shared,
  is_team_shared,
  is_pinned
) VALUES (
  'system@investaycapital.com',
  'Team Shared',
  '/Team Shared',
  '👥',
  '#C9A962',
  'Shared files accessible to all team members',
  1,
  1,
  1
);

-- Create default subfolders in Team Shared
INSERT INTO file_bank_folders (
  user_email, 
  folder_name, 
  parent_folder_id,
  folder_path, 
  icon,
  color,
  description,
  is_shared,
  is_team_shared
) VALUES 
(
  'system@investaycapital.com',
  'Templates',
  (SELECT id FROM file_bank_folders WHERE folder_name = 'Team Shared' AND user_email = 'system@investaycapital.com'),
  '/Team Shared/Templates',
  '📋',
  '#C9A962',
  'Shared templates for the team',
  1,
  1
),
(
  'system@investaycapital.com',
  'Brand Assets',
  (SELECT id FROM file_bank_folders WHERE folder_name = 'Team Shared' AND user_email = 'system@investaycapital.com'),
  '/Team Shared/Brand Assets',
  '🎨',
  '#C9A962',
  'Company branding materials',
  1,
  1
),
(
  'system@investaycapital.com',
  'Documents',
  (SELECT id FROM file_bank_folders WHERE folder_name = 'Team Shared' AND user_email = 'system@investaycapital.com'),
  '/Team Shared/Documents',
  '📄',
  '#C9A962',
  'Shared documents and files',
  1,
  1
);

-- Add index for shared folder queries
CREATE INDEX IF NOT EXISTS idx_file_bank_folders_shared ON file_bank_folders(is_team_shared, is_shared);
CREATE INDEX IF NOT EXISTS idx_file_bank_folders_user_shared ON file_bank_folders(user_email, is_shared);
