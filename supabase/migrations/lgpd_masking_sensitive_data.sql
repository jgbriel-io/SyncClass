-- ============================================================
-- LGPD Data Masking - P0-SEC-02
-- ============================================================
-- Esta migration implementa mascaramento de dados sensíveis
-- (CPF e Telefone) conforme LGPD para usuários não-admin
-- ============================================================

-- ============================================================
-- VERIFICAÇÃO E ADIÇÃO DE COLUNAS FALTANTES
-- ============================================================

-- Adicionar coluna specialization à tabela teachers se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teachers' 
        AND column_name = 'specialization'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN specialization TEXT;
        COMMENT ON COLUMN public.teachers.specialization IS 
        'Especialização do professor (adicionada por LGPD migration)';
    END IF;
END $$;

-- Criar enum teacher_status se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'teacher_status') THEN
        CREATE TYPE public.teacher_status AS ENUM ('ativo', 'inativo');
    END IF;
END $$;

-- Adicionar coluna status à tabela teachers se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teachers' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN status public.teacher_status DEFAULT 'ativo';
        COMMENT ON COLUMN public.teachers.status IS 
        'Status do professor (adicionada por LGPD migration)';
    END IF;
END $$;

-- ============================================================
-- FUNÇÕES DE MASCARAMENTO
-- ============================================================

