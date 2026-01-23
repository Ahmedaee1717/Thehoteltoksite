-- Otter.ai Meeting Transcripts Integration
-- Stores meeting transcripts synced from Otter.ai

CREATE TABLE IF NOT EXISTS otter_transcripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  otter_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  start_time DATETIME,
  end_time DATETIME,
  duration_seconds INTEGER DEFAULT 0,
  transcript_text TEXT,
  speakers TEXT, -- JSON array of speaker objects
  meeting_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_otter_transcripts_start_time ON otter_transcripts(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_otter_transcripts_title ON otter_transcripts(title);
CREATE INDEX IF NOT EXISTS idx_otter_transcripts_otter_id ON otter_transcripts(otter_id);

-- Full-text search support (for SQLite)
-- Note: Full-text search indexes may need to be created separately depending on D1 support
