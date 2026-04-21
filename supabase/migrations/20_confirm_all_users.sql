-- Migration 43: Confirmar email de todos os usuários
-- Útil para desenvolvimento/homologação quando SMTP não está configurado
-- ATENÇÃO: NÃO rodar em produção sem avaliar impacto de segurança

-- Confirmar email de todos os usuários na tabela auth.users
-- NOTA: confirmed_at é uma coluna gerada, não pode ser atualizada manualmente
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Verificar resultado
DO $$
DECLARE
  confirmed_count INTEGER;
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO confirmed_count 
  FROM auth.users 
  WHERE email_confirmed_at IS NOT NULL;
  
  SELECT COUNT(*) INTO pending_count 
  FROM auth.users 
  WHERE email_confirmed_at IS NULL;
  
  RAISE NOTICE 'Usuários confirmados: %', confirmed_count;
  RAISE NOTICE 'Usuários pendentes: %', pending_count;
END $$;
