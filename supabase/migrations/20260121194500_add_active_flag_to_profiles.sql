-- Add active flag to profiles to support soft-deactivation of users
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
