-- =====================================================
-- MIGRAÇÃO: Adicionar coluna action_type ao audit_logs
-- Data: 14/02/2026
-- =====================================================

BEGIN;

-- =====================================================
-- PARTE 1: Verificar estrutura atual
-- =====================================================

-- Ver colunas atuais da tabela audit_logs
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'audit_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PARTE 2: Adicionar coluna action_type
-- =====================================================

-- Adicionar coluna action_type (permitindo NULL temporariamente)
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS action_type TEXT;

-- =====================================================
-- PARTE 3: Migrar dados existentes
-- =====================================================

-- Mapear valores antigos de 'action' para 'action_type'
-- Regras:
-- - Se action contém 'create' ou 'insert' -> 'INSERT'
-- - Se action contém 'update' ou 'edit' ou 'mark' -> 'UPDATE'
-- - Se action contém 'delete' ou 'remove' -> 'DELETE'
-- - Caso contrário -> 'UPDATE' (padrão seguro)

UPDATE audit_logs
SET action_type = CASE
    WHEN action ILIKE '%create%' OR action ILIKE '%insert%' THEN 'INSERT'
    WHEN action ILIKE '%delete%' OR action ILIKE '%remove%' THEN 'DELETE'
    WHEN action ILIKE '%update%' OR action ILIKE '%edit%' OR action ILIKE '%mark%' THEN 'UPDATE'
    ELSE 'UPDATE'
END
WHERE action_type IS NULL;

-- =====================================================
-- PARTE 4: Tornar action_type obrigatório
-- =====================================================

-- Tornar action_type NOT NULL
ALTER TABLE audit_logs 
ALTER COLUMN action_type SET NOT NULL;

-- Adicionar CHECK constraint
ALTER TABLE audit_logs
DROP CONSTRAINT IF EXISTS audit_logs_action_type_check;

ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_action_type_check 
CHECK (action_type = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text]));

-- =====================================================
-- PARTE 5: Criar índice para performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type 
ON audit_logs(action_type);

COMMIT;

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

-- Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'audit_logs' 
  AND table_schema = 'public'
  AND column_name IN ('action', 'action_type')
ORDER BY ordinal_position;

-- Verificar distribuição de valores
SELECT 
    action_type,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM audit_logs
GROUP BY action_type
ORDER BY count DESC;

-- Verificar constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'audit_logs'::regclass
  AND conname LIKE '%action_type%';
