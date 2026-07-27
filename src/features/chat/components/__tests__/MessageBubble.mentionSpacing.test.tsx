import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

vi.mock('@/hooks/useResolvedTripMediaUrl', () => ({
  useResolvedTripMediaUrl: () => null,
}));

vi.mock('@/lib/featureFlags', () => ({
  useFeatureFlag: () => true,
}));

vi.mock('../MessageActions', () => ({
  MessageActions: () => null,
}));

vi.mock('../GoogleMapsWidget', () => ({
  GoogleMapsWidget: () => null,
}));

vi.mock('../GroundingCitationCard', () => ({
  GroundingCitationCard: () => null,
}));

vi.mock('../ImageLightbox', () => ({
  ImageLightbox: () => null,
}));

vi.mock('../ReadReceipts', () => ({
  ReadReceipts: () => <div data-testid="read-receipts" />,
}));

vi.mock('../VoiceNotePlayer', () => ({
  VoiceNotePlayer: ({ src }: { src: string }) => (
    <div data-testid="voice-note-player" data-src={src} />
  ),
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

/**
 * Regression: the message body is split on MENTION_REGEX and each non-mention
 * fragment is passed through ReactMarkdown. Markdown paragraph parsing strips a
 * fragment's outer whitespace, which used to delete the space separating a
 * mention from the following word ("@Darren Gee WYA" -> "@Darren GeeWYA").
 */
describe('MessageBubble mention spacing', () => {
  const renderText = (text: string) => {
    const { container } = render(<MessageBubble {...baseProps} text={text} />);
    return container;
  };

  it('keeps the space between a mention and the following word', () => {
    const container = renderText('Hey @Darren Gee WYA DG');

    expect(container.textContent).toContain('Hey @Darren Gee WYA DG');
    expect(container.textContent).not.toContain('@Darren GeeWYA');
  });

  it('keeps the space before a mention', () => {
    const container = renderText('cc @Anne-Marie please');

    expect(container.textContent).toContain('cc @Anne-Marie please');
    expect(container.textContent).not.toContain('cc@Anne-Marie');
  });

  it('keeps spacing around back-to-back mentions', () => {
    const container = renderText('@Alex Rivera and @Sam ship it');

    expect(container.textContent).toContain('@Alex Rivera and @Sam ship it');
  });

  it('still renders the mention with the bubble-aware class', () => {
    renderText('Hey @Darren Gee WYA DG');

    const mention = screen.getByText('@Darren Gee');
    expect(mention.className).toContain('text-chat-other-foreground');
    expect(mention.className).not.toContain('text-black');
  });
});
