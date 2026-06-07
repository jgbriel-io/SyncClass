-- Fix: teachers_select_policy missing student clause.
-- Migration 04 defined the policy with a student branch, but a later migration
-- recreated it with only admin/teacher clauses. Students cannot see their own
-- teacher's data (name, pix_key) which breaks the student portal views.
DROP POLICY IF EXISTS "teachers_select_policy" ON teachers;

CREATE POLICY "teachers_select_policy"
    ON teachers FOR SELECT
    TO authenticated
    USING (
        (SELECT public.is_admin())
        OR id = (SELECT public.get_teacher_id())
        OR (
            (SELECT public.is_student())
            AND id IN (
                SELECT teacher_id
                FROM students
                WHERE id = (SELECT public.get_student_id())
            )
        )
    );

COMMENT ON POLICY "teachers_select_policy" ON teachers IS
'Permite: Admin vê tudo, Professor vê seus dados, Aluno vê apenas dados do seu professor (inclui pix_key para pagamentos)';
