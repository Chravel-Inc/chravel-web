/**
 * Rolling health window for the Stream canary auto-rollback.
 *
 * Pure logic, deliberately free of Deno and Supabase imports so the security property it enforces
 * — that no single user can trip a global feature-flag disable — is unit-testable.
 */

export type Metric =
  | 'read_channel_denied'
  | 'send_message_failure'
  | 'reconnect_backfill_mismatch'
  | 'mention_notification_failure';

export type MetricStats = {
  failures: number;
  total: number;
  /** userId -> incidents from that user counted toward the threshold (capped). */
  reporters: Record<string, number>;
  /** Reports received but deliberately not counted (reporter at cap, or tracking full). */
  suppressed: number;
};

export type HealthWindow = {
  windowStartMs: number;
  metrics: Record<Metric, MetricStats>;
};

export const WINDOW_MS = 10 * 60 * 1000;

// Only failures are ever reported — every incident increments `failures` AND `total`, so `rate` is
// always exactly 1.0 and maxRate never discriminates. The real gate has always been minSamples,
// which meant N reports from a SINGLE user were enough to disable the flag for everyone.
//
// Two limits fix that without weakening genuine detection:
//   * MAX_INCIDENTS_PER_REPORTER caps how much any one user can contribute to a window.
//   * MIN_DISTINCT_REPORTERS sets a floor on how many different users must be affected.
// Together, tripping the switch requires a real multi-user regression. A single actor — malicious,
// or just on a broken network — can no longer do it alone.
//
// These are deliberately conservative because the failure mode they prevent (global chat disabled
// for everyone) is worse than the one they risk (auto-rollback not firing). The manual kill switch
// at /admin/feature-flags is unaffected and remains the operator's immediate lever.
export const MAX_INCIDENTS_PER_REPORTER = 5;
export const MIN_DISTINCT_REPORTERS = 3;
/** Bounds the JSON stored in app_settings.value; the window rotates every WINDOW_MS anyway. */
export const MAX_TRACKED_REPORTERS = 500;

export const THRESHOLDS: Record<Metric, { maxRate: number; minSamples: number }> = {
  read_channel_denied: { maxRate: 0.03, minSamples: 20 },
  send_message_failure: { maxRate: 0.02, minSamples: 20 },
  reconnect_backfill_mismatch: { maxRate: 0.01, minSamples: 10 },
  mention_notification_failure: { maxRate: 0.01, minSamples: 10 },
};

export const emptyStats = (): MetricStats => ({
  failures: 0,
  total: 0,
  reporters: {},
  suppressed: 0,
});

export const defaultWindow = (nowMs: number = Date.now()): HealthWindow => ({
  windowStartMs: nowMs,
  metrics: {
    read_channel_denied: emptyStats(),
    send_message_failure: emptyStats(),
    reconnect_backfill_mismatch: emptyStats(),
    mention_notification_failure: emptyStats(),
  },
});

export function isMetric(value: unknown): value is Metric {
  return (
    value === 'read_channel_denied' ||
    value === 'send_message_failure' ||
    value === 'reconnect_backfill_mismatch' ||
    value === 'mention_notification_failure'
  );
}

/**
 * Count one incident against a metric, respecting the per-reporter cap.
 * Returns false when the report was recorded but deliberately not counted.
 */
export function recordIncident(stats: MetricStats, userId: string): boolean {
  const alreadyCounted = stats.reporters[userId] ?? 0;

  if (alreadyCounted >= MAX_INCIDENTS_PER_REPORTER) {
    stats.suppressed += 1;
    return false;
  }
  if (alreadyCounted === 0 && Object.keys(stats.reporters).length >= MAX_TRACKED_REPORTERS) {
    stats.suppressed += 1;
    return false;
  }

  stats.reporters[userId] = alreadyCounted + 1;
  stats.failures += 1;
  stats.total += 1;
  return true;
}

export function parseWindow(raw: string | null, nowMs: number = Date.now()): HealthWindow {
  if (!raw) return defaultWindow(nowMs);
  try {
    const parsed = JSON.parse(raw) as HealthWindow;
    if (!parsed?.metrics) return defaultWindow(nowMs);

    // A window persisted before per-reporter tracking has no `reporters`/`suppressed`. Normalise
    // every metric so the counting path never touches undefined. Pre-existing counts are kept but
    // carry no reporter identities, so they cannot satisfy MIN_DISTINCT_REPORTERS on their own —
    // the conservative direction.
    const normalised = defaultWindow(nowMs);
    normalised.windowStartMs =
      typeof parsed.windowStartMs === 'number' ? parsed.windowStartMs : nowMs;

    for (const metric of Object.keys(normalised.metrics) as Metric[]) {
      const stored = parsed.metrics[metric];
      if (!stored) continue;
      normalised.metrics[metric] = {
        failures: typeof stored.failures === 'number' ? stored.failures : 0,
        total: typeof stored.total === 'number' ? stored.total : 0,
        reporters:
          stored.reporters &&
          typeof stored.reporters === 'object' &&
          !Array.isArray(stored.reporters)
            ? { ...stored.reporters }
            : {},
        suppressed: typeof stored.suppressed === 'number' ? stored.suppressed : 0,
      };
    }
    return normalised;
  } catch {
    return defaultWindow(nowMs);
  }
}

export function maybeRotateWindow(window: HealthWindow, nowMs: number = Date.now()): HealthWindow {
  if (nowMs - window.windowStartMs <= WINDOW_MS) return window;
  return defaultWindow(nowMs);
}

export function thresholdExceeded(window: HealthWindow): { metric: Metric; rate: number } | null {
  for (const metric of Object.keys(window.metrics) as Metric[]) {
    const stats = window.metrics[metric];
    const threshold = THRESHOLDS[metric];
    if (stats.total < threshold.minSamples) continue;
    // A global rollback requires evidence from several independent users, not volume from one.
    if (Object.keys(stats.reporters).length < MIN_DISTINCT_REPORTERS) continue;
    const rate = stats.failures / stats.total;
    if (rate > threshold.maxRate) {
      return { metric, rate };
    }
  }
  return null;
}
