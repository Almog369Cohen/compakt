-- Error logging table for custom error tracking
-- Alternative to Sentry - stores errors in Supabase

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Error details
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_type VARCHAR(100),
  
  -- Context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  page_url TEXT,
  user_agent TEXT,
  
  -- Severity
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  -- 'critical', 'high', 'medium', 'low'
  
  -- Additional data
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Tracking
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);

-- RLS policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert errors (for client-side logging)
CREATE POLICY "Anyone can insert errors"
  ON error_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Only staff/owner can view errors
CREATE POLICY "Staff and owner can view errors"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('staff', 'owner')
    )
  );

-- Only staff/owner can update errors (mark as resolved)
CREATE POLICY "Staff and owner can update errors"
  ON error_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('staff', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('staff', 'owner')
    )
  );

-- Function to clean up old errors (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_errors()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM error_logs
  WHERE timestamp < NOW() - INTERVAL '30 days'
  AND resolved = true;
END;
$$;

-- Comment
COMMENT ON TABLE error_logs IS 'Custom error tracking - alternative to Sentry';
