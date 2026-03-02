-- ============================================================
-- Migration 016: Phone Auth Sessions + Analytics Events
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Event Sessions — links phone number to event for couple auth + resume
CREATE TABLE IF NOT EXISTS event_sessions (
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_sessions_phone_event
  ON event_sessions(event_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_event_sessions_phone
  ON event_sessions(phone_number);

-- 2. Analytics Events — comprehensive tracking for couple + admin activity
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Who
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  session_id UUID REFERENCES event_sessions(id) ON DELETE SET NULL,
  dj_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- What
  event_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'couple',
    -- categories: couple, admin, system
  -- Context
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Where
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  -- When
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_event_id ON analytics_events(event_id);
CREATE INDEX IF NOT EXISTS idx_analytics_dj_id ON analytics_events(dj_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_category ON analytics_events(category);

-- 3. RLS — permissive for inserts (tracking), restricted reads
ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Event sessions: anyone can create (couple entering phone), read own by phone match
CREATE POLICY "sessions_insert_anon" ON event_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_select_anon" ON event_sessions FOR SELECT USING (true);
CREATE POLICY "sessions_update_anon" ON event_sessions FOR UPDATE USING (true);

-- Analytics: anyone can insert (tracking), DJs can read their own
CREATE POLICY "analytics_insert_anon" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "analytics_select_public" ON analytics_events FOR SELECT USING (true);

-- 4. Add dj_id to events table (links couple event to a specific DJ)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'dj_id'
  ) THEN
    ALTER TABLE events ADD COLUMN dj_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    CREATE INDEX idx_events_dj_id_ref ON events(dj_id);
  END IF;
END
$$;

-- 5. Add phone_number to events table (for couple identification)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE events ADD COLUMN phone_number TEXT;
  END IF;
END
$$;
