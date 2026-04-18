export const EVENT_OPEN_CHAT_MAX_ATTENDEES = 50;

export type ChatMode = 'broadcasts' | 'admin_only' | 'everyone' | null;
export type TripType = 'event' | 'pro' | 'consumer' | string | null;

const ADMIN_ROLES = new Set(['admin', 'organizer', 'owner']);

export function isLargeEvent(tripType: TripType, attendeeCount: number): boolean {
  return tripType === 'event' && attendeeCount > EVENT_OPEN_CHAT_MAX_ATTENDEES;
}

export function canEnableEveryoneChat(tripType: TripType, attendeeCount: number): boolean {
  return !isLargeEvent(tripType, attendeeCount);
}

export function resolveEffectiveMainChatMode(
  chatMode: ChatMode,
  tripType: TripType,
  attendeeCount: number,
  surfaceIsEvent?: boolean,
): Exclude<ChatMode, null> {
  // Product decision (April 2026): Event main chat is fully open for all attendees.
  if (tripType === 'event' || surfaceIsEvent === true) {
    return 'everyone';
  }

  // Keep null mode permissive to match existing server policy (`chat_mode IS NULL` allows posting).
  const normalizedMode = chatMode ?? 'everyone';

  if (normalizedMode === 'broadcasts') {
    // Consumer/pro shells never show announcements-only lock (product rule).
    if (surfaceIsEvent === false) {
      return 'everyone';
    }
    // Event shell: honor trips.chat_mode even if trip_type is misclassified (wrong row data).
    if (surfaceIsEvent === true) {
      return 'broadcasts';
    }
    // Legacy callers (no surface): non-event DB rows should not stay in broadcasts.
    if (tripType !== 'event') {
      return 'everyone';
    }
    return 'broadcasts';
  }

  if (normalizedMode === 'everyone' && isLargeEvent(tripType, attendeeCount)) {
    return 'admin_only';
  }
  return normalizedMode;
}

export function canPostInMainChat(params: {
  chatMode: ChatMode;
  tripType: TripType;
  attendeeCount: number;
  userRole: string | null;
  isLoading: boolean;
  /** When false, main chat is never announcements-locked (consumer/pro shell). */
  surfaceIsEvent?: boolean;
}): boolean {
  const { chatMode, tripType, attendeeCount, userRole, isLoading, surfaceIsEvent } = params;
  const effectiveMode = resolveEffectiveMainChatMode(
    chatMode,
    tripType,
    attendeeCount,
    surfaceIsEvent,
  );

  if (tripType === 'event' || surfaceIsEvent === true) return true;

  // While chat mode + membership are still fetching, show the composer for trips that
  // resolve to open chat. RLS remains authoritative; this fixes a multi-second blank
  // composer on cold navigation (previously we returned false for all isLoading).
  if (isLoading) {
    return effectiveMode === 'everyone';
  }

  if (effectiveMode === 'everyone') return true;

  return ADMIN_ROLES.has(userRole ?? '');
}
