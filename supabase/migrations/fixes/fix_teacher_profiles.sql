-- Vincular profiles dos professores com os registros na tabela teachers
UPDATE public.profiles p
SET teacher_id = t.id
FROM public.teachers t
WHERE t.email = p.email
  AND p.role = 'teacher'
  AND p.teacher_id IS NULL;

-- Vincular profiles dos alunos com os registros na tabela students  
UPDATE public.profiles p
SET student_id = s.id
FROM public.students s
WHERE s.email = p.email
  AND p.role = 'student'
  AND p.student_id IS NULL;

-- Verificar resultado
SELECT 
    p.email,
    p.role,
    p.teacher_id,
    p.student_id
FROM public.profiles p
WHERE p.email IN (
    'admin@test.com',
    'professor1@test.com',
    'professor2@test.com',
    'aluno1@test.com',
    'aluno2@test.com'
)
ORDER BY p.email;
