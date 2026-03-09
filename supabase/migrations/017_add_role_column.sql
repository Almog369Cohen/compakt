-- ============================================================
-- Migration 017: Add role column to profiles (if not exists)
-- Safe to run multiple times (idempotent)
-- ============================================================

-- Add role column with default 'dj'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'dj';

-- Add email column (for quick lookups without joining auth.users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index on role for future role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
