-- ============================================
-- Script para Recriar Admin nas Tabelas
-- ============================================
-- Recria o admin com ID: c87d8572-f461-4518-8d88-3bd502a9d1a6
-- ============================================

BEGIN;

DO $$
DECLARE
  admin_id uuid := 'c87d8572-f461-4518-8d88-3bd502a9d1a6';
  admin_email text;
BEGIN
  -- Buscar o email do admin no auth.users
  SELECT email INTO admin_email
  FROM auth.users
  WHERE id = admin_id;

  -- Se não encontrou, abortar
  IF admin_email IS NULL THEN
    RAISE EXCEPTION 'Usuário admin com ID % não encontrado no auth.users', admin_id;
  END IF;

  RAISE NOTICE 'Admin encontrado: % (ID: %)', admin_email, admin_id;

  -- Inserir ou atualizar na tabela profiles
  INSERT INTO profiles (id, user_id, teacher_id, full_name, email, role, active, created_at, updated_at)
  VALUES (admin_id, admin_id, admin_id, 'Administrador', admin_email, 'admin', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET 
    user_id = admin_id,
    teacher_id = admin_id,
    full_name = 'Administrador',
    email = EXCLUDED.email,
    role = 'admin',
    active = true,
    updated_at = NOW();

  RAISE NOTICE 'Profile criado/atualizado para admin';

  -- Inserir ou atualizar na tabela teachers
  INSERT INTO teachers (id, name, email, created_at, updated_at)
  VALUES (
    admin_id,
    'Administrador',
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
WHERE id = 'c87d8572-f461-4518-8d88-3bd502a9d1a6'
UNION ALL
SELECT 
  'profiles' as tabela,
  id,
  NULL as email
FROM profiles
WHERE id = 'c87d8572-f461-4518-8d88-3bd502a9d1a6'
UNION ALL
SELECT 
  'teachers' as tabela,
  id,
  email
FROM teachers
WHERE id = 'c87d8572-f461-4518-8d88-3bd502a9d1a6'
UNION ALL
SELECT 
  'user_roles' as tabela,
  user_id as id,
  role as email
FROM user_roles
WHERE user_id = 'c87d8572-f461-4518-8d88-3bd502a9d1a6';

COMMIT;
