import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, sendMessageMock, getStreamClientMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  sendMessageMock: vi.fn(),
  getStreamClientMock: vi.fn(),
}));

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock('../stream/streamClient', () => ({
  getStreamClient: () => getStreamClientMock(),
}));

import { systemMessageService } from '../systemMessageService';

const REAL_TRIP = '00000000-0000-0000-0000-000000000aaa';

describe('personalBaseCampUpdated — privacy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    systemMessageService._clearTripTypeCache();
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: { trip_type: 'consumer' } }) }),
      }),
    });
    getStreamClientMock.mockReturnValue({
      userID: 'user-1',
      channel: () => ({ sendMessage: sendMessageMock }),
    });
    sendMessageMock.mockResolvedValue({});
  });

  it('never includes a street address in the Stream system message', async () => {
    await systemMessageService.personalBaseCampUpdated(REAL_TRIP, 'Alex');

    expect(sendMessageMock).toHaveBeenCalled();
    const payload = sendMessageMock.mock.calls[0][0] as {
      text?: string;
      system_event_type?: string;
    };
    expect(payload.system_event_type).toBe('personal_base_camp_updated');
    expect(payload.text).toBe('Alex updated their personal base camp');
    expect(payload.text).not.toMatch(/Main St|Avenue|123/);
  });
});
