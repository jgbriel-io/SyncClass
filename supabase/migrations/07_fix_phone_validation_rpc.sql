-- Migration: Fix phone validation RPC to normalize before comparing
-- A função check_phone_exists_platform precisa normalizar telefones antes de comparar
-- para detectar duplicados mesmo quando há máscaras diferentes

-- Atualizar função de CPF para normalizar antes de comparar
CREATE OR REPLACE FUNCTION check_cpf_exists_platform(p_cpf_digits TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_exists BOOLEAN;
  v_normalized_input TEXT;
BEGIN
  -- Normalizar o input (remover tudo exceto dígitos)
  v_normalized_input := regexp_replace(p_cpf_digits, '[^0-9]', '', 'g');
  
  -- Se vazio após normalização, retornar false
  IF v_normalized_input IS NULL OR v_normalized_input = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Buscar comparando CPFs normalizados
  SELECT EXISTS (
    SELECT 1 FROM students 
    WHERE cpf IS NOT NULL 
      AND cpf != ''
      AND regexp_replace(cpf, '[^0-9]', '', 'g') = v_normalized_input
    UNION ALL
    SELECT 1 FROM teachers 
    WHERE cpf IS NOT NULL 
      AND cpf != ''
      AND regexp_replace(cpf, '[^0-9]', '', 'g') = v_normalized_input
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$;

COMMENT ON FUNCTION check_cpf_exists_platform IS 
'Verifica se CPF já existe em students ou teachers (platform-wide). Normaliza CPFs antes de comparar para detectar duplicados independente de máscaras.';

-- Atualizar função de telefone para normalizar antes de comparar
CREATE OR REPLACE FUNCTION check_phone_exists_platform(p_phone_digits TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_exists BOOLEAN;
  v_normalized_input TEXT;
BEGIN
  -- Normalizar o input (remover tudo exceto dígitos)
  v_normalized_input := regexp_replace(p_phone_digits, '[^0-9]', '', 'g');
  
  -- Se vazio após normalização, retornar false
  IF v_normalized_input IS NULL OR v_normalized_input = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Buscar comparando telefones normalizados
  SELECT EXISTS (
    SELECT 1 FROM students 
    WHERE phone IS NOT NULL 
      AND phone != ''
      AND regexp_replace(phone, '[^0-9]', '', 'g') = v_normalized_input
    UNION ALL
    SELECT 1 FROM teachers 
    WHERE phone IS NOT NULL 
      AND phone != ''
      AND regexp_replace(phone, '[^0-9]', '', 'g') = v_normalized_input
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$;

COMMENT ON FUNCTION check_phone_exists_platform IS 
'Verifica se telefone já existe em students ou teachers (platform-wide). Normaliza telefones antes de comparar para detectar duplicados independente de máscaras.';
