-- ============================================================
-- Migration 013: Profiles, Events, Swipes, Answers, Requests
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Profiles table (DJ profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT '',
  tagline TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  accent_color TEXT DEFAULT '#059cc0',
  dj_slug TEXT UNIQUE,
  logo_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  tiktok_url TEXT DEFAULT '',
  soundcloud_url TEXT DEFAULT '',
  spotify_url TEXT DEFAULT '',
  youtube_url TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  whatsapp_number TEXT DEFAULT '',
  custom_links JSONB DEFAULT '[]'::jsonb,
  gallery_photos JSONB DEFAULT '[]'::jsonb,
  reviews JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_dj_slug ON profiles(dj_slug);

-- 2. Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dj_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  magic_token TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'wedding',
  couple_name_a TEXT DEFAULT '',
  couple_name_b TEXT DEFAULT '',
  event_date TEXT DEFAULT '',
  venue TEXT DEFAULT '',
  current_stage INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_magic_token ON events(magic_token);
CREATE INDEX IF NOT EXISTS idx_events_dj_id ON events(dj_id);

-- 3. Answers table (question answers per event)
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_answers_event_id ON answers(event_id);

-- 4. Swipes table (song swipes per event)
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'dislike', 'super_like', 'unsure')),
  reason_chips JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_swipes_event_id ON swipes(event_id);

-- 5. Requests table (free text, do/dont, links, moments)
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('free_text', 'do', 'dont', 'link', 'special_moment')),
  content TEXT NOT NULL,
  moment_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_event_id ON requests(event_id);

-- 6. Songs table (DJ's song library — per DJ)
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dj_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  cover_url TEXT DEFAULT '',
  preview_url TEXT DEFAULT '',
  external_link TEXT DEFAULT '',
  category TEXT DEFAULT 'dancing',
  tags JSONB DEFAULT '[]'::jsonb,
  energy INT DEFAULT 3 CHECK (energy BETWEEN 1 AND 5),
  language TEXT DEFAULT 'hebrew',
  is_safe BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_songs_dj_id ON songs(dj_id);

-- 7. Questions table (DJ's question set — per DJ)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dj_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_he TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single_select',
  event_type TEXT NOT NULL DEFAULT 'wedding',
  options JSONB DEFAULT '[]'::jsonb,
  slider_min INT,
  slider_max INT,
  slider_labels JSONB,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_dj_id ON questions(dj_id);

-- 8. Upsells table (per DJ)
CREATE TABLE IF NOT EXISTS upsells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dj_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title_he TEXT NOT NULL,
  description_he TEXT DEFAULT '',
  price_hint TEXT DEFAULT '',
  cta_text_he TEXT DEFAULT '',
  placement TEXT DEFAULT 'stage_4',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_upsells_dj_id ON upsells(dj_id);

-- ============================================================
-- RLS Policies (idempotent: DROP IF EXISTS before CREATE)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsells ENABLE ROW LEVEL SECURITY;

-- Helper: SECURITY DEFINER function to get profile id without RLS recursion
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- Songs
DROP POLICY IF EXISTS "songs_select_public" ON songs;
DROP POLICY IF EXISTS "songs_insert_own" ON songs;
DROP POLICY IF EXISTS "songs_update_own" ON songs;
DROP POLICY IF EXISTS "songs_delete_own" ON songs;
CREATE POLICY "songs_select_public" ON songs FOR SELECT USING (true);
CREATE POLICY "songs_insert_own" ON songs FOR INSERT WITH CHECK (
  dj_id = get_my_profile_id()
);
CREATE POLICY "songs_update_own" ON songs FOR UPDATE USING (
  dj_id = get_my_profile_id()
);
CREATE POLICY "songs_delete_own" ON songs FOR DELETE USING (
  dj_id = get_my_profile_id()
);

-- Questions
DROP POLICY IF EXISTS "questions_select_public" ON questions;
DROP POLICY IF EXISTS "questions_insert_own" ON questions;
DROP POLICY IF EXISTS "questions_update_own" ON questions;
DROP POLICY IF EXISTS "questions_delete_own" ON questions;
CREATE POLICY "questions_select_public" ON questions FOR SELECT USING (true);
CREATE POLICY "questions_insert_own" ON questions FOR INSERT WITH CHECK (
  dj_id = get_my_profile_id()
);
CREATE POLICY "questions_update_own" ON questions FOR UPDATE USING (
  dj_id = get_my_profile_id()
);
CREATE POLICY "questions_delete_own" ON questions FOR DELETE USING (
  dj_id = get_my_profile_id()
);

-- Upsells
DROP POLICY IF EXISTS "upsells_select_public" ON upsells;
DROP POLICY IF EXISTS "upsells_insert_own" ON upsells;
DROP POLICY IF EXISTS "upsells_update_own" ON upsells;
DROP POLICY IF EXISTS "upsells_delete_own" ON upsells;
CREATE POLICY "upsells_select_public" ON upsells FOR SELECT USING (true);
CREATE POLICY "upsells_insert_own" ON upsells FOR INSERT WITH CHECK (
  dj_id = get_my_profile_id()
);
CREATE POLICY "upsells_update_own" ON upsells FOR UPDATE USING (
  dj_id = get_my_profile_id()
);
CREATE POLICY "upsells_delete_own" ON upsells FOR DELETE USING (
  dj_id = get_my_profile_id()
);

-- Events
DROP POLICY IF EXISTS "events_insert_anon" ON events;
DROP POLICY IF EXISTS "events_select_by_token" ON events;
DROP POLICY IF EXISTS "events_update_by_token" ON events;
CREATE POLICY "events_insert_anon" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "events_select_by_token" ON events FOR SELECT USING (true);
CREATE POLICY "events_update_by_token" ON events FOR UPDATE USING (true);

-- Answers
DROP POLICY IF EXISTS "answers_insert_anon" ON answers;
DROP POLICY IF EXISTS "answers_select" ON answers;
CREATE POLICY "answers_insert_anon" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "answers_select" ON answers FOR SELECT USING (true);

-- Swipes
DROP POLICY IF EXISTS "swipes_insert_anon" ON swipes;
DROP POLICY IF EXISTS "swipes_select" ON swipes;
CREATE POLICY "swipes_insert_anon" ON swipes FOR INSERT WITH CHECK (true);
CREATE POLICY "swipes_select" ON swipes FOR SELECT USING (true);

-- Requests
DROP POLICY IF EXISTS "requests_insert_anon" ON requests;
DROP POLICY IF EXISTS "requests_select" ON requests;
CREATE POLICY "requests_insert_anon" ON requests FOR INSERT WITH CHECK (true);
CREATE POLICY "requests_select" ON requests FOR SELECT USING (true);

-- ============================================================
-- Updated_at trigger (idempotent)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
