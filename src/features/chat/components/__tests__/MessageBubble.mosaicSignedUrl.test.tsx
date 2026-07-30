import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';

vi.mock('@/hooks/useLongPress', () => ({
  useLongPress: () => ({
    onTouchStart: vi.fn(),
    onTouchMove: vi.fn(),
    onTouchEnd: vi.fn(),
    onMouseDown: vi.fn(),
    onMouseMove: vi.fn(),
    onMouseUp: vi.fn(),
    onMouseLeave: vi.fn(),
  }),
}));

vi.mock('@/hooks/useMobilePortrait', () => ({
  useMobilePortrait: () => false,
}));

// Simulate the signed-URL resolver: private-bucket URLs resolve to a signed
// variant; the mosaic must render the SIGNED url, not the raw stored one.
vi.mock('@/hooks/useResolvedTripMediaUrl', () => ({
  useResolvedTripMediaUrl: ({ url }: { url: string | null }) => (url ? `${url}?signed=1` : null),
}));

vi.mock('@/lib/featureFlags', () => ({
  useFeatureFlag: () => true,
}));

vi.mock('../MessageActions', () => ({ MessageActions: () => null }));
vi.mock('../GoogleMapsWidget', () => ({ GoogleMapsWidget: () => null }));
vi.mock('../GroundingCitationCard', () => ({ GroundingCitationCard: () => null }));
vi.mock('../ImageLightbox', () => ({ ImageLightbox: () => null }));
vi.mock('../ReadReceipts', () => ({
  ReadReceipts: () => <div data-testid="read-receipts" />,
}));

const baseProps = {
  id: 'm1',
  text: '',
  senderName: 'Alex',
  timestamp: '2026-07-13T12:00:00.000Z',
  onReaction: vi.fn(),
  currentUserId: 'user-1',
  isOwnMessage: false,
  isLastInGroup: true,
};

describe('MessageBubble mosaic signed URLs', () => {
  it('renders each mosaic tile with the resolved (signed) URL, not the raw stored URL', () => {
    const attachments = [
      {
        type: 'image' as const,
        ref_id: 'r1',
        url: 'https://x.supabase.co/storage/v1/object/public/trip-media/a.jpg',
      },
      {
        type: 'image' as const,
        ref_id: 'r2',
        url: 'https://x.supabase.co/storage/v1/object/public/trip-media/b.jpg',
      },
      {
        type: 'image' as const,
        ref_id: 'r3',
        url: 'https://x.supabase.co/storage/v1/object/public/trip-media/c.jpg',
      },
    ];
    const { container } = render(<MessageBubble {...baseProps} attachments={attachments} />);

    const imgs = Array.from(container.querySelectorAll('img')).filter(img =>
      img.src.includes('trip-media'),
    );
    expect(imgs.length).toBe(3);
    for (const img of imgs) {
      expect(img.src).toContain('?signed=1');
    }
  });
});
