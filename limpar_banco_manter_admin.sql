-- ============================================
-- Script para Limpar Banco e Manter Apenas Admin
-- ============================================
-- ATENÇÃO: Este script apaga TODOS os dados do banco
-- mantendo apenas o usuário admin
-- Execute com CUIDADO!
-- ============================================

BEGIN;

-- 1. Deletar atividades
DELETE FROM activities;

-- 2. Deletar registros de auditoria
DELETE FROM audit_logs;

-- 3. Deletar chaves de idempotência
DELETE FROM idempotency_keys;

-- 4. Deletar logs de performance
DELETE FROM performance_logs;

-- 5. Deletar registros financeiros e suas relações
DELETE FROM financial_record_class_logs;
DELETE FROM financial_records;

-- 6. Deletar aulas
DELETE FROM class_logs;

-- 7. Deletar alunos
DELETE FROM students;

-- 8. Deletar professores e usuários (mantém apenas admin)
-- Primeiro, identificar quem é admin
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Buscar o ID do usuário admin via user_roles
  SELECT user_id INTO admin_user_id
  FROM user_roles
  WHERE role = 'admin'
  LIMIT 1;

  -- Se não encontrou admin, abortar para não deletar tudo
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin não encontrado na tabela user_roles! Abortando para segurança.';
  END IF;

  -- Deletar todos os professores que não são admin
  DELETE FROM teachers WHERE id != admin_user_id;

  -- Deletar profiles que não são do admin
  DELETE FROM profiles WHERE id != admin_user_id;

  -- Deletar user_roles que não são do admin
  DELETE FROM user_roles WHERE user_id != admin_user_id;

  -- Deletar usuários do auth.users que não são admin
  DELETE FROM auth.users WHERE id != admin_user_id;

  RAISE NOTICE 'Limpeza concluída. Admin mantido: %', admin_user_id;
END $$;

-- 9. Verificar o que sobrou
SELECT 
  'auth.users' as tabela,
  COUNT(*) as registros
FROM auth.users
UNION ALL
SELECT 'teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'class_logs', COUNT(*) FROM class_logs
UNION ALL
SELECT 'activities', COUNT(*) FROM activities
UNION ALL
SELECT 'financial_records', COUNT(*) FROM financial_records
UNION ALL
SELECT 'financial_record_class_logs', COUNT(*) FROM financial_record_class_logs
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'idempotency_keys', COUNT(*) FROM idempotency_keys
UNION ALL
SELECT 'performance_logs', COUNT(*) FROM performance_logs
ORDER BY tabela;

COMMIT;

-- ============================================
-- Resultado esperado:
-- - auth.users: 1 registro (admin)
-- - teachers: 1 registro (admin)
-- - profiles: 1 registro (admin)
-- - user_roles: 1 registro (admin)
-- - Todas as outras tabelas: 0 registros
-- ============================================
