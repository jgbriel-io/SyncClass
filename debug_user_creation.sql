-- Debug: verifica os dados dos professores criados

-- 1. Dados na tabela teachers
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM teachers
ORDER BY created_at DESC
LIMIT 5;

-- 2. Dados na tabela profiles vinculados aos teachers
SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.email,
    p.role,
    p.active,
    p.teacher_id,
    p.created_at
FROM profiles p
WHERE p.teacher_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 5;

-- 3. Dados na tabela user_roles
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.full_name,
    ur.email,
    ur.created_at
FROM user_roles ur
WHERE ur.role = 'teacher'
ORDER BY ur.created_at DESC
LIMIT 5;

-- 4. Join completo para ver se está tudo linkado
SELECT 
    t.id as teacher_id,
    t.name as teacher_name,
    t.status as teacher_status,
    p.id as profile_id,
    p.user_id,
    p.full_name as profile_name,
    p.active as profile_active,
    ur.role as user_role
FROM teachers t
LEFT JOIN profiles p ON p.teacher_id = t.id
LEFT JOIN user_roles ur ON ur.user_id = p.user_id
ORDER BY t.created_at DESC
LIMIT 5;
