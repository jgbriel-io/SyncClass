-- Verifica se as views existem e estão funcionando

-- 1. Verifica se teachers_masked existe
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE viewname = 'teachers_masked';

-- 2. Testa a view teachers_masked
SELECT * FROM teachers_masked LIMIT 5;

-- 3. Verifica dados na tabela teachers
SELECT id, name, email, status, created_at FROM teachers LIMIT 5;

-- 4. Verifica se profiles tem os dados
SELECT id, full_name, email, role, teacher_id FROM profiles WHERE teacher_id IS NOT NULL LIMIT 5;

-- 5. Verifica user_roles
SELECT * FROM user_roles LIMIT 10;
