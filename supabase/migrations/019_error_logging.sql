-- Error Logging System Migration
-- Creates comprehensive error logging and monitoring tables

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id TEXT,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  url TEXT,
  user_agent TEXT,
  ip_address INET,
  component TEXT,
  action TEXT,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  action TEXT NOT NULL,
  component TEXT,
  context JSONB,
  user_id TEXT,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance logs table
CREATE TABLE IF NOT EXISTS performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  component TEXT,
  context JSONB,
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health checks table
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'warn')),
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_profile_id ON error_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_profile_id ON activity_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at ON performance_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_logs_metric_name ON performance_logs(metric_name);
CREATE INDEX IF NOT EXISTS idx_health_checks_created_at ON health_checks(created_at DESC);

-- RLS Policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;

-- Error logs policies
CREATE POLICY "Staff can view all error logs" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()::text 
      AND role IN ('staff', 'owner')
    )
  );

CREATE POLICY "System can manage error logs" ON error_logs
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Activity logs policies
CREATE POLICY "Staff can view all activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()::text 
      AND role IN ('staff', 'owner')
    )
  );

CREATE POLICY "System can manage activity logs" ON activity_logs
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Performance logs policies
CREATE POLICY "Staff can view all performance logs" ON performance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()::text 
      AND role IN ('staff', 'owner')
    )
  );

CREATE POLICY "System can manage performance logs" ON performance_logs
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Health checks policies (read-only for all)
CREATE POLICY "Anyone can view health checks" ON health_checks
  FOR SELECT USING (true);

CREATE POLICY "System can manage health checks" ON health_checks
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Functions for error management

-- Function to log errors safely
CREATE OR REPLACE FUNCTION log_error_safe(
  p_error_type TEXT,
  p_error_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL,
  p_profile_id UUID DEFAULT NULL,
  p_component TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_context JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  BEGIN
    INSERT INTO error_logs (
      error_type,
      error_message,
      stack_trace,
      user_id,
      profile_id,
      component,
      action,
      context
    ) VALUES (
      p_error_type,
      p_error_message,
      p_stack_trace,
      p_user_id,
      p_profile_id,
      p_component,
      p_action,
      p_context
    );
    RETURN true;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the operation
      RAISE LOG 'Failed to log error: %', SQLERRM;
      RETURN false;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to run health checks
CREATE OR REPLACE FUNCTION run_health_checks()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  response_time_ms INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Database check
  v_start_time := clock_timestamp();
  PERFORM 1 FROM profiles LIMIT 1;
  v_end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'database'::TEXT,
    'pass'::TEXT,
    EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER,
    NULL::TEXT;
  
  -- Auth check
  v_start_time := clock_timestamp();
  PERFORM 1 FROM auth.users LIMIT 1;
  v_end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'auth'::TEXT,
    'pass'::TEXT,
    EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER,
    NULL::TEXT;
  
  -- Storage check
  v_start_time := clock_timestamp();
  BEGIN
    PERFORM 1 FROM information_schema.columns WHERE table_name = 'storage.buckets' LIMIT 1;
    RETURN QUERY SELECT 
      'storage'::TEXT,
      'pass'::TEXT,
      EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER,
      NULL::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 
        'storage'::TEXT,
        'fail'::TEXT,
        EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER,
        SQLERRM::TEXT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to store health check results
CREATE OR REPLACE FUNCTION store_health_checks()
RETURNS VOID AS $$
BEGIN
  INSERT INTO health_checks (check_name, status, response_time_ms, error_message)
  SELECT * FROM run_health_checks();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_stats(
  p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  error_type TEXT,
  error_count BIGINT,
  resolved_count BIGINT,
  last_occurrence TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    error_type,
    COUNT(*) as error_count,
    COUNT(*) FILTER (WHERE resolved = true) as resolved_count,
    MAX(created_at) as last_occurrence
  FROM error_logs 
  WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL
  GROUP BY error_type
  ORDER BY error_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs(
  p_days_to_keep INTEGER DEFAULT 30
)
RETURNS TABLE (
  table_name TEXT,
  deleted_count BIGINT
) AS $$
DECLARE
  v_cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  v_cutoff_date := NOW() - (p_days_to_keep || ' days')::INTERVAL;
  
  -- Clean error_logs
  DELETE FROM error_logs 
  WHERE created_at < v_cutoff_date 
  AND resolved = true;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'error_logs'::TEXT, v_deleted_count::BIGINT;
  
  -- Clean activity_logs
  DELETE FROM activity_logs 
  WHERE created_at < v_cutoff_date;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'activity_logs'::TEXT, v_deleted_count::BIGINT;
  
  -- Clean performance_logs
  DELETE FROM performance_logs 
  WHERE created_at < v_cutoff_date;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'performance_logs'::TEXT, v_deleted_count::BIGINT;
  
  -- Clean health_checks
  DELETE FROM health_checks 
  WHERE created_at < v_cutoff_date;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'health_checks'::TEXT, v_deleted_count::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample data for testing
INSERT INTO health_checks (check_name, status, response_time_ms)
VALUES 
  ('database', 'pass', 5),
  ('auth', 'pass', 3),
  ('storage', 'pass', 12)
ON CONFLICT DO NOTHING;
