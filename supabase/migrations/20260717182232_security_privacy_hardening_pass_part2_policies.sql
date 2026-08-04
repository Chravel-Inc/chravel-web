-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260717182232, name 'security_privacy_hardening_pass_part2_policies').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

DROP POLICY IF EXISTS "Trip members can view trip media" ON storage.objects;
CREATE POLICY "Trip members can view trip media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'trip-media' AND public.is_active_trip_member(auth.uid(), (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "Trip members can view chat media" ON storage.objects;
CREATE POLICY "Trip members can view chat media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-media' AND public.is_active_trip_member(auth.uid(), (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "Trip members can view voice notes" ON storage.objects;
CREATE POLICY "Trip members can view voice notes" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'trip-voice-notes' AND public.is_active_trip_member(auth.uid(), (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "Trip members can upload trip media" ON storage.objects;
CREATE POLICY "Trip members can upload trip media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'trip-media' AND public.is_active_trip_member(auth.uid(), (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "Trip members can upload chat media" ON storage.objects;
CREATE POLICY "Trip members can upload chat media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media' AND public.is_active_trip_member(auth.uid(), (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "Trip members can upload voice notes" ON storage.objects;
CREATE POLICY "Trip members can upload voice notes" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'trip-voice-notes' AND public.is_active_trip_member(auth.uid(), (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "Trip members can subscribe to trip_chat_messages" ON realtime.messages;
CREATE POLICY "Trip members can subscribe to trip_chat_messages" ON realtime.messages FOR SELECT TO authenticated
USING (realtime.topic() LIKE 'trip_chat_messages:%' AND public.is_active_trip_member(auth.uid(), SUBSTRING(realtime.topic() FROM (length('trip_chat_messages:') + 1))));

DROP POLICY IF EXISTS "Trip members can read chat broadcast messages" ON realtime.messages;
CREATE POLICY "Trip members can read chat broadcast messages" ON realtime.messages FOR SELECT TO authenticated
USING (realtime.topic() LIKE 'chat_broadcast:%' AND public.is_active_trip_member(auth.uid(), split_part(realtime.topic(), ':', 2)));

DROP POLICY IF EXISTS "Trip members can view active invite links" ON public.invite_links;
CREATE POLICY "Trip members can view active invite links" ON public.invite_links FOR SELECT TO authenticated
USING (is_active = true AND public.is_active_trip_member(auth.uid(), trip_id));

DROP POLICY IF EXISTS "Trip members can view active invites" ON public.trip_invites;
CREATE POLICY "Trip members can view active invites" ON public.trip_invites FOR SELECT TO authenticated
USING (is_active = true AND public.is_active_trip_member(auth.uid(), trip_id));

DROP POLICY IF EXISTS "Trip members can view invites" ON public.trip_invites;
CREATE POLICY "Trip members can view invites" ON public.trip_invites FOR SELECT TO authenticated
USING (is_active = true AND public.is_active_trip_member(auth.uid(), trip_id));

CREATE OR REPLACE FUNCTION public.is_payment_debtor(_payment_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.payment_splits
    WHERE payment_message_id = _payment_id AND debtor_user_id = _user_id
  );
$$;
REVOKE ALL ON FUNCTION public.is_payment_debtor(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_payment_debtor(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Trip members can view payment splits" ON public.payment_splits;
CREATE POLICY "Trip members can view payment splits" ON public.payment_splits FOR SELECT TO authenticated
USING (
  debtor_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.trip_payment_messages tpm
    JOIN public.trips t ON t.id = tpm.trip_id
    JOIN public.trip_members tm ON tm.trip_id = tpm.trip_id AND tm.user_id = auth.uid()
      AND (tm.status IS NULL OR tm.status = 'active')
    WHERE tpm.id = public.payment_splits.payment_message_id
      AND (
        t.trip_type = 'consumer'
        OR (
          t.trip_type IN ('pro', 'event') AND (
            tpm.created_by = auth.uid()
            OR public.is_payment_debtor(tpm.id, auth.uid())
            OR EXISTS (SELECT 1 FROM public.trip_admins ta WHERE ta.trip_id = t.id AND ta.user_id = auth.uid())
            OR EXISTS (
              SELECT 1 FROM public.user_trip_roles utr
              JOIN public.trip_roles tr ON utr.role_id = tr.id
              WHERE utr.user_id = auth.uid() AND utr.trip_id = tpm.trip_id
                AND (tr.feature_permissions -> 'payments' ->> 'can_view')::boolean = true
            )
          )
        )
      )
  )
);

CREATE OR REPLACE FUNCTION public.is_trip_co_member(viewer_id uuid, target_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members tm1
    JOIN trip_members tm2 ON tm1.trip_id = tm2.trip_id
    WHERE tm1.user_id = viewer_id AND tm2.user_id = target_user_id
      AND (tm1.status IS NULL OR tm1.status = 'active')
      AND (tm2.status IS NULL OR tm2.status = 'active')
  )
  OR EXISTS (
    SELECT 1 FROM trips t JOIN trip_members tm ON tm.trip_id = t.id
    WHERE t.created_by = viewer_id AND tm.user_id = target_user_id
      AND (tm.status IS NULL OR tm.status = 'active')
  )
  OR EXISTS (
    SELECT 1 FROM trips t JOIN trip_members tm ON tm.trip_id = t.id
    WHERE t.created_by = target_user_id AND tm.user_id = viewer_id
      AND (tm.status IS NULL OR tm.status = 'active')
  );
$$;
