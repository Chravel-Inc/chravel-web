-- Chat is backed by GetStream; `trip_chat_messages` is legacy / unused for live sends.
-- The AFTER INSERT trigger `trigger_notify_chat_message` still fired on any row insert,
-- creating in-app notifications with Postgres `message_id` that do not exist in Stream UI
-- and spamming users who enabled legacy chat preferences.
-- Mention-only / Stream-sourced notifications remain (stream-webhook, app logic).

DROP TRIGGER IF EXISTS trigger_notify_chat_message ON public.trip_chat_messages;
