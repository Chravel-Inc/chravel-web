import { describe, expect, it } from 'vitest';
import {
  canRestoreArchivedTrip,
  evaluateTripCreationPermission,
  resolveEffectiveTripPlan,
} from '../tripEntitlementPolicy.ts';

describe('tripEntitlementPolicy', () => {
  it('resolves active entitlement plan before legacy profile fallback', () => {
    const plan = resolveEffectiveTripPlan({
      entitlement: {
        plan: 'explorer',
        status: 'active',
        current_period_end: null,
      },
      legacyProfile: {
        subscription_status: 'active',
        subscription_product_id: 'prod_frequent_legacy',
      },
    });

    expect(plan).toBe('explorer');
  });

  it('enforces free-tier creation limits by trip type', () => {
    expect(
      evaluateTripCreationPermission({
        plan: 'free',
        tripType: 'consumer',
        counts: {
          consumerActiveCount: 3,
          freeProTripsUsed: 0,
          freeEventsUsed: 0,
          freeProTripLimit: 1,
          freeEventLimit: 1,
        },
      }),
    ).toEqual({ allowed: false, errorCode: 'TRIP_LIMIT_REACHED' });

    expect(
      evaluateTripCreationPermission({
        plan: 'free',
        tripType: 'pro',
        counts: {
          consumerActiveCount: 0,
          freeProTripsUsed: 1,
          freeEventsUsed: 0,
          freeProTripLimit: 1,
          freeEventLimit: 1,
        },
      }),
    ).toEqual({ allowed: false, errorCode: 'UPGRADE_REQUIRED_PRO_TRIP' });

    expect(
      evaluateTripCreationPermission({
        plan: 'free',
        tripType: 'event',
        counts: {
          consumerActiveCount: 0,
          freeProTripsUsed: 0,
          freeEventsUsed: 1,
          freeProTripLimit: 1,
          freeEventLimit: 1,
        },
      }),
    ).toEqual({ allowed: false, errorCode: 'UPGRADE_REQUIRED_EVENT' });
  });

  it('requires explicit override for explorer pro trip creation', () => {
    expect(
      evaluateTripCreationPermission({
        plan: 'explorer',
        tripType: 'pro',
        counts: {
          consumerActiveCount: 0,
          freeProTripsUsed: 0,
          freeEventsUsed: 0,
          freeProTripLimit: 1,
          freeEventLimit: 1,
        },
      }),
    ).toEqual({ allowed: false, errorCode: 'EXPLORER_PRO_TRIP_REQUIRES_EXPLICIT_OVERRIDE' });

    expect(
      evaluateTripCreationPermission({
        plan: 'explorer',
        tripType: 'pro',
        explorerProTripOverride: true,
        counts: {
          consumerActiveCount: 0,
          freeProTripsUsed: 0,
          freeEventsUsed: 0,
          freeProTripLimit: 1,
          freeEventLimit: 1,
        },
      }),
    ).toEqual({ allowed: true });
  });

  it('limits restore for free users at 3 active consumer trips', () => {
    expect(canRestoreArchivedTrip({ plan: 'free', activeConsumerCount: 3 })).toBe(false);
    expect(canRestoreArchivedTrip({ plan: 'free', activeConsumerCount: 2 })).toBe(true);
    expect(canRestoreArchivedTrip({ plan: 'frequent-chraveler', activeConsumerCount: 20 })).toBe(
      true,
    );
  });
});
