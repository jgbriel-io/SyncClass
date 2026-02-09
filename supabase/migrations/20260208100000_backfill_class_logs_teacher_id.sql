-- Preenche class_logs.teacher_id quando NULL usando o professor do aluno (students.teacher_id).
-- Assim o join teachers_masked(name) passa a retornar o nome e os dados ficam consistentes.

UPDATE public.class_logs cl
SET teacher_id = s.teacher_id
FROM public.students s
WHERE cl.student_id = s.id
  AND cl.teacher_id IS NULL
  AND s.teacher_id IS NOT NULL;
