-- Security / privacy hardening pass (2026-07-17)
--
-- Closes live gaps found in the security audit:
-- 1) Privileged SECURITY DEFINER RPCs still executable by anon/authenticated
-- 2) hybrid_search_trip_context missing membership gate (regression)
-- 3) ensure_trip_membership allowing arbitrary p_user_id
-- 4) Former-member read on private storage + realtime chat topics + invites
-- 5) payment_splits SELECT still over-broad (repo migration never applied)
-- 6) is_trip_co_member ignoring membership status (profiles_public PII)
--
-- Invariants preserved:
-- - Trip existence != access: membership gates use is_active_trip_member / status=active
-- - Auth required for hybrid_search + ensure_trip_membership (auth.uid())
-- - create_payment_with_splits_v2 remains executable by authenticated (no payment drift)
-- - Triggers keep working (EXECUTE not required for trigger fire)
-- - Edge/cron continue via service_role GRANT
-- - No trip SELECT / membership SELECT policies loosened

-- =====================================================================
-- 1. Revoke dangerous / internal RPC EXECUTE from anon + authenticated
-- =====================================================================
DO $$
DECLARE
  fn text;
  revoke_fns text[] := ARRAY[
    'public.create_notification(uuid, text, text, text, jsonb)',
    'public.send_notification(uuid[], uuid, text, text, text, jsonb)',
    'public.create_notification_for_trip_members(uuid, uuid, text, text, uuid, text, text, text, text, text, jsonb, text)',
    'public.create_payment_with_splits(text, numeric, text, text, integer, jsonb, jsonb, uuid)',
    'public.create_event_with_conflict_check(text, text, text, text, timestamptz, timestamptz, uuid)',
    'public.claim_notification_deliveries(integer, text[], uuid[], uuid[])',
    'public.check_and_increment_smart_import_usage(uuid, text, integer)',
    'public.notify_on_basecamp_change()',
    'public.notify_on_calendar_event_added()',
    'public.notify_on_member_joined()',
    'public.notify_on_payment()',
    'public.notify_on_pin_created()',
    'public.notify_on_task_assignment()',
    'public.notify_on_task_created()'
  ];
BEGIN
  FOREACH fn IN ARRAY revoke_fns LOOP
    IF to_regprocedure(fn) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated;', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role;', fn);
    END IF;
  END LOOP;
END;
$$;

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'create_payment_with_splits_v2'
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated;', fn.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, PUBLIC;', fn.sig);
  END LOOP;
END;
$$;

