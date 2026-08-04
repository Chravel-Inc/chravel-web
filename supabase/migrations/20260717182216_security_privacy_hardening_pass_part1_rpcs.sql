-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260717182216, name 'security_privacy_hardening_pass_part1_rpcs').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

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
    WHERE n.nspname = 'public' AND p.proname = 'create_payment_with_splits_v2'
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated;', fn.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, PUBLIC;', fn.sig);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.hybrid_search_trip_context(
  p_trip_id text,
  p_query_text text,
  p_query_embedding vector,
  p_match_threshold double precision DEFAULT 0.6,
  p_match_count integer DEFAULT 10
)
RETURNS TABLE (
  id uuid, source_type text, source_id uuid, content_text text,
  similarity double precision, metadata jsonb, rank double precision, search_type text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF NOT public.is_active_trip_member(auth.uid(), p_trip_id) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this trip';
  END IF;
  RETURN QUERY
  WITH vector_results AS (
    SELECT te.id, te.source_type, te.source_id, te.content_text,
      1 - (te.embedding <=> p_query_embedding) AS similarity, te.metadata,
      0.7 AS weight, 'vector'::text AS search_type
    FROM trip_embeddings te
    WHERE te.trip_id = p_trip_id AND te.embedding IS NOT NULL
      AND 1 - (te.embedding <=> p_query_embedding) > p_match_threshold
    ORDER BY similarity DESC LIMIT p_match_count
  ),
  keyword_results AS (
    SELECT kd.id, kd.source AS source_type, kd.source_id, kc.content AS content_text,
      0.0 AS similarity, kd.metadata, 0.3 AS weight, 'keyword'::text AS search_type
    FROM kb_chunks kc JOIN kb_documents kd ON kd.id = kc.doc_id
    WHERE kd.trip_id = p_trip_id
      AND kc.content_tsv @@ plainto_tsquery('english', p_query_text)
    ORDER BY ts_rank(kc.content_tsv, plainto_tsquery('english', p_query_text)) DESC
    LIMIT p_match_count / 2
  ),
  combined AS (
    SELECT *, vector_results.similarity * vector_results.weight AS rank FROM vector_results
    UNION ALL
    SELECT *, keyword_results.weight AS rank FROM keyword_results
  )
  SELECT combined.id, combined.source_type, combined.source_id, combined.content_text,
    combined.similarity, combined.metadata, combined.rank, combined.search_type
  FROM combined ORDER BY rank DESC, similarity DESC LIMIT p_match_count;
END;
$$;

REVOKE ALL ON FUNCTION public.hybrid_search_trip_context(text, text, vector, double precision, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hybrid_search_trip_context(text, text, vector, double precision, integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ensure_trip_membership(p_trip_id text, p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  membership_exists boolean := false;
  is_consumer_trip boolean := false;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  is_consumer_trip := p_trip_id IN ('1','2','3','4','5','6','7','8','9','10','11','12');
  IF NOT is_consumer_trip THEN RETURN false; END IF;
  SELECT EXISTS (SELECT 1 FROM trip_members WHERE trip_id = p_trip_id AND user_id = p_user_id)
    INTO membership_exists;
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
