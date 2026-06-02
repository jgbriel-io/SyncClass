-- log_performance is called by create_class_package but was never implemented.
-- Create a no-op stub so the RPC does not throw "function does not exist".
CREATE OR REPLACE FUNCTION log_performance(
  p_operation text,
  p_duration_ms integer,
  p_metadata jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- no-op: performance logging not implemented
END;
$$;
