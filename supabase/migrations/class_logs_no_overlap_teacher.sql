-- ============================================================
-- Constraint: impedir sobreposição de aulas por professor
-- ============================================================
-- Garante que o mesmo professor não tenha duas aulas com horários
-- sobrepostos na mesma data. Só se aplica a registros com start_at
-- e end_at preenchidos.
-- ============================================================

-- Habilitar extensão btree_gist (necessária para EXCLUDE com UUID)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Remover constraint anterior se existir (para reaplicar migração)
ALTER TABLE public.class_logs
  DROP CONSTRAINT IF EXISTS class_logs_no_overlap_teacher;

-- Limpar dados existentes que violariam a constraint:
-- Para cada par de aulas sobrepostas (mesmo professor, intervalos &&),
-- remove uma de cada par (mantém a com id menor), até não haver mais conflitos.
-- Remove cobranças vinculadas à aula excluída antes.
DO $$
DECLARE
  r RECORD;
  any_deleted BOOLEAN := TRUE;
BEGIN
  WHILE any_deleted LOOP
    any_deleted := FALSE;
    FOR r IN (
      SELECT a.id AS keep_id, b.id AS delete_id
      FROM public.class_logs a
      JOIN public.class_logs b ON a.teacher_id = b.teacher_id
        AND a.teacher_id IS NOT NULL
        AND a.start_at IS NOT NULL AND a.end_at IS NOT NULL
        AND b.start_at IS NOT NULL AND b.end_at IS NOT NULL
        AND a.id < b.id
        AND tstzrange(a.start_at, a.end_at) && tstzrange(b.start_at, b.end_at)
      LIMIT 1
    ) LOOP
      DELETE FROM public.financial_records WHERE class_log_id = r.delete_id;
      DELETE FROM public.class_logs WHERE id = r.delete_id;
      any_deleted := TRUE;
    END LOOP;
  END LOOP;
END $$;

-- Constraint EXCLUDE: impede intervalos sobrepostos por teacher_id
-- Só considera registros com start_at e end_at preenchidos
ALTER TABLE public.class_logs
  ADD CONSTRAINT class_logs_no_overlap_teacher
  EXCLUDE USING gist (
    teacher_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  )
  WHERE (
    teacher_id IS NOT NULL
    AND start_at IS NOT NULL
    AND end_at IS NOT NULL
  );

COMMENT ON CONSTRAINT class_logs_no_overlap_teacher ON public.class_logs IS
'Não permite que o mesmo professor tenha aulas com horários sobrepostos na mesma data.';
