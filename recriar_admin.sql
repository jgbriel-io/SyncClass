-- ============================================
-- Script para Recriar Admin nas Tabelas
-- ============================================
-- Execute este script para recriar o admin nas tabelas
-- profiles, teachers e user_roles
-- ============================================

BEGIN;

-- Passo 1: Identificar o admin no auth.users
-- SUBSTITUA o email abaixo pelo email do admin
DO $$
DECLARE
  admin_id uuid;
  admin_email text := 'SEU_EMAIL_ADMIN@exemplo.com'; -- ALTERE AQUI!
BEGIN
  -- Buscar o ID do admin no auth.users
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = admin_email;

  -- Se não encontrou, abortar
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Usuário admin com email % não encontrado no auth.users', admin_email;
  END IF;

  RAISE NOTICE 'Admin encontrado: % (ID: %)', admin_email, admin_id;

  -- Inserir ou atualizar na tabela profiles
  INSERT INTO profiles (id, created_at, updated_at)
  VALUES (admin_id, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET updated_at = NOW();

  RAISE NOTICE 'Profile criado/atualizado para admin';

  -- Inserir ou atualizar na tabela teachers
  -- AJUSTE os campos conforme necessário (name, email, etc.)
  INSERT INTO teachers (id, name, email, created_at, updated_at)
  VALUES (
    admin_id,
    'Administrador', -- ALTERE AQUI se quiser outro nome
    admin_email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();

  RAISE NOTICE 'Teacher criado/atualizado para admin';

  -- Inserir ou atualizar na tabela user_roles
  INSERT INTO user_roles (user_id, role, created_at)
  VALUES (admin_id, 'admin', NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET 
    role = 'admin',
    created_at = NOW();

  RAISE NOTICE 'User role criado/atualizado para admin';

END $$;

-- Verificar o resultado
SELECT 
  'auth.users' as tabela,
  id,
  email
FROM auth.users
WHERE email = 'SEU_EMAIL_ADMIN@exemplo.com' -- ALTERE AQUI!
UNION ALL
SELECT 
  'profiles' as tabela,
  id,
  NULL as email
FROM profiles
WHERE id IN (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL_ADMIN@exemplo.com') -- ALTERE AQUI!
UNION ALL
SELECT 
  'teachers' as tabela,
  id,
  email
FROM teachers
WHERE id IN (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL_ADMIN@exemplo.com') -- ALTERE AQUI!
UNION ALL
SELECT 
  'user_roles' as tabela,
  user_id as id,
  role as email
FROM user_roles
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL_ADMIN@exemplo.com'); -- ALTERE AQUI!

COMMIT;

-- ============================================
-- INSTRUÇÕES:
-- 1. Substitua 'SEU_EMAIL_ADMIN@exemplo.com' pelo email real do admin
-- 2. Ajuste o nome 'Administrador' se necessário
-- 3. Execute o script
-- ============================================
