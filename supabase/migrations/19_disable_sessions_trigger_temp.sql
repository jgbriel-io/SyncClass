-- ============================================
-- MIGRATION 37: DESABILITAR TRIGGER PROBLEMÁTICO EM PRODUÇÃO
-- ============================================
-- Este trigger está causando erro de tipo UUID
-- Desabilitar temporariamente até aplicar correção completa
-- ============================================

-- Desabilitar o trigger que invalida sessões ao desativar usuário
ALTER TABLE profiles DISABLE TRIGGER trigger_invalidate_sessions_on_deactivate;

-- Notificação
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TRIGGER DESABILITADO EM PRODUÇÃO';
  RAISE NOTICE '============================================';
  RAISE NOTICE '⚠️  trigger_invalidate_sessions_on_deactivate DESABILITADO';
  RAISE NOTICE '✓ Arquivamento de usuários funcionará normalmente';
  RAISE NOTICE '⚠️  Sessões NÃO serão invalidadas automaticamente';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Testar arquivamento de usuário';
  RAISE NOTICE '2. Aplicar migration 36 (correção completa)';
  RAISE NOTICE '3. Reabilitar trigger com correção';
  RAISE NOTICE '============================================';
END;
$$;
