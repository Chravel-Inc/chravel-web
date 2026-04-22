import { describe, expect, it, vi } from 'vitest';
import { configureStreamPermissionsAndPrincipal } from '../setup.ts';
import {
  expectedAiConciergeServiceUser,
  expectedAppLevelUserGrants,
  expectedConfiguredChannelTypes,
} from './fixtures/setupPath.fixture.ts';

describe('configureStreamPermissionsAndPrincipal', () => {
  it('upserts deterministic concierge bot principal before channel setup path', async () => {
    const upsertUser = vi.fn().mockResolvedValue(undefined);
    const updateChannelType = vi.fn().mockResolvedValue(undefined);
    const updateAppSettings = vi.fn().mockResolvedValue(undefined);

    const results = await configureStreamPermissionsAndPrincipal({
      upsertUser,
      updateChannelType,
      updateAppSettings,
    });

    expect(upsertUser).toHaveBeenCalledTimes(1);
    expect(upsertUser).toHaveBeenCalledWith(expectedAiConciergeServiceUser);

    expect(updateChannelType).toHaveBeenCalledTimes(expectedConfiguredChannelTypes.length);
    expect(updateChannelType.mock.calls.map(call => call[0])).toEqual(
      expectedConfiguredChannelTypes,
    );
    const mentionEnabledChannelTypes = new Set([
      'chravel-trip',
      'chravel-broadcast',
      'chravel-channel',
    ]);
    for (const [channelType, config] of updateChannelType.mock.calls) {
      if (!mentionEnabledChannelTypes.has(channelType)) continue;
      const grants = (config as { grants?: Record<string, string[]> }).grants ?? {};
      for (const roleGrants of Object.values(grants)) {
        if (roleGrants.includes('create-message')) {
          expect(roleGrants).toContain('create-mention');
        }
      }
    }

    expect(results[0]).toEqual({ channelType: 'service-principal:ai-concierge-bot', status: 'ok' });

    // App-level user role grants must be applied so owner-scoped edit/delete works.
    expect(updateAppSettings).toHaveBeenCalledTimes(1);
    expect(updateAppSettings).toHaveBeenCalledWith({
      grants: { user: [...expectedAppLevelUserGrants] },
    });
    expect(results.some(r => r.channelType === 'app-grants:user' && r.status === 'ok')).toBe(true);
  });

  it('logs structured error and continues setup when bot upsert fails', async () => {
    const upsertUser = vi.fn().mockRejectedValue(new Error('stream unavailable'));
    const updateChannelType = vi.fn().mockResolvedValue(undefined);
    const logger = { error: vi.fn() };

    const results = await configureStreamPermissionsAndPrincipal(
      {
        upsertUser,
        updateChannelType,
      },
      logger,
    );

    expect(logger.error).toHaveBeenCalledWith(
      '[stream-setup-permissions] service_user_upsert_failed',
      expect.objectContaining({
        operation: 'upsert_service_user',
        principal_id: expectedAiConciergeServiceUser.id,
        principal_name: expectedAiConciergeServiceUser.name,
        error: 'stream unavailable',
      }),
    );

    expect(results[0]).toEqual({
      channelType: 'service-principal:ai-concierge-bot',
      status: 'error: stream unavailable',
    });
    expect(updateChannelType).toHaveBeenCalledTimes(expectedConfiguredChannelTypes.length);
  });
});
