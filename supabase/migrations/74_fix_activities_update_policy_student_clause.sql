-- Fix: activities_update_policy missing student clause.
-- DB policy only had admin + teacher branches; student branch was lost.
-- Students need to UPDATE their own activities to deliver responses.
DROP POLICY IF EXISTS "activities_update_policy" ON activities;

CREATE POLICY "activities_update_policy"
    ON activities FOR UPDATE
    TO authenticated
    USING (
        (SELECT public.is_admin())
        OR (
            (SELECT public.is_teacher())
            AND teacher_id = (SELECT public.get_teacher_id())
            AND student_id IN (
                SELECT students.id
                FROM students
                WHERE students.teacher_id = (SELECT public.get_teacher_id())
            )
        )
        OR (
            (SELECT public.is_student())
            AND student_id = (SELECT public.get_student_id())
        )
    )
    WITH CHECK (
        (SELECT public.is_admin())
        OR (
            (SELECT public.is_teacher())
            AND teacher_id = (SELECT public.get_teacher_id())
        )
        OR (
            (SELECT public.is_student())
            AND student_id = (SELECT public.get_student_id())
        )
    );

COMMENT ON POLICY "activities_update_policy" ON activities IS
'Permite: Admin edita tudo, Professor edita atividades dos próprios alunos, Aluno entrega sua própria atividade (status, resposta, arquivo)';
