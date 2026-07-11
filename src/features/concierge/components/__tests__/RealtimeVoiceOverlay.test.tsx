import React from 'react';
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RealtimeVoiceOverlay } from '../RealtimeVoiceOverlay';

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDarkMode: true, toggleTheme: vi.fn() }),
}));

describe('RealtimeVoiceOverlay layout', () => {
  beforeAll(() => {
    // jsdom does not implement Element.scrollTo used by the transcript auto-scroll effect.
    Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
  });

  afterEach(() => {
    cleanup();
  });

  it('renders assistant transcript above the wave and user transcript below', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const containerRef = { current: container };

    render(
      <RealtimeVoiceOverlay
        phase="listening"
        turns={[
          { id: 'a1', role: 'assistant', text: 'Here are top spots in Fort Wayne.' },
          { id: 'u1', role: 'user', text: 'What about dinner?' },
        ]}
        isCapturing
        isPlaying={false}
        errorMessage={null}
        micPermission="granted"
        isRecording
        latestUserText=""
        latestAssistantText=""
        onEnd={vi.fn()}
        containerRef={containerRef}
      />,
    );

    const assistant = screen.getByText('Here are top spots in Fort Wayne.');
    const user = screen.getByText('What about dinner?');
    expect(assistant.compareDocumentPosition(user) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector('.realtime-wave-drift')).toBeTruthy();
  });
});
