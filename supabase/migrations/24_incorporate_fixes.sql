-- ============================================================
-- Migration 24: Incorpora hotfixes aplicados fora da sequência
-- ============================================================

-- Fix 1: is_admin() com SECURITY DEFINER para evitar recursão
-- Problema: is_admin() consultava profiles/user_roles que tinham
-- RLS policies chamando is_admin() novamente → stack overflow
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Fix 2: Garantir integridade de vínculos profiles ↔ teachers/students
-- Caso profiles tenham sido criados antes do vínculo ser estabelecido
UPDATE public.profiles p
SET teacher_id = t.id
FROM public.teachers t
WHERE t.email = p.email
  AND p.role = 'teacher'
  AND p.teacher_id IS NULL;

UPDATE public.profiles p
SET student_id = s.id
FROM public.students s
WHERE s.email = p.email
  AND p.role = 'student'
  AND p.student_id IS NULL;

-- Fix 3: validate_financial_logic() sem ELSE no CASE causava erro
-- "case not found" para status 'pendente'
DROP TRIGGER IF EXISTS trigger_validate_financial_logic ON financial_records;
DROP FUNCTION IF EXISTS validate_financial_logic();

CREATE OR REPLACE FUNCTION validate_financial_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Valor deve ser positivo. Valor informado: R$ %', NEW.amount;
    END IF;

    CASE NEW.status
        WHEN 'pago' THEN
            IF NEW.amount <= 0 THEN
                RAISE EXCEPTION 'Pagamento deve ter valor positivo. Valor informado: R$ %', NEW.amount;
            END IF;
            IF NEW.amount > 10000 THEN
                RAISE EXCEPTION 'Valor de pagamento não pode exceder R$ 10.000. Valor: R$ %', NEW.amount;
            END IF;
            IF NEW.paid_at IS NULL THEN
                NEW.paid_at := NOW();
            END IF;
            IF NEW.description IS NULL OR TRIM(NEW.description) = '' THEN
                RAISE EXCEPTION 'Pagamento deve ter descrição';
            END IF;

        WHEN 'extornado' THEN
            IF NEW.amount <= 0 THEN
                RAISE EXCEPTION 'Extorno deve ter valor positivo. Valor informado: R$ %', NEW.amount;
            END IF;
            IF NEW.amount > 1000 THEN
                RAISE EXCEPTION 'Extorno não pode exceder R$ 1.000. Valor: R$ %', NEW.amount;
            END IF;
            IF NEW.description IS NULL OR TRIM(NEW.description) = '' THEN
                RAISE EXCEPTION 'Extorno deve ter descrição/motivo';
            END IF;

        WHEN 'abonado' THEN
            IF NEW.description IS NULL OR TRIM(NEW.description) = '' THEN
                RAISE EXCEPTION 'Abono deve ter descrição/justificativa';
            END IF;

        WHEN 'cancelado' THEN
            IF NEW.description IS NULL OR TRIM(NEW.description) = '' THEN
                RAISE EXCEPTION 'Cancelamento deve ter descrição/motivo';
            END IF;

        WHEN 'pendente' THEN
            NULL;

        ELSE
            RAISE NOTICE 'Status desconhecido: %. Validação básica aplicada.', NEW.status;
    END CASE;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_validate_financial_logic
    BEFORE INSERT OR UPDATE ON financial_records
    FOR EACH ROW
    EXECUTE FUNCTION validate_financial_logic();
