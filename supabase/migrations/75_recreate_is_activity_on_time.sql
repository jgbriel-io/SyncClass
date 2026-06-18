-- Recreate is_activity_on_time dropped by migration 25 but still referenced
-- by validate_activity_submission trigger. Returns true if due_date not passed yet.
CREATE OR REPLACE FUNCTION public.is_activity_on_time(due_date TIMESTAMPTZ)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT due_date IS NULL OR NOW() <= due_date;
$$;
