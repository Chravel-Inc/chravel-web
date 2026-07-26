import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { isSuperAdminEmail } from '../_shared/superAdmins.ts';
import { checkRateLimit } from '../_shared/security.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FLAG_KEY = 'stream_changes_canary';
const APP_SETTINGS_KEY = 'stream_canary_health';
const WINDOW_MS = 10 * 60 * 1000;

// Server-side mirror of isTrustedStreamCanaryUser() in src/services/stream/streamCanary.ts.
// That check gates whether the *client* joins the canary cohort, but it is client-side only —
// it never constrained who could POST here. Reporting an incident increments a failure counter
// that, on threshold, disables the stream_changes_canary feature flag for every user, so an
// ungated endpoint let any authenticated caller kill production chat by looping requests.
const INTERNAL_EMAIL_DOMAINS = ['chravel.app', 'chravelapp.com', 'meechyourgoals.com'];

// Cohort members are internal staff, so this only has to blunt a compromised-session loop.
const CANARY_REPORT_MAX_PER_WINDOW = 30;
const CANARY_REPORT_WINDOW_SECONDS = 600;

function isInternalEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return Boolean(domain && INTERNAL_EMAIL_DOMAINS.includes(domain));
}

async function isTrustedReporter(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  email: string | null | undefined,
): Promise<boolean> {
  if (isInternalEmail(email) || isSuperAdminEmail(email)) return true;

  const { data, error } = await adminClient
    .from('super_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  // Fail closed: an unresolvable trust check must not grant kill-switch authority.
  if (error) return false;
  return Boolean(data);
}

type Metric =
  | 'read_channel_denied'
  | 'send_message_failure'
  | 'reconnect_backfill_mismatch'
  | 'mention_notification_failure';

type MetricStats = {
  failures: number;
  total: number;
};

type HealthWindow = {
  windowStartMs: number;
  metrics: Record<Metric, MetricStats>;
};

const defaultWindow = (): HealthWindow => ({
  windowStartMs: Date.now(),
  metrics: {
    read_channel_denied: { failures: 0, total: 0 },
    send_message_failure: { failures: 0, total: 0 },
    reconnect_backfill_mismatch: { failures: 0, total: 0 },
    mention_notification_failure: { failures: 0, total: 0 },
  },
});

const THRESHOLDS: Record<Metric, { maxRate: number; minSamples: number }> = {
  read_channel_denied: { maxRate: 0.03, minSamples: 20 },
  send_message_failure: { maxRate: 0.02, minSamples: 20 },
  reconnect_backfill_mismatch: { maxRate: 0.01, minSamples: 10 },
  mention_notification_failure: { maxRate: 0.01, minSamples: 10 },
};

function response(payload: Record<string, unknown>, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function isMetric(value: unknown): value is Metric {
  return (
    value === 'read_channel_denied' ||
    value === 'send_message_failure' ||
    value === 'reconnect_backfill_mismatch' ||
    value === 'mention_notification_failure'
  );
}

function parseWindow(raw: string | null): HealthWindow {
  if (!raw) return defaultWindow();
  try {
    const parsed = JSON.parse(raw) as HealthWindow;
    if (!parsed?.metrics) return defaultWindow();
    return parsed;
  } catch {
    return defaultWindow();
  }
}

function maybeRotateWindow(window: HealthWindow): HealthWindow {
  if (Date.now() - window.windowStartMs <= WINDOW_MS) return window;
  return defaultWindow();
}

function thresholdExceeded(window: HealthWindow): { metric: Metric; rate: number } | null {
  for (const metric of Object.keys(window.metrics) as Metric[]) {
    const stats = window.metrics[metric];
    const threshold = THRESHOLDS[metric];
    if (stats.total < threshold.minSamples) continue;
    const rate = stats.failures / stats.total;
    if (rate > threshold.maxRate) {
      return { metric, rate };
    }
  }
  return null;
}

serve(async req => {
  const cors = getCorsHeaders(req);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return response({ error: 'Method not allowed' }, 405, cors);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return response({ error: 'Unauthorized' }, 401, cors);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userErr || !user) return response({ error: 'Unauthorized' }, 401, cors);

    if (!(await isTrustedReporter(adminClient, user.id, user.email))) {
      // Deliberately indistinguishable from any other rejection — do not confirm the endpoint
      // exists or that the caller merely lacks a role.
      return response({ error: 'Forbidden' }, 403, cors);
    }

    const rateLimit = await checkRateLimit(
      adminClient,
      `stream-canary-guard:${user.id}`,
      CANARY_REPORT_MAX_PER_WINDOW,
      CANARY_REPORT_WINDOW_SECONDS,
      user.id,
      'stream-canary-guard',
    );
    if (!rateLimit.allowed) {
      return response({ error: 'Rate limit exceeded' }, 429, cors);
    }

    const body = await req.json().catch(() => ({}));
    const metric = body?.metric;
    if (!isMetric(metric)) return response({ error: 'Invalid metric' }, 400, cors);

    const { data: setting } = await adminClient
      .from('app_settings')
      .select('value')
      .eq('key', APP_SETTINGS_KEY)
      .maybeSingle();

    const healthWindow = maybeRotateWindow(parseWindow(setting?.value ?? null));
    const currentStats = healthWindow.metrics[metric];
    currentStats.total += 1;
    currentStats.failures += 1;

    await adminClient.from('app_settings').upsert(
      {
        key: APP_SETTINGS_KEY,
        value: JSON.stringify(healthWindow),
        description: 'Rolling stream canary health window (auto-managed)',
      },
      { onConflict: 'key' },
    );

    const exceeded = thresholdExceeded(healthWindow);
    if (exceeded) {
      await adminClient
        .from('feature_flags')
        .update({ enabled: false, rollout_percentage: 0 })
        .eq('key', FLAG_KEY);

      return response(
        {
          success: true,
          autoDisabled: true,
          reason: `${exceeded.metric} rate ${exceeded.rate.toFixed(4)} exceeded threshold`,
        },
        200,
        cors,
      );
    }

    return response({ success: true, autoDisabled: false }, 200, cors);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[stream-canary-guard]', message);
    return response({ error: 'Internal error' }, 500, cors);
  }
});
