-- BE-007: Fix totalAbsent — NULL attendance was incorrectly counted as absent
-- IS DISTINCT FROM true treats NULL as absent, inflating the count.
-- Fix: count only explicit false as absent, expose NULL separately as totalPending.
CREATE OR REPLACE FUNCTION public.get_class_logs_summary(p_teacher_id UUID DEFAULT NULL)
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
  LEFT JOIN students s ON s.id = cl.student_id
  WHERE p_teacher_id IS NULL OR s.teacher_id = p_teacher_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_class_logs_summary(UUID) TO authenticated;
