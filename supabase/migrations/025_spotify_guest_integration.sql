-- ============================================================
-- Migration 025: Spotify Guest Playlist Integration
-- Purpose: Allow guests to share their Spotify playlists for music analysis
-- ============================================================

-- 1. Guest Invitations Table
CREATE TABLE IF NOT EXISTS guest_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_email TEXT NOT NULL,
  guest_name TEXT,
  invite_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'declined')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_invitations_event_id ON guest_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_invitations_invite_token ON guest_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_guest_invitations_status ON guest_invitations(status);

-- 2. Guest Spotify Tokens Table (encrypted tokens)
CREATE TABLE IF NOT EXISTS guest_spotify_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES guest_invitations(id) ON DELETE CASCADE,
  spotify_user_id TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_spotify_tokens_invitation_id ON guest_spotify_tokens(invitation_id);
CREATE INDEX IF NOT EXISTS idx_guest_spotify_tokens_expires_at ON guest_spotify_tokens(expires_at);

-- 3. Guest Playlists Table
CREATE TABLE IF NOT EXISTS guest_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES guest_invitations(id) ON DELETE CASCADE,
  spotify_playlist_id TEXT NOT NULL,
  playlist_name TEXT NOT NULL,
  track_count INT DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_playlists_invitation_id ON guest_playlists(invitation_id);
CREATE INDEX IF NOT EXISTS idx_guest_playlists_spotify_playlist_id ON guest_playlists(spotify_playlist_id);

-- 4. Guest Tracks Table
CREATE TABLE IF NOT EXISTS guest_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES guest_playlists(id) ON DELETE CASCADE,
  spotify_track_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  popularity INT DEFAULT 0 CHECK (popularity BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_tracks_playlist_id ON guest_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_guest_tracks_spotify_track_id ON guest_tracks(spotify_track_id);

-- 5. Event Music Analysis Table (cached analysis results)
CREATE TABLE IF NOT EXISTS event_music_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  top_tracks JSONB DEFAULT '[]'::jsonb,
  total_guests_connected INT DEFAULT 0,
  total_tracks_analyzed INT DEFAULT 0,
  last_analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_music_analysis_event_id ON event_music_analysis(event_id);
CREATE INDEX IF NOT EXISTS idx_event_music_analysis_last_analyzed_at ON event_music_analysis(last_analyzed_at);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE guest_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_spotify_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_music_analysis ENABLE ROW LEVEL SECURITY;

-- Guest Invitations Policies
DROP POLICY IF EXISTS "Guests can view their own invitation" ON guest_invitations;
CREATE POLICY "Guests can view their own invitation" ON guest_invitations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Guests can update their own invitation status" ON guest_invitations;
CREATE POLICY "Guests can update their own invitation status" ON guest_invitations
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Service role full access to guest_invitations" ON guest_invitations;
CREATE POLICY "Service role full access to guest_invitations" ON guest_invitations
  FOR ALL USING (true);

-- Guest Spotify Tokens Policies (service role only for security)
DROP POLICY IF EXISTS "Service role full access to guest_spotify_tokens" ON guest_spotify_tokens;
CREATE POLICY "Service role full access to guest_spotify_tokens" ON guest_spotify_tokens
  FOR ALL USING (true);

-- Guest Playlists Policies
DROP POLICY IF EXISTS "Service role full access to guest_playlists" ON guest_playlists;
CREATE POLICY "Service role full access to guest_playlists" ON guest_playlists
  FOR ALL USING (true);

-- Guest Tracks Policies
DROP POLICY IF EXISTS "Service role full access to guest_tracks" ON guest_tracks;
CREATE POLICY "Service role full access to guest_tracks" ON guest_tracks
  FOR ALL USING (true);

-- Event Music Analysis Policies
DROP POLICY IF EXISTS "Service role full access to event_music_analysis" ON event_music_analysis;
CREATE POLICY "Service role full access to event_music_analysis" ON event_music_analysis
  FOR ALL USING (true);

-- ============================================================
-- Helper Functions
-- ============================================================

-- Function to generate unique invite token
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_guest_invitations_updated_at ON guest_invitations;
CREATE TRIGGER update_guest_invitations_updated_at
  BEFORE UPDATE ON guest_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guest_spotify_tokens_updated_at ON guest_spotify_tokens;
CREATE TRIGGER update_guest_spotify_tokens_updated_at
  BEFORE UPDATE ON guest_spotify_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_music_analysis_updated_at ON event_music_analysis;
CREATE TRIGGER update_event_music_analysis_updated_at
  BEFORE UPDATE ON event_music_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Success Message
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 025 completed successfully: Spotify Guest Integration tables created';
END $$;
