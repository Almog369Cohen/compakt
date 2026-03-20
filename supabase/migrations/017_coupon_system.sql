-- Coupon System Migration
-- Adds comprehensive coupon management capabilities

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_trial')),
  discount_value NUMERIC NOT NULL,
  discount_currency TEXT DEFAULT 'ILS',
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Usage restrictions
  min_plan_value NUMERIC,
  applicable_plans TEXT[] DEFAULT ARRAY['starter', 'pro', 'premium', 'enterprise'],
  first_time_only BOOLEAN DEFAULT false,
  trial_trigger BOOLEAN DEFAULT false, -- Auto-starts trial when used
  
  -- Constraints
  CONSTRAINT discount_value_positive CHECK (discount_value > 0),
  CONSTRAINT valid_dates CHECK (valid_until > valid_from)
);

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id TEXT, -- Morning subscription ID if applicable
  discount_applied NUMERIC NOT NULL,
  discount_currency TEXT DEFAULT 'ILS',
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(coupon_id, profile_id) -- One use per customer per coupon
);

-- Coupon analytics
CREATE TABLE IF NOT EXISTS coupon_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'viewed', 'applied', 'expired', 'deactivated')),
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON coupons(created_by);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_profile_id ON coupon_usages(profile_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_used_at ON coupon_usages(used_at);
CREATE INDEX IF NOT EXISTS idx_coupon_analytics_coupon_id ON coupon_analytics(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_analytics_event_type ON coupon_analytics(event_type);

-- RLS Policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_analytics ENABLE ROW LEVEL SECURITY;

-- Coupons policies
CREATE POLICY "Staff can manage all coupons" ON coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()::text 
      AND role IN ('staff', 'owner')
    )
  );

CREATE POLICY "Users can view active coupons" ON coupons
  FOR SELECT USING (
    is_active = true 
    AND valid_from <= NOW() 
    AND valid_until >= NOW()
  );

CREATE POLICY "System can manage coupons" ON coupons
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Coupon usages policies
CREATE POLICY "Users can view their own coupon usage" ON coupon_usages
  FOR SELECT USING (auth.uid()::text = (SELECT user_id FROM profiles WHERE id = profile_id));

CREATE POLICY "Staff can view all coupon usage" ON coupon_usages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()::text 
      AND role IN ('staff', 'owner')
    )
  );

CREATE POLICY "System can manage coupon usage" ON coupon_usages
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Coupon analytics policies
CREATE POLICY "Staff can view all coupon analytics" ON coupon_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()::text 
      AND role IN ('staff', 'owner')
    )
  );

CREATE POLICY "System can manage coupon analytics" ON coupon_analytics
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Functions for coupon management

-- Function to generate unique coupon code
CREATE OR REPLACE FUNCTION generate_coupon_code(p_prefix TEXT DEFAULT 'COMPAKT')
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := p_prefix || '_' || upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 6));
    
    SELECT EXISTS(SELECT 1 FROM coupons WHERE code = v_code) INTO v_exists;
    
    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate coupon
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_profile_id UUID DEFAULT NULL,
  p_plan_value NUMERIC DEFAULT NULL,
  p_plan_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_usage_count INTEGER;
  v_result JSONB;
