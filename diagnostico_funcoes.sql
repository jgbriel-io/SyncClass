-- =====================================================
-- DIAGNÓSTICO: Descobrir todas as versões das funções
-- =====================================================

-- Listar TODAS as versões de mark_as_paid_idempotent
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.oid::regprocedure as full_signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'mark_as_paid_idempotent'
  AND n.nspname = 'public'
ORDER BY p.oid;

-- Listar TODAS as versões de create_class_package
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.oid::regprocedure as full_signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_class_package'
  AND n.nspname = 'public'
ORDER BY p.oid;

-- Listar TODAS as versões de update_payment_day
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.oid::regprocedure as full_signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'update_payment_day'
  AND n.nspname = 'public'
ORDER BY p.oid;
