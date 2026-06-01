-- Migration 62: add optional date range params to get_financial_summary
-- Enables period filtering (month / semester / year) on dashboard financial cards.
-- total_overdue is intentionally NOT date-filtered — it always reflects current state.

DROP FUNCTION IF EXISTS public.get_financial_summary(uuid);

CREATE OR REPLACE FUNCTION public.get_financial_summary(
  p_teacher_id uuid DEFAULT NULL,
  p_date_from  date DEFAULT NULL,
  p_date_to    date DEFAULT NULL
)
RETURNS TABLE (
  total_paid       numeric,
  total_pending    numeric,
  total_overdue    numeric,
  total_receivable numeric,
  count_paid       integer,
  count_pending    integer,
  count_overdue    integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    -- paid within the selected period
    COALESCE(SUM(CASE
      WHEN fr.status = 'pago'
       AND (p_date_from IS NULL OR fr.due_date >= p_date_from)
       AND (p_date_to   IS NULL OR fr.due_date <= p_date_to)
      THEN fr.amount ELSE 0
    END), 0) AS total_paid,

    -- pending (not yet due) within the selected period
    COALESCE(SUM(CASE
      WHEN fr.status != 'pago'
       AND fr.due_date >= CURRENT_DATE
       AND (p_date_from IS NULL OR fr.due_date >= p_date_from)
       AND (p_date_to   IS NULL OR fr.due_date <= p_date_to)
      THEN fr.amount ELSE 0
    END), 0) AS total_pending,

    -- overdue: always current state, never date-filtered
    COALESCE(SUM(CASE
      WHEN fr.status != 'pago'
       AND fr.due_date < CURRENT_DATE
      THEN fr.amount ELSE 0
    END), 0) AS total_overdue,

    -- receivable = pending (filtered) + overdue (all)
    COALESCE(SUM(CASE
      WHEN fr.status != 'pago'
       AND (
         (fr.due_date >= CURRENT_DATE
          AND (p_date_from IS NULL OR fr.due_date >= p_date_from)
          AND (p_date_to   IS NULL OR fr.due_date <= p_date_to))
         OR fr.due_date < CURRENT_DATE
       )
      THEN fr.amount ELSE 0
    END), 0) AS total_receivable,

    COUNT(CASE
      WHEN fr.status = 'pago'
       AND (p_date_from IS NULL OR fr.due_date >= p_date_from)
       AND (p_date_to   IS NULL OR fr.due_date <= p_date_to)
      THEN 1
    END)::integer AS count_paid,

    COUNT(CASE
      WHEN fr.status != 'pago'
       AND fr.due_date >= CURRENT_DATE
       AND (p_date_from IS NULL OR fr.due_date >= p_date_from)
       AND (p_date_to   IS NULL OR fr.due_date <= p_date_to)
      THEN 1
    END)::integer AS count_pending,

    COUNT(CASE
      WHEN fr.status != 'pago'
       AND fr.due_date < CURRENT_DATE
      THEN 1
    END)::integer AS count_overdue

  FROM public.financial_records fr
  JOIN public.students s ON s.id = fr.student_id
  WHERE (p_teacher_id IS NULL OR s.teacher_id = p_teacher_id);
$$;

REVOKE EXECUTE ON FUNCTION public.get_financial_summary(uuid, date, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_financial_summary(uuid, date, date) TO authenticated, service_role;
