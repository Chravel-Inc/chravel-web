-- P3 security hardening sweep (low regression risk: revokes + a permissive media allowlist).
-- All changes tighten access or validate new uploads; none affect trip loading, auth, RLS reads,
-- or payment state.

-- 1. billing_webhook_ops_dashboard is a SECURITY DEFINER view that was SELECTable by anon +
--    authenticated, bypassing the deny-all RLS on billing_webhook_processing_failures to expose
--    aggregate webhook-failure metadata. It is not read by any application code (only generated
--    types), so revoke client access entirely; service_role continues to read it.
REVOKE SELECT ON public.billing_webhook_ops_dashboard FROM anon, authenticated;

-- 2. check_invite_code_exists was intended to be revoked from anon (20260725143000 /
--    20260729234527) but the grant persisted in production — an unauthenticated invite-code
--    existence oracle. Re-assert the revoke idempotently.
REVOKE EXECUTE ON FUNCTION public.check_invite_code_exists(text) FROM anon;

-- 3. Sensitive internal tables were discoverable via the anon GraphQL key. Rows are already
--    RLS-gated, but they should not be schema-discoverable pre-auth.
REVOKE SELECT ON public.super_admins FROM anon;
REVOKE SELECT ON public.entitlement_audit_log FROM anon;
REVOKE SELECT ON public.webhook_events FROM anon;

-- 4. trip-media had no MIME allowlist, so an active member could upload text/html or
--    image/svg+xml and have it served (with that content-type) from the storage origin —
--    stored-XSS. Set an allowlist that covers every type the app legitimately uploads to this
--    bucket (photos, videos, and the PDFs/images used by event agenda & lineup files) while
--    excluding text/html and image/svg+xml. Also cap per-file size. Existing objects are
--    unaffected; only new uploads are validated.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
      'video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg', 'video/x-m4v', 'video/3gpp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ],
    file_size_limit = 524288000  -- 500 MB per file
WHERE id = 'trip-media';
