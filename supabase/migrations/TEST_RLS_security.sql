-- ============================================
-- TESTE CRÍTICO: RLS e Security Invoker
-- ============================================
-- IMPORTANTE: Rodar este teste logado como ALUNO (não admin)
-- para verificar se RLS está funcionando corretamente

-- ============================================
-- SETUP: Criar usuário de teste (se não existir)
-- ============================================

-- Pegar ID de um aluno existente para teste
DO $$
DECLARE
  v_student_id UUID;
  v_other_student_id UUID;
BEGIN
  -- Pegar primeiro aluno ativo
  SELECT id INTO v_student_id FROM students WHERE is_deleted = false LIMIT 1;
  
  -- Pegar segundo aluno (diferente do primeiro)
  SELECT id INTO v_other_student_id 
  FROM students 
  WHERE is_deleted = false 
  AND id != v_student_id 
  LIMIT 1;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'IDs para teste:';
  RAISE NOTICE 'Aluno 1: %', v_student_id;
  RAISE NOTICE 'Aluno 2: %', v_other_student_id;
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'INSTRUÇÕES:';
  RAISE NOTICE '1. Faça login como Aluno 1 no frontend';
  RAISE NOTICE '2. Abra o SQL Editor do Supabase';
  RAISE NOTICE '3. Execute as queries abaixo';
  RAISE NOTICE '============================================';
END $$;

-- ============================================
-- TESTE 1: View students_with_stats
-- ============================================
-- ESPERADO: Aluno vê apenas SEUS dados

-- Substituir pelo ID do aluno logado
SELECT 
  id,
  name,
  email,
  total_classes,
  total_activities
FROM students_with_stats 
WHERE id = 'b022461b-5c53-477e-912e-3ad9bb4e8554';

-- Tentar ver dados de OUTRO aluno (deve retornar vazio ou erro)
SELECT 
  id,
  name,
  email
FROM students_with_stats 
WHERE id != 'b022461b-5c53-477e-912e-3ad9bb4e8554'
LIMIT 1;

-- ============================================
-- TESTE 2: View activities_active
-- ============================================
-- ESPERADO: Aluno vê apenas SUAS atividades

SELECT 
  id,
  title,
  status,
  student_id
FROM activities_active 
WHERE student_id = 'b022461b-5c53-477e-912e-3ad9bb4e8554'
LIMIT 5;

-- Tentar ver atividades de OUTRO aluno (deve retornar vazio)
SELECT 
  id,
  title,
  student_id
FROM activities_active 
WHERE student_id != 'b022461b-5c53-477e-912e-3ad9bb4e8554'
LIMIT 1;

-- ============================================
-- TESTE 3: Materialized Views (sem RLS direto)
-- ============================================
-- NOTA: Materialized views NÃO têm RLS nativo
-- A segurança deve ser aplicada no frontend ou via views wrapper

SELECT COUNT(*) as total_activities FROM activities_dashboard;
SELECT COUNT(*) as total_financial FROM financial_dashboard;

-- ============================================
-- TESTE 4: View teachers_with_pix_restricted
-- ============================================
-- ESPERADO: Apenas ADMIN vê PIX keys

-- Se logado como ALUNO/PROFESSOR: deve dar erro ou retornar vazio
-- Se logado como ADMIN: deve retornar dados com PIX
SELECT 
  id,
  name,
  pix_key_type,
  pix_key_value
FROM teachers_with_pix_restricted
LIMIT 1;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RESULTADO ESPERADO:';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ TESTE 1: Retorna apenas dados do aluno logado';
  RAISE NOTICE '✅ TESTE 2: Retorna apenas atividades do aluno logado';
  RAISE NOTICE '✅ TESTE 3: Retorna contagem total (sem filtro RLS)';
  RAISE NOTICE '✅ TESTE 4: Erro ou vazio (se não for admin)';
  RAISE NOTICE '';
  RAISE NOTICE '❌ FALHA: Se conseguir ver dados de outros alunos';
  RAISE NOTICE '❌ FALHA: Se conseguir ver PIX keys sem ser admin';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
