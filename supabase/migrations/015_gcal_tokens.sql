-- Add Google Calendar tokens column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_tokens JSONB;

-- Add unique constraint for upsert on events by dj_id + google_event_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_dj_google_event
  ON events(dj_id, google_event_id)
  WHERE google_event_id IS NOT NULL;
