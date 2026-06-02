-- Fix check_class_date_consistency: remove timezone-sensitive date equality.
-- start_at::date uses UTC session, but class_date is local date (UTC-3).
-- Classes after 21:00 local time store start_at as next day in UTC → constraint violation.
-- Keep only the NULL consistency invariant (both set or both null).
ALTER TABLE public.class_logs DROP CONSTRAINT IF EXISTS check_class_date_consistency;

ALTER TABLE public.class_logs ADD CONSTRAINT check_class_date_consistency
  CHECK (
    (start_at IS NULL AND end_at IS NULL)
    OR (start_at IS NOT NULL AND end_at IS NOT NULL)
  );
