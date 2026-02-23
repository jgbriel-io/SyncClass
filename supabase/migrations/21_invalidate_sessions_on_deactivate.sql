-- ============================================
-- MIGRATION 21: INVALIDAR SESSÕES AO DESATIVAR USUÁRIO
-- Segurança: Desconectar usuário quando conta é desativada/deletada
-- Data: 23/02/2026
-- ============================================

-- ============================================
-- FUNÇÃO: INVALIDAR TODAS AS SESSÕES DE UM USUÁRIO
-- ============================================

CREATE OR REPLACE FUNCTION invalidate_user_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Se o usuário foi desativado (active: true -> false)
  IF OLD.active = true AND NEW.active = false THEN
    
    -- Deletar todas as sessões ativas do usuário no auth.sessions
    DELETE FROM auth.sessions
    WHERE user_id = NEW.user_id;
    
    -- Deletar todos os refresh tokens do usuário
    DELETE FROM auth.refresh_tokens
    WHERE user_id = NEW.user_id;
    
    RAISE NOTICE 'Sessões invalidadas para usuário %', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION invalidate_user_sessions IS 'Invalida todas as sessões quando um usuário é desativado (active = false)';

-- ============================================
-- TRIGGER: EXECUTAR APÓS UPDATE EM PROFILES
-- ============================================

DROP TRIGGER IF EXISTS trigger_invalidate_sessions_on_deactivate ON profiles;

CREATE TRIGGER trigger_invalidate_sessions_on_deactivate
  AFTER UPDATE OF active ON profiles
  FOR EACH ROW
  WHEN (OLD.active IS DISTINCT FROM NEW.active)
  EXECUTE FUNCTION invalidate_user_sessions();

COMMENT ON TRIGGER trigger_invalidate_sessions_on_deactivate ON profiles IS 'Trigger que invalida sessões quando active muda';

-- ============================================
-- FUNÇÃO: INVALIDAR SESSÕES AO DELETAR AUTH USER
-- ============================================

-- NOTA: Esta função será chamada pela Edge Function admin-delete-user
-- Não podemos criar trigger em auth.users (tabela do Supabase Auth)

CREATE OR REPLACE FUNCTION invalidate_sessions_before_delete(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Deletar todas as sessões ativas
  DELETE FROM auth.sessions
  WHERE user_id = p_user_id;
  
  -- Deletar todos os refresh tokens
  DELETE FROM auth.refresh_tokens
  WHERE user_id = p_user_id;
  
  RAISE NOTICE 'Sessões invalidadas antes de deletar usuário %', p_user_id;
END;
$$;

COMMENT ON FUNCTION invalidate_sessions_before_delete IS 'Invalida sessões antes de deletar um usuário (chamado pela Edge Function)';

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice para buscar sessões por user_id (se não existir)
-- NOTA: auth.sessions já tem índice, mas vamos garantir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'auth' 
    AND tablename = 'sessions' 
    AND indexname = 'sessions_user_id_idx'
  ) THEN
    CREATE INDEX sessions_user_id_idx ON auth.sessions(user_id);
  END IF;
END;
$$;

-- ============================================
-- TESTES DE VALIDAÇÃO
-- ============================================

DO $$
DECLARE
  v_test_user_id UUID;
  v_test_profile_id UUID;
  v_sessions_before INT;
  v_sessions_after INT;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TESTES DE INVALIDAÇÃO DE SESSÕES';
  RAISE NOTICE '============================================';
  
  -- Verificar se a função existe
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'invalidate_user_sessions') THEN
    RAISE NOTICE '✅ Função invalidate_user_sessions() criada';
  ELSE
    RAISE WARNING '❌ Função invalidate_user_sessions() NÃO encontrada';
  END IF;
  
  -- Verificar se o trigger existe
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_invalidate_sessions_on_deactivate'
  ) THEN
    RAISE NOTICE '✅ Trigger trigger_invalidate_sessions_on_deactivate criado';
  ELSE
    RAISE WARNING '❌ Trigger NÃO encontrado';
  END IF;
  
  -- Verificar se a função de delete existe
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'invalidate_sessions_before_delete') THEN
    RAISE NOTICE '✅ Função invalidate_sessions_before_delete() criada';
  ELSE
    RAISE WARNING '❌ Função invalidate_sessions_before_delete() NÃO encontrada';
  END IF;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'COMPORTAMENTO ESPERADO:';
  RAISE NOTICE '1. Ao desativar usuário (active = false) → sessões invalidadas';
  RAISE NOTICE '2. Ao deletar usuário → chamar invalidate_sessions_before_delete()';
  RAISE NOTICE '3. Usuário é desconectado automaticamente';
  RAISE NOTICE '============================================';
END;
$$;

-- ============================================
-- NOTIFICAÇÃO DE SUCESSO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 21 APLICADA COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Função invalidate_user_sessions() criada';
  RAISE NOTICE '✅ Trigger em profiles.active criado';
  RAISE NOTICE '✅ Função invalidate_sessions_before_delete() criada';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SEGURANÇA IMPLEMENTADA:';
  RAISE NOTICE '- Desativar usuário → desconecta automaticamente';
  RAISE NOTICE '- Deletar usuário → desconecta antes de deletar';
  RAISE NOTICE '- Todas as sessões e refresh tokens invalidados';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Atualizar Edge Function admin-delete-user';
  RAISE NOTICE '2. Testar desativação de usuário';
  RAISE NOTICE '3. Verificar que sessões são invalidadas';
  RAISE NOTICE '============================================';
END;
$$;
