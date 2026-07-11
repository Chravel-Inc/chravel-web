import { telemetry } from '@/telemetry/service';
import { isChravelNativeShell, isInstalledApp } from '@/utils/platformDetection';

/**
 * Cold-start boot phases, all measured as ms since timeOrigin so they are
 * directly comparable:
 * - `entry`: entry module evaluated (marked with a raw performance.mark in
 *   main.tsx so the entry chunk doesn't need this module).
 * - `app_mounted`: the lazy App shell mounted (App.tsx).
 * - `auth_hydrated`: supabase.auth.getSession() settled (useAuth.tsx).
 * - `dashboard_rendered`: first authenticated dashboard content painted (Index.tsx).
 */
export type BootPhase = 'app_mounted' | 'auth_hydrated' | 'dashboard_rendered';

interface PerformanceMetrics {
  navigationStart?: number;
  loadComplete?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

class PerformanceService {
  private metrics: PerformanceMetrics = {};
  private observer?: PerformanceObserver;
  private bootTimelineReported = false;
  // Captured at module eval (before the Router mounts), so it is the COLD
  // START path even after in-app navigations. boot_timeline only reports for
  // '/' boots — marking dashboard_rendered after a deep-link boot navigates
  // home minutes later would poison the yardstick with multi-minute outliers.
  private bootPath = typeof window !== 'undefined' ? window.location.pathname : '';

  constructor() {
    this.initializeObservers();
    this.trackNavigationTiming();
  }

  private initializeObservers() {
    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      this.observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.metrics.largestContentfulPaint = entry.startTime;
            this.reportMetric('LCP', entry.startTime);
          }

          if (entry.entryType === 'first-input') {
            // intentional: PerformanceEventTiming not fully typed in all envs
            this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
            this.reportMetric('FID', this.metrics.firstInputDelay);
          }

          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            this.metrics.cumulativeLayoutShift =
              (this.metrics.cumulativeLayoutShift || 0) + (entry as any).value;
            this.reportMetric('CLS', this.metrics.cumulativeLayoutShift);
          }
        }
      });

      try {
        this.observer.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observer.observe({ type: 'first-input', buffered: true });
        this.observer.observe({ type: 'layout-shift', buffered: true });
      } catch (_e) {
        console.warn('Performance observer not supported for some metrics');
      }
    }

    // Track First Contentful Paint
    if ('PerformancePaintTiming' in window) {
      const paintEntries = performance.getEntriesByType('paint');
      for (const entry of paintEntries) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
          this.reportMetric('FCP', entry.startTime);
        }
      }
    }
  }

  private trackNavigationTiming() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation',
        )[0] as PerformanceNavigationTiming;

        if (navigation) {
          const navigationStart = navigation.fetchStart || 0;
          this.metrics.navigationStart = navigationStart;
          this.metrics.loadComplete = navigation.loadEventEnd - navigationStart;

          this.reportMetric('Page Load Time', this.metrics.loadComplete);
          this.reportMetric(
            'DNS Lookup',
            navigation.domainLookupEnd - navigation.domainLookupStart,
          );
          this.reportMetric('TCP Connect', navigation.connectEnd - navigation.connectStart);
          this.reportMetric(
            'DOM Content Loaded',
            navigation.domContentLoadedEventEnd - navigationStart,
          );
        }
      }, 0);
    });
  }

  private reportMetric(name: string, value: number) {
    // Send to PostHog via telemetry service (unified analytics pipeline)
    if (name === 'Page Load Time') {
      telemetry.track('app_loaded', {
        duration_ms: Math.round(value),
        is_cached: false,
        network_type: (navigator as any).connection?.effectiveType,
      });
    }

    // Keep gtag for backward compatibility
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: name,
        value: Math.round(value),
      });
    }
  }

  /** Start time of a chravel-boot mark in ms since timeOrigin, or null. */
  private bootPhaseTime(phase: string): number | null {
    try {
      const entry = performance.getEntriesByName(`chravel-boot:${phase}`)[0];
      return entry ? Math.round(entry.startTime) : null;
    } catch {
      return null;
    }
  }

  /**
   * Record a cold-start boot phase (first occurrence only; the performance
   * marks are the single source of truth — entry is marked the same way in
   * main.tsx without importing this service). When the dashboard renders on a
   * '/' boot, the full timeline is reported as one `boot_timeline` event —
   * the before/after yardstick for startup work.
   */
  public markBootPhase(phase: BootPhase): void {
    try {
      if (performance.getEntriesByName(`chravel-boot:${phase}`).length > 0) return;
      performance.mark(`chravel-boot:${phase}`);
    } catch {
      // performance.mark unavailable — boot timeline silently disabled
      return;
    }
    if (phase === 'dashboard_rendered' && this.bootPath === '/') {
      this.reportBootTimeline();
    }
  }

  private reportBootTimeline(): void {
    if (this.bootTimelineReported) return;
    this.bootTimelineReported = true;

    telemetry.track('boot_timeline', {
      entry_ms: this.bootPhaseTime('entry'),
      app_mounted_ms: this.bootPhaseTime('app_mounted'),
      auth_hydrated_ms: this.bootPhaseTime('auth_hydrated'),
      dashboard_rendered_ms: this.bootPhaseTime('dashboard_rendered'),
      lcp_ms:
        this.metrics.largestContentfulPaint !== undefined
          ? Math.round(this.metrics.largestContentfulPaint)
          : null,
      fcp_ms:
        this.metrics.firstContentfulPaint !== undefined
          ? Math.round(this.metrics.firstContentfulPaint)
          : null,
      network_type: (navigator as any).connection?.effectiveType ?? null,
      native_shell: isChravelNativeShell(),
      installed_app: isInstalledApp(),
    });
  }

  // Public methods for manual tracking
  public startTiming(name: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.reportMetric(name, duration);
    };
  }

  public markRoute(routeName: string) {
    const mark = `route-${routeName}-${Date.now()}`;
    performance.mark(mark);

    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: routeName,
        page_location: window.location.href,
      });
    }
  }

  public trackUserAction(action: string, category = 'user_interaction') {
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: window.location.pathname,
      });
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export const performanceService = new PerformanceService();

// Add global type for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
