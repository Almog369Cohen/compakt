-- Trial Management System Migration
-- Adds comprehensive trial management capabilities

-- Trial periods table
CREATE TABLE IF NOT EXISTS trial_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL CHECK (plan_key IN ('starter', 'pro', 'premium', 'enterprise')),
  trial_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_extended_at TIMESTAMP WITH TIME ZONE,
  trial_extensions_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  converted_to_paid BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  trial_source TEXT DEFAULT 'self_signup' CHECK (trial_source IN ('self_signup', 'admin_created', 'coupon_triggered', 'referral')),
  usage_events_count INTEGER DEFAULT 0,
  max_events_allowed INTEGER DEFAULT 5, -- Free trial limit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trial events tracking
CREATE TABLE IF NOT EXISTS trial_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trial_periods(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('started', 'extended', 'reminder_sent', 'expired', 'converted', 'cancelled')),
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trial reminders schedule
CREATE TABLE IF NOT EXISTS trial_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trial_periods(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('day_3', 'day_7', 'day_14', 'day_1_before', 'day_expired')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN DEFAULT false,
  push_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trial settings (system-wide)
CREATE TABLE IF NOT EXISTS trial_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default trial settings
INSERT INTO trial_settings (setting_key, setting_value, description) VALUES
('default_trial_days', '14', 'Default trial period in days'),
('max_extensions', '2', 'Maximum number of trial extensions allowed'),
('extension_days', '7', 'Days added per extension'),
('reminder_schedule', '[3, 7, 14, 1]', 'Days before trial end to send reminders'),
('auto_convert_enabled', 'false', 'Automatically convert trials to paid plans'),
('trial_events_limit', '5', 'Maximum events allowed during trial')
ON CONFLICT (setting_key) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trial_periods_profile_id ON trial_periods(profile_id);
CREATE INDEX IF NOT EXISTS idx_trial_periods_ends_at ON trial_periods(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_trial_periods_active ON trial_periods(is_active);
CREATE INDEX IF NOT EXISTS idx_trial_events_trial_id ON trial_events(trial_id);
CREATE INDEX IF NOT EXISTS idx_trial_reminders_scheduled ON trial_reminders(scheduled_at, sent_at);

-- RLS Policies
ALTER TABLE trial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_reminders ENABLE ROW LEVEL SECURITY;

-- Trial periods policies
CREATE POLICY "Users can view their own trials" ON trial_periods
  FOR SELECT USING (auth.uid()::text = (SELECT user_id FROM profiles WHERE id = profile_id));

CREATE POLICY "Staff can view all trials" ON trial_periods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()::text 
      AND role IN ('staff', 'owner')
    )
  );

CREATE POLICY "System can manage trials" ON trial_periods
  FOR ALL USING (
    -- Allow service role and admin functions
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Trial events policies
CREATE POLICY "Users can view their own trial events" ON trial_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trial_periods tp
      JOIN profiles p ON p.id = tp.profile_id
      WHERE tp.id = trial_id 
      AND p.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Staff can view all trial events" ON trial_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()::text 
      AND role IN ('staff', 'owner')
    )
  );

-- Trial reminders policies
CREATE POLICY "System can manage reminders" ON trial_reminders
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Trial settings policies (read-only for most users)
CREATE POLICY "Anyone can view trial settings" ON trial_settings
  FOR SELECT USING (true);

CREATE POLICY "Staff can update trial settings" ON trial_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()::text 
      AND role IN ('staff', 'owner')
    )
  );

-- Functions for trial management

-- Function to start a trial
CREATE OR REPLACE FUNCTION start_trial(
  p_profile_id UUID,
  p_plan_key TEXT DEFAULT 'pro',
  p_trial_days INTEGER DEFAULT 14,
  p_source TEXT DEFAULT 'self_signup'
)
RETURNS UUID AS $$
DECLARE
  v_trial_id UUID;
  v_trial_ends_at TIMESTAMP WITH TIME ZONE;
  v_existing_trial RECORD;
BEGIN
  -- Check if user already has an active trial
  SELECT * INTO v_existing_trial 
  FROM trial_periods 
  WHERE profile_id = p_profile_id 
  AND is_active = true 
  AND trial_ends_at > NOW()
  LIMIT 1;
  
  IF v_existing_trial IS NOT NULL THEN
    RAISE EXCEPTION 'User already has an active trial ending at %', v_existing_trial.trial_ends_at;
  END IF;
  
  -- Calculate trial end date
  v_trial_ends_at := NOW() + (p_trial_days || ' days')::INTERVAL;
  
  -- Create trial
  INSERT INTO trial_periods (
    profile_id, 
    plan_key, 
    trial_ends_at,
    trial_source,
    max_events_allowed
  ) VALUES (
    p_profile_id, 
    p_plan_key, 
    v_trial_ends_at,
    p_source,
    CASE 
      WHEN p_plan_key = 'starter' THEN 3
      WHEN p_plan_key = 'pro' THEN 10
      WHEN p_plan_key = 'premium' THEN 25
      ELSE 5
    END
  ) RETURNING id INTO v_trial_id;
  
  -- Log trial start event
  INSERT INTO trial_events (trial_id, event_type, event_data)
  VALUES (v_trial_id, 'started', jsonb_build_object(
    'plan_key', p_plan_key,
    'trial_days', p_trial_days,
    'source', p_source
  ));
  
  -- Schedule reminders
  INSERT INTO trial_reminders (trial_id, reminder_type, scheduled_at)
  SELECT 
    v_trial_id,
    reminder_type,
    v_trial_ends_at - (days || ' days')::INTERVAL
  FROM unnest(ARRAY['day_3', 'day_7', 'day_14', 'day_1_before']) AS reminder_type,
       unnest(ARRAY[3, 7, 14, 1]) AS days
  WHERE days <= p_trial_days;
  
  -- Update profile with trial info
  UPDATE profiles 
  SET 
    trial_started_at = NOW(),
    trial_ends_at = v_trial_ends_at,
    updated_at = NOW()
  WHERE id = p_profile_id;
  
  RETURN v_trial_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extend trial
