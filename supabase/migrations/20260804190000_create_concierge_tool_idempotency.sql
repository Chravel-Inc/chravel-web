-- Provision the durable idempotency store for execute-concierge-tool.
--
-- WHY: execute-concierge-tool (active, invoked by confirmGatedAction and the
-- realtime voice client — both always send an idempotency key for mutating
-- tools) throws "Failed to reserve idempotency key" when this table is absent,
-- which breaks EVERY confirm-gated mutating concierge action in production.
-- The original definition (20260509120000_add_concierge_tool_idempotency_store.sql)
-- was never applied to prod, and it declared trip_id as uuid — which cannot
-- reference public.trips(id) because trips.id is TEXT in this database.
-- This forward migration supersedes it with the correct column type.
--
-- Idempotent: safe to re-run; CREATE TABLE IF NOT EXISTS + guarded policies.

CREATE TABLE IF NOT EXISTS public.concierge_tool_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id text NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'completed')),
  result_ref text,
  result_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, trip_id, tool_name, idempotency_key)
);

CREATE INDEX IF NOT EXISTS concierge_tool_idempotency_trip_user_idx
  ON public.concierge_tool_idempotency (trip_id, user_id);

ALTER TABLE public.concierge_tool_idempotency ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own concierge idempotency records"
  ON public.concierge_tool_idempotency;
CREATE POLICY "Users can read their own concierge idempotency records"
  ON public.concierge_tool_idempotency
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own concierge idempotency records"
  ON public.concierge_tool_idempotency;
CREATE POLICY "Users can insert their own concierge idempotency records"
  ON public.concierge_tool_idempotency
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own concierge idempotency records"
  ON public.concierge_tool_idempotency;
CREATE POLICY "Users can update their own concierge idempotency records"
  ON public.concierge_tool_idempotency
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
