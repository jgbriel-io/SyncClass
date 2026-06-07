-- Scalar subquery in students_with_stats/students_masked runs as the calling user
-- (security_invoker = true), so teacher can't read profiles of their students.
-- Fix: SECURITY DEFINER helper function that bypasses RLS for avatar_url only.

CREATE OR REPLACE FUNCTION public.get_student_avatar_url(p_student_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT avatar_url FROM public.profiles WHERE student_id = p_student_id LIMIT 1;
$$;

-- Recreate views using the function (no column order change, so CREATE OR REPLACE works)
CREATE OR REPLACE VIEW students_with_stats
WITH (security_invoker = true) AS
SELECT
  s.id,
  s.name,
  s.country,
  s.phone,
  s.email,
  s.pay_day,
  s.hourly_rate,
  s.is_deleted,
  s.status,
  s.teacher_id,
  s.birth_date,
  s.city,
  s.state,
  s.origin,
  s.created_at,
  s.updated_at,
  s.anonymized_at,
  public.get_student_avatar_url(s.id) AS avatar_url,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.attendance = true)  AS total_classes_attended,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.attendance = false) AS total_classes_missed,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.attendance IS NULL) AS total_classes_pending,
  COALESCE(SUM(fr.amount) FILTER (WHERE fr.status = 'pendente'), 0) AS total_pending_amount,
  COALESCE(SUM(fr.amount) FILTER (WHERE fr.status = 'pago'),    0) AS total_paid_amount,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'pendente')   AS total_activities_pending,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'entregue')   AS total_activities_delivered,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'corrigida')  AS total_activities_corrected
FROM students s
LEFT JOIN class_logs cl        ON cl.student_id = s.id
LEFT JOIN financial_records fr ON fr.student_id = s.id
LEFT JOIN activities a         ON a.student_id  = s.id
GROUP BY s.id;

CREATE OR REPLACE VIEW students_masked
WITH (security_invoker = true) AS
SELECT
  s.id,
  s.name,
  s.country,
  s.phone,
  s.email,
  s.pay_day,
  s.hourly_rate,
  s.is_deleted,
  s.status,
  s.teacher_id,
  s.birth_date,
  s.city,
  s.state,
  s.origin,
  s.created_at,
  s.updated_at,
  s.anonymized_at,
  public.get_student_avatar_url(s.id) AS avatar_url
FROM students s;
