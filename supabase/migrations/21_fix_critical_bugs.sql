-- ============================================
-- MIGRATION 21: Correções críticas pós-produção
-- ============================================
-- Consolida 4 fixes críticos:
-- 1. is_admin() com SECURITY DEFINER (evita recursão infinita com RLS)
-- 2. validate_financial_logic() com CASE+ELSE (evita "case not found")
-- 3. Vinculação de profiles com teachers/students por email
-- 4. Sincronização de roles entre profiles e user_roles
-- ============================================

-- ============================================
-- 1. FIX: is_admin() - SECURITY DEFINER
-- ============================================
-- Sem SECURITY DEFINER: is_admin() consulta profiles → RLS chama is_admin() → loop infinito
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

-- ============================================
-- 2. FIX: validate_financial_logic() - CASE com ELSE
-- ============================================
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
            NULL; -- apenas validação básica de valor positivo
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

-- ============================================
-- 3. FIX: Vincular profiles com teachers/students
-- ============================================
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

-- ============================================
-- 4. FIX: Sincronizar roles entre profiles e user_roles
-- ============================================
INSERT INTO public.user_roles (user_id, role, email)
SELECT p.user_id, p.role, p.email
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id
)
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
