-- Migration 27: ARQ-002 — financial summary RPC
-- Move client-side aggregation (fetchFinancialSummary) to SQL
-- Eliminates full-table scan + JS loop in useFinancialRecords hook

CREATE OR REPLACE FUNCTION get_financial_summary(p_teacher_id uuid DEFAULT NULL)
RETURNS TABLE (
  total_paid      numeric,
  total_pending   numeric,
  total_overdue   numeric,
  total_receivable numeric,
  count_paid      integer,
  count_pending   integer,
  count_overdue   integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN fr.status = 'pago' THEN fr.amount ELSE 0 END), 0)                                              AS total_paid,
    COALESCE(SUM(CASE WHEN fr.status != 'pago' AND fr.due_date >= CURRENT_DATE THEN fr.amount ELSE 0 END), 0)             AS total_pending,
    COALESCE(SUM(CASE WHEN fr.status != 'pago' AND fr.due_date <  CURRENT_DATE THEN fr.amount ELSE 0 END), 0)             AS total_overdue,
    COALESCE(SUM(CASE WHEN fr.status != 'pago'                                 THEN fr.amount ELSE 0 END), 0)             AS total_receivable,
    COUNT(CASE WHEN fr.status = 'pago'                                              THEN 1 END)::integer                  AS count_paid,
    COUNT(CASE WHEN fr.status != 'pago' AND fr.due_date >= CURRENT_DATE             THEN 1 END)::integer                  AS count_pending,
    COUNT(CASE WHEN fr.status != 'pago' AND fr.due_date <  CURRENT_DATE             THEN 1 END)::integer                  AS count_overdue
  FROM public.financial_records fr
  JOIN public.students s ON s.id = fr.student_id
  WHERE (p_teacher_id IS NULL OR s.teacher_id = p_teacher_id);
$$;

GRANT EXECUTE ON FUNCTION get_financial_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_financial_summary(uuid) TO service_role;
