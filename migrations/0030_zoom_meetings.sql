-- Zoom Meeting Sessions and Events
-- Stores data from Zoom webhooks for meeting bot

-- Meeting Sessions
CREATE TABLE IF NOT EXISTS zoom_meeting_sessions (
  id TEXT PRIMARY KEY,
  zoom_meeting_id TEXT UNIQUE NOT NULL,
  topic TEXT,
  host_id TEXT,
  start_time DATETIME,
  end_time DATETIME,
  duration INTEGER, -- in minutes
  status TEXT DEFAULT 'active', -- 'active', 'ended'
  recording_url TEXT,
  recording_completed_at DATETIME,
  transcript_url TEXT,
  transcript_completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_zoom_meetings_id ON zoom_meeting_sessions(zoom_meeting_id);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_status ON zoom_meeting_sessions(status);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_start ON zoom_meeting_sessions(start_time);

-- Meeting Participants
CREATE TABLE IF NOT EXISTS zoom_meeting_participants (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  user_name TEXT,
  email TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  left_at DATETIME,
  FOREIGN KEY (session_id) REFERENCES zoom_meeting_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_zoom_participants_session ON zoom_meeting_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_zoom_participants_id ON zoom_meeting_participants(participant_id);

-- Real-time Transcript Chunks (for bot transcription)
CREATE TABLE IF NOT EXISTS zoom_transcript_chunks (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  speaker_name TEXT,
  speaker_id TEXT,
  text TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  timestamp_ms INTEGER, -- Milliseconds from meeting start
  confidence REAL, -- Speech-to-text confidence 0-1
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES zoom_meeting_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transcript_session ON zoom_transcript_chunks(session_id);
CREATE INDEX IF NOT EXISTS idx_transcript_timestamp ON zoom_transcript_chunks(timestamp_ms);

-- Translations
CREATE TABLE IF NOT EXISTS zoom_transcript_translations (
  id TEXT PRIMARY KEY,
  chunk_id TEXT NOT NULL,
  target_language TEXT NOT NULL, -- 'es', 'fr', 'de', etc.
  translated_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chunk_id) REFERENCES zoom_transcript_chunks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_translations_chunk ON zoom_transcript_translations(chunk_id);
CREATE INDEX IF NOT EXISTS idx_translations_lang ON zoom_transcript_translations(target_language);

-- User Language Preferences
CREATE TABLE IF NOT EXISTS zoom_user_language_preferences (
  user_email TEXT PRIMARY KEY,
  preferred_language TEXT DEFAULT 'en',
  show_original INTEGER DEFAULT 1, -- Boolean: show original + translation
  auto_scroll INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
