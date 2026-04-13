import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Provides a minimal RealtimeChannel-compatible noop object.
 * Used when Stream is canonical and legacy Supabase realtime must be disabled.
 */
export function createNoopRealtimeChannel(): RealtimeChannel {
  const channel = {
    on: () => channel,
    subscribe: () => channel,
    unsubscribe: () => Promise.resolve('ok'),
  };

  return channel as unknown as RealtimeChannel;
}
