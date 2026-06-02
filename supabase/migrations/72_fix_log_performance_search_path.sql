-- Fix: log_performance stub was SECURITY DEFINER without SET search_path,
-- making it vulnerable to search_path hijacking.
CREATE OR REPLACE FUNCTION log_performance(
  p_operation text,
  p_duration_ms integer,
  p_metadata jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- no-op: performance logging not implemented
END;
$$;
