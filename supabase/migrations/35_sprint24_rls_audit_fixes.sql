-- Sprint 24: RLS Full Audit Fixes
-- RLS-003: financial_record_class_logs INSERT — add ownership validation
-- RLS-004: rate_limit_tracker — add explicit ::uuid cast
-- RLS-006: user_roles UPDATE — add WITH CHECK clause

-- ============================================
-- RLS-003: financial_record_class_logs INSERT
-- ============================================
DROP POLICY IF EXISTS "financial_record_class_logs_insert_policy" ON public.financial_record_class_logs;
CREATE POLICY "financial_record_class_logs_insert_policy"
  ON public.financial_record_class_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND financial_record_id IN (
        SELECT fr.id FROM public.financial_records fr
        JOIN public.students s ON s.id = fr.student_id
        WHERE s.teacher_id = auth.uid()
      )
      AND class_log_id IN (
        SELECT cl.id FROM public.class_logs cl
        JOIN public.students s ON s.id = cl.student_id
        WHERE s.teacher_id = auth.uid()
      )
    )
  );

-- ============================================
-- RLS-004: rate_limit_tracker — explicit ::uuid cast
-- ============================================
DROP POLICY IF EXISTS "rate_limit_tracker_select_policy" ON public.rate_limit_tracker;
CREATE POLICY "rate_limit_tracker_select_policy"
  ON public.rate_limit_tracker FOR SELECT
  TO authenticated
  USING (user_id = (auth.uid())::uuid);

DROP POLICY IF EXISTS "rate_limit_tracker_insert_policy" ON public.rate_limit_tracker;
CREATE POLICY "rate_limit_tracker_insert_policy"
  ON public.rate_limit_tracker FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (auth.uid())::uuid);

DROP POLICY IF EXISTS "rate_limit_tracker_update_policy" ON public.rate_limit_tracker;
CREATE POLICY "rate_limit_tracker_update_policy"
  ON public.rate_limit_tracker FOR UPDATE
  TO authenticated
  USING (user_id = (auth.uid())::uuid);

-- ============================================
-- RLS-006: user_roles UPDATE — add WITH CHECK to restrict valid role values
-- ============================================
DROP POLICY IF EXISTS "user_roles_update_policy" ON public.user_roles;
CREATE POLICY "user_roles_update_policy"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK (
    (SELECT public.is_admin())
    AND role IN ('admin', 'teacher', 'student')
  );
