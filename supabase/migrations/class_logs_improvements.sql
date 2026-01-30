-- ============================================================
-- Class Logs Improvements - Tratamento de Faltas e Reposições
-- ============================================================
-- Esta migration melhora o controle de aulas, adicionando
-- campo 'title' (se não existir) e documentando a lógica
-- de status das aulas para tratamento de faltas e cobranças.
-- ============================================================

-- ============================================================
-- 1. ADICIONAR CAMPO TITLE (se não existir)
-- ============================================================

DO $$ 
BEGIN
    -- Verificar se a coluna 'title' já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'class_logs' 
        AND column_name = 'title'
    ) THEN
        -- Adicionar coluna 'title'
        ALTER TABLE public.class_logs 
        ADD COLUMN title TEXT;
        
        COMMENT ON COLUMN public.class_logs.title IS 
        'Título ou descrição curta da aula (ex: "Revisão de escalas maiores")';
    END IF;
END $$;

-- ============================================================
-- 2. ADICIONAR CAMPO TEACHER_ID (para rastreabilidade)
-- ============================================================

DO $$ 
BEGIN
    -- Verificar se a coluna 'teacher_id' já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'class_logs' 
        AND column_name = 'teacher_id'
    ) THEN
        -- Adicionar coluna 'teacher_id'
        ALTER TABLE public.class_logs 
        ADD COLUMN teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN public.class_logs.teacher_id IS 
        'Professor que registrou esta aula (para auditoria e filtros)';
        
        -- Criar índice para melhorar performance de queries por professor
        CREATE INDEX IF NOT EXISTS idx_class_logs_teacher 
        ON public.class_logs(teacher_id);
    END IF;
END $$;

-- ============================================================
-- 3. COMMENTS E DOCUMENTAÇÃO
-- ============================================================

COMMENT ON TABLE public.class_logs IS 
'Registro de aulas. Campo attendance controla se aluno compareceu ou faltou.';

COMMENT ON COLUMN public.class_logs.attendance IS 
'Se TRUE: Aluno compareceu (cobrar normalmente). 
Se FALSE: Aluno faltou (regra de negócio define se cobra ou não).
IMPORTANTE: A cobrança é controlada pelos financial_records vinculados.';

COMMENT ON COLUMN public.class_logs.grade IS 
'Nota da aula (0-10). Apenas para aulas com attendance=true.
Se attendance=false, grade deve ser NULL.';

COMMENT ON COLUMN public.class_logs.feedback IS 
'Feedback textual do professor sobre a aula.';

-- ============================================================
-- 4. VIEW: Aulas com Status de Cobrança
-- ============================================================
-- Esta view mostra quais aulas têm cobrança vinculada e qual o status

CREATE OR REPLACE VIEW public.class_logs_with_billing AS
SELECT 
    cl.id AS class_log_id,
    cl.student_id,
    cl.teacher_id,
    cl.class_date,
    cl.attendance,
    cl.title,
    cl.grade,
    cl.feedback,
    cl.created_at,
    -- Dados de cobrança (se houver)
    fr.id AS financial_record_id,
    fr.amount AS billed_amount,
    fr.status AS billing_status,
    fr.due_date AS billing_due_date,
    fr.paid_at AS billing_paid_at,
    -- Status consolidado
    CASE 
        WHEN fr.id IS NULL THEN 'not_billed'  -- Aula sem cobrança
        WHEN fr.status = 'pago' THEN 'paid'    -- Aula paga
        WHEN fr.status = 'pendente' AND fr.due_date >= CURRENT_DATE THEN 'pending'  -- Pendente
        WHEN fr.status = 'pendente' AND fr.due_date < CURRENT_DATE THEN 'overdue'   -- Atrasada
        ELSE 'unknown'
    END AS billing_status_consolidated,
    -- Aluno e professor (nomes)
    s.name AS student_name,
    t.name AS teacher_name
FROM 
    public.class_logs cl
LEFT JOIN 
    public.financial_records fr ON fr.class_log_id = cl.id
LEFT JOIN
    public.students s ON s.id = cl.student_id
LEFT JOIN
    public.teachers t ON t.id = cl.teacher_id
ORDER BY 
    cl.class_date DESC;

COMMENT ON VIEW public.class_logs_with_billing IS 
'View que mostra todas as aulas com informações de cobrança vinculada.
Útil para dashboards e relatórios de aulas x cobranças.';

