-- Audit Logs Migration (Fixed)
-- Creates hq_audit_logs table with proper schema and RLS

-- Create table
CREATE TABLE IF NOT EXISTS hq_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id TEXT,
  actor_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_hq_audit_logs_actor_profile_id ON hq_audit_logs(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_hq_audit_logs_target_profile_id ON hq_audit_logs(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_hq_audit_logs_action ON hq_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_hq_audit_logs_created_at ON hq_audit_logs(created_at DESC);

-- RLS Policies
ALTER TABLE hq_audit_logs ENABLE ROW LEVEL SECURITY;

-- Staff and owner can view all audit logs (FIXED TYPE CASTING)
DROP POLICY IF EXISTS "Staff can view all audit logs" ON hq_audit_logs;
CREATE POLICY "Staff can view all audit logs" ON hq_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid()
      AND role IN ('staff', 'owner')
    )
  );

-- System can manage audit logs
DROP POLICY IF EXISTS "System can manage audit logs" ON hq_audit_logs;
CREATE POLICY "System can manage audit logs" ON hq_audit_logs
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Function to log audit events safely
CREATE OR REPLACE FUNCTION log_audit_event(
  p_actor_user_id TEXT DEFAULT NULL,
  p_actor_profile_id UUID DEFAULT NULL,
  p_target_profile_id UUID DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_before_state JSONB DEFAULT NULL,
  p_after_state JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  BEGIN
    INSERT INTO hq_audit_logs (
      actor_user_id,
      actor_profile_id,
      target_profile_id,
      action,
      before_state,
      after_state
    ) VALUES (
      p_actor_user_id,
      p_actor_profile_id,
      p_target_profile_id,
      p_action,
      p_before_state,
      p_after_state
    );
    RETURN true;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Failed to log audit event: %', SQLERRM;
      RETURN false;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
