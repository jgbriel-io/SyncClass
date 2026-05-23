-- Migration 26: Sprint-18 critical fixes
-- BACK-001: UNIQUE constraint on profiles.email (prevents race condition in invite-user)

DO $$
BEGIN
  -- Check for duplicates before adding constraint
  IF EXISTS (
    SELECT email, COUNT(*) FROM profiles
    WHERE email IS NOT NULL
    GROUP BY email HAVING COUNT(*) > 1
  ) THEN
    RAISE WARNING 'Duplicate emails found in profiles — skipping UNIQUE constraint';
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'profiles_email_unique'
    ) THEN
      ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
      RAISE NOTICE '✅ UNIQUE constraint added to profiles.email';
    ELSE
      RAISE NOTICE 'profiles_email_unique already exists — skipped';
    END IF;
  END IF;
END $$;
