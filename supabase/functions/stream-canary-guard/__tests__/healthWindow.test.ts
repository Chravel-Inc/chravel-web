import { describe, it, expect } from 'vitest';
import {
  MAX_INCIDENTS_PER_REPORTER,
  MIN_DISTINCT_REPORTERS,
  MAX_TRACKED_REPORTERS,
  THRESHOLDS,
  WINDOW_MS,
  defaultWindow,
  isMetric,
  maybeRotateWindow,
  parseWindow,
  recordIncident,
  thresholdExceeded,
  type HealthWindow,
  type Metric,
} from '../healthWindow';

const METRIC: Metric = 'read_channel_denied';

/** Report `count` incidents for `userId`, as the edge function would. */
function report(window: HealthWindow, metric: Metric, userId: string, count: number): void {
  for (let i = 0; i < count; i += 1) {
    recordIncident(window.metrics[metric], userId);
  }
}

describe('stream canary health window', () => {
  describe('the property that matters: one user cannot trip a global rollback', () => {
    it('does not disable the flag no matter how many incidents a single user reports', () => {
      const window = defaultWindow(0);
      // Far beyond minSamples (20). Before per-reporter capping this disabled chat for everyone.
      report(window, METRIC, 'attacker', 500);

      expect(thresholdExceeded(window)).toBeNull();
    });

    it('caps how much a single reporter can contribute to the counter', () => {
      const window = defaultWindow(0);
      report(window, METRIC, 'attacker', 500);

      expect(window.metrics[METRIC].total).toBe(MAX_INCIDENTS_PER_REPORTER);
      expect(window.metrics[METRIC].failures).toBe(MAX_INCIDENTS_PER_REPORTER);
      expect(window.metrics[METRIC].suppressed).toBe(500 - MAX_INCIDENTS_PER_REPORTER);
    });

    it('reports whether an incident was counted', () => {
      const window = defaultWindow(0);
      const stats = window.metrics[METRIC];

      for (let i = 0; i < MAX_INCIDENTS_PER_REPORTER; i += 1) {
        expect(recordIncident(stats, 'user-1')).toBe(true);
      }
      expect(recordIncident(stats, 'user-1')).toBe(false);
      // A different user is unaffected by another's cap.
      expect(recordIncident(stats, 'user-2')).toBe(true);
    });

    it('still refuses to disable when volume is high but reporters are too few', () => {
      const window = defaultWindow(0);
      const needed = THRESHOLDS[METRIC].minSamples;
      // Two users at full cap — enough volume only if the cap allows it, but never enough voices.
      report(window, METRIC, 'user-1', needed);
      report(window, METRIC, 'user-2', needed);

      expect(Object.keys(window.metrics[METRIC].reporters).length).toBeLessThan(
        MIN_DISTINCT_REPORTERS,
      );
      expect(thresholdExceeded(window)).toBeNull();
    });
  });

  describe('genuine multi-user regressions still trigger rollback', () => {
    it('disables the flag once enough distinct users are affected', () => {
      const window = defaultWindow(0);
      const { minSamples } = THRESHOLDS[METRIC];
      // Enough distinct users, each within their cap, to clear minSamples.
      const usersNeeded = Math.ceil(minSamples / MAX_INCIDENTS_PER_REPORTER);
      expect(usersNeeded).toBeGreaterThanOrEqual(MIN_DISTINCT_REPORTERS);

      for (let i = 0; i < usersNeeded; i += 1) {
        report(window, METRIC, `user-${i}`, MAX_INCIDENTS_PER_REPORTER);
      }

      const exceeded = thresholdExceeded(window);
      expect(exceeded).not.toBeNull();
      expect(exceeded?.metric).toBe(METRIC);
    });

    it('holds for every metric — no metric can be tripped by one user', () => {
      for (const metric of Object.keys(THRESHOLDS) as Metric[]) {
        const solo = defaultWindow(0);
        report(solo, metric, 'attacker', 1000);
        expect(thresholdExceeded(solo)).toBeNull();

        const crowd = defaultWindow(0);
        const usersNeeded = Math.max(
          MIN_DISTINCT_REPORTERS,
          Math.ceil(THRESHOLDS[metric].minSamples / MAX_INCIDENTS_PER_REPORTER),
        );
        for (let i = 0; i < usersNeeded; i += 1) {
          report(crowd, metric, `user-${i}`, MAX_INCIDENTS_PER_REPORTER);
        }
        expect(thresholdExceeded(crowd)?.metric).toBe(metric);
      }
    });
  });

  describe('reporter tracking is bounded', () => {
    it('stops tracking new reporters past the cap instead of growing without limit', () => {
      const window = defaultWindow(0);
      const stats = window.metrics[METRIC];

      for (let i = 0; i < MAX_TRACKED_REPORTERS + 50; i += 1) {
        recordIncident(stats, `user-${i}`);
      }

      expect(Object.keys(stats.reporters).length).toBe(MAX_TRACKED_REPORTERS);
      expect(stats.suppressed).toBe(50);
    });
  });

  describe('parseWindow', () => {
    it('migrates a window persisted before per-reporter tracking', () => {
      const legacy = JSON.stringify({
        windowStartMs: 1000,
        metrics: {
          read_channel_denied: { failures: 50, total: 50 },
          send_message_failure: { failures: 0, total: 0 },
          reconnect_backfill_mismatch: { failures: 0, total: 0 },
          mention_notification_failure: { failures: 0, total: 0 },
        },
      });

      const parsed = parseWindow(legacy, 0);

      expect(parsed.metrics.read_channel_denied.reporters).toEqual({});
      expect(parsed.metrics.read_channel_denied.suppressed).toBe(0);
      expect(parsed.metrics.read_channel_denied.total).toBe(50);
      // Legacy counts carry no identities, so they cannot trip a rollback on their own.
      expect(thresholdExceeded(parsed)).toBeNull();
    });

    it('falls back to a fresh window on malformed input', () => {
      expect(parseWindow('not json', 0)).toEqual(defaultWindow(0));
      expect(parseWindow('{}', 0)).toEqual(defaultWindow(0));
      expect(parseWindow(null, 0)).toEqual(defaultWindow(0));
    });

    it('ignores a reporters value of the wrong shape', () => {
      const hostile = JSON.stringify({
        windowStartMs: 0,
        metrics: { read_channel_denied: { failures: 9, total: 9, reporters: ['a', 'b', 'c'] } },
      });

      expect(parseWindow(hostile, 0).metrics.read_channel_denied.reporters).toEqual({});
    });
  });

  describe('maybeRotateWindow', () => {
    it('keeps a window inside the interval and resets one past it', () => {
      const window = defaultWindow(0);
      report(window, METRIC, 'user-1', 3);

      expect(maybeRotateWindow(window, WINDOW_MS).metrics[METRIC].total).toBe(3);
      expect(maybeRotateWindow(window, WINDOW_MS + 1).metrics[METRIC].total).toBe(0);
    });
  });

  describe('isMetric', () => {
    it('accepts known metrics and rejects anything else', () => {
      expect(isMetric('send_message_failure')).toBe(true);
      expect(isMetric('__proto__')).toBe(false);
      expect(isMetric(null)).toBe(false);
      expect(isMetric({ metric: 'send_message_failure' })).toBe(false);
    });
  });
});
