-- Follow-up to 20260802130000 (trip-media MIME allowlist).
--
-- The file-upload edge function now stores trip documents in the existing private trip-media bucket
-- (the trip-files bucket it previously targeted does not exist, so every upload failed). Its
-- accepted set — ALLOWED_FILE_TYPES in _shared/validation.ts — includes three types the initial
-- allowlist did not cover: text/csv, audio/mpeg and audio/wav. Without them those uploads would be
-- rejected at the storage layer.
--
-- Still deliberately excluded: text/html and image/svg+xml, the stored-XSS vectors that motivated
-- the allowlist in the first place.
--
-- Scope: upload-time MIME validation on a single bucket. No RLS policy, trip fetch, auth, or
-- payment surface is touched. Idempotent: recomputes the full array rather than appending.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
      'video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg', 'video/x-m4v', 'video/3gpp',
      'audio/mpeg', 'audio/wav',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
WHERE id = 'trip-media';
