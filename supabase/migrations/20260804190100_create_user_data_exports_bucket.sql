-- Provision the private storage bucket used by the export-user-data edge function.
--
-- WHY: export-user-data (active — invoked from src/hooks/useDataExport.ts on the
-- account data-export surface) uploads to bucket 'user-data-exports', which does
-- not exist in production, so every data export fails at the upload step.
-- The original definition (20260110000000_create_user_data_exports_bucket.sql)
-- never applied. This forward migration provisions only what the function
-- actually uses: the bucket and its storage.objects policies. (The original's
-- data_export_requests table and cleanup function are NOT provisioned — no code
-- references them.)
--
-- Idempotent: ON CONFLICT upsert + DROP POLICY IF EXISTS.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-data-exports',
  'user-data-exports',
  false, -- private bucket; access via signed URLs only
  52428800, -- 50MB
  ARRAY['application/json', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Users can read only their own exports (path convention: <user_id>/<file>)
DROP POLICY IF EXISTS "Users can read own exports" ON storage.objects;
CREATE POLICY "Users can read own exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-data-exports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- The edge function writes with the service role (bypasses RLS); the user-path
-- clause additionally lets a user upload only into their own folder.
DROP POLICY IF EXISTS "Service role can upload exports" ON storage.objects;
CREATE POLICY "Service role can upload exports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-data-exports'
  AND (
    auth.jwt()->>'role' = 'service_role'
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Service role can update exports" ON storage.objects;
CREATE POLICY "Service role can update exports"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-data-exports'
  AND (
    auth.jwt()->>'role' = 'service_role'
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'user-data-exports'
  AND (
    auth.jwt()->>'role' = 'service_role'
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Service role can delete exports" ON storage.objects;
CREATE POLICY "Service role can delete exports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-data-exports'
  AND (
    auth.jwt()->>'role' = 'service_role'
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);
