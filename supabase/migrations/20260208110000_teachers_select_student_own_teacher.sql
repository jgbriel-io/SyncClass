-- Permite que o aluno leia o professor vinculado a ele (teachers_masked usa RLS de teachers).
-- Sem isso, get_my_teacher_id() é NULL para aluno e studentTeacherName fica undefined nos cards.

CREATE POLICY "teachers_select_student_own_teacher" ON public.teachers
FOR SELECT TO authenticated
USING (
  id = (
    SELECT s.teacher_id
    FROM public.students s
    WHERE s.id = (SELECT public.get_my_student_id())
    LIMIT 1
  )
);
