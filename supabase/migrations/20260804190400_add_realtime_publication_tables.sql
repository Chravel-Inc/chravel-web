-- Add actively-subscribed tables to the supabase_realtime publication.
--
-- WHY: the client holds postgres_changes subscriptions on 25 tables
-- (grep: .on('postgres_changes', { table: ... }) in src/), but the live
-- supabase_realtime publication contained only 5 (notifications, poll_comments,
-- profiles, trip_chat_messages, trip_join_requests). Every other subscription —
-- polls, tasks, calendar events, payments, members, admins, roles, channels,
-- media, basecamps, agenda/lineup — connected successfully and then received
-- no events, so two-session updates in those features only appeared after a
-- manual refetch. Realtime delivery still enforces RLS per subscriber, so this
-- widens no access.
--
-- Idempotent: each table is added only if missing from the publication.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'trips',
    'trip_members',
    'trip_admins',
    'trip_roles',
    'user_trip_roles',
    'trip_channels',
    'channel_messages',
    'trip_polls',
    'trip_tasks',
    'trip_events',
    'trip_payment_messages',
    'payment_attachments',
    'trip_links',
    'trip_link_index',
    'trip_files',
    'trip_media_index',
    'trip_base_camps',
    'trip_personal_base_camps',
    'event_agenda_items',
    'event_lineup_members'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
