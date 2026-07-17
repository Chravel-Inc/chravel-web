import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../../..');
const read = (path: string) => readFileSync(resolve(repoRoot, path), 'utf8');

describe('2026-07-17 security/privacy hardening regressions', () => {
  it('revokes privileged RPC execute and restores hybrid search membership gate', () => {
    const migration = read(
      'supabase/migrations/20260717180000_security_privacy_hardening_pass.sql',
    );

    expect(migration).toContain('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated');
    expect(migration).toContain(
      'create_payment_with_splits(text, numeric, text, text, integer, jsonb, jsonb, uuid)',
    );
    expect(migration).toContain('claim_notification_deliveries(integer, text[], uuid[], uuid[])');
    expect(migration).toContain('IF NOT public.is_active_trip_member(auth.uid(), p_trip_id)');
    expect(migration).toContain('auth.uid() IS DISTINCT FROM p_user_id');
    expect(migration).toContain(
      'public.is_active_trip_member(auth.uid(), (storage.foldername(name))[1])',
    );
    expect(migration).toContain("realtime.topic() LIKE 'trip_chat_messages:%'");
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.is_payment_debtor');
  });

  it('hardens send-push against arbitrary userId targeting', () => {
    const sendPush = read('supabase/functions/send-push/index.ts');
    expect(sendPush).toContain('authorizeTripPushTargets');
    expect(sendPush).toContain('authorizeSharedTripPushTargets');
    expect(sendPush).toContain(".or('status.is.null,status.eq.active')");
  });

  it('requires auth on paid venue/place edge proxies and restricts bootstrap CORS', () => {
    const venue = read('supabase/functions/venue-enricher/index.ts');
    const place = read('supabase/functions/place-grounding/index.ts');
    const bootstrap = read('supabase/functions/bootstrap-super-admins/index.ts');

    expect(venue).toContain('requireAuth');
    expect(venue).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(place).toContain('requireAuth');
    expect(bootstrap).toContain('getCorsHeaders');
    expect(bootstrap).not.toContain("Access-Control-Allow-Origin: '*'");
  });

  it('does not ship a hardcoded PostHog project key fallback', () => {
    const telemetry = read('src/telemetry/service.ts');
    expect(telemetry).not.toMatch(/phc_[A-Za-z0-9]+/);
    expect(telemetry).toContain('VITE_POSTHOG_API_KEY');
  });
});
