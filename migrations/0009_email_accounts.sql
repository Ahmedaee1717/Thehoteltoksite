-- Email Accounts Management
-- Admin can create/delete email accounts for the domain

CREATE TABLE IF NOT EXISTS email_accounts (
    id TEXT PRIMARY KEY,
    email_address TEXT UNIQUE NOT NULL,
    display_name TEXT,
    password_hash TEXT, -- For future authentication
    forward_to TEXT, -- Forward emails to this address
    is_active INTEGER DEFAULT 1,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email_address);
CREATE INDEX IF NOT EXISTS idx_email_accounts_active ON email_accounts(is_active);

-- Email Account Aliases (multiple addresses for one account)
CREATE TABLE IF NOT EXISTS email_aliases (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    alias_address TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES email_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email_aliases_account ON email_aliases(account_id);

-- Email Account Quotas and Statistics
CREATE TABLE IF NOT EXISTS email_account_stats (
    account_id TEXT PRIMARY KEY,
    emails_sent_today INTEGER DEFAULT 0,
    emails_sent_total INTEGER DEFAULT 0,
    emails_received_total INTEGER DEFAULT 0,
    storage_used_mb REAL DEFAULT 0,
    last_sent_at DATETIME,
    last_received_at DATETIME,
    FOREIGN KEY (account_id) REFERENCES email_accounts(id) ON DELETE CASCADE
);