-- Função para mascarar CPF (formato: 123.456.789-01 -> ***.456.***-01)
-- Mantém apenas os 3 dígitos do meio visíveis
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN cpf IS NULL OR cpf = '' THEN NULL
    WHEN LENGTH(REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '')) = 11 THEN
      -- CPF com 11 dígitos: mostra apenas dígitos 4-6
      '***.' || SUBSTRING(REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', ''), 4, 3) || '.***-' || 
      SUBSTRING(REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', ''), 10, 2)
    ELSE
      -- Formato não reconhecido: mascara tudo menos últimos 2 dígitos
      REPEAT('*', GREATEST(0, LENGTH(cpf) - 2)) || RIGHT(cpf, 2)
  END
$$;

COMMENT ON FUNCTION public.mask_cpf(TEXT) IS 
'Mascara CPF mantendo apenas 3 dígitos do meio visíveis. Formato: ***.456.***-01';

-- Função para mascarar telefone (formato: (11) 98765-4321 -> (11) ****-4321)
-- Mantém DDD e últimos 4 dígitos visíveis
CREATE OR REPLACE FUNCTION public.mask_phone(phone TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN phone IS NULL OR phone = '' THEN NULL
    WHEN LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '')) >= 10 THEN
      -- Extrai DDD e últimos 4 dígitos
      '(' || SUBSTRING(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 1, 2) || ') ' ||
      '****-' || 
      RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', ''), 4)
    ELSE
      -- Formato não reconhecido: mascara tudo menos últimos 4 caracteres
      REPEAT('*', GREATEST(0, LENGTH(phone) - 4)) || RIGHT(phone, 4)
  END
$$;

COMMENT ON FUNCTION public.mask_phone(TEXT) IS 
'Mascara telefone mantendo DDD e últimos 4 dígitos. Formato: (11) ****-4321';

-- ============================================================
-- VIEWS COM MASCARAMENTO AUTOMÁTICO
-- ============================================================

-- View de students com mascaramento condicional baseado na role do usuário
CREATE OR REPLACE VIEW public.students_masked AS
SELECT 
    s.id,
    s.name,
    -- CPF: mascarado se não for admin
    CASE 
        WHEN public.is_admin() THEN s.cpf
        ELSE public.mask_cpf(s.cpf)
    END AS cpf,
    -- Phone: mascarado se não for admin
    CASE 
        WHEN public.is_admin() THEN s.phone
        ELSE public.mask_phone(s.phone)
    END AS phone,
    s.email,
    s.origin,
    s.status,
    s.birth_date,
    s.city,
    s.state,
    s.hourly_rate,
    s.classes_per_week,
    s.pay_day,
    s.teacher_id,
    s.created_at,
    s.updated_at
FROM public.students s;

COMMENT ON VIEW public.students_masked IS 
'View que mascara CPF e telefone de estudantes para não-admins, conforme LGPD';

-- View de teachers com mascaramento condicional baseado na role do usuário
CREATE OR REPLACE VIEW public.teachers_masked AS
SELECT 
    t.id,
    t.name,
    t.email,
    -- CPF: mascarado se não for admin
    CASE 
        WHEN public.is_admin() THEN t.cpf
        ELSE public.mask_cpf(t.cpf)
    END AS cpf,
    -- Phone: mascarado se não for admin
    CASE 
        WHEN public.is_admin() THEN t.phone
        ELSE public.mask_phone(t.phone)
    END AS phone,
    t.specialization,
    t.status,
    t.created_at,
    t.updated_at
FROM public.teachers t;

COMMENT ON VIEW public.teachers_masked IS 
'View que mascara CPF e telefone de professores para não-admins, conforme LGPD';

-- ============================================================
-- RLS POLICIES PARA AS VIEWS
-- ============================================================

-- Habilitar RLS nas views não é necessário pois elas herdam
-- o contexto de segurança das tabelas base

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- Conceder permissões de SELECT nas views para authenticated users
GRANT SELECT ON public.students_masked TO authenticated;
GRANT SELECT ON public.teachers_masked TO authenticated;

-- ============================================================
-- TESTES DE VALIDAÇÃO
-- ============================================================

-- Função helper para testar mascaramento (apenas para validação)
CREATE OR REPLACE FUNCTION public.test_lgpd_masking()
RETURNS TABLE(
    test_name TEXT,
    input TEXT,
    expected TEXT,
    actual TEXT,
    passed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Teste 1: CPF formatado
    RETURN QUERY
    SELECT 
        'CPF formatado'::TEXT,
        '123.456.789-01'::TEXT,
        '***.456.***-01'::TEXT,
        public.mask_cpf('123.456.789-01'),
        public.mask_cpf('123.456.789-01') = '***.456.***-01';

    -- Teste 2: CPF sem formatação
    RETURN QUERY
    SELECT 
        'CPF sem formatação'::TEXT,
        '12345678901'::TEXT,
        '***.456.***-01'::TEXT,
        public.mask_cpf('12345678901'),
        public.mask_cpf('12345678901') = '***.456.***-01';

    -- Teste 3: Telefone com DDD
    RETURN QUERY
    SELECT 
        'Telefone com DDD'::TEXT,
        '(11) 98765-4321'::TEXT,
        '(11) ****-4321'::TEXT,
        public.mask_phone('(11) 98765-4321'),
        public.mask_phone('(11) 98765-4321') = '(11) ****-4321';

    -- Teste 4: Telefone sem formatação
    RETURN QUERY
    SELECT 
        'Telefone sem formatação'::TEXT,
        '11987654321'::TEXT,
        '(11) ****-4321'::TEXT,
        public.mask_phone('11987654321'),
        public.mask_phone('11987654321') = '(11) ****-4321';

    -- Teste 5: CPF NULL
    RETURN QUERY
    SELECT 
        'CPF NULL'::TEXT,
        NULL::TEXT,
        NULL::TEXT,
        public.mask_cpf(NULL),
        public.mask_cpf(NULL) IS NULL;

    -- Teste 6: Telefone NULL
    RETURN QUERY
    SELECT 
        'Telefone NULL'::TEXT,
        NULL::TEXT,
        NULL::TEXT,
        public.mask_phone(NULL),
        public.mask_phone(NULL) IS NULL;
END;
$$;

COMMENT ON FUNCTION public.test_lgpd_masking() IS 
'Função de teste para validar o mascaramento de CPF e telefone. Execute: SELECT * FROM public.test_lgpd_masking();';

-- ============================================================
-- INSTRUÇÕES DE USO
-- ============================================================

-- Para usar as views mascaradas no frontend:
-- 
-- 1. Substitua queries diretas às tabelas pelas views:
--    ❌ SELECT * FROM students WHERE ...
--    ✅ SELECT * FROM students_masked WHERE ...
--
-- 2. Admins verão dados completos, outros usuários verão mascarados
--
-- 3. Para INSERT/UPDATE/DELETE, continue usando as tabelas originais
--    (as views são READ-ONLY)
--
-- 4. Execute os testes: SELECT * FROM public.test_lgpd_masking();
--
-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
