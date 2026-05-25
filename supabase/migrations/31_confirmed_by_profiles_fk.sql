-- ARQ-005: Add FK from financial_records.confirmed_by_user_id → profiles.user_id
-- Existing FK financial_records_confirmed_by_user_id_fkey points to auth.users (inaccessible via PostgREST).
-- New FK targets profiles.user_id (unique index profiles_user_id_key exists) to enable
-- JOIN alias: confirmed_by:profiles!financial_records_confirmed_by_profiles_fkey(full_name)
ALTER TABLE public.financial_records
  ADD CONSTRAINT financial_records_confirmed_by_profiles_fkey
  FOREIGN KEY (confirmed_by_user_id) REFERENCES public.profiles(user_id)
  ON DELETE SET NULL;
