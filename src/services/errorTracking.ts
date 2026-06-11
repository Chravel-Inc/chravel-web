/**
 * Centralized Error Tracking Service
 *
 * Provides a unified interface for error tracking across the application.
 * Integrates with Sentry when VITE_SENTRY_DSN is configured.
 * Falls back to console-only logging when DSN is not set.
 *
 * Usage:
 * ```ts
 * import { errorTracking } from '@/services/errorTracking';
 *
 * try {
 *   // risky operation
 * } catch (error) {
 *   errorTracking.captureException(error, {
 *     context: 'PaymentFlow',
 *     userId: user.id
 *   });
 * }
 * ```
 */
// Type-only import — erased at build time. The SDK itself is dynamically
// imported in init() so @sentry/react stays out of the App critical path
// (it was statically pulled in by App.tsx and useAuth.tsx).
import type * as SentryTypes from '@sentry/react';

type SentryModule = typeof SentryTypes;

// Errors thrown before the Sentry chunk resolves are buffered (bounded) and
// flushed in order once it loads, so early boot failures are not lost.
const MAX_PENDING_EVENTS = 20;

export interface ErrorContext {
  userId?: string;
  tripId?: string;
  organizationId?: string;
  context?: string;
  additionalData?: Record<string, unknown>;
}

export interface BreadcrumbData {
  category: 'navigation' | 'user-action' | 'api-call' | 'state-change' | 'error';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

class ErrorTrackingService {
  private breadcrumbs: BreadcrumbData[] = [];
  private maxBreadcrumbs = 50;
  private initialized = false;
  /** DSN configured — Sentry chunk is loading or loaded; buffer until `sentry` is set. */
  private sentryEnabled = false;
  /** Loaded SDK module; null while the dynamic import is in flight. */
  private sentry: SentryModule | null = null;
  private userId: string | null = null;
  private pendingExceptions: Array<{ error: Error; context?: ErrorContext }> = [];
  private pendingMessages: Array<{
    message: string;
    level: 'info' | 'warning' | 'error';
    context?: ErrorContext;
  }> = [];
  /** undefined = no change queued; null = clear queued; object = set queued. */
  private pendingUser: { id: string; data?: Record<string, unknown> } | null | undefined =
    undefined;

  /**
   * Initialize error tracking service.
   * Sentry is activated only when VITE_SENTRY_DSN is set (no-op otherwise).
   */
  init(config?: { userId?: string; environment?: string }) {
    if (this.initialized) return;
    this.initialized = true;

    if (config?.userId) {
      this.userId = config.userId;
    }

    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn) return;

    this.sentryEnabled = true;
    const environment = config?.environment || import.meta.env.MODE || 'production';

    void import('@sentry/react')
      .then(Sentry => {
        Sentry.init({
          dsn,
          environment,
          // Sample 100% of errors, 20% of transactions in production
          tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
          // Only send errors in production/staging
          enabled: import.meta.env.PROD || import.meta.env.VITE_SENTRY_FORCE_ENABLE === 'true',
          integrations: [Sentry.browserTracingIntegration()],
        });
        this.sentry = Sentry;
        this.flushPending();
      })
      .catch(err => {
        this.sentryEnabled = false;
        this.pendingExceptions = [];
        this.pendingMessages = [];
        console.warn('[ErrorTracking] Failed to load Sentry SDK:', err);
      });
  }

