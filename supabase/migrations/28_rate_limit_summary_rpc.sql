-- ============================================================
-- MIGRATION 28: Rate Limit Summary RPC
-- Expõe agregação de rate_limit_tracker para o dashboard admin
-- ============================================================

CREATE OR REPLACE FUNCTION get_rate_limit_summary(p_window_hours integer DEFAULT 1)
RETURNS TABLE (
  operation        text,
  total_requests   bigint,
  unique_users     bigint,
  max_per_user     integer,
  window_start     timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT
    rlt.operation,
    SUM(rlt.request_count)::bigint         AS total_requests,
    COUNT(DISTINCT rlt.user_id)::bigint    AS unique_users,
    MAX(rlt.request_count)::integer        AS max_per_user,
    MIN(rlt.window_start)                  AS window_start
  FROM public.rate_limit_tracker rlt
  WHERE rlt.window_start >= NOW() - (p_window_hours || ' hours')::interval
  GROUP BY rlt.operation
  ORDER BY total_requests DESC;
$$;

GRANT EXECUTE ON FUNCTION get_rate_limit_summary(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_rate_limit_summary(integer) TO service_role;
