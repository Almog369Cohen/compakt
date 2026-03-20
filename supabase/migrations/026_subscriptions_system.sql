-- Subscription Management System
-- Coupon-based access with trial support

-- ============================================================================
-- 1. Update Coupons Table
-- ============================================================================

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS subscription_duration_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS trial_duration_days INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;

COMMENT ON COLUMN coupons.subscription_duration_days IS 'Duration of subscription in days (default 30)';
COMMENT ON COLUMN coupons.trial_duration_days IS 'Trial period before payment required (default 7)';
COMMENT ON COLUMN coupons.auto_renew IS 'Whether subscription auto-renews (future use)';

-- ============================================================================
-- 2. Create Subscriptions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Subscription details
  plan_key TEXT NOT NULL CHECK (plan_key IN ('starter', 'pro', 'premium', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'cancelled', 'expired', 'trial_expired', 'pending')),
  
  -- Dates
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Payment tracking
  payment_method TEXT DEFAULT 'manual', -- manual, morning, stripe, coupon, etc.
  payment_reference TEXT, -- מספר הזמנה/חשבונית
  amount_paid NUMERIC,
  currency TEXT DEFAULT 'ILS',
  
  -- Coupon link
  coupon_id UUID REFERENCES coupons(id),
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(profile_id, started_at)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_id ON subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_coupon_id ON subscriptions(coupon_id);

COMMENT ON TABLE subscriptions IS 'User subscriptions with trial and payment tracking';
COMMENT ON COLUMN subscriptions.status IS 'trial, active, cancelled, expired, trial_expired, pending';
COMMENT ON COLUMN subscriptions.payment_method IS 'manual, morning, stripe, coupon';

-- ============================================================================
-- 3. Create Subscription Events Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'activated', 'renewed', 'cancelled', 
    'expired', 'upgraded', 'downgraded', 'payment_received',
    'trial_started', 'trial_ended', 'trial_converted'
  )),
  event_data JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at DESC);

COMMENT ON TABLE subscription_events IS 'Audit log for subscription changes';

-- ============================================================================
-- 4. RLS Policies for Subscriptions
-- ============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (
    auth.uid() = (SELECT user_id::uuid FROM profiles WHERE id = profile_id)
  );

DROP POLICY IF EXISTS "Staff can view all subscriptions" ON subscriptions;
CREATE POLICY "Staff can view all subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id::uuid = auth.uid()
      AND role IN ('staff', 'owner')
    )
  );

DROP POLICY IF EXISTS "Staff can manage subscriptions" ON subscriptions;
CREATE POLICY "Staff can manage subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id::uuid = auth.uid()
      AND role IN ('staff', 'owner')
    )
  );

-- Subscription events policies
DROP POLICY IF EXISTS "Users can view their subscription events" ON subscription_events;
CREATE POLICY "Users can view their subscription events" ON subscription_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      JOIN profiles p ON s.profile_id = p.id
      WHERE s.id = subscription_events.subscription_id
      AND p.user_id::uuid = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can view all subscription events" ON subscription_events;
CREATE POLICY "Staff can view all subscription events" ON subscription_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id::uuid = auth.uid()
      AND role IN ('staff', 'owner')
    )
  );

-- ============================================================================
-- 5. Functions
-- ============================================================================

-- Function: Create subscription from coupon with trial
CREATE OR REPLACE FUNCTION create_subscription_from_coupon(
  p_profile_id UUID,
  p_coupon_code TEXT,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_coupon RECORD;
  v_subscription_id UUID;
  v_plan_key TEXT;
  v_trial_days INTEGER;
  v_subscription_days INTEGER;
  v_trial_ends_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon FROM coupons WHERE code = p_coupon_code AND is_active = true;
  
  IF v_coupon IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive coupon';
  END IF;
  
  -- Check if coupon already used by this profile
  IF EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE coupon_id = v_coupon.id AND profile_id = p_profile_id
  ) THEN
    RAISE EXCEPTION 'Coupon already used by this profile';
  END IF;
  
  -- Check max uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RAISE EXCEPTION 'Coupon has reached maximum uses';
  END IF;
  
  -- Determine plan and duration from coupon
  v_plan_key := COALESCE(v_coupon.applicable_plans[1], 'pro');
  v_trial_days := COALESCE(v_coupon.trial_duration_days, 7);
  v_subscription_days := COALESCE(v_coupon.subscription_duration_days, 30);
  v_trial_ends_at := NOW() + (v_trial_days || ' days')::INTERVAL;
  
  -- Create subscription with trial status
  INSERT INTO subscriptions (
    profile_id, 
    plan_key, 
    status,
    started_at,
    expires_at, 
    coupon_id, 
    payment_reference, 
    payment_method
  ) VALUES (
    p_profile_id, 
    v_plan_key,
    'trial',
    NOW(),
    v_trial_ends_at,
    v_coupon.id, 
    p_payment_reference, 
    'coupon'
  ) RETURNING id INTO v_subscription_id;
  
  -- Update profile with trial info
  UPDATE profiles 
  SET 
    plan = v_plan_key,
    trial_ends_at = v_trial_ends_at,
    subscription_status = 'trialing'
  WHERE id = p_profile_id;
  
  -- Mark coupon as used
  UPDATE coupons 
  SET used_count = used_count + 1 
  WHERE id = v_coupon.id;
  
  -- Record coupon usage
  INSERT INTO coupon_usages (coupon_id, profile_id)
  VALUES (v_coupon.id, p_profile_id)
  ON CONFLICT DO NOTHING;
  
  -- Log event
  INSERT INTO subscription_events (subscription_id, event_type, event_data)
  VALUES (v_subscription_id, 'trial_started', jsonb_build_object(
    'coupon_code', p_coupon_code,
    'plan', v_plan_key,
    'trial_days', v_trial_days,
    'subscription_days', v_subscription_days,
    'trial_ends_at', v_trial_ends_at
  ));
  
  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_subscription_from_coupon IS 'Create a trial subscription from a coupon code';

