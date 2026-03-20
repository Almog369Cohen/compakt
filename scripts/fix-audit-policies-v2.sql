-- Fix Audit Logs RLS Policies (Version 2)
-- Try different type casting approach

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view all audit logs" ON hq_audit_logs;
DROP POLICY IF EXISTS "System can manage audit logs" ON hq_audit_logs;

-- Try with explicit UUID casting on both sides
CREATE POLICY "Staff can view all audit logs" ON hq_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id::uuid = auth.uid()
      AND role IN ('staff', 'owner')
    )
  );

CREATE POLICY "System can manage audit logs" ON hq_audit_logs
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Also add a more permissive policy for debugging
CREATE POLICY "Owner bypass for audit logs" ON hq_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE email = 'almog22@gmail.com'
      AND role = 'owner'
    )
  );
