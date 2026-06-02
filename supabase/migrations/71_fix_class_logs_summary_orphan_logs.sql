-- Fix: get_class_logs_summary LEFT JOINs students but never guards s.id IS NOT NULL.
-- When p_teacher_id IS NULL (admin view), orphan class_logs (student hard-deleted)
-- pass the (p_teacher_id IS NULL OR ...) condition and inflate totals.
-- Switch to INNER JOIN so orphan logs are excluded from all counts.
CREATE OR REPLACE FUNCTION public.get_class_logs_summary(
  p_teacher_id UUID DEFAULT NULL,
  p_date_from  DATE DEFAULT NULL,
  p_date_to    DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'totalClasses',  COUNT(*),
    'totalPresent',  COUNT(*) FILTER (WHERE cl.attendance = true),
    'totalAbsent',   COUNT(*) FILTER (WHERE cl.attendance = false),
    'totalPending',  COUNT(*) FILTER (WHERE cl.attendance IS NULL),
    'gradesCount',   COUNT(*) FILTER (WHERE cl.grade IS NOT NULL),
    'gradesSum',     COALESCE(SUM(cl.grade) FILTER (WHERE cl.grade IS NOT NULL), 0),
    'averageGrade',  CASE
      WHEN COUNT(*) FILTER (WHERE cl.grade IS NOT NULL) > 0
      THEN SUM(cl.grade) FILTER (WHERE cl.grade IS NOT NULL)::numeric
           / COUNT(*) FILTER (WHERE cl.grade IS NOT NULL)
      ELSE 0
    END
  )
  FROM class_logs cl
  INNER JOIN students s ON s.id = cl.student_id
  WHERE (p_teacher_id IS NULL OR s.teacher_id = p_teacher_id)
    AND (p_date_from IS NULL OR cl.class_date >= p_date_from)
    AND (p_date_to   IS NULL OR cl.class_date <= p_date_to);
$$;

REVOKE EXECUTE ON FUNCTION public.get_class_logs_summary(UUID, DATE, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_class_logs_summary(UUID, DATE, DATE) TO authenticated, service_role;
