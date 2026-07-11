/**
 * PostHog Telemetry Provider
 *
 * Wraps posthog-js to implement the TelemetryProvider interface.
 * Only active when VITE_POSTHOG_API_KEY is set.
 *
 * posthog-js is imported dynamically inside init() so its ~200KB of source
 * stays out of the entry chunk — telemetry.init() is idle-deferred in main.tsx
 * and TelemetryService queues events fired before init resolves, so nothing
 * is lost while the SDK chunk loads.
 */

import type { PostHog } from 'posthog-js';
import type {
  TelemetryProvider,
  TelemetryConfig,
  TelemetryUser,
  TelemetryEventName,
  TelemetryEventMap,
} from '../types';

export class PostHogProvider implements TelemetryProvider {
  name = 'posthog';
  private ready = false;
  private posthog: PostHog | null = null;

  async init(config: TelemetryConfig): Promise<void> {
    if (!config.posthog?.apiKey) return;

    const { default: posthog } = await import('posthog-js');

    posthog.init(config.posthog.apiKey, {
      api_host: config.posthog.apiHost || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false, // We track page views manually via telemetry.page()
      capture_pageleave: true,
      loaded: ph => {
        if (config.debug) {
          ph.debug();
        }
      },
    });

    this.posthog = posthog;
    this.ready = true;
  }

  identify(user: TelemetryUser): void {
    if (!this.ready || !this.posthog) return;

    this.posthog.identify(user.id, {
      email: user.email,
      display_name: user.display_name,
      is_pro: user.is_pro,
      organization_id: user.organization_id,
      created_at: user.created_at,
    });
  }

  reset(): void {
    if (!this.ready || !this.posthog) return;
    this.posthog.reset();
  }

  track<E extends TelemetryEventName>(event: E, properties: TelemetryEventMap[E]): void {
    if (!this.ready || !this.posthog) return;
    this.posthog.capture(event, properties as Record<string, unknown>);
  }

  page(name: string, properties?: Record<string, unknown>): void {
    if (!this.ready || !this.posthog) return;
    this.posthog.capture('$pageview', { page_name: name, ...properties });
  }

  captureError(error: Error, context?: Record<string, unknown>): void {
    if (!this.ready || !this.posthog) return;
    this.posthog.capture('$exception', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  /**
   * Register super properties that are sent with every event.
   * Used for deploy markers (SHA, timestamp, build ID).
   */
  registerSuperProperties(properties: Record<string, string>): void {
    if (!this.ready || !this.posthog) return;
    this.posthog.register(properties);
  }

  async flush(): Promise<void> {
    // posthog-js auto-flushes; no manual flush needed
  }

  async shutdown(): Promise<void> {
    if (!this.ready) return;
    this.ready = false;
  }
}