BEGIN
  -- Find coupon
  SELECT * INTO v_coupon 
  FROM coupons 
  WHERE code = p_code 
  AND is_active = true 
  AND valid_from <= NOW() 
  AND valid_until >= NOW();
  
  IF v_coupon IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Coupon not found or expired'
    );
  END IF;
  
  -- Check usage limits
  IF v_coupon.max_uses IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM coupon_usages 
    WHERE coupon_id = v_coupon.id;
    
    IF v_usage_count >= v_coupon.max_uses THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Coupon usage limit reached'
      );
    END IF;
  END IF;
  
  -- Check first-time only restriction
  IF v_coupon.first_time_only AND p_profile_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM coupon_usages 
    WHERE profile_id = p_profile_id;
    
    IF v_usage_count > 0 THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Coupon only valid for first-time customers'
      );
    END IF;
  END IF;
  
  -- Check plan applicability
  IF p_plan_key IS NOT NULL AND NOT (p_plan_key = ANY(v_coupon.applicable_plans)) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Coupon not applicable to this plan'
    );
  END IF;
  
  -- Check minimum plan value
  IF v_coupon.min_plan_value IS NOT NULL AND (p_plan_value IS NULL OR p_plan_value < v_coupon.min_plan_value) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Minimum plan value not met'
    );
  END IF;
  
  -- Check if already used by this customer
  IF p_profile_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM coupon_usages 
    WHERE coupon_id = v_coupon.id AND profile_id = p_profile_id;
    
    IF v_usage_count > 0 THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Coupon already used by this customer'
      );
    END IF;
  END IF;
  
  -- Return coupon details
  RETURN jsonb_build_object(
    'valid', true,
    'coupon', jsonb_build_object(
      'id', v_coupon.id,
      'code', v_coupon.code,
      'name', v_coupon.name,
      'discount_type', v_coupon.discount_type,
      'discount_value', v_coupon.discount_value,
      'discount_currency', v_coupon.discount_currency,
      'trial_trigger', v_coupon.trial_trigger
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply coupon
CREATE OR REPLACE FUNCTION apply_coupon(
  p_code TEXT,
  p_profile_id UUID,
  p_subscription_id TEXT DEFAULT NULL,
  p_plan_value NUMERIC DEFAULT NULL,
  p_plan_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_validation JSONB;
  v_coupon_id UUID;
  v_discount_amount NUMERIC;
  v_usage_id UUID;
BEGIN
  -- Validate coupon first
  v_validation := validate_coupon(p_code, p_profile_id, p_plan_value, p_plan_key);
  
  IF NOT (v_validation->>'valid')::boolean THEN
    RETURN v_validation;
  END IF;
  
  v_coupon_id := (v_validation->'coupon'->>'id')::uuid;
  
  -- Calculate discount amount
  CASE (v_validation->'coupon'->>'discount_type')
    WHEN 'percentage' THEN
      v_discount_amount := p_plan_value * ((v_validation->'coupon'->>'discount_value')::numeric / 100);
    WHEN 'fixed_amount' THEN
      v_discount_amount := (v_validation->'coupon'->>'discount_value')::numeric;
    WHEN 'free_trial' THEN
      v_discount_amount := 0;
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid discount type'
      );
  END CASE;
  
  -- Create usage record
  INSERT INTO coupon_usages (
    coupon_id, 
    profile_id, 
    subscription_id, 
    discount_applied, 
    discount_currency
  ) VALUES (
    v_coupon_id,
    p_profile_id,
    p_subscription_id,
    v_discount_amount,
    v_validation->'coupon'->>'discount_currency'
  ) RETURNING id INTO v_usage_id;
  
  -- Update coupon usage count
  UPDATE coupons 
  SET used_count = used_count + 1, updated_at = NOW()
  WHERE id = v_coupon_id;
  
  -- Log analytics event
  INSERT INTO coupon_analytics (coupon_id, event_type, event_data)
  VALUES (v_coupon_id, 'applied', jsonb_build_object(
    'profile_id', p_profile_id,
    'subscription_id', p_subscription_id,
    'discount_amount', v_discount_amount,
    'usage_id', v_usage_id
  ));
  
  -- Trigger trial if needed
  IF (v_validation->'coupon'->>'trial_trigger')::boolean THEN
    -- This would trigger trial start logic
    PERFORM pg_notify('trial_trigger', jsonb_build_object(
      'profile_id', p_profile_id,
      'coupon_id', v_coupon_id,
      'coupon_code', p_code
    )::text);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'usage_id', v_usage_id,
    'discount_amount', v_discount_amount,
    'discount_currency', v_validation->'coupon'->>'discount_currency',
    'coupon_details', v_validation->'coupon'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create coupon
CREATE OR REPLACE FUNCTION create_coupon(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_discount_type TEXT,
  p_discount_value NUMERIC,
  p_max_uses INTEGER DEFAULT NULL,
  p_valid_days INTEGER DEFAULT 30,
  p_min_plan_value NUMERIC DEFAULT NULL,
  p_applicable_plans TEXT[] DEFAULT ARRAY['starter', 'pro', 'premium', 'enterprise'],
  p_first_time_only BOOLEAN DEFAULT false,
  p_trial_trigger BOOLEAN DEFAULT false,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_coupon_id UUID;
  v_code TEXT;
  v_valid_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Validate discount type
  IF p_discount_type NOT IN ('percentage', 'fixed_amount', 'free_trial') THEN
    RAISE EXCEPTION 'Invalid discount type';
  END IF;
  
  -- Generate unique code
  v_code := generate_coupon_code();
  
  -- Calculate validity period
  v_valid_until := NOW() + (p_valid_days || ' days')::INTERVAL;
  
  -- Create coupon
  INSERT INTO coupons (
    code,
    name,
    description,
    discount_type,
    discount_value,
    max_uses,
    valid_from,
    valid_until,
    min_plan_value,
    applicable_plans,
    first_time_only,
    trial_trigger,
    created_by
  ) VALUES (
    v_code,
    p_name,
    p_description,
    p_discount_type,
    p_discount_value,
    p_max_uses,
    NOW(),
    v_valid_until,
    p_min_plan_value,
    p_applicable_plans,
    p_first_time_only,
    p_trial_trigger,
    p_created_by
  ) RETURNING id INTO v_coupon_id;
  
  -- Log analytics event
  INSERT INTO coupon_analytics (coupon_id, event_type, event_data)
  VALUES (v_coupon_id, 'created', jsonb_build_object(
    'name', p_name,
    'discount_type', p_discount_type,
    'discount_value', p_discount_value,
    'max_uses', p_max_uses,
    'valid_days', p_valid_days,
    'created_by', p_created_by
  ));
  
  RETURN v_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get coupon analytics
CREATE OR REPLACE FUNCTION get_coupon_analytics(p_coupon_id UUID DEFAULT NULL)
RETURNS TABLE (
  coupon_id UUID,
  coupon_name TEXT,
  coupon_code TEXT,
  total_views BIGINT,
  total_applications BIGINT,
  total_discount NUMERIC,
  conversion_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.code,
    COALESCE(views.view_count, 0) as total_views,
    COALESCE(apps.app_count, 0) as total_applications,
    COALESCE(SUM(cu.discount_applied), 0) as total_discount,
    CASE 
      WHEN COALESCE(views.view_count, 0) > 0 
      THEN ROUND((COALESCE(apps.app_count, 0)::numeric / COALESCE(views.view_count, 1)::numeric) * 100, 2)
      ELSE 0
    END as conversion_rate,
    c.created_at
  FROM coupons c
  LEFT JOIN (
    SELECT coupon_id, COUNT(*) as view_count
    FROM coupon_analytics 
    WHERE event_type = 'viewed'
    GROUP BY coupon_id
  ) views ON c.id = views.coupon_id
  LEFT JOIN (
    SELECT coupon_id, COUNT(*) as app_count
    FROM coupon_analytics 
    WHERE event_type = 'applied'
    GROUP BY coupon_id
  ) apps ON c.id = apps.coupon_id
  LEFT JOIN coupon_usages cu ON c.id = cu.coupon_id
  WHERE (p_coupon_id IS NULL OR c.id = p_coupon_id)
  GROUP BY c.id, c.name, c.code, views.view_count, apps.app_count, c.created_at
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
