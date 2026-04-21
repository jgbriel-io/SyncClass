-- Verificar roles atuais dos usuários de teste
SELECT 
    u.email,
    p.role as profile_role,
    ur.role as user_roles_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('admin@test.com', 'professor1@test.com', 'professor2@test.com', 'aluno1@test.com', 'aluno2@test.com')
ORDER BY u.email;

-- Corrigir roles nos profiles
UPDATE public.profiles SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@test.com');

UPDATE public.profiles SET role = 'teacher'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'professor1@test.com');

UPDATE public.profiles SET role = 'teacher'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'professor2@test.com');

UPDATE public.profiles SET role = 'student'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'aluno1@test.com');

UPDATE public.profiles SET role = 'student'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'aluno2@test.com');

-- Corrigir roles na tabela user_roles (se existir)
INSERT INTO public.user_roles (user_id, role, email)
SELECT id, 'admin', email FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

INSERT INTO public.user_roles (user_id, role, email)
SELECT id, 'teacher', email FROM auth.users WHERE email = 'professor1@test.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'teacher';

INSERT INTO public.user_roles (user_id, role, email)
SELECT id, 'teacher', email FROM auth.users WHERE email = 'professor2@test.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'teacher';

INSERT INTO public.user_roles (user_id, role, email)
SELECT id, 'student', email FROM auth.users WHERE email = 'aluno1@test.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'student';

INSERT INTO public.user_roles (user_id, role, email)
SELECT id, 'student', email FROM auth.users WHERE email = 'aluno2@test.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'student';

-- Verificar resultado
SELECT 
    u.email,
    p.role as profile_role,
    ur.role as user_roles_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('admin@test.com', 'professor1@test.com', 'professor2@test.com', 'aluno1@test.com', 'aluno2@test.com')
ORDER BY u.email;
