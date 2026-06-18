-- Add avatar_url (from profiles) to student views so the frontend can display student photos.
-- Uses a scalar subquery to avoid complicating the GROUP BY in students_with_stats.

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
  (SELECT p.avatar_url FROM public.profiles p WHERE p.student_id = s.id LIMIT 1) AS avatar_url,
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

COMMENT ON VIEW students_with_stats IS 'Alunos com estatísticas agregadas de aulas, cobranças e atividades';

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
  (SELECT p.avatar_url FROM public.profiles p WHERE p.student_id = s.id LIMIT 1) AS avatar_url
FROM students s;

COMMENT ON VIEW students_masked IS 'Alunos com nome anonimizado se aplicável (LGPD)';
