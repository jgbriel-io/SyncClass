-- Migration: Add partial UNIQUE constraints for CPF and phone
-- CPF e telefone são OPCIONAIS para todos os alunos
-- Esta constraint permite NULL mas previne duplicados quando preenchidos

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS students_cpf_unique_when_not_null;
DROP INDEX IF EXISTS students_phone_unique_when_not_null;

-- Create partial UNIQUE index for CPF (only when NOT NULL)
-- Allows multiple NULL CPFs but prevents duplicate non-NULL CPFs
CREATE UNIQUE INDEX students_cpf_unique_when_not_null 
ON students (cpf) 
WHERE cpf IS NOT NULL AND cpf != '';

-- Create partial UNIQUE index for phone (only when NOT NULL)
-- Allows multiple NULL phones but prevents duplicate non-NULL phones
CREATE UNIQUE INDEX students_phone_unique_when_not_null 
ON students (phone) 
WHERE phone IS NOT NULL AND phone != '';

COMMENT ON INDEX students_cpf_unique_when_not_null IS 
'Ensures CPF uniqueness when provided (optional field)';

COMMENT ON INDEX students_phone_unique_when_not_null IS 
'Ensures phone uniqueness when provided (optional field)';
