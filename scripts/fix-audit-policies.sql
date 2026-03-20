-- Fix Audit Logs RLS Policies
-- Fixes type casting issues in existing policies

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view all audit logs" ON hq_audit_logs;
DROP POLICY IF EXISTS "System can manage audit logs" ON hq_audit_logs;

-- Recreate with correct type casting
CREATE POLICY "Staff can view all audit logs" ON hq_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid()
      AND role IN ('staff', 'owner')
    )
  );

CREATE POLICY "System can manage audit logs" ON hq_audit_logs
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );
