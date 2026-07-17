
-- =====================================================================
-- Security hardening pass: storage bucket policies + RLS WITH CHECK
-- Helper signatures: is_full_trip_admin(_user_id uuid, _trip_id text)
-- =====================================================================

-- ---------- 1. Drop orphan trip-photos storage policies (bucket removed)
DROP POLICY IF EXISTS "Trip members can upload trip photos" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can view trip photos" ON storage.objects;

-- ---------- 2. Tighten trip-media storage UPDATE/DELETE to uploader or trip admin
DROP POLICY IF EXISTS "Trip members can update trip media" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can delete trip media" ON storage.objects;

CREATE POLICY "Uploader or admin can update trip media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'trip-media'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[2] = (auth.uid())::text
      OR public.is_full_trip_admin(auth.uid(), (storage.foldername(name))[1])
    )
  )
  WITH CHECK (
    bucket_id = 'trip-media'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[2] = (auth.uid())::text
      OR public.is_full_trip_admin(auth.uid(), (storage.foldername(name))[1])
    )
  );

CREATE POLICY "Uploader or admin can delete trip media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'trip-media'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[2] = (auth.uid())::text
      OR public.is_full_trip_admin(auth.uid(), (storage.foldername(name))[1])
    )
  );

-- ---------- 3. Same tightening for chat-media and trip-voice-notes
DROP POLICY IF EXISTS "Trip members can update chat media" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can delete chat media" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can update voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can delete voice notes" ON storage.objects;

CREATE POLICY "Uploader or admin can modify chat media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[2] = (auth.uid())::text
      OR public.is_full_trip_admin(auth.uid(), (storage.foldername(name))[1])
    )
  )
  WITH CHECK (
    bucket_id = 'chat-media'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[2] = (auth.uid())::text
      OR public.is_full_trip_admin(auth.uid(), (storage.foldername(name))[1])
    )
  );

CREATE POLICY "Uploader or admin can delete chat media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[2] = (auth.uid())::text
      OR public.is_full_trip_admin(auth.uid(), (storage.foldername(name))[1])
    )
  );

CREATE POLICY "Uploader or admin can modify voice notes"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'trip-voice-notes'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[2] = (auth.uid())::text
      OR public.is_full_trip_admin(auth.uid(), (storage.foldername(name))[1])
    )
  )
  WITH CHECK (
    bucket_id = 'trip-voice-notes'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[2] = (auth.uid())::text
      OR public.is_full_trip_admin(auth.uid(), (storage.foldername(name))[1])
    )
  );

CREATE POLICY "Uploader or admin can delete voice notes"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'trip-voice-notes'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[2] = (auth.uid())::text
      OR public.is_full_trip_admin(auth.uid(), (storage.foldername(name))[1])
    )
  );

-- =====================================================================
-- 4. trip_media_index / trip_link_index: restrict UPDATE/DELETE to
--    the underlying chat message author or a trip admin.
-- =====================================================================
DROP POLICY IF EXISTS "Members can update trip media" ON public.trip_media_index;
DROP POLICY IF EXISTS "Members can delete trip media" ON public.trip_media_index;
DROP POLICY IF EXISTS "Members can update trip links" ON public.trip_link_index;
DROP POLICY IF EXISTS "Members can delete trip links" ON public.trip_link_index;

CREATE POLICY "Author or admin can update trip media"
  ON public.trip_media_index
  FOR UPDATE
  TO authenticated
  USING (
    public.is_full_trip_admin(auth.uid(), trip_id)
    OR EXISTS (
      SELECT 1 FROM public.trip_chat_messages m
      WHERE m.id = trip_media_index.message_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_full_trip_admin(auth.uid(), trip_id)
    OR EXISTS (
      SELECT 1 FROM public.trip_chat_messages m
      WHERE m.id = trip_media_index.message_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Author or admin can delete trip media"
  ON public.trip_media_index
  FOR DELETE
  TO authenticated
  USING (
    public.is_full_trip_admin(auth.uid(), trip_id)
    OR EXISTS (
      SELECT 1 FROM public.trip_chat_messages m
      WHERE m.id = trip_media_index.message_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Author or admin can update trip link index"
  ON public.trip_link_index
  FOR UPDATE
  TO authenticated
  USING (
    public.is_full_trip_admin(auth.uid(), trip_id)
    OR EXISTS (
      SELECT 1 FROM public.trip_chat_messages m
      WHERE m.id = trip_link_index.message_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_full_trip_admin(auth.uid(), trip_id)
    OR EXISTS (
      SELECT 1 FROM public.trip_chat_messages m
      WHERE m.id = trip_link_index.message_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Author or admin can delete trip link index"
  ON public.trip_link_index
  FOR DELETE
  TO authenticated
  USING (
    public.is_full_trip_admin(auth.uid(), trip_id)
    OR EXISTS (
      SELECT 1 FROM public.trip_chat_messages m
      WHERE m.id = trip_link_index.message_id AND m.user_id = auth.uid()
    )
  );

-- =====================================================================
-- 5. Add mirrored WITH CHECK to owner-scoped UPDATE policies to prevent
--    ownership/trip_id reassignment via UPDATE.
-- =====================================================================

DROP POLICY IF EXISTS "Broadcast creators can update their broadcasts" ON public.broadcasts;
CREATE POLICY "Broadcast creators can update their broadcasts"
  ON public.broadcasts FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own receipts" ON public.receipts;
CREATE POLICY "Users can update their own receipts"
  ON public.receipts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trip receipts" ON public.trip_receipts;
CREATE POLICY "Users can update their own trip receipts"
  ON public.trip_receipts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can update trip_files" ON public.trip_files;
CREATE POLICY "Owners can update trip_files"
  ON public.trip_files FOR UPDATE TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Owners can update trip_links" ON public.trip_links;
CREATE POLICY "Owners can update trip_links"
  ON public.trip_links FOR UPDATE TO authenticated
  USING (auth.uid() = added_by)
  WITH CHECK (auth.uid() = added_by);

DROP POLICY IF EXISTS "Owners can update trip_polls" ON public.trip_polls;
CREATE POLICY "Owners can update trip_polls"
  ON public.trip_polls FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Payment creators can update their messages" ON public.trip_payment_messages;
CREATE POLICY "Payment creators can update their messages"
  ON public.trip_payment_messages FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Task creators can update their tasks" ON public.trip_tasks;
CREATE POLICY "Task creators can update their tasks"
  ON public.trip_tasks FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);
