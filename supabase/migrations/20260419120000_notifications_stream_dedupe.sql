-- Race-safe dedupe for Stream-sourced notifications.
--
-- supabase-js .upsert({ onConflict: '...' }) requires real column names in the
-- conflict target, so we materialize metadata->>'stream_message_id' as a STORED
-- generated column and build the unique index on (user_id, type, that column).
-- The index is partial so rows without a stream_message_id retain free-form
-- uniqueness semantics.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS stream_message_id_mv text
  GENERATED ALWAYS AS (metadata->>'stream_message_id') STORED;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_stream_msg_uniq
  ON public.notifications (user_id, type, stream_message_id_mv)
  WHERE stream_message_id_mv IS NOT NULL;
