/**
 * Telemetry Event Helpers
 *
 * Convenience functions for tracking common events.
 * These provide type-safe, easy-to-use wrappers around telemetry.track().
 */

import { telemetry } from './service';
import type { AuthEvents, TripEvents, MessageEvents, TaskEvents } from './types';

// ============================================================================
// Auth Events
// ============================================================================

export const authEvents = {
  signupStarted: (method: AuthEvents['signup_started']['method']) => {
    telemetry.track('signup_started', { method });
  },

  signupCompleted: (method: AuthEvents['signup_completed']['method'], userId: string) => {
    telemetry.track('signup_completed', { method, user_id: userId });
  },

  signupFailed: (method: AuthEvents['signup_failed']['method'], error: string) => {
    telemetry.track('signup_failed', { method, error });
  },

  loginStarted: (method: AuthEvents['login_started']['method']) => {
    telemetry.track('login_started', { method });
  },

  loginCompleted: (method: AuthEvents['login_completed']['method'], userId: string) => {
    telemetry.track('login_completed', { method, user_id: userId });
  },

  loginFailed: (method: AuthEvents['login_failed']['method'], error: string) => {
    telemetry.track('login_failed', { method, error });
  },

  logout: (userId: string) => {
    telemetry.track('logout', { user_id: userId });
  },
};

// ============================================================================
// Trip Events
// ============================================================================

export const tripEvents = {
  createStarted: () => {
    telemetry.track('trip_create_started', {});
  },

  created: (params: TripEvents['trip_created']) => {
    telemetry.track('trip_created', params);
  },

  createFailed: (error: string) => {
    telemetry.track('trip_create_failed', { error });
  },

  joinStarted: (tripId: string, method: TripEvents['trip_join_started']['method']) => {
    telemetry.track('trip_join_started', { trip_id: tripId, method });
  },

  joined: (tripId: string, method: TripEvents['trip_joined']['method'], userId: string) => {
    telemetry.track('trip_joined', {
      trip_id: tripId,
      method,
      user_id: userId,
    });
  },

  joinFailed: (tripId: string, method: TripEvents['trip_join_failed']['method'], error: string) => {
    telemetry.track('trip_join_failed', { trip_id: tripId, method, error });
  },

  viewed: (tripId: string, tripType: TripEvents['trip_viewed']['trip_type']) => {
    telemetry.track('trip_viewed', { trip_id: tripId, trip_type: tripType });
  },

  archived: (tripId: string) => {
    telemetry.track('trip_archived', { trip_id: tripId });
  },
};

// ============================================================================
// Message Events
// ============================================================================

export const messageEvents = {
  sent: (params: MessageEvents['message_sent']) => {
    telemetry.track('message_sent', params);
  },

  sendFailed: (tripId: string, error: string) => {
    telemetry.track('message_send_failed', { trip_id: tripId, error });
    telemetry.track('message.send.failed', {
      trip_id: tripId,
      error,
      transport: 'stream',
      mode: 'fire_and_forget',
    });
  },

  sendFailedAsync: (tripId: string, error: string) => {
    telemetry.track('message_send_failed', { trip_id: tripId, error });
    telemetry.track('message.send.failed', {
      trip_id: tripId,
      error,
      transport: 'stream',
      mode: 'async',
    });
  },

  threadOpened: (params: MessageEvents['thread_opened']) => {
    telemetry.track('thread_opened', params);
  },

  threadReplySent: (params: MessageEvents['thread_reply_sent']) => {
    telemetry.track('thread_reply_sent', params);
  },
};

export const streamReliabilityEvents = {
  membershipRecoveryAttempt: (
    tripId: string,
    stage: 'join_preflight' | 'ensure_membership',
    attemptNumber: number,
  ) => {
    telemetry.track('membership.recovery.attempt', {
      trip_id: tripId,
      stage,
      attempt_number: attemptNumber,
    });
  },

  reconnectBackfill: (
    tripId: string,
    trigger: 'socket_reconnect' | 'visibility_resume',
    fetchedCount: number,
  ) => {
    telemetry.track('chat.reconnect.backfill', {
      trip_id: tripId,
      trigger,
      fetched_count: fetchedCount,
    });
  },

  timeToFirstMessage: (
    tripId: string,
    durationMs: number,
    source: 'initial_history' | 'realtime_new',
  ) => {
    telemetry.track('chat.time_to_first_message', {
      trip_id: tripId,
      duration_ms: durationMs,
      source,
    });
  },
};

