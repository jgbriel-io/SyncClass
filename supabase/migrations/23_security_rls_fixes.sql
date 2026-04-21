-- ============================================
-- MIGRATION 23: Security RLS Fixes
-- ============================================
-- Corrige 4 vulnerabilidades críticas de BOLA/IDOR:
-- BUG-SEC-001: financial_records INSERT sem validar ownership do student
-- BUG-SEC-002: activities INSERT sem validar ownership do student
-- BUG-SEC-003: financial_records UPDATE sem validar ownership do student
-- BUG-SEC-006: class_logs INSERT sem validar ownership do student
-- ============================================

-- ============================================
-- BUG-SEC-001: financial_records INSERT
-- ============================================
DROP POLICY IF EXISTS "financial_records_insert_policy" ON financial_records;
CREATE POLICY "financial_records_insert_policy"
  ON financial_records FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND student_id IN (
        SELECT id FROM students 
        WHERE teacher_id = (SELECT public.get_teacher_id())
      )
    )
  );

COMMENT ON POLICY "financial_records_insert_policy" ON financial_records IS
'Professor só pode criar cobranças para seus próprios alunos. Previne BOLA/IDOR.';

-- ============================================
-- BUG-SEC-002: activities INSERT
-- ============================================
DROP POLICY IF EXISTS "activities_insert_policy" ON activities;
CREATE POLICY "activities_insert_policy"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND student_id IN (
        SELECT id FROM students 
        WHERE teacher_id = (SELECT public.get_teacher_id())
      )
    )
  );

COMMENT ON POLICY "activities_insert_policy" ON activities IS
'Professor só pode criar atividades para seus próprios alunos. Previne BOLA/IDOR.';

-- ============================================
-- BUG-SEC-003: financial_records UPDATE
-- ============================================
DROP POLICY IF EXISTS "financial_records_update_policy" ON financial_records;
CREATE POLICY "financial_records_update_policy"
  ON financial_records FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND student_id IN (
        SELECT id FROM students 
        WHERE teacher_id = (SELECT public.get_teacher_id())
      )
    )
  );

COMMENT ON POLICY "financial_records_update_policy" ON financial_records IS
'Professor só pode atualizar cobranças dos seus próprios alunos. Previne BOLA.';

-- ============================================
-- BUG-SEC-006: class_logs INSERT
-- ============================================
DROP POLICY IF EXISTS "class_logs_insert_policy" ON class_logs;
CREATE POLICY "class_logs_insert_policy"
  ON class_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_teacher())
      AND teacher_id = (SELECT public.get_teacher_id())
      AND student_id IN (
        SELECT id FROM students 
        WHERE teacher_id = (SELECT public.get_teacher_id())
      )
    )
  );

COMMENT ON POLICY "class_logs_insert_policy" ON class_logs IS
'Professor só pode criar aulas para seus próprios alunos. Previne BOLA/IDOR.';

-- ============================================
-- BUG-SEC-004: Validação de role em update_profile_by_id
-- ============================================
CREATE OR REPLACE FUNCTION public.update_profile_by_id(
  p_id TEXT,
  p_role TEXT DEFAULT NULL,
  p_active BOOLEAN DEFAULT NULL,
  p_student_id UUID DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_is_admin BOOLEAN;
  v_profile_id UUID;
BEGIN
  -- Verificar se o caller é admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id::text = (auth.uid())::text 
    AND role = 'admin'
  ) INTO v_caller_is_admin;
  
  IF NOT v_caller_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem atualizar profiles';
  END IF;

  -- Validar role antes de qualquer operação
  IF p_role IS NOT NULL AND p_role NOT IN ('admin', 'teacher', 'student') THEN
    RAISE EXCEPTION 'Role inválido: %. Valores aceitos: admin, teacher, student', p_role;
  END IF;
  
  -- Converter p_id para UUID (validação explícita)
  BEGIN
    v_profile_id := p_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'ID inválido: %', p_id;
  END;

  -- Log de auditoria para promoção a admin
  IF p_role = 'admin' THEN
    INSERT INTO audit_logs (user_id, action_type, action, table_name, record_id, metadata)
    VALUES (
      auth.uid(), 'UPDATE', 'promote_to_admin', 'profiles', v_profile_id,
      jsonb_build_object('promoted_by', auth.uid(), 'target_profile', v_profile_id)
    );
  END IF;
  
  -- Desabilitar RLS temporariamente (SECURITY DEFINER já garante que só admin chega aqui)
  SET LOCAL row_security = off;
  
  -- Atualizar profile
  UPDATE profiles
  SET
    role = COALESCE(p_role, role),
    active = COALESCE(p_active, active),
    student_id = COALESCE(p_student_id, student_id),
    teacher_id = COALESCE(p_teacher_id, teacher_id),
    full_name = COALESCE(p_full_name, full_name),
    email = COALESCE(p_email, email),
    updated_at = NOW()
  WHERE id = v_profile_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile não encontrado: %', p_id;
  END IF;
END;
$$;

-- ============================================
-- Verificação
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SECURITY RLS FIXES APLICADOS!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ BUG-SEC-001: financial_records INSERT corrigido';
  RAISE NOTICE '✅ BUG-SEC-002: activities INSERT corrigido';
  RAISE NOTICE '✅ BUG-SEC-003: financial_records UPDATE corrigido';
  RAISE NOTICE '✅ BUG-SEC-004: update_profile_by_id validação de role';
  RAISE NOTICE '✅ BUG-SEC-006: class_logs INSERT corrigido';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Pendente (requer decisão de produto):';
  RAISE NOTICE '⚠️  BUG-SEC-005: teacher_id em financial_records';
  RAISE NOTICE '⚠️  BUG-SEC-007: pix_key exposta para alunos';
  RAISE NOTICE '⚠️  BUG-SEC-008: race condition em idempotency_keys';
  RAISE NOTICE '============================================';
END $$;