  /** Replay everything captured while the SDK chunk was loading, in order. */
  private flushPending(): void {
    if (!this.sentry) return;

    // Breadcrumbs first so buffered exceptions carry their context
    for (const breadcrumb of this.breadcrumbs) {
      this.sentry.addBreadcrumb({
        category: breadcrumb.category,
        message: breadcrumb.message,
        level: breadcrumb.level as SentryTypes.SeverityLevel,
        data: breadcrumb.data,
      });
    }

    if (this.pendingUser !== undefined) {
      this.sentry.setUser(
        this.pendingUser ? { id: this.pendingUser.id, ...this.pendingUser.data } : null,
      );
      this.pendingUser = undefined;
    }

    for (const { error, context } of this.pendingExceptions.splice(0)) {
      this.sentry.captureException(error, {
        contexts: { custom: context as Record<string, unknown> },
      });
    }

    for (const { message, level, context } of this.pendingMessages.splice(0)) {
      this.sentry.captureMessage(message, {
        level: level as SentryTypes.SeverityLevel,
        contexts: { custom: context as Record<string, unknown> },
      });
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(userId: string, userData?: Record<string, unknown>) {
    this.userId = userId;

    if (this.sentry) {
      this.sentry.setUser({ id: userId, ...userData });
    } else if (this.sentryEnabled) {
      this.pendingUser = { id: userId, data: userData };
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUser() {
    this.userId = null;

    if (this.sentry) {
      this.sentry.setUser(null);
    } else if (this.sentryEnabled) {
      this.pendingUser = null;
    }
  }

  /**
   * Capture an exception with context
   */
  captureException(error: Error | unknown, context?: ErrorContext) {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    if (import.meta.env.DEV) {
      console.error('[ErrorTracking] Exception captured:', {
        error: errorObj,
        message: errorObj.message,
        context,
      });
    }

    if (this.sentry) {
      this.sentry.captureException(errorObj, {
        contexts: {
          custom: context as Record<string, unknown>,
        },
      });
    } else if (this.sentryEnabled && this.pendingExceptions.length < MAX_PENDING_EVENTS) {
      this.pendingExceptions.push({ error: errorObj, context });
    }

    return errorObj;
  }

  /**
   * Capture a message (non-error log)
   */
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: ErrorContext,
  ) {
    if (this.sentry) {
      this.sentry.captureMessage(message, {
        level: level as SentryTypes.SeverityLevel,
        contexts: {
          custom: context as Record<string, unknown>,
        },
      });
    } else if (this.sentryEnabled && this.pendingMessages.length < MAX_PENDING_EVENTS) {
      this.pendingMessages.push({ message, level, context });
    }
  }

  /**
   * Add breadcrumb for debugging context
   */
  addBreadcrumb(breadcrumb: BreadcrumbData) {
    this.breadcrumbs.push({
      ...breadcrumb,
      data: {
        ...breadcrumb.data,
        timestamp: new Date().toISOString(),
      },
    });

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }

    // Pre-load breadcrumbs aren't queued separately: the local ring buffer is
    // replayed into Sentry by flushPending() when the SDK resolves.
    if (this.sentry) {
      this.sentry.addBreadcrumb({
        category: breadcrumb.category,
        message: breadcrumb.message,
        level: breadcrumb.level as SentryTypes.SeverityLevel,
        data: breadcrumb.data,
      });
    }
  }

  /**
   * Get recent breadcrumbs for debugging
   */
  getBreadcrumbs(limit: number = 10): BreadcrumbData[] {
    return this.breadcrumbs.slice(-limit);
  }

  /**
   * Wrap an async function with error tracking
   */
  wrapAsync<T extends (...args: unknown[]) => Promise<unknown>>(fn: T, context: ErrorContext): T {
    return (async (...args: unknown[]) => {
      try {
        this.addBreadcrumb({
          category: 'api-call',
          message: `Executing ${context.context || 'async operation'}`,
          level: 'info',
          data: { args: args.slice(0, 3) }, // Don't log all args for privacy
        });

        const result = await fn(...args);
        return result;
      } catch (error) {
        this.captureException(error, context);
        throw error;
      }
    }) as T;
  }
}

// Export singleton instance
export const errorTracking = new ErrorTrackingService();

// Auto-initialize. Wrapped so a Sentry/provider init failure can never throw at
// module-evaluation time — that would reject the lazy App chunk import and black-
// screen the app before any error boundary mounts. App.tsx also calls init() on
// mount, so a failure here is non-fatal.
try {
  errorTracking.init({
    environment: import.meta.env.MODE || 'development',
  });
} catch (err) {
  console.warn('[errorTracking] Deferred init after module-load failure:', err);
}
