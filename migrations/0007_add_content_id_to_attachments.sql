-- Add content_id column to attachments table for inline image support
-- Content-ID is used to map cid: references in email HTML to actual attachments

ALTER TABLE attachments ADD COLUMN content_id TEXT;

-- Create index for faster CID lookups
CREATE INDEX IF NOT EXISTS idx_attachments_content_id ON attachments(content_id);
