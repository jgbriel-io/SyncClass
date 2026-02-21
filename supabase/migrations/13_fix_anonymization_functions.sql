-- ============================================
-- MIGRATION 13: Corrigir Funções de Anonimização
-- Remove referências a CPF (coluna já foi removida)
-- Data: 21/02/2026
-- ============================================

-- Função para anonimizar aluno (SEM CPF)
CREATE OR REPLACE FUNCTION anonymize_student(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_anonymized_name TEXT;
BEGIN
  v_anonymized_name := 'Aluno ' || SUBSTRING(p_student_id::TEXT FROM 1 FOR 8);
  
  UPDATE students
  SET
    name = v_anonymized_name,
    phone = NULL,
    email = NULL,
    birth_date = NULL,
    city = NULL,
    state = NULL,
    origin = NULL,
    anonymized_at = NOW(),
    updated_at = NOW()
  WHERE id = p_student_id
    AND anonymized_at IS NULL;
  
  RAISE NOTICE 'Aluno % anonimizado com sucesso', p_student_id;
END;
$$;

COMMENT ON FUNCTION anonymize_student IS 'Anonimiza dados pessoais de um aluno mantendo dados fiscais para auditoria (LGPD Art. 16, I)';

-- Função para anonimizar professor (SEM CPF)
CREATE OR REPLACE FUNCTION anonymize_teacher(p_teacher_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_anonymized_name TEXT;
BEGIN
  v_anonymized_name := 'Professor ' || SUBSTRING(p_teacher_id::TEXT FROM 1 FOR 8);
  
  UPDATE teachers
  SET
    name = v_anonymized_name,
    phone = NULL,
    email = NULL,
    address = NULL,
    pix_key = NULL,
    anonymized_at = NOW(),
    updated_at = NOW()
  WHERE id = p_teacher_id
    AND anonymized_at IS NULL;
  
  RAISE NOTICE 'Professor % anonimizado com sucesso', p_teacher_id;
END;
$$;

COMMENT ON FUNCTION anonymize_teacher IS 'Anonimiza dados pessoais de um professor mantendo dados fiscais para auditoria (LGPD Art. 16, I)';

-- Notificar sucesso
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'FUNÇÕES DE ANONIMIZAÇÃO ATUALIZADAS!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ Referências a CPF removidas';
  RAISE NOTICE '✓ anonymize_student atualizado';
  RAISE NOTICE '✓ anonymize_teacher atualizado';
  RAISE NOTICE '============================================';
END $$;
