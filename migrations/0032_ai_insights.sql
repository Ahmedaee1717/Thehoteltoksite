-- AI-Powered Meeting Insights Tables
-- For sentiment tracking, fact-checking, and speaker analytics

-- Sentiment Analysis Results
CREATE TABLE IF NOT EXISTS meeting_sentiment_analysis (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  chunk_id TEXT,
  timestamp_ms INTEGER,
  sentiment TEXT NOT NULL, -- 'positive', 'neutral', 'negative'
  confidence REAL, -- 0-1
  emotion_label TEXT, -- 'joy', 'anger', 'sadness', etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES zoom_meeting_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (chunk_id) REFERENCES zoom_transcript_chunks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sentiment_session ON meeting_sentiment_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_timestamp ON meeting_sentiment_analysis(timestamp_ms);

-- Fact-Checking Results
CREATE TABLE IF NOT EXISTS meeting_fact_checks (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  chunk_id TEXT,
  claim TEXT NOT NULL,
  verification_status TEXT, -- 'verified', 'unverified', 'false', 'needs_context'
  sources TEXT, -- JSON array of source URLs
  summary TEXT,
  confidence REAL,
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES zoom_meeting_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (chunk_id) REFERENCES zoom_transcript_chunks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fact_checks_session ON meeting_fact_checks(session_id);
CREATE INDEX IF NOT EXISTS idx_fact_checks_status ON meeting_fact_checks(verification_status);

-- Speaker Talk-Time Analytics
CREATE TABLE IF NOT EXISTS speaker_analytics (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  speaker_name TEXT NOT NULL,
  speaker_id TEXT,
  total_talk_time_ms INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  interruption_count INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  sentiment_score REAL, -- Average sentiment
  energy_level REAL, -- Speaking energy/pace
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES zoom_meeting_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_speaker_analytics_session ON speaker_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_speaker_analytics_speaker ON speaker_analytics(speaker_id);

-- AI Meeting Summaries (Sparkpages)
CREATE TABLE IF NOT EXISTS meeting_summaries (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT,
  summary_type TEXT, -- 'quick', 'detailed', 'sparkpage'
  content TEXT NOT NULL, -- Markdown or HTML
  key_topics TEXT, -- JSON array
  action_items TEXT, -- JSON array
  decisions TEXT, -- JSON array
  generated_by TEXT DEFAULT 'claude', -- AI model used
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES zoom_meeting_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_summaries_session ON meeting_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_summaries_type ON meeting_summaries(summary_type);

-- AI Co-Pilot Chat History
CREATE TABLE IF NOT EXISTS copilot_chat_history (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  message_type TEXT, -- 'user', 'assistant'
  message TEXT NOT NULL,
  context_used TEXT, -- What context was provided to AI
  timestamp_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES zoom_meeting_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_copilot_session ON copilot_chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_copilot_user ON copilot_chat_history(user_email);