CREATE OR REPLACE FUNCTION extend_trial(
  p_trial_id UUID,
  p_extension_days INTEGER DEFAULT 7
)
RETURNS BOOLEAN AS $$
DECLARE
  v_trial RECORD;
  v_max_extensions INTEGER;
  v_new_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get trial info
  SELECT * INTO v_trial 
  FROM trial_periods 
  WHERE id = p_trial_id AND is_active = true;
  
  IF v_trial IS NULL THEN
    RAISE EXCEPTION 'Trial not found or inactive';
  END IF;
  
  -- Get max extensions setting
  SELECT (setting_value::text)::integer INTO v_max_extensions
  FROM trial_settings 
  WHERE setting_key = 'max_extensions';
  
  -- Check extension limit
  IF v_trial.trial_extensions_count >= v_max_extensions THEN
    RAISE EXCEPTION 'Maximum trial extensions reached';
  END IF;
  
  -- Calculate new end date
  v_new_end_date := v_trial.trial_ends_at + (p_extension_days || ' days')::INTERVAL;
  
  -- Update trial
  UPDATE trial_periods 
  SET 
    trial_ends_at = v_new_end_date,
    trial_extended_at = NOW(),
    trial_extensions_count = trial_extensions_count + 1,
    updated_at = NOW()
  WHERE id = p_trial_id;
  
  -- Update profile
  UPDATE profiles 
  SET trial_ends_at = v_new_end_date, updated_at = NOW()
  WHERE id = v_trial.profile_id;
  
  -- Log extension event
  INSERT INTO trial_events (trial_id, event_type, event_data)
  VALUES (p_trial_id, 'extended', jsonb_build_object(
    'extension_days', p_extension_days,
    'new_end_date', v_new_end_date,
    'total_extensions', v_trial.trial_extensions_count + 1
  ));
  
  -- Schedule new reminder if needed
  INSERT INTO trial_reminders (trial_id, reminder_type, scheduled_at)
  VALUES (
    p_trial_id,
    'day_1_before',
    v_new_end_date - '1 day'::INTERVAL
  ) ON CONFLICT DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert trial to paid
CREATE OR REPLACE FUNCTION convert_trial_to_paid(
  p_trial_id UUID,
  p_plan_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_trial RECORD;
BEGIN
  -- Get trial info
  SELECT * INTO v_trial 
  FROM trial_periods 
  WHERE id = p_trial_id AND is_active = true;
  
  IF v_trial IS NULL THEN
    RAISE EXCEPTION 'Trial not found or inactive';
  END IF;
  
  -- Update trial
  UPDATE trial_periods 
  SET 
    converted_to_paid = true,
    converted_at = NOW(),
    is_active = false,
    updated_at = NOW()
  WHERE id = p_trial_id;
  
  -- Update profile plan
  UPDATE profiles 
  SET 
    plan = p_plan_key,
    trial_ends_at = NULL,
    updated_at = NOW()
  WHERE id = v_trial.profile_id;
  
  -- Log conversion event
  INSERT INTO trial_events (trial_id, event_type, event_data)
  VALUES (p_trial_id, 'converted', jsonb_build_object(
    'from_plan', v_trial.plan_key,
    'to_plan', p_plan_key,
    'converted_at', NOW()
  ));
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check trial status
CREATE OR REPLACE FUNCTION check_trial_status(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_trial RECORD;
  v_result JSONB;
BEGIN
  -- Get active trial
  SELECT * INTO v_trial 
  FROM trial_periods 
  WHERE profile_id = p_profile_id 
  AND is_active = true 
  AND trial_ends_at > NOW()
  ORDER BY trial_started_at DESC
  LIMIT 1;
  
  IF v_trial IS NULL THEN
    RETURN jsonb_build_object(
      'has_trial', false,
      'status', 'no_trial'
    );
  END IF;
  
  -- Calculate days remaining
  RETURN jsonb_build_object(
    'has_trial', true,
    'trial_id', v_trial.id,
    'plan_key', v_trial.plan_key,
    'started_at', v_trial.trial_started_at,
    'ends_at', v_trial.trial_ends_at,
    'days_remaining', EXTRACT(DAYS FROM v_trial.trial_ends_at - NOW()),
    'events_used', v_trial.usage_events_count,
    'events_limit', v_trial.max_events_allowed,
    'extensions_used', v_trial.trial_extensions_count,
    'can_extend', v_trial.trial_extensions_count < 2,
    'status', CASE 
      WHEN v_trial.trial_ends_at <= NOW() THEN 'expired'
      WHEN v_trial.trial_ends_at <= NOW() + '3 days'::INTERVAL THEN 'expiring_soon'
      ELSE 'active'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_trial_periods_updated_at
  BEFORE UPDATE ON trial_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trial_settings_updated_at
  BEFORE UPDATE ON trial_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
