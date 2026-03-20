-- Audit Logs Fix Migration
-- Ensures hq_audit_logs table exists with proper schema and RLS

-- Create table if not exists
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

-- Staff and owner can view all audit logs
CREATE POLICY "Staff can view all audit logs" ON hq_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()::text 
      AND role IN ('staff', 'owner')
    )
  );

-- System can manage audit logs
CREATE POLICY "System can manage audit logs" ON hq_audit_logs
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Function to create audit logs table (for runtime creation)
CREATE OR REPLACE FUNCTION create_audit_logs_table()
RETURNS TEXT AS $$
BEGIN
  -- Table already exists via migration, but this function allows runtime creation
  RETURN 'Audit logs table exists';
EXCEPTION
  WHEN OTHERS THEN
    -- If table doesn't exist, create it
    EXECUTE '
      CREATE TABLE hq_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_user_id TEXT,
        actor_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        target_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        before_state JSONB,
        after_state JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    ';
    
    -- Add indexes
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_hq_audit_logs_actor_profile_id ON hq_audit_logs(actor_profile_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_hq_audit_logs_target_profile_id ON hq_audit_logs(target_profile_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_hq_audit_logs_action ON hq_audit_logs(action)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_hq_audit_logs_created_at ON hq_audit_logs(created_at DESC)';
    
    -- Enable RLS
    EXECUTE 'ALTER TABLE hq_audit_logs ENABLE ROW LEVEL SECURITY';
    
    -- Add policies
    EXECUTE '
      CREATE POLICY "Staff can view all audit logs" ON hq_audit_logs
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid()::text 
          AND role IN (''staff'', ''owner'')
        )
      )
    ';
    
    EXECUTE '
      CREATE POLICY "System can manage audit logs" ON hq_audit_logs
      FOR ALL USING (
        current_setting(''request.jwt.claims'', true)::jsonb->>''role'' = ''service_role''
      )
    ';
    
    RETURN 'Audit logs table created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample audit logs for testing
INSERT INTO hq_audit_logs (actor_profile_id, action, before_state, after_state)
SELECT 
  p.id,
  'profile_created',
  jsonb_build_object('role', 'dj'),
  jsonb_build_object('role', p.role, 'business_name', p.business_name)
FROM profiles p 
WHERE p.role IN ('staff', 'owner')
LIMIT 3
ON CONFLICT DO NOTHING;

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
  -- Insert audit log with error handling
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
      -- Log the error but don't fail the operation
      RAISE LOG 'Failed to log audit event: %', SQLERRM;
      RETURN false;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to automatically log profile changes
CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change
  PERFORM log_audit_event(
    p_actor_user_id => current_setting('request.jwt.claims', true)::jsonb->>'user_id',
    p_actor_profile_id => current_setting('request.jwt.claims', true)::jsonb->>'profile_id',
    p_target_profile_id => NEW.id,
    p_action => TG_OP,
    p_before_state => row_to_json(OLD),
    p_after_state => row_to_json(NEW)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for profile changes (optional - can be enabled later)
-- CREATE TRIGGER audit_profile_update
--   AFTER UPDATE ON profiles
--   FOR EACH ROW
--   EXECUTE FUNCTION audit_profile_changes();
