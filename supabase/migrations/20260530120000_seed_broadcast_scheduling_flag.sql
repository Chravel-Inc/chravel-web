-- Seed the `broadcast-scheduling-enabled` feature flag.
--
-- The Admin Dashboard "Broadcasts" panel (src/pages/AdminDashboard.tsx) and the
-- scheduling service (src/services/unifiedMessagingService.ts) both gate broadcast
-- scheduling on the feature flag `broadcast-scheduling-enabled`. That flag was never
-- seeded in any migration, so with no row present the client-side default (`false`)
-- won and the feature was silently dark — the button rendered disabled and
-- scheduleMessage() short-circuited. The underlying feature is fully wired
-- (broadcasts table + message-scheduler edge function), so we seed the flag enabled.
--
-- Idempotent: ON CONFLICT DO NOTHING preserves any value an admin may have set in prod.
-- Kill switch: UPDATE public.feature_flags SET enabled = false WHERE key = 'broadcast-scheduling-enabled';
--   (takes effect within ~60s client cache TTL — no redeploy required).
-- Rollback: DELETE FROM public.feature_flags WHERE key = 'broadcast-scheduling-enabled';

INSERT INTO public.feature_flags (key, enabled, description)
VALUES (
  'broadcast-scheduling-enabled',
  true,
  'Admin broadcast scheduling panel — schedule Pro Trip broadcasts ahead of time.'
)
ON CONFLICT (key) DO NOTHING;
