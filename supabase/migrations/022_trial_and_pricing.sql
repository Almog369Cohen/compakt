-- Migration 022: Trial and Pricing Features
-- Adds trial management and discount tracking to profiles

-- Add trial and discount columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount_expires_at TIMESTAMPTZ;

-- Create index for trial expiry queries
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at ON profiles(trial_ends_at) WHERE trial_ends_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.trial_ends_at IS 'When the premium trial expires (null if not on trial)';
COMMENT ON COLUMN profiles.trial_started_at IS 'When the premium trial started';
COMMENT ON COLUMN profiles.discount_code IS 'Active discount code for the user';
COMMENT ON COLUMN profiles.discount_expires_at IS 'When the discount code expires';
