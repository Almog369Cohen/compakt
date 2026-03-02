-- DJ Events management (separate from couple questionnaire "events" table in 013)
-- Each DJ can create events with name, date/time, venue, status, notes
-- Each event can have WhatsApp screenshot images as social proof
-- NOTE: table name is "dj_events" to avoid conflict with "events" from migration 013

CREATE TABLE IF NOT EXISTS dj_events (
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

CREATE TABLE IF NOT EXISTS event_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES dj_events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dj_events_dj_id ON dj_events(dj_id);
CREATE INDEX IF NOT EXISTS idx_dj_events_date_time ON dj_events(date_time);
CREATE INDEX IF NOT EXISTS idx_event_screenshots_event_id ON event_screenshots(event_id);

-- RLS (permissive — admin operations go through service role API routes)
ALTER TABLE dj_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_screenshots ENABLE ROW LEVEL SECURITY;

-- Public read for events (public profile can show social proof)
CREATE POLICY "dj_events_public_read" ON dj_events FOR SELECT USING (true);
CREATE POLICY "screenshots_public_read" ON event_screenshots FOR SELECT USING (true);

-- DJs can manage their own events (when using Supabase Auth)
CREATE POLICY "dj_events_insert_own" ON dj_events FOR INSERT
  WITH CHECK (dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "dj_events_update_own" ON dj_events FOR UPDATE
  USING (dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "dj_events_delete_own" ON dj_events FOR DELETE
  USING (dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Screenshots: same ownership via dj_event -> profile
CREATE POLICY "screenshots_insert_own" ON event_screenshots FOR INSERT
  WITH CHECK (event_id IN (SELECT id FROM dj_events WHERE dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));
CREATE POLICY "screenshots_update_own" ON event_screenshots FOR UPDATE
  USING (event_id IN (SELECT id FROM dj_events WHERE dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));
CREATE POLICY "screenshots_delete_own" ON event_screenshots FOR DELETE
  USING (event_id IN (SELECT id FROM dj_events WHERE dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));

-- Updated_at trigger
DROP TRIGGER IF EXISTS dj_events_updated_at ON dj_events;
CREATE TRIGGER dj_events_updated_at BEFORE UPDATE ON dj_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
