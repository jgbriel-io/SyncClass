-- Inclui start_at e end_at na view do extrato para o status considerar horário (Agendada até o horário da aula)
-- DROP necessário: CREATE OR REPLACE não permite trocar ordem/nomes de colunas (ex: 5ª coluna era attendance, passa a ser start_at).
DROP VIEW IF EXISTS public.class_logs_with_billing;

CREATE VIEW public.class_logs_with_billing WITH (security_invoker = true) AS
SELECT
  cl.id AS class_log_id,
  cl.student_id,
  cl.teacher_id,
  cl.class_date,
  cl.start_at,
  cl.end_at,
  cl.attendance,
  cl.title,
  cl.grade,
  cl.feedback,
  cl.created_at,
  fr.id AS financial_record_id,
  fr.amount AS billed_amount,
  fr.status AS billing_status,
  fr.due_date AS billing_due_date,
  fr.paid_at AS billing_paid_at,
  CASE
    WHEN fr.id IS NULL THEN 'not_billed'
    WHEN fr.status = 'pago' THEN 'paid'
    WHEN fr.status = 'pendente' AND fr.due_date >= CURRENT_DATE THEN 'pending'
    WHEN fr.status = 'pendente' AND fr.due_date < CURRENT_DATE THEN 'overdue'
    ELSE 'unknown'
  END AS billing_status_consolidated,
  s.name AS student_name,
  t.name AS teacher_name
FROM public.class_logs cl
LEFT JOIN public.financial_records fr ON fr.class_log_id = cl.id
LEFT JOIN public.students s ON s.id = cl.student_id
LEFT JOIN public.teachers t ON t.id = cl.teacher_id
ORDER BY cl.class_date DESC;

GRANT SELECT ON public.class_logs_with_billing TO authenticated;
