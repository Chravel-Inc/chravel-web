import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FLAG_KEY = 'stream_changes_canary';
const APP_SETTINGS_KEY = 'stream_canary_health';
const WINDOW_MS = 10 * 60 * 1000;

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
