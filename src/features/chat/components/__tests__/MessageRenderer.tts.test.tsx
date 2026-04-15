import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageRenderer } from '../MessageRenderer';
import type { ChatMessage } from '../types';

vi.mock('@/hooks/useResolvedTripMediaUrl', () => ({
  useResolvedTripMediaUrl: () => null,
}));

describe('MessageRenderer TTS affordance', () => {
  const baseMessage: ChatMessage = {
    id: 'assistant-1',
    content: 'Here is a concise trip update.',
    timestamp: new Date('2026-04-15T00:00:00Z').toISOString(),
    type: 'assistant',
  };

  it('renders the speaker button for assistant messages when TTS handlers are present', () => {
    render(
      <MessageRenderer
        message={baseMessage}
        ttsPlaybackState="idle"
        ttsPlayingMessageId={null}
        onTTSPlay={vi.fn()}
        onTTSStop={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Listen to response')).toBeInTheDocument();
  });

  it('does not render speaker button for user messages', () => {
    render(
      <MessageRenderer
        message={{ ...baseMessage, id: 'user-1', type: 'user' }}
        ttsPlaybackState="idle"
        ttsPlayingMessageId={null}
        onTTSPlay={vi.fn()}
        onTTSStop={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('Listen to response')).not.toBeInTheDocument();
  });
});
