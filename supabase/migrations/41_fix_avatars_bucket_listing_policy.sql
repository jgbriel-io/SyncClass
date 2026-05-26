-- Migration 41: Remove broad SELECT policy on avatars bucket
-- "Public can read avatars" already restricts to own files via name LIKE auth.uid() || '/%'
-- The broad "Authenticated users can read avatars" policy allowed listing all files in the bucket.
DROP POLICY IF EXISTS "Authenticated users can read avatars" ON storage.objects;
