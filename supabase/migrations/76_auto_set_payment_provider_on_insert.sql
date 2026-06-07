-- Auto-set payment_provider = 'abacate_pay' on financial_records INSERT
-- when the record's student has a teacher with AbacatePay configured.
-- Handles all creation paths: standalone record, class log + financial, package.
CREATE OR REPLACE FUNCTION public.set_payment_provider_from_teacher()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_teacher_id UUID;
    v_api_key TEXT;
BEGIN
    IF NEW.payment_provider IS NOT NULL THEN
        RETURN NEW;
    END IF;

    SELECT s.teacher_id INTO v_teacher_id
    FROM public.students s
    WHERE s.id = NEW.student_id;

    IF v_teacher_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT t.abacate_pay_api_key INTO v_api_key
    FROM public.teachers t
    WHERE t.id = v_teacher_id;

    IF v_api_key IS NOT NULL AND v_api_key <> '' THEN
        NEW.payment_provider := 'abacate_pay';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_financial_records_set_payment_provider
    BEFORE INSERT ON public.financial_records
    FOR EACH ROW
    EXECUTE FUNCTION public.set_payment_provider_from_teacher();
