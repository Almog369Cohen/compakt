-- ============================================================
-- Migration 018: HQ governance, plans, feature overrides, audit logs
-- Safe to run multiple times (idempotent)
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS feature_overrides JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS managed_by UUID NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

CREATE TABLE IF NOT EXISTS hq_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  actor_profile_id UUID,
  target_profile_id UUID,
  action TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hq_audit_logs_target_profile_id ON hq_audit_logs(target_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hq_audit_logs_actor_profile_id ON hq_audit_logs(actor_profile_id, created_at DESC);
