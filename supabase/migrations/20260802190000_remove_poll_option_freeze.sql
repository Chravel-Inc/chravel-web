-- Polls: remove the option-freeze machinery (product decision).
--
-- 20260315100000 added trip_polls.options_locked_at plus a trigger that stamps it when the first
-- vote arrives, intending to freeze a poll's options once voting began. Nothing ever READ the
-- column — no policy, trigger, RPC, or client code enforces the freeze — so it was a dead safeguard
-- that implied a protection the system did not provide. append_poll_option explicitly ignores it by
-- design (options are append-only).
--
-- Product decision: poll options must NOT freeze after the first vote. Adding an option to a live
-- poll is intended behavior. So remove the stamping trigger rather than start enforcing it.
--
-- Two-phase per the destructive-change rule:
--   Phase 1 (this migration): drop the trigger + function so nothing writes options_locked_at, and
--                             mark the column deprecated. Existing values are left untouched.
--   Phase 2 (forward fix, separate migration once this has shipped and no consumer appears):
--                             ALTER TABLE public.trip_polls DROP COLUMN IF EXISTS options_locked_at;
--
-- Regression scope: removes a write-only BEFORE UPDATE trigger on trip_polls that no code reads.
-- Cannot affect trip existence/fetch, auth hydration, RLS visibility, or payment state.

DROP TRIGGER IF EXISTS trg_lock_poll_options ON public.trip_polls;
DROP FUNCTION IF EXISTS public.lock_poll_options_on_vote();

-- The column may not exist: 20260315100000 was never applied to production (verified — the column,
-- the trigger and the function are all absent), so this migration must not assume the freeze
-- machinery was ever installed. COMMENT ON has no IF EXISTS form, so guard it explicitly.
DO $deprecate$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trip_polls'
      AND column_name = 'options_locked_at'
  ) THEN
    COMMENT ON COLUMN public.trip_polls.options_locked_at IS
      'DEPRECATED (2026-08-02). Poll options intentionally do NOT freeze after the first vote; '
      'nothing writes or reads this column. Scheduled for removal in a follow-up migration. Do not '
      'add new consumers.';
  END IF;
END;
$deprecate$;
