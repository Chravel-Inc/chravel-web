-- Deprecate the legacy public.broadcasts table (Phase 1 of 2 — non-destructive).
--
-- Chat's canonical broadcast transport is Stream: messages on the chravel-trip
-- channel flagged message_type='broadcast'. The Broadcasts chat tab and (as of
-- this branch) chat search both read from Stream. The broadcasts table used to
-- ALSO feed chat search, which made search results diverge from what the tabs
-- displayed — that read-path is now retired (src/services/chatSearchService.ts).
--
-- The table is NOT dropped. These consumers still read or write it and must be
-- migrated before Phase 2:
--   Writers: unifiedMessagingService.sendBroadcast (dual-write),
--            usePendingActions (AI concierge send_broadcast action),
--            broadcasts-create edge function.
--   Readers: broadcasts-fetch / broadcasts-react edge functions,
--            unifiedMessagingService.getScheduledMessages (AdminDashboard),
--            _shared/contextBuilder + _shared/functionExecutor (concierge),
--            generate-embeddings / regenerate-all-embeddings,
--            export-trip + tripExportDataService, seed-carlton-universe.
--
-- Phase 2 (destructive, separate migration once the above are on Stream):
--   1. Point concierge context/executor + embeddings + exports at Stream
--      broadcast history (server-side channel.search on message_type).
--   2. Replace scheduled-broadcast reads with a dedicated scheduling table or
--      Stream reminders; retire broadcasts-create/-fetch/-react functions.
--   3. Stop all writers, verify cron/log silence for one release cycle, then
--      DROP TABLE public.broadcasts (with the standard two-phase forward-fix
--      documented in that migration).
--
-- This migration only stamps the deprecation on the table itself so schema
-- browsing and future agents see the status without archaeology. Idempotent.
-- No schema, RLS, or data change — COMMENT ON TABLE only, guarded by existence.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'broadcasts'
  ) THEN
    COMMENT ON TABLE public.broadcasts IS
      'DEPRECATED (2026-07, Phase 1/2): chat broadcasts are canonical in Stream '
      '(chravel-trip channel, message_type=broadcast). Chat search no longer reads '
      'this table. Remaining consumers (concierge tools, embeddings, exports, '
      'broadcasts-* edge functions, scheduled broadcasts) must migrate to Stream '
      'before the Phase 2 drop. See migration 20260712010000 for the full plan.';
  END IF;
END $$;
