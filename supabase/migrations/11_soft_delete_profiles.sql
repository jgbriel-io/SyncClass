-- Migration: Add soft delete support for profiles
-- Description: When a student/teacher is hard deleted, mark their profile as inactive instead of keeping orphaned records

-- Add deleted_at column to profiles for soft delete tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON COLUMN profiles.deleted_at IS 'Timestamp when profile was soft deleted (hidden from UI but preserved for audit)';