-- Function: Convert trial to paid subscription
CREATE OR REPLACE FUNCTION convert_trial_to_paid(
  p_subscription_id UUID,
  p_payment_reference TEXT,
  p_amount_paid NUMERIC DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_new_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get subscription
  SELECT * INTO v_subscription FROM subscriptions WHERE id = p_subscription_id;
  
  IF v_subscription IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;
  
  IF v_subscription.status != 'trial' THEN
    RAISE EXCEPTION 'Subscription is not in trial status';
  END IF;
  
  -- Calculate new expiry (30 days from now)
  v_new_expires_at := NOW() + '30 days'::INTERVAL;
  
  -- Update subscription
  UPDATE subscriptions
  SET
    status = 'active',
    expires_at = v_new_expires_at,
    payment_reference = p_payment_reference,
    amount_paid = p_amount_paid,
    updated_at = NOW()
  WHERE id = p_subscription_id;
  
  -- Update profile
  UPDATE profiles
  SET
    subscription_status = 'active',
    trial_ends_at = NULL,
    next_billing_date = v_new_expires_at
  WHERE id = v_subscription.profile_id;
  
  -- Log event
  INSERT INTO subscription_events (subscription_id, event_type, event_data)
  VALUES (p_subscription_id, 'trial_converted', jsonb_build_object(
    'payment_reference', p_payment_reference,
    'amount_paid', p_amount_paid,
    'new_expires_at', v_new_expires_at
  ));
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION convert_trial_to_paid IS 'Convert a trial subscription to paid status';

-- Function: Check and expire subscriptions
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS TABLE(
  profile_id UUID, 
  subscription_id UUID, 
  event_type TEXT
) AS $$
BEGIN
  -- Expire trials that ended
  UPDATE subscriptions 
  SET status = 'trial_expired', updated_at = NOW()
  WHERE status = 'trial' 
  AND expires_at < NOW();
  
  -- Expire active subscriptions
  UPDATE subscriptions 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' 
  AND expires_at < NOW();
  
  -- Reset profiles to free plan
  UPDATE profiles p
  SET 
    plan = 'starter',
    subscription_status = 'none',
    trial_ends_at = NULL,
    next_billing_date = NULL
  WHERE EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.profile_id = p.id
    AND s.status IN ('expired', 'trial_expired')
    AND s.updated_at > NOW() - '1 minute'::INTERVAL
  );
  
  -- Log events for expired subscriptions
  INSERT INTO subscription_events (subscription_id, event_type, event_data)
  SELECT 
    s.id,
    CASE 
      WHEN s.status = 'trial_expired' THEN 'trial_ended'
      ELSE 'expired'
    END,
    jsonb_build_object('expired_at', NOW())
  FROM subscriptions s
  WHERE s.status IN ('expired', 'trial_expired')
  AND s.updated_at > NOW() - '1 minute'::INTERVAL;
  
  -- Return affected subscriptions
  RETURN QUERY
  SELECT 
    s.profile_id, 
    s.id,
    s.status::TEXT
  FROM subscriptions s
  WHERE s.status IN ('expired', 'trial_expired')
  AND s.updated_at > NOW() - '1 minute'::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_expired_subscriptions IS 'Check and expire trial/active subscriptions, reset profiles to free plan';

-- Function: Extend subscription
CREATE OR REPLACE FUNCTION extend_subscription(
  p_subscription_id UUID,
  p_days INTEGER,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE subscriptions 
  SET 
    expires_at = expires_at + (p_days || ' days')::INTERVAL,
    payment_reference = COALESCE(p_payment_reference, payment_reference),
    updated_at = NOW()
  WHERE id = p_subscription_id;
  
  INSERT INTO subscription_events (subscription_id, event_type, event_data)
  VALUES (p_subscription_id, 'renewed', jsonb_build_object(
    'days_added', p_days,
    'payment_reference', p_payment_reference
  ));
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION extend_subscription IS 'Extend subscription by specified days';

-- Function: Get active subscription for profile
CREATE OR REPLACE FUNCTION get_active_subscription(p_profile_id UUID)
RETURNS TABLE(
  subscription_id UUID,
  plan_key TEXT,
  status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.plan_key,
    s.status,
    s.expires_at,
    EXTRACT(DAY FROM (s.expires_at - NOW()))::INTEGER
  FROM subscriptions s
  WHERE s.profile_id = p_profile_id
  AND s.status IN ('trial', 'active')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_active_subscription IS 'Get active or trial subscription for a profile';

-- ============================================================================
-- 6. Triggers
-- ============================================================================

-- Trigger: Update updated_at on subscriptions
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscription_updated_at ON subscriptions;
CREATE TRIGGER trigger_update_subscription_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();
