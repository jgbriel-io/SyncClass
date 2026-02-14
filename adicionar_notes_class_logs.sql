-- =====================================================
-- MIGRAÇÃO: Adicionar coluna notes ao class_logs
-- Data: 14/02/2026
-- =====================================================

BEGIN;

-- =====================================================
-- PARTE 1: Verificar estrutura atual
-- =====================================================

-- Ver colunas atuais da tabela class_logs
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'class_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PARTE 2: Adicionar coluna notes
-- =====================================================

-- Adicionar coluna notes (TEXT, nullable)
ALTER TABLE class_logs 
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN class_logs.notes IS 'Observações ou notas sobre a aula';

COMMIT;

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

-- Verificar que a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'class_logs' 
  AND table_schema = 'public'
  AND column_name = 'notes';

-- Contar registros existentes
SELECT 
    COUNT(*) as total_records,
    COUNT(notes) as records_with_notes,
    COUNT(*) - COUNT(notes) as records_without_notes
FROM class_logs;
