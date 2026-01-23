-- Add is_shared column to file_bank_files
ALTER TABLE file_bank_files ADD COLUMN is_shared INTEGER DEFAULT 0;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_file_bank_files_shared ON file_bank_files(is_shared);

-- Update existing "Shared" folder to be team shared (if not already)
UPDATE file_bank_folders SET is_team_shared = 1 WHERE folder_name LIKE '%Shared%' OR folder_name LIKE '%Team%';