-- ============================================================
-- 5. FUNÇÃO: Verificar se aula está cobrada
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_class_billed(p_class_log_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS(
        SELECT 1 
        FROM public.financial_records 
        WHERE class_log_id = p_class_log_id
    );
$$;

COMMENT ON FUNCTION public.is_class_billed(UUID) IS 
'Verifica se uma aula específica tem cobrança vinculada. 
Retorna TRUE se existe financial_record, FALSE caso contrário.';

-- ============================================================
-- 6. FUNÇÃO: Obter aulas sem cobrança
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_unbilled_classes(p_student_id UUID)
RETURNS TABLE (
    class_log_id UUID,
    class_date DATE,
    attendance BOOLEAN,
    title TEXT,
    teacher_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        cl.id,
        cl.class_date,
        cl.attendance,
        cl.title,
        t.name
    FROM public.class_logs cl
    LEFT JOIN public.financial_records fr ON fr.class_log_id = cl.id
    LEFT JOIN public.teachers t ON t.id = cl.teacher_id
    WHERE cl.student_id = p_student_id
    AND fr.id IS NULL  -- Sem cobrança vinculada
    AND cl.attendance = true  -- Apenas aulas com presença
    ORDER BY cl.class_date DESC;
$$;

COMMENT ON FUNCTION public.get_unbilled_classes(UUID) IS 
'Retorna aulas de um aluno que ainda não têm cobrança vinculada.
Útil para sugerir criação de cobranças.';

-- ============================================================
-- 7. REGRAS DE NEGÓCIO DOCUMENTADAS
-- ============================================================

/*
LÓGICA DE FALTAS E COBRANÇAS:

1. AULA REALIZADA (attendance=true):
   - Aluno compareceu
   - Pode ter nota (grade) e feedback
   - DEVE ser cobrada (criar financial_record)
   - Gera cobrança normal

2. AULA FALTA DO ALUNO (attendance=false):
   - Aluno não compareceu
   - grade DEVE ser NULL
   - DECISÃO: Cobra ou não?
     a) SE COBRAR: Criar financial_record (status='pendente')
     b) SE NÃO COBRAR: Não criar financial_record
   
3. AULA CANCELADA (attendance=false + sem financial_record):
   - Aula foi cancelada pelo professor
   - Aluno não é cobrado
   - Não aparece no saldo devedor

IMPLEMENTAÇÃO NO FRONTEND:

- Ao registrar aula com attendance=false, perguntar ao professor:
  "Esta falta deve ser cobrada?"
  
  - SIM: Criar financial_record vinculado
  - NÃO: Apenas criar class_log (sem financial_record)

- Na view de saldo, apenas financial_records contam
- Class_logs sem financial_record = aulas não cobradas

EXEMPLO DE QUERY:

-- Aulas realizadas e cobradas
SELECT * FROM class_logs_with_billing 
WHERE attendance = true AND billing_status = 'paid';

-- Aulas com falta (aluno não compareceu)
SELECT * FROM class_logs_with_billing 
WHERE attendance = false;

-- Aulas sem cobrança (realizadas mas não faturadas)
SELECT * FROM class_logs_with_billing 
WHERE attendance = true AND billing_status_consolidated = 'not_billed';
*/

-- ============================================================
-- 8. GRANTS - Permissões
-- ============================================================

GRANT SELECT ON public.class_logs_with_billing TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_billed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unbilled_classes(UUID) TO authenticated;

-- ============================================================
-- 9. ÍNDICES para Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_class_logs_date 
ON public.class_logs(class_date DESC);

CREATE INDEX IF NOT EXISTS idx_class_logs_attendance 
ON public.class_logs(attendance);

CREATE INDEX IF NOT EXISTS idx_financial_records_class_log 
ON public.financial_records(class_log_id);

-- ============================================================
-- INSTRUÇÕES DE USO
-- ============================================================

-- 1. Listar todas as aulas com informações de cobrança:
--    SELECT * FROM public.class_logs_with_billing LIMIT 10;
--
-- 2. Listar aulas de um aluno específico (substitua pelo UUID real):
--    -- Primeiro, obter um UUID de aluno:
--    SELECT id, name FROM public.students LIMIT 1;
--    -- Depois, usar o UUID:
--    SELECT * FROM public.class_logs_with_billing 
--    WHERE student_id = '00000000-0000-0000-0000-000000000000'::uuid;  -- Substituir pelo UUID real
--
-- 3. Verificar se aula foi cobrada (substitua pelo UUID real da aula):
--    SELECT public.is_class_billed('00000000-0000-0000-0000-000000000000'::uuid);
--
-- 4. Listar aulas sem cobrança de um aluno (substitua pelo UUID real):
--    SELECT * FROM public.get_unbilled_classes('00000000-0000-0000-0000-000000000000'::uuid);
--
-- 5. No frontend, ao registrar aula:
--    a) Se attendance=true: SEMPRE criar financial_record
--    b) Se attendance=false: PERGUNTAR ao professor se deve cobrar
--
-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
