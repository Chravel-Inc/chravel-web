import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  applyEntitlementUpserts,
  USER_ENTITLEMENT_CONFLICT_TARGET,
  isTripPassProductId,
  resolvePurchaseTypeForProductId,
} from '../entitlementUpsert.ts';

describe('entitlement upsert conflict target', () => {
  it('uses composite conflict target for purchase-scoped upserts', () => {
    expect(USER_ENTITLEMENT_CONFLICT_TARGET).toBe('user_id,purchase_type');
  });

  /**
   * REGRESSION (2026-08-05): every payment upsert failed in production with
   *   42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification
   * because `user_entitlements` still had `PRIMARY KEY (user_id)` — the migration that widens it to
   * (user_id, purchase_type) had never been applied. stripe-webhook, revenuecat-webhook,
   * check-subscription and sync-revenuecat-entitlement all upsert on this target, so NO payment of
   * any kind could grant an entitlement.
   *
   * The assertion above passed throughout, because it only checks the constant against itself. A
   * conflict target is meaningless without a matching constraint, so assert the paired migration
   * declares one. This cannot prove the migration was APPLIED — only the deploy pipeline can — but
   * it does stop the two sides drifting apart in the repo.
   */
  it('has a migration declaring a matching unique/primary key on user_entitlements', () => {
    const migrationsDir = join(process.cwd(), 'supabase/migrations');
    const columns = USER_ENTITLEMENT_CONFLICT_TARGET.split(',').map(c => c.trim());

    // Match PRIMARY KEY/UNIQUE on public.user_entitlements listing exactly these columns, in order.
    const keyPattern = new RegExp(
      String.raw`(PRIMARY\s+KEY|UNIQUE)\s*\(\s*${columns.join(String.raw`\s*,\s*`)}\s*\)`,
      'i',
    );

    const declaring = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .filter(f => {
        const sql = readFileSync(join(migrationsDir, f), 'utf8');
        return /user_entitlements/i.test(sql) && keyPattern.test(sql);
      });

    expect(
      declaring.length,
      `No migration declares ${keyPattern} on user_entitlements. Every payment upsert uses ` +
        `onConflict: '${USER_ENTITLEMENT_CONFLICT_TARGET}' and will fail with 42P10 without it.`,
    ).toBeGreaterThan(0);
  });

  it('preserves both subscription and pass rows for the same user', () => {
    const userId = '11111111-1111-1111-1111-111111111111';

    const rows = applyEntitlementUpserts([
      { user_id: userId, purchase_type: 'subscription', plan: 'explorer' },
      { user_id: userId, purchase_type: 'pass', plan: 'frequent-chraveler' },
      { user_id: userId, purchase_type: 'subscription', plan: 'pro-starter' },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ purchase_type: 'subscription', plan: 'pro-starter' }),
        expect.objectContaining({ purchase_type: 'pass', plan: 'frequent-chraveler' }),
      ]),
    );
  });
});

describe('RevenueCat purchase type classification', () => {
  it('classifies Trip Pass App Store SKUs as pass purchases', () => {
    expect(isTripPassProductId('com.chravel.trippass.explorer')).toBe(true);
    expect(isTripPassProductId('com.chravel.trippass.frequent')).toBe(true);
    expect(resolvePurchaseTypeForProductId('com.chravel.trippass.explorer')).toBe('pass');
  });

  it('classifies subscription SKUs as subscription purchases', () => {
    expect(isTripPassProductId('com.chravel.explorer.monthly')).toBe(false);
    expect(resolvePurchaseTypeForProductId('com.chravel.frequentchraveler.annual')).toBe(
      'subscription',
    );
  });
});
