-- =====================================================
-- AJUSTE: Constraint de attendance em aulas futuras
-- Data: 14/02/2026
-- =====================================================

BEGIN;

-- =====================================================
-- PARTE 1: Ver o constraint atual
-- =====================================================

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'class_logs'::regclass
  AND conname LIKE '%attendance%';

-- =====================================================
-- PARTE 2: Remover o constraint restritivo
-- =====================================================

-- Este constraint impede marcar presença em aulas futuras
-- Mas para pacotes mensais, é comum criar aulas futuras já com attendance=true
ALTER TABLE class_logs
DROP CONSTRAINT IF EXISTS chk_class_logs_no_future_attendance;

-- =====================================================
-- PARTE 3: Adicionar constraint mais flexível (OPCIONAL)
-- =====================================================

-- Se quiser manter alguma validação, pode adicionar um constraint
-- que permite attendance=true em aulas futuras, mas não permite
-- attendance=false em aulas futuras (não faz sentido marcar ausência antes da aula)

-- DESCOMENTE se quiser essa validação:
/*
ALTER TABLE class_logs
ADD CONSTRAINT chk_class_logs_attendance_logic CHECK (
    -- Se a aula é futura E attendance é false, não permite
    NOT (class_date > CURRENT_DATE AND attendance = false)
    -- Permite: aula futura com attendance=true ou null
    -- Permite: aula passada com qualquer valor de attendance
);
*/

COMMIT;

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

-- Verificar constraints restantes
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'class_logs'::regclass
  AND contype = 'c'  -- CHECK constraints
ORDER BY conname;

-- Testar inserção de aula futura com attendance=true
-- (isso deve funcionar agora)
SELECT 'Constraint removido com sucesso!' as status;
