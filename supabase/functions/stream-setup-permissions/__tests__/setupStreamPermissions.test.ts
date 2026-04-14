import { describe, expect, it, vi } from 'vitest';
import { configureStreamPermissionsAndPrincipal } from '../setup.ts';
import {
  expectedAiConciergeServiceUser,
  expectedConfiguredChannelTypes,
} from './fixtures/setupPath.fixture.ts';

describe('configureStreamPermissionsAndPrincipal', () => {
  it('upserts deterministic concierge bot principal before channel setup path', async () => {
    const upsertUser = vi.fn().mockResolvedValue(undefined);
    const updateChannelType = vi.fn().mockResolvedValue(undefined);

    const results = await configureStreamPermissionsAndPrincipal({
      upsertUser,
      updateChannelType,
    });

    expect(upsertUser).toHaveBeenCalledTimes(1);
    expect(upsertUser).toHaveBeenCalledWith(expectedAiConciergeServiceUser);

    expect(updateChannelType).toHaveBeenCalledTimes(expectedConfiguredChannelTypes.length);
    expect(updateChannelType.mock.calls.map(call => call[0])).toEqual(
      expectedConfiguredChannelTypes,
    );

    expect(results[0]).toEqual({ channelType: 'service-principal:ai-concierge-bot', status: 'ok' });
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
