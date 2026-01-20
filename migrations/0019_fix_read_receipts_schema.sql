-- Fix shared_mailbox_read_receipts schema - email_id should be TEXT not INTEGER
-- This is because emails.id is TEXT (e.g., 'eml_1234567890_abcdef')

-- Drop the old table
DROP TABLE IF EXISTS shared_mailbox_read_receipts;

-- Recreate with correct schema
CREATE TABLE IF NOT EXISTS shared_mailbox_read_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id TEXT NOT NULL,
  shared_mailbox_id INTEGER NOT NULL,
  user_email TEXT NOT NULL,
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email_id) REFERENCES emails(id),
  FOREIGN KEY (shared_mailbox_id) REFERENCES shared_mailboxes(id),
  UNIQUE(email_id, shared_mailbox_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_read_receipts_email ON shared_mailbox_read_receipts(email_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_mailbox ON shared_mailbox_read_receipts(shared_mailbox_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user ON shared_mailbox_read_receipts(user_email);