export const moderationEvents = {
  actionExecuted: (params: MessageEvents['moderation_action_executed']) => {
    telemetry.track('moderation_action_executed', params);
  },

  actionFailed: (params: MessageEvents['moderation_action_failed']) => {
    telemetry.track('moderation_action_failed', params);
  },
};

// ============================================================================

// Task Events
// ============================================================================

export const taskEvents = {
  created: (params: TaskEvents['task_created']) => {
    telemetry.track('task_created', params);
  },

  completed: (tripId: string, taskId: string, timeToCompleteMs?: number) => {
    telemetry.track('task_completed', {
      trip_id: tripId,
      task_id: taskId,
      time_to_complete_ms: timeToCompleteMs,
    });
  },

  uncompleted: (tripId: string, taskId: string) => {
    telemetry.track('task_uncompleted', { trip_id: tripId, task_id: taskId });
  },

  deleted: (tripId: string, taskId: string) => {
    telemetry.track('task_deleted', { trip_id: tripId, task_id: taskId });
  },
};

// ============================================================================

// Page View Helper
// ============================================================================

export const pageView = (
  pageName: string,
  properties?: { trip_id?: string; load_time_ms?: number },
) => {
  telemetry.page(pageName, properties);
  telemetry.track('page_view', {
    page: pageName,
    trip_id: properties?.trip_id,
    load_time_ms: properties?.load_time_ms,
  });
};

// ============================================================================

// Onboarding Events
// ============================================================================

export const onboardingEvents = {
  screenViewed: (screen: number) => {
    telemetry.track('onboarding_screen_viewed', { screen });
  },

  completed: () => {
    telemetry.track('onboarding_completed', {});
  },

  skipped: (atScreen: number) => {
    telemetry.track('onboarding_skipped', { at_screen: atScreen });
  },

  demoTripSelected: () => {
    telemetry.track('onboarding_demo_trip_selected', {});
  },
};

// ============================================================================
// Demo Mode Events
// ============================================================================

// ============================================================================

// Demo Mode Events
// ============================================================================

export const demoEvents = {
  entered: (source: 'onboarding' | 'toggle' | 'deep_link') => {
    telemetry.track('demo_mode_entered', { source });
    // Store entry timestamp in sessionStorage for duration calc
    try {
      sessionStorage.setItem('demo_mode_start', Date.now().toString());
      sessionStorage.setItem('demo_actions_count', '0');
    } catch {
      // sessionStorage not available
    }
  },

  exited: (exitMethod: 'button' | 'toggle' | 'logout', actionsCount: number) => {
    let duration = 0;
    try {
      const startTime = sessionStorage.getItem('demo_mode_start');
      duration = startTime ? Date.now() - parseInt(startTime, 10) : 0;
      sessionStorage.removeItem('demo_mode_start');
      sessionStorage.removeItem('demo_actions_count');
    } catch {
      // sessionStorage not available
    }
    telemetry.track('demo_mode_exited', {
      duration_ms: duration,
      actions_count: actionsCount,
      exit_method: exitMethod,
    });
  },

  actionPerformed: (
    action: 'message_sent' | 'task_created' | 'payment_added' | 'cover_changed' | 'poll_created',
    tripId: string,
  ) => {
    telemetry.track('demo_action_performed', { action, trip_id: tripId });
    // Increment action counter
    try {
      const count = parseInt(sessionStorage.getItem('demo_actions_count') || '0', 10);
      sessionStorage.setItem('demo_actions_count', (count + 1).toString());
    } catch {
      // sessionStorage not available
    }
  },
};

// ============================================================================
