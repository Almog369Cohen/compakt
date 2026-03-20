-- Fix Coupons Table Schema
-- This script drops and recreates the coupons table with the correct schema

-- Drop existing table (this will also drop dependent objects)
DROP TABLE IF EXISTS coupons CASCADE;

-- Recreate coupons table with correct schema
CREATE TABLE coupons (
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
  trial_trigger BOOLEAN DEFAULT false,
  
  -- Constraints
  CONSTRAINT discount_value_positive CHECK (discount_value > 0),
  CONSTRAINT valid_dates CHECK (valid_until > valid_from)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons
DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;
CREATE POLICY "Public can view active coupons" ON coupons
  FOR SELECT USING (is_active = true AND valid_from <= NOW() AND valid_until >= NOW());

DROP POLICY IF EXISTS "Staff can view all coupons" ON coupons;
CREATE POLICY "Staff can view all coupons" ON coupons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid()
      AND role IN ('staff', 'owner')
    )
  );

DROP POLICY IF EXISTS "Staff can manage coupons" ON coupons;
CREATE POLICY "Staff can manage coupons" ON coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid()
      AND role IN ('staff', 'owner')
    )
  );

DROP POLICY IF EXISTS "System can manage coupons" ON coupons;
CREATE POLICY "System can manage coupons" ON coupons
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Recreate dependent tables (they were dropped with CASCADE)
-- coupon_usages
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id TEXT,
  discount_applied NUMERIC NOT NULL,
  discount_currency TEXT DEFAULT 'ILS',
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(coupon_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_profile_id ON coupon_usages(profile_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_used_at ON coupon_usages(used_at);

ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own coupon usage" ON coupon_usages;
CREATE POLICY "Users can view their own coupon usage" ON coupon_usages
  FOR SELECT USING (auth.uid() = (SELECT user_id::uuid FROM profiles WHERE id = profile_id));

DROP POLICY IF EXISTS "Staff can view all coupon usage" ON coupon_usages;
CREATE POLICY "Staff can view all coupon usage" ON coupon_usages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid()
      AND role IN ('staff', 'owner')
    )
  );

DROP POLICY IF EXISTS "System can manage coupon usage" ON coupon_usages;
CREATE POLICY "System can manage coupon usage" ON coupon_usages
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- coupon_analytics
CREATE TABLE IF NOT EXISTS coupon_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'viewed', 'applied', 'expired', 'deactivated')),
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_analytics_coupon_id ON coupon_analytics(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_analytics_event_type ON coupon_analytics(event_type);

ALTER TABLE coupon_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view all coupon analytics" ON coupon_analytics;
CREATE POLICY "Staff can view all coupon analytics" ON coupon_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid()
      AND role IN ('staff', 'owner')
    )
  );

DROP POLICY IF EXISTS "System can manage coupon analytics" ON coupon_analytics;
CREATE POLICY "System can manage coupon analytics" ON coupon_analytics
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );
