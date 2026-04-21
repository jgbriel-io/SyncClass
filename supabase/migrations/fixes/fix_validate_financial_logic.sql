-- ═══════════════════════════════════════════════════════════════
-- FIX: validate_financial_logic() - Adicionar ELSE no CASE
-- ═══════════════════════════════════════════════════════════════
-- Problema: CASE sem ELSE causa erro "case not found" para status 'pendente'
-- Solução: Adicionar WHEN 'pendente' e ELSE para cobrir todos os casos
-- ═══════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trigger_validate_financial_logic ON financial_records;
DROP FUNCTION IF EXISTS validate_financial_logic();

CREATE OR REPLACE FUNCTION validate_financial_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Validação geral: valor deve ser positivo
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Valor deve ser positivo. Valor informado: R$ %', NEW.amount;
    END IF;
    
    -- Validações específicas por status
    CASE NEW.status
        WHEN 'pago' THEN
            -- Pagamento deve ser positivo
            IF NEW.amount <= 0 THEN
                RAISE EXCEPTION 'Pagamento deve ter valor positivo. Valor informado: R$ %', NEW.amount;
            END IF;
            
            -- Valor máximo por pagamento: R$ 10.000
            IF NEW.amount > 10000 THEN
                RAISE EXCEPTION 'Valor de pagamento não pode exceder R$ 10.000. Valor: R$ %', NEW.amount;
            END IF;
            
            -- Pagamentos devem ter data de pagamento
            IF NEW.paid_at IS NULL THEN
                NEW.paid_at := NOW();
            END IF;
            
            -- Pagamentos devem ter descrição
            IF NEW.description IS NULL OR TRIM(NEW.description) = '' THEN
                RAISE EXCEPTION 'Pagamento deve ter descrição';
            END IF;
            
        WHEN 'extornado' THEN
            -- Extornos devem ter valor positivo
            IF NEW.amount <= 0 THEN
                RAISE EXCEPTION 'Extorno deve ter valor positivo. Valor informado: R$ %', NEW.amount;
            END IF;
            
            -- Extorno limitado a R$ 1000
            IF NEW.amount > 1000 THEN
                RAISE EXCEPTION 'Extorno não pode exceder R$ 1.000. Valor: R$ %', NEW.amount;
            END IF;
            
            -- Extornos devem ter descrição
            IF NEW.description IS NULL OR TRIM(NEW.description) = '' THEN
                RAISE EXCEPTION 'Extorno deve ter descrição/motivo';
            END IF;
            
        WHEN 'abonado' THEN
            -- Abonos devem ter justificativa
            IF NEW.description IS NULL OR TRIM(NEW.description) = '' THEN
                RAISE EXCEPTION 'Abono deve ter descrição/justificativa';
            END IF;
            
        WHEN 'cancelado' THEN
            -- Cancelamentos devem ter motivo
            IF NEW.description IS NULL OR TRIM(NEW.description) = '' THEN
                RAISE EXCEPTION 'Cancelamento deve ter descrição/motivo';
            END IF;
            
        WHEN 'pendente' THEN
            -- Pendentes: apenas validação básica de valor positivo (já feita acima)
            NULL;
            
        ELSE
            -- Status desconhecido: permitir mas registrar
            RAISE NOTICE 'Status desconhecido: %. Validação básica aplicada.', NEW.status;
    END CASE;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION validate_financial_logic IS 
'Valida lógica de negócio para transações financeiras baseada no status - CORRIGIDO com ELSE';

CREATE TRIGGER trigger_validate_financial_logic
    BEFORE INSERT OR UPDATE ON financial_records
    FOR EACH ROW
    EXECUTE FUNCTION validate_financial_logic();

COMMENT ON TRIGGER trigger_validate_financial_logic ON financial_records IS 
'Valida lógica de negócio para transações financeiras - previne bypass de pagamento';

SELECT '✅ Função validate_financial_logic() corrigida com sucesso' as status;
