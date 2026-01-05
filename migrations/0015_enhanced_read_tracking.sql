-- Migration: Enhanced Read Tracking
-- Add columns to track HOW emails were read (pixel, link, reply)

-- Add read_method column to emails table
ALTER TABLE emails ADD COLUMN read_method TEXT DEFAULT NULL;
-- Values: 'pixel', 'link_click', 'reply', 'manual'

-- Add read_method to email_read_receipts table
ALTER TABLE email_read_receipts ADD COLUMN read_method TEXT DEFAULT 'pixel';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_emails_read_method ON emails(read_method);
CREATE INDEX IF NOT EXISTS idx_read_receipts_method ON email_read_receipts(read_method);
