import { describe, expect, it } from 'vitest';

import { getOrCreateConciergeChannel } from '../streamChannelFactory';
import { getUnsupportedConciergeTransportMessage } from '../streamTransportGuards';

describe('streamChannelFactory concierge transport boundary', () => {
  it('throws when legacy concierge stream factory is called', async () => {
    await expect(getOrCreateConciergeChannel('trip-1', 'user-1')).rejects.toThrow(
      getUnsupportedConciergeTransportMessage(),
    );
  });
});
