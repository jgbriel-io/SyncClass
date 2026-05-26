-- BE-001: Fix financial_records INSERT policy — enforce teacher→student ownership
DROP POLICY IF EXISTS "financial_records_insert" ON public.financial_records;
CREATE POLICY "financial_records_insert" ON public.financial_records
  FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND student_id IN (
        SELECT id FROM public.students WHERE teacher_id = auth.uid()
      )
    )
  );

-- BE-002: Fix activities INSERT policy — enforce teacher→student ownership
DROP POLICY IF EXISTS "activities_insert" ON public.activities;
CREATE POLICY "activities_insert" ON public.activities
  FOR INSERT WITH CHECK (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND student_id IN (
        SELECT id FROM public.students WHERE teacher_id = auth.uid()
      )
    )
  );

-- BE-003: Grant EXECUTE on upsert_user_role_safe to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.upsert_user_role_safe(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_role_safe(uuid, text) TO service_role;
