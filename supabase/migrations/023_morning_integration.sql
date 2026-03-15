-- Morning Integration - Payment & Subscription Management
-- Add columns to track Morning customer and subscription data

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS morning_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS morning_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_method_last4 TEXT;

-- Index for finding active subscriptions
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status 
ON profiles(subscription_status) 
WHERE subscription_status IN ('active', 'trialing');

-- Index for trial expiration checks
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends 
ON profiles(trial_ends_at) 
WHERE trial_ends_at IS NOT NULL;

-- Comment
COMMENT ON COLUMN profiles.morning_customer_id IS 'Morning (Green Invoice) customer ID';
COMMENT ON COLUMN profiles.morning_subscription_id IS 'Morning subscription ID for recurring payments';
COMMENT ON COLUMN profiles.subscription_status IS 'Subscription status: none, pending, trialing, active, cancelled, past_due';
COMMENT ON COLUMN profiles.trial_ends_at IS 'When the trial period ends';
COMMENT ON COLUMN profiles.next_billing_date IS 'Next billing date for the subscription';
COMMENT ON COLUMN profiles.payment_method_last4 IS 'Last 4 digits of payment method';