-- =====================================================================
-- 2. Harden hybrid_search_trip_context (membership gate restored)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.hybrid_search_trip_context(
  p_trip_id text,
  p_query_text text,
  p_query_embedding vector,
  p_match_threshold double precision DEFAULT 0.6,
  p_match_count integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  source_type text,
  source_id uuid,
  content_text text,
  similarity double precision,
  metadata jsonb,
  rank double precision,
  search_type text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT public.is_active_trip_member(auth.uid(), p_trip_id) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this trip';
  END IF;

  RETURN QUERY
  WITH vector_results AS (
    SELECT
      te.id,
      te.source_type,
      te.source_id,
      te.content_text,
      1 - (te.embedding <=> p_query_embedding) AS similarity,
      te.metadata,
      0.7 AS weight,
      'vector'::text AS search_type
    FROM trip_embeddings te
    WHERE te.trip_id = p_trip_id
      AND te.embedding IS NOT NULL
      AND 1 - (te.embedding <=> p_query_embedding) > p_match_threshold
    ORDER BY similarity DESC
    LIMIT p_match_count
  ),
  keyword_results AS (
    SELECT
      kd.id,
      kd.source AS source_type,
      kd.source_id,
      kc.content AS content_text,
      0.0 AS similarity,
      kd.metadata,
      0.3 AS weight,
      'keyword'::text AS search_type
    FROM kb_chunks kc
    JOIN kb_documents kd ON kd.id = kc.doc_id
    WHERE kd.trip_id = p_trip_id
      AND kc.content_tsv @@ plainto_tsquery('english', p_query_text)
    ORDER BY ts_rank(kc.content_tsv, plainto_tsquery('english', p_query_text)) DESC
    LIMIT p_match_count / 2
  ),
  combined AS (
    SELECT *, vector_results.similarity * vector_results.weight AS rank
    FROM vector_results
    UNION ALL
    SELECT *, keyword_results.weight AS rank
    FROM keyword_results
  )
  SELECT
    combined.id,
    combined.source_type,
    combined.source_id,
    combined.content_text,
    combined.similarity,
    combined.metadata,
    combined.rank,
    combined.search_type
  FROM combined
  ORDER BY rank DESC, similarity DESC
  LIMIT p_match_count;
END;
$$;

REVOKE ALL ON FUNCTION public.hybrid_search_trip_context(text, text, vector, double precision, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hybrid_search_trip_context(text, text, vector, double precision, integer)
  TO authenticated, service_role;

-- =====================================================================
-- 3. Bind ensure_trip_membership to auth.uid() (demo trip IDs only)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.ensure_trip_membership(p_trip_id text, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  membership_exists boolean := false;
  is_consumer_trip boolean := false;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  is_consumer_trip := p_trip_id IN ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');

  IF NOT is_consumer_trip THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = p_trip_id AND user_id = p_user_id
  ) INTO membership_exists;

  IF NOT membership_exists THEN
    INSERT INTO trip_members (trip_id, user_id, role)
    VALUES (p_trip_id, p_user_id, 'member')
    ON CONFLICT (trip_id, user_id) DO NOTHING;
    RETURN true;
  END IF;

  RETURN membership_exists;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_trip_membership(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_trip_membership(text, uuid) TO authenticated, service_role;

-- =====================================================================
-- 4. Former-member: private storage SELECT/INSERT require active membership
-- =====================================================================
DROP POLICY IF EXISTS "Trip members can view trip media" ON storage.objects;
CREATE POLICY "Trip members can view trip media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'trip-media'
    AND public.is_active_trip_member(auth.uid(), (storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "Trip members can view chat media" ON storage.objects;
CREATE POLICY "Trip members can view chat media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND public.is_active_trip_member(auth.uid(), (storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "Trip members can view voice notes" ON storage.objects;
CREATE POLICY "Trip members can view voice notes"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'trip-voice-notes'
    AND public.is_active_trip_member(auth.uid(), (storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "Trip members can upload trip media" ON storage.objects;
CREATE POLICY "Trip members can upload trip media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'trip-media'
    AND public.is_active_trip_member(auth.uid(), (storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "Trip members can upload chat media" ON storage.objects;
CREATE POLICY "Trip members can upload chat media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media'
    AND public.is_active_trip_member(auth.uid(), (storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "Trip members can upload voice notes" ON storage.objects;
CREATE POLICY "Trip members can upload voice notes"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'trip-voice-notes'
    AND public.is_active_trip_member(auth.uid(), (storage.foldername(name))[1])
  );

-- =====================================================================
-- 5. Realtime chat topics: active membership only
-- =====================================================================
DROP POLICY IF EXISTS "Trip members can subscribe to trip_chat_messages" ON realtime.messages;
CREATE POLICY "Trip members can subscribe to trip_chat_messages"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() LIKE 'trip_chat_messages:%'
    AND public.is_active_trip_member(
      auth.uid(),
      SUBSTRING(realtime.topic() FROM (length('trip_chat_messages:') + 1))
    )
  );

DROP POLICY IF EXISTS "Trip members can read chat broadcast messages" ON realtime.messages;
CREATE POLICY "Trip members can read chat broadcast messages"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() LIKE 'chat_broadcast:%'
    AND public.is_active_trip_member(
      auth.uid(),
      split_part(realtime.topic(), ':', 2)
    )
  );

-- =====================================================================
-- 6. Invite policies: active membership
-- =====================================================================
DROP POLICY IF EXISTS "Trip members can view active invite links" ON public.invite_links;
CREATE POLICY "Trip members can view active invite links"
  ON public.invite_links
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND public.is_active_trip_member(auth.uid(), trip_id)
  );

DROP POLICY IF EXISTS "Trip members can view active invites" ON public.trip_invites;
CREATE POLICY "Trip members can view active invites"
  ON public.trip_invites
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND public.is_active_trip_member(auth.uid(), trip_id)
  );

DROP POLICY IF EXISTS "Trip members can view invites" ON public.trip_invites;
CREATE POLICY "Trip members can view invites"
  ON public.trip_invites
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND public.is_active_trip_member(auth.uid(), trip_id)
  );


-- =====================================================================
-- 6b. Ensure is_payment_debtor helper exists (may be missing in live DB)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_payment_debtor(_payment_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.payment_splits
    WHERE payment_message_id = _payment_id
      AND debtor_user_id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_payment_debtor(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_payment_debtor(uuid, uuid) TO authenticated, service_role;

-- =====================================================================
-- 7. payment_splits SELECT: need-to-know + active membership
-- =====================================================================
DROP POLICY IF EXISTS "Trip members can view payment splits" ON public.payment_splits;
CREATE POLICY "Trip members can view payment splits"
  ON public.payment_splits
  FOR SELECT
  TO authenticated
  USING (
    debtor_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.trip_payment_messages tpm
      JOIN public.trips t ON t.id = tpm.trip_id
      JOIN public.trip_members tm
        ON tm.trip_id = tpm.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.status IS NULL OR tm.status = 'active')
      WHERE tpm.id = public.payment_splits.payment_message_id
        AND (
          COALESCE(t.trip_type, 'consumer') = 'consumer'
          OR (
            COALESCE(t.trip_type, 'consumer') IN ('pro', 'event') AND (
              tpm.created_by = auth.uid()
              OR public.is_payment_debtor(tpm.id, auth.uid())
              OR EXISTS (
                SELECT 1 FROM public.trip_admins ta
                WHERE ta.trip_id = t.id AND ta.user_id = auth.uid()
              )
              OR EXISTS (
                SELECT 1 FROM public.user_trip_roles utr
                JOIN public.trip_roles tr ON utr.role_id = tr.id
                WHERE utr.user_id = auth.uid()
                  AND utr.trip_id = tpm.trip_id
                  AND (tr.feature_permissions -> 'payments' ->> 'can_view')::boolean = true
              )
            )
          )
        )
    )
  );

-- =====================================================================
-- 8. is_trip_co_member: require active membership on both sides
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_trip_co_member(viewer_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM trip_members tm1
    JOIN trip_members tm2 ON tm1.trip_id = tm2.trip_id
    WHERE tm1.user_id = viewer_id
      AND tm2.user_id = target_user_id
      AND (tm1.status IS NULL OR tm1.status = 'active')
      AND (tm2.status IS NULL OR tm2.status = 'active')
  )
  OR EXISTS (
    SELECT 1
    FROM trips t
    JOIN trip_members tm ON tm.trip_id = t.id
    WHERE t.created_by = viewer_id
      AND tm.user_id = target_user_id
      AND (tm.status IS NULL OR tm.status = 'active')
  )
  OR EXISTS (
    SELECT 1
    FROM trips t
    JOIN trip_members tm ON tm.trip_id = t.id
    WHERE t.created_by = target_user_id
      AND tm.user_id = viewer_id
      AND (tm.status IS NULL OR tm.status = 'active')
  );
$$;
