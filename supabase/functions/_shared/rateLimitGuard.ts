/**
 * Rate Limit Guard for Edge Functions
 *
 * Provides a simple, consistent way to apply rate limiting to any edge function.
 * Always database-backed via checkRateLimit, so a bucket is shared across every Deno replica.
 *
 * Designed for easy adoption: single function call returns allow/deny + response.
 */

import { checkRateLimit } from './security.ts';

export interface RateLimitConfig {
  /** Unique identifier for the rate limit bucket (e.g., userId, IP, userId:action) */
  identifier: string;
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** CORS headers to include in 429 response */
  corsHeaders: Record<string, string>;
  /**
   * Supabase client used to reach the increment_rate_limit RPC.
   *
   * REQUIRED. This was previously optional, and omitting it silently downgraded the limiter to a
   * per-isolate in-memory Map — each Deno replica kept its own counter, so the effective limit was
   * (replicas x maxRequests) and reset on every cold start. A caller that believed it was rate
   * limited was not. Passing a client is now enforced at the type level and at runtime.
   */
  supabaseClient: unknown;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  response?: Response;
}

/**
 * Check rate limit and return a ready-to-use result.
 *
 * Usage:
 * ```ts
 * const rl = await applyRateLimit({
 *   identifier: `join-trip:${userId}`,
 *   maxRequests: 10,
 *   windowSeconds: 60,
 *   corsHeaders,
 *   supabaseClient: supabase,
 * });
 * if (!rl.allowed) return rl.response!;
 * ```
 */
export async function applyRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { identifier, maxRequests, windowSeconds, corsHeaders, supabaseClient } = config;

  // Fail closed rather than silently running unlimited. checkRateLimit itself is fail-closed on
  // RPC error, and a missing client is the same class of failure — the limiter cannot be
  // evaluated, so the request must not be treated as allowed.
  if (!supabaseClient) {
    throw new Error(
      'applyRateLimit requires a supabaseClient — refusing to run without a distributed limiter',
    );
  }

  const result = await checkRateLimit(supabaseClient, identifier, maxRequests, windowSeconds);

  if (!result.allowed) {
    return {
      allowed: false,
      remaining: 0,
      response: new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          retryAfter: windowSeconds,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(windowSeconds),
          },
        },
      ),
    };
  }

  return { allowed: true, remaining: result.remaining };
}
