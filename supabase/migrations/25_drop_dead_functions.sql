-- Migration 25: Drop funções mortas sem uso no código
DROP FUNCTION IF EXISTS public.decrypt_sensitive_data(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.encrypt_sensitive_data(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_activity_status_info(UUID);
DROP FUNCTION IF EXISTS public.is_activity_on_time(TIMESTAMPTZ);
