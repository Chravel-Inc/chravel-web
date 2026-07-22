/**
 * Freemium limits for consumer tiers
 *
 * AI Query Limits (per user, per trip - NO daily reset):
 * - Free: 3 queries per user per trip
 * - Explorer: 25 queries per user per trip
 * - Frequent Chraveler: Unlimited
 */
export const FREEMIUM_LIMITS = {
  free: {
    aiQueriesPerTrip: 3, // 3 queries per user per trip
    photosPerTrip: 5,
    videosPerTrip: 5,
    filesPerTrip: 5,
    urlsPerTrip: -1, // Unlimited
    storageAccountMB: 500,
    activeTripsLimit: 3, // Max 3 active (non-archived) trips
    paymentRequestsPerTrip: 3, // Matches FEATURE_LIMITS.payment_splitting.free
    canCreatePayments: true,
    canSettlePayments: true,
    // Taste test: 1 free Pro trip. Events are a Frequent Chraveler benefit —
    // Free and Explorer get 3 events total (lifetime), then upgrade to FC for
    // unlimited. eventsLimit MUST stay aligned with FEATURE_LIMITS.event_creation
    // in src/billing/entitlements.ts.
    freeProTripsLimit: 1,
    freeEventsLimit: 3,
    eventsLimit: 3,
    eventAttendeesLimit: 50,
    canCreateEvents: true,
  },
  explorer: {
    aiQueriesPerTrip: 25, // 25 queries per user per trip
    photosPerTrip: -1,
    videosPerTrip: -1,
    filesPerTrip: -1,
    urlsPerTrip: -1,
    storageAccountMB: 50000, // 50GB
    activeTripsLimit: -1, // Unlimited
    paymentRequestsPerTrip: 10, // Matches FEATURE_LIMITS.payment_splitting.explorer
    canCreatePayments: true,
    canSettlePayments: true,
    // Events are a Frequent Chraveler benefit — Explorer gets 3 events total
    // (lifetime), then upgrade to FC for unlimited. Aligns with FEATURE_LIMITS.event_creation.
    canCreateEvents: true,
    eventsLimit: 3,
    eventAttendeesLimit: 100,
  },
  'frequent-chraveler': {
    aiQueriesPerTrip: -1,
    photosPerTrip: -1,
    videosPerTrip: -1,
    filesPerTrip: -1,
    urlsPerTrip: -1,
    storageAccountMB: -1, // Unlimited
    activeTripsLimit: -1, // Unlimited
    paymentRequestsPerTrip: -1, // Unlimited
    canCreatePayments: true,
    canSettlePayments: true,
    canCreateProTrip: true,
    proTripsPerMonth: 1,
    // Events bundled into Frequent Chraveler
    canCreateEvents: true,
    eventsLimit: -1, // Unlimited
    eventAttendeesLimit: 200,
  },
} as const;

// Pro tier limits
export const PRO_LIMITS = {
  starter: {
    memberLimit: 50,
    canCreateEvents: true,
    eventsLimit: -1, // Unlimited
    eventAttendeesLimit: -1, // Unlimited for Pro
  },
  growth: {
    memberLimit: 100,
    canCreateEvents: true,
    eventsLimit: -1,
    eventAttendeesLimit: -1,
  },
  enterprise: {
    memberLimit: 250,
    canCreateEvents: true,
    eventsLimit: -1,
    eventAttendeesLimit: -1,
  },
} as const;

export type FreemiumTier = keyof typeof FREEMIUM_LIMITS;
export type ProTier = keyof typeof PRO_LIMITS;
