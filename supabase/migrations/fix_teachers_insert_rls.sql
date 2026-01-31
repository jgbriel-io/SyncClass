-- ============================================================
-- Fix: INSERT falhando com RLS em teachers e students
-- ============================================================
-- Políticas FOR ALL com apenas USING podem falhar em INSERT.
-- Adicionar WITH CHECK explícito garante que admin possa inserir.
-- ============================================================

-- teachers
DROP POLICY IF EXISTS "teachers_admin_all" ON public.teachers;

CREATE POLICY "teachers_admin_all"
    ON public.teachers FOR ALL
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- students (mesmo padrão)
DROP POLICY IF EXISTS "students_admin_all" ON public.students;

CREATE POLICY "students_admin_all"
    ON public.students FOR ALL
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));
