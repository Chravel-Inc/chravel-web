-- Create scheduled_messages table
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  send_at TIMESTAMPTZ NOT NULL,
  trip_id UUID,
  user_id UUID NOT NULL,
  priority TEXT
);

-- RLS added 2026-07-25. This table holds user-authored message content and shipped with no RLS,
-- which would have made it world-readable had the migration ever been applied (it was not — the
-- table does not exist in production). Owner-scoped: a user sees and manages only their own
-- scheduled messages. Enforced by scripts/check-rls-coverage.ts.
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own scheduled messages" ON public.scheduled_messages;
CREATE POLICY "Users manage their own scheduled messages"
  ON public.scheduled_messages
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
