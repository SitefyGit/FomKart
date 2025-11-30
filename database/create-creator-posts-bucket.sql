-- Creator post media storage bucket setup
-- Run this in Supabase SQL Editor (or via the CLI) after provisioning the core schema.

-- 1. Create a dedicated bucket for creator posts if it does not yet exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-posts', 'creator-posts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies so creators can manage their own uploads while keeping media public.
-- Allow anyone (even anon) to read public creator post assets.
DROP POLICY IF EXISTS "Public read for creator-posts" ON storage.objects;
CREATE POLICY "Public read for creator-posts" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'creator-posts');

-- Allow authenticated users to upload new objects into this bucket.
DROP POLICY IF EXISTS "Authenticated insert for creator-posts" ON storage.objects;
CREATE POLICY "Authenticated insert for creator-posts" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'creator-posts'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update or delete only the files they own.
DROP POLICY IF EXISTS "Owner update for creator-posts" ON storage.objects;
CREATE POLICY "Owner update for creator-posts" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'creator-posts'
    AND auth.uid() = owner
  )
  WITH CHECK (
    bucket_id = 'creator-posts'
    AND auth.uid() = owner
  );

DROP POLICY IF EXISTS "Owner delete for creator-posts" ON storage.objects;
CREATE POLICY "Owner delete for creator-posts" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'creator-posts'
    AND auth.uid() = owner
  );
