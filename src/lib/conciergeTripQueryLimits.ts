export type ConciergeTripQueryPlan = 'free' | 'explorer' | 'frequent_chraveler';

export const CONCIERGE_TRIP_QUERY_LIMITS: Record<ConciergeTripQueryPlan, number | null> = {
  free: 10,
  explorer: 25,
  frequent_chraveler: null,
};

export const getConciergeTripQueryLimit = (plan: ConciergeTripQueryPlan): number | null =>
  CONCIERGE_TRIP_QUERY_LIMITS[plan] ?? null;
