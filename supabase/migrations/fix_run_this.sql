-- ============================================================
-- FIX SCRIPT: Run this ONCE in Supabase SQL Editor
-- Drops old conflicting tables and re-creates everything cleanly
-- ============================================================

-- ========== PART 1: DJ Events (from 014) ==========

-- Drop old versions if they exist
DROP TABLE IF EXISTS event_screenshots CASCADE;
DROP TABLE IF EXISTS dj_events CASCADE;

-- Create dj_events
CREATE TABLE dj_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dj_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_time TIMESTAMPTZ,
  venue TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  google_event_id TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create event_screenshots
CREATE TABLE event_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES dj_events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_dj_events_dj_id ON dj_events(dj_id);
CREATE INDEX idx_dj_events_date_time ON dj_events(date_time);
CREATE INDEX idx_event_screenshots_event_id ON event_screenshots(event_id);

-- RLS
ALTER TABLE dj_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dj_events_public_read" ON dj_events FOR SELECT USING (true);
CREATE POLICY "screenshots_public_read" ON event_screenshots FOR SELECT USING (true);

CREATE POLICY "dj_events_insert_own" ON dj_events FOR INSERT
  WITH CHECK (dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "dj_events_update_own" ON dj_events FOR UPDATE
  USING (dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "dj_events_delete_own" ON dj_events FOR DELETE
  USING (dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "screenshots_insert_own" ON event_screenshots FOR INSERT
  WITH CHECK (event_id IN (SELECT id FROM dj_events WHERE dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));
CREATE POLICY "screenshots_update_own" ON event_screenshots FOR UPDATE
  USING (event_id IN (SELECT id FROM dj_events WHERE dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));
CREATE POLICY "screenshots_delete_own" ON event_screenshots FOR DELETE
  USING (event_id IN (SELECT id FROM dj_events WHERE dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));

-- Trigger (create function if missing)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dj_events_updated_at ON dj_events;
CREATE TRIGGER dj_events_updated_at BEFORE UPDATE ON dj_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ========== PART 2: Phone Auth + Analytics (from 016) ==========

-- Drop old versions if they exist
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS event_sessions CASCADE;

-- Event Sessions
CREATE TABLE event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  phone_verified BOOLEAN DEFAULT false,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  otp_attempts INT DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_event_sessions_phone_event ON event_sessions(event_id, phone_number);
CREATE INDEX idx_event_sessions_phone ON event_sessions(phone_number);

-- Analytics Events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  session_id UUID REFERENCES event_sessions(id) ON DELETE SET NULL,
  dj_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'couple',
  metadata JSONB DEFAULT '{}'::jsonb,
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_event_id ON analytics_events(event_id);
CREATE INDEX idx_analytics_dj_id ON analytics_events(dj_id);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_category ON analytics_events(category);

-- RLS
ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_insert_anon" ON event_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_select_anon" ON event_sessions FOR SELECT USING (true);
CREATE POLICY "sessions_update_anon" ON event_sessions FOR UPDATE USING (true);

CREATE POLICY "analytics_insert_anon" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "analytics_select_public" ON analytics_events FOR SELECT USING (true);

-- Add columns to events table (safe — skips if already exist)
ALTER TABLE events ADD COLUMN IF NOT EXISTS dj_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS phone_number TEXT;

CREATE INDEX IF NOT EXISTS idx_events_dj_id_ref ON events(dj_id);
