-- ============================================
-- MIGRATION 15: Forçar troca de senha no primeiro login
-- Adiciona flag must_change_password em profiles
-- Data: 21/02/2026
-- ============================================

-- Adicionar coluna must_change_password
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.must_change_password IS 'Indica se o usuário deve trocar a senha no próximo login';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_must_change_password 
ON profiles(must_change_password) 
WHERE must_change_password = TRUE;

-- Notificar sucesso
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'COLUNA must_change_password ADICIONADA!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ Coluna must_change_password criada em profiles';
  RAISE NOTICE '✓ Índice criado para performance';
  RAISE NOTICE '✓ Usuários novos serão marcados automaticamente';
  RAISE NOTICE '============================================';
END $$;
