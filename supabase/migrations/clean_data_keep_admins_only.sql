-- ============================================================
-- LIMPEZA: Manter apenas administradores
-- ============================================================
-- Remove alunos, professores, registros de aula e financeiros.
-- Preserva apenas usuários com role 'admin' em user_roles e profiles.
-- ATENÇÃO: Execute com cuidado. Não deleta usuários do Auth automaticamente.
-- ============================================================

-- 1. Identificar administradores (por user_id em user_roles)
CREATE TEMP TABLE admin_ids AS
SELECT user_id 
FROM public.user_roles 
WHERE role = 'admin';

-- 2. Limpar na ordem correta (respeitando FKs)
-- financial_records -> class_logs -> students (depois teachers)
DELETE FROM public.financial_records;

DELETE FROM public.class_logs;

DELETE FROM public.students;

DELETE FROM public.teachers;

-- 3. Limpar user_roles e profiles (exceto admins)
-- profiles.id é PK; profiles.user_id é a FK para auth
DELETE FROM public.user_roles 
WHERE user_id NOT IN (SELECT user_id FROM admin_ids);

DELETE FROM public.profiles 
WHERE user_id NOT IN (SELECT user_id FROM admin_ids);

-- 4. Auth: deletar manualmente em Dashboard > Authentication > Users
-- os usuários que não são admins, ou use admin-delete-user Edge Function.
